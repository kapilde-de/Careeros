const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('agent', {
  // Profile
  saveProfile:  (p)  => ipcRenderer.invoke('save-profile', p),
  loadProfile:  ()   => ipcRenderer.invoke('load-profile'),

  // CV
  parseCV:      (p)  => ipcRenderer.invoke('parse-cv', p),
  pickCVFile:   ()   => ipcRenderer.invoke('pick-cv-file'),

  // Jobs
  searchJobs:   (q)  => ipcRenderer.invoke('search-jobs', q),
  tailorCV:     (p)  => ipcRenderer.invoke('tailor-cv', p),
  applyJob:     (p)  => ipcRenderer.invoke('apply-job', p),

  // Queue
  loadQueue:    ()   => ipcRenderer.invoke('load-queue'),
  approveJob:   (id) => ipcRenderer.invoke('approve-job', id),
  rejectJob:    (id) => ipcRenderer.invoke('reject-job', id),

  // Email test
  testEmail:    (p)  => ipcRenderer.invoke('test-email', p),

  // Settings
  saveSettings: (s)  => ipcRenderer.invoke('save-settings', s),
  loadSettings: ()   => ipcRenderer.invoke('load-settings'),

  // First run detection
  isFirstRun: () => ipcRenderer.invoke('is-first-run'),

  // Logs streamed from main process
  onLog: (cb) => ipcRenderer.on('log', (_, msg) => cb(msg)),
  onJobFound: (cb) => ipcRenderer.on('job-found', (_, job) => cb(job)),
})
