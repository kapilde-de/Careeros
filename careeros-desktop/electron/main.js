const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs   = require('fs')
const os   = require('os')

const DATA_DIR = path.join(app.getPath('userData'), 'careeros')
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

const PROFILE_FILE   = path.join(DATA_DIR, 'profile.json')
const SETTINGS_FILE  = path.join(DATA_DIR, 'settings.json')
const QUEUE_FILE     = path.join(DATA_DIR, 'queue.json')
const FIRSTRUN_FILE  = path.join(DATA_DIR, 'firstrun.json')

const isDev = !app.isPackaged

let win

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: true,
    backgroundColor: '#f7f8fa',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '../public/icon.ico'),
  })

  if (isDev) {
    win.loadURL('http://localhost:5174')
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(createWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })

// ── Helpers ───────────────────────────────────────────────────────────────────
function readJSON(file, fallback = {}) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')) } catch { return fallback }
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2))
}
function log(msg) {
  win?.webContents.send('log', { time: new Date().toLocaleTimeString(), msg })
  console.log(`[agent] ${msg}`)
}

// ── IPC: Profile ──────────────────────────────────────────────────────────────
ipcMain.handle('is-first-run', () => {
  if (!fs.existsSync(FIRSTRUN_FILE)) {
    writeJSON(FIRSTRUN_FILE, { done: true, date: new Date().toISOString() })
    return true
  }
  return false
})

ipcMain.handle('save-profile', (_, p) => { writeJSON(PROFILE_FILE, p); return true })
ipcMain.handle('load-profile', ()    => readJSON(PROFILE_FILE, null))

// ── IPC: Settings ─────────────────────────────────────────────────────────────
ipcMain.handle('save-settings', (_, s) => { writeJSON(SETTINGS_FILE, s); return true })
ipcMain.handle('load-settings', ()     => readJSON(SETTINGS_FILE, {}))

// ── IPC: Queue ────────────────────────────────────────────────────────────────
ipcMain.handle('load-queue',  ()   => readJSON(QUEUE_FILE, []))
ipcMain.handle('approve-job', (_, id) => {
  const q = readJSON(QUEUE_FILE, [])
  const job = q.find(j => j.id === id)
  if (job) job.status = 'approved'
  writeJSON(QUEUE_FILE, q)
  return true
})
ipcMain.handle('reject-job', (_, id) => {
  const q = readJSON(QUEUE_FILE, [])
  const job = q.find(j => j.id === id)
  if (job) job.status = 'rejected'
  writeJSON(QUEUE_FILE, q)
  return true
})

// ── IPC: Pick CV file ─────────────────────────────────────────────────────────
ipcMain.handle('pick-cv-file', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: 'Select your CV',
    filters: [{ name: 'CV Files', extensions: ['pdf', 'docx', 'doc', 'txt'] }],
    properties: ['openFile'],
  })
  if (canceled || !filePaths.length) return null
  return filePaths[0]
})

// ── IPC: Parse CV ─────────────────────────────────────────────────────────────
ipcMain.handle('parse-cv', async (_, filePath) => {
  try {
    const { parseCV } = require('./cv-parser')
    return await parseCV(filePath)
  } catch (e) {
    return { error: e.message }
  }
})

// ── IPC: Search Jobs ──────────────────────────────────────────────────────────
ipcMain.handle('search-jobs', async (_, query) => {
  try {
    log(`Searching jobs: "${query.keywords}" in ${query.location || 'anywhere'}…`)
    const { scrapeJobs } = require('./scraper')
    const jobs = await scrapeJobs(query, (msg) => log(msg))
    log(`Found ${jobs.length} jobs`)

    // Add to queue
    const queue = readJSON(QUEUE_FILE, [])
    const existing = new Set(queue.map(j => j.id))
    const fresh = jobs.filter(j => !existing.has(j.id)).map(j => ({ ...j, status: 'pending', foundAt: new Date().toISOString() }))
    writeJSON(QUEUE_FILE, [...queue, ...fresh])

    fresh.forEach(j => win?.webContents.send('job-found', j))
    return jobs
  } catch (e) {
    log(`Search error: ${e.message}`)
    return []
  }
})

// ── IPC: Tailor CV ────────────────────────────────────────────────────────────
ipcMain.handle('tailor-cv', async (_, { cvText, jobTitle, jobDescription, apiKey }) => {
  try {
    log(`Tailoring CV for: ${jobTitle}…`)
    const Anthropic = require('@anthropic-ai/sdk')
    const client = new Anthropic({ apiKey })

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 3000,
      system: 'You are an expert CV writer. Return only valid JSON, no markdown.',
      messages: [{
        role: 'user',
        content: `Tailor this CV for the job below. Return JSON: {"summary":"...","skills":["..."],"experience":[{"title":"...","company":"...","period":"...","bullets":["..."]}],"education":"...","coverLetter":"...","matchScore":85,"keyChanges":["change1","change2"]}
Job Title: ${jobTitle}
Job Description: ${jobDescription.slice(0, 1500)}
CV: ${cvText.slice(0, 2000)}`
      }]
    })

    const raw = response.content[0].text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
    const result = JSON.parse(raw)
    log(`CV tailored — match score: ${result.matchScore}%`)
    return result
  } catch (e) {
    log(`Tailor error: ${e.message}`)
    return { error: e.message }
  }
})

// ── IPC: Apply to Job ─────────────────────────────────────────────────────────
ipcMain.handle('apply-job', async (_, { job, profile, settings }) => {
  try {
    log(`Applying to: ${job.title} at ${job.company}…`)

    // Send email notification
    if (settings?.emailEnabled && settings?.emailTo) {
      const { sendNotification } = require('./mailer')
      await sendNotification({
        to: settings.emailTo,
        smtpUser: settings.smtpUser,
        smtpPass: settings.smtpPass,
        subject: `Applied: ${job.title} at ${job.company}`,
        job,
        profile,
      })
      log(`Email notification sent to ${settings.emailTo}`)
    }

    // Update queue
    const queue = readJSON(QUEUE_FILE, [])
    const item = queue.find(j => j.id === job.id)
    if (item) { item.status = 'applied'; item.appliedAt = new Date().toISOString() }
    writeJSON(QUEUE_FILE, queue)

    log(`✓ Applied to ${job.title} at ${job.company}`)
    return { success: true }
  } catch (e) {
    log(`Apply error: ${e.message}`)
    return { error: e.message }
  }
})

// ── IPC: Test Email ───────────────────────────────────────────────────────────
ipcMain.handle('test-email', async (_, settings) => {
  try {
    const { sendNotification } = require('./mailer')
    await sendNotification({
      to: settings.emailTo,
      smtpUser: settings.smtpUser,
      smtpPass: settings.smtpPass,
      subject: 'CareerOS — Email test ✓',
      job: { title: 'Test Job', company: 'Test Company', location: 'Remote', salary: '£50k', url: 'https://careeros.app' },
      profile: { firstName: 'Test' },
    })
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
})
