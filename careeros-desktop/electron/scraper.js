const https = require('https')
const http  = require('http')

// ── HTTP helpers ──────────────────────────────────────────────────────────────
function request(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const client = parsed.protocol === 'https:' ? https : http
    const req = client.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: opts.method || 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json, */*',
        'Accept-Language': 'en-GB,en;q=0.9',
        ...opts.headers,
      }
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location)
        return request(res.headers.location, opts).then(resolve).catch(reject)
      let d = ''
      res.on('data', c => d += c)
      res.on('end', () => resolve({ status: res.statusCode, body: d }))
    })
    req.on('error', reject)
    req.setTimeout(14000, () => { req.destroy(); reject(new Error('Timeout')) })
    if (opts.body) req.write(opts.body)
    req.end()
  })
}

async function getJSON(url, opts = {}) {
  const r = await request(url, opts)
  if (r.status >= 400) throw new Error(`HTTP ${r.status}`)
  return JSON.parse(r.body)
}

function postJSON(url, body, headers = {}) {
  const payload = JSON.stringify(body)
  return getJSON(url, { method:'POST', body:payload, headers:{ 'Content-Type':'application/json', 'Content-Length':Buffer.byteLength(payload), ...headers } })
}

function clean(s) {
  return (s||'').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#\d+;/g,' ').replace(/\s+/g,' ').trim()
}
function makeId(a,b) { return Buffer.from(`${a}|${b}`.toLowerCase()).toString('base64').slice(0,16) }

// ── Job validation ────────────────────────────────────────────────────────────
const BAD = ['course','diploma','certificate','training programme','training program','learn ','level 3 ','level 4 ','level 5 ','level 6 ','level 7 ','qualification','bootcamp','masterclass','e-learning','distance learning','cpd ','webinar','seminar','for beginners','introduction to']

function isReal(j) {
  if (!j?.title||!j?.url||!j?.company||j.company.length<2) return false
  if (j.title.length<4||j.title.length>120) return false
  if (!/^https?:\/\/[a-z]/i.test(j.url)) return false
  if (/undefined|null|\{|}|webkit/.test(j.url+j.title)) return false
  const t = j.title.toLowerCase()
  return !BAD.some(w=>t.includes(w))
}

// ── Keyword relevance check ───────────────────────────────────────────────────
// Synonyms/expansions so "project manager" also matches "programme manager", "PMO" etc.
const SYNONYMS = {
  'project manager':   ['project manager','programme manager','program manager','pmo','project lead','delivery manager','project director','project coordinator','project management'],
  'product manager':   ['product manager','product owner','product lead','product director','product management','vp product','head of product'],
  'software engineer': ['software engineer','software developer','software dev','backend engineer','frontend engineer','full stack','fullstack','swe ','engineer ii','engineer iii'],
  'data engineer':     ['data engineer','data developer','etl','data pipeline','data platform','analytics engineer'],
  'data scientist':    ['data scientist','data science','ml engineer','machine learning','ai engineer'],
  'devops':            ['devops','site reliability','sre ','platform engineer','cloud engineer','infrastructure engineer'],
  'designer':          ['designer','ux','ui ','user experience','user interface','visual designer','product design'],
  'marketing':         ['marketing','growth','brand','campaign','digital marketing','content marketing'],
  'finance':           ['finance','financial','accountant','accounting','analyst','fp&a','controller','cfo'],
  'hr':                ['hr ','human resources','people operations','talent','recruiter','recruitment','hrbp'],
  'sales':             ['sales','account executive','account manager','business development','bdr','sdr','revenue'],
  'legal':             ['legal','counsel','lawyer','attorney','compliance','regulatory'],
  'operations':        ['operations manager','operations director','ops manager','chief of staff','business operations'],
}

function isRelevant(jobTitle, keywords) {
  if (!keywords || !jobTitle) return true
  const title = jobTitle.toLowerCase()
  const kw    = keywords.toLowerCase().trim()

  // Reject non-English / flag emoji in title (🇩🇪 etc.)
  if (/[\u{1F1E0}-\u{1F1FF}]/u.test(jobTitle)) return false

  // Synonym expansion — if search maps to known variants, check those
  for (const [key, variants] of Object.entries(SYNONYMS)) {
    if (kw.includes(key) || key.includes(kw)) {
      if (variants.some(v => title.includes(v))) return true
      // If synonym matched the key but no variant found, still require direct match below
    }
  }

  // Strict word match: ALL meaningful words must appear in title
  const words = kw.split(/\s+/).filter(w => w.length > 2)
  if (!words.length) return true

  // For 1–2 word searches: require 100% match
  // For 3+ word searches: require 70% match
  const threshold = words.length <= 2 ? 1.0 : 0.7
  const hits = words.filter(w => title.includes(w))
  return hits.length / words.length >= threshold
}

// ── Fortune 500 — Workday companies ──────────────────────────────────────────
const WORKDAY = {
  // 🏦 Banking & Finance — UK
  barclays:       { host:'barclays.wd3.myworkdayjobs.com',             tenant:'Barclays',           board:'External' },
  hsbc:           { host:'hsbc.wd3.myworkdayjobs.com',                 tenant:'HSBC',               board:'External' },
  lloyds:         { host:'lloydsbankinggroup.wd3.myworkdayjobs.com',   tenant:'LloydsBankingGroup', board:'External' },
  natwest:        { host:'natwestgroup.wd3.myworkdayjobs.com',         tenant:'NatWestGroup',       board:'External' },
  // 🏦 Banking & Finance — US
  jpmorgan:       { host:'jpmc.wd5.myworkdayjobs.com',                 tenant:'JPMorganChase',      board:'External' },
  goldmansachs:   { host:'goldmansachs.wd5.myworkdayjobs.com',         tenant:'Goldman_Sachs',      board:'External' },
  wellsfargo:     { host:'wellsfargo.wd5.myworkdayjobs.com',           tenant:'WellsFargo',         board:'External' },
  citi:           { host:'citi.wd5.myworkdayjobs.com',                 tenant:'Citi',               board:'External' },
  morganstanley:  { host:'morganstanley.wd5.myworkdayjobs.com',        tenant:'MorganStanley',      board:'External' },
  americanexpress:{ host:'aexp.wd5.myworkdayjobs.com',                 tenant:'AmericanExpress',    board:'External' },
  capitalone:     { host:'capitalone.wd5.myworkdayjobs.com',           tenant:'CapitalOne',         board:'External' },
  blackrock:      { host:'blackrock.wd5.myworkdayjobs.com',            tenant:'BlackRock',          board:'External' },
  // 💻 Technology
  amazon:         { host:'amazon.wd5.myworkdayjobs.com',               tenant:'Amazon',             board:'External' },
  microsoft:      { host:'microsoft.wd1.myworkdayjobs.com',            tenant:'Microsoft',          board:'External' },
  ibm:            { host:'ibm.wd12.myworkdayjobs.com',                 tenant:'IBM',                board:'External' },
  intel:          { host:'intel.wd1.myworkdayjobs.com',                tenant:'Intel',              board:'External' },
  cisco:          { host:'cisco.wd5.myworkdayjobs.com',                tenant:'Cisco',              board:'External' },
  oracle:         { host:'oracle.wd5.myworkdayjobs.com',               tenant:'Oracle',             board:'External' },
  salesforce:     { host:'salesforce.wd5.myworkdayjobs.com',           tenant:'Salesforce',         board:'External' },
  dell:           { host:'dell.wd5.myworkdayjobs.com',                 tenant:'Dell',               board:'External' },
  hp:             { host:'hp.wd5.myworkdayjobs.com',                   tenant:'HP',                 board:'External' },
  qualcomm:       { host:'qualcomm.wd5.myworkdayjobs.com',             tenant:'Qualcomm',           board:'External' },
  // 💼 Consulting & Professional Services
  deloitte:       { host:'deloitte.wd5.myworkdayjobs.com',             tenant:'Deloitte',           board:'External' },
  pwc:            { host:'pwc.wd3.myworkdayjobs.com',                  tenant:'PwC',                board:'External' },
  kpmg:           { host:'kpmg.wd3.myworkdayjobs.com',                 tenant:'KPMG',               board:'External' },
  ey:             { host:'ey.wd5.myworkdayjobs.com',                   tenant:'EY',                 board:'External' },
  accenture:      { host:'accenture.wd3.myworkdayjobs.com',            tenant:'Accenture',          board:'External' },
  capgemini:      { host:'capgemini.wd3.myworkdayjobs.com',            tenant:'Capgemini',          board:'External' },
  wipro:          { host:'wipro.wd3.myworkdayjobs.com',                tenant:'Wipro',              board:'External' },
  hcl:            { host:'hcltech.wd3.myworkdayjobs.com',             tenant:'HCLTech',            board:'External' },
  cognizant:      { host:'cognizant.wd5.myworkdayjobs.com',            tenant:'Cognizant',          board:'External' },
  // 🏥 Healthcare & Pharma
  unitedhealth:   { host:'uhg.wd5.myworkdayjobs.com',                  tenant:'UHG',                board:'External' },
  cvs:            { host:'cvshealth.wd5.myworkdayjobs.com',            tenant:'CVSHealth',          board:'External' },
  jnj:            { host:'jnj.wd5.myworkdayjobs.com',                  tenant:'JohnsonJohnson',     board:'External' },
  pfizer:         { host:'pfizer.wd5.myworkdayjobs.com',               tenant:'Pfizer',             board:'External' },
  merck:          { host:'merck.wd5.myworkdayjobs.com',                tenant:'Merck',              board:'External' },
  abbott:         { host:'abbott.wd5.myworkdayjobs.com',               tenant:'Abbott',             board:'External' },
  astrazeneca:    { host:'astrazeneca.wd3.myworkdayjobs.com',          tenant:'AstraZeneca',        board:'External' },
  gsk:            { host:'gsk.wd5.myworkdayjobs.com',                  tenant:'GSK',                board:'External' },
  novartis:       { host:'novartis.wd3.myworkdayjobs.com',             tenant:'Novartis',           board:'External' },
  roche:          { host:'roche.wd3.myworkdayjobs.com',                tenant:'Roche',              board:'External' },
  bayer:          { host:'bayer.wd3.myworkdayjobs.com',                tenant:'Bayer',              board:'External' },
  // ✈️ Aerospace & Defence
  boeing:         { host:'boeing.wd5.myworkdayjobs.com',               tenant:'Boeing',             board:'External' },
  lockheedmartin: { host:'lmco.wd5.myworkdayjobs.com',                 tenant:'LM',                 board:'External' },
  northropgrumman:{ host:'northropgrumman.wd5.myworkdayjobs.com',      tenant:'NorthropGrumman',    board:'External' },
  generaldynamics:{ host:'gd.wd5.myworkdayjobs.com',                   tenant:'GeneralDynamics',    board:'External' },
  raytheon:       { host:'rtx.wd5.myworkdayjobs.com',                  tenant:'RTX',                board:'External' },
  bae:            { host:'baesystems.wd3.myworkdayjobs.com',           tenant:'BAESystems',         board:'External' },
  rolls:          { host:'rolls-royce.wd3.myworkdayjobs.com',          tenant:'RollsRoyce',         board:'External' },
  // ⚡ Energy
  exxonmobil:     { host:'exxonmobil.wd5.myworkdayjobs.com',           tenant:'ExxonMobil',         board:'External' },
  chevron:        { host:'chevron.wd5.myworkdayjobs.com',              tenant:'Chevron',            board:'External' },
  bp:             { host:'bp.wd3.myworkdayjobs.com',                   tenant:'BP',                 board:'External' },
  shell:          { host:'shell.wd5.myworkdayjobs.com',                tenant:'Shell',              board:'External' },
  totalenergies:  { host:'totalenergies.wd3.myworkdayjobs.com',        tenant:'TotalEnergies',      board:'External' },
  // 🛒 Retail & Consumer
  walmart:        { host:'walmart.wd5.myworkdayjobs.com',              tenant:'Walmart',            board:'External' },
  target:         { host:'target.wd5.myworkdayjobs.com',               tenant:'Target',             board:'External' },
  homedepot:      { host:'homedepot.wd5.myworkdayjobs.com',            tenant:'HomeDepot',          board:'External' },
  costco:         { host:'costco.wd5.myworkdayjobs.com',               tenant:'Costco',             board:'External' },
  pg:             { host:'pg.wd5.myworkdayjobs.com',                   tenant:'ProcterGamble',      board:'External' },
  unilever:       { host:'unilever.wd3.myworkdayjobs.com',             tenant:'Unilever',           board:'External' },
  nestle:         { host:'nestle.wd3.myworkdayjobs.com',               tenant:'Nestle',             board:'External' },
  // 📱 Telecom & Media
  att:            { host:'att.wd5.myworkdayjobs.com',                  tenant:'ATT',                board:'External' },
  verizon:        { host:'verizon.wd5.myworkdayjobs.com',              tenant:'Verizon',            board:'External' },
  comcast:        { host:'comcast.wd5.myworkdayjobs.com',              tenant:'Comcast',            board:'External' },
  tmobile:        { host:'tmobile.wd5.myworkdayjobs.com',              tenant:'TMobile',            board:'External' },
  bt:             { host:'bt.wd3.myworkdayjobs.com',                   tenant:'BT',                 board:'External' },
  // 🚗 Automotive
  ford:           { host:'ford.wd12.myworkdayjobs.com',                tenant:'Ford',               board:'External' },
  gm:             { host:'generalmotors.wd5.myworkdayjobs.com',        tenant:'GeneralMotors',      board:'External' },
  tesla:          { host:'tesla.wd5.myworkdayjobs.com',                tenant:'Tesla',              board:'External' },
  bmw:            { host:'bmwgroup.wd3.myworkdayjobs.com',             tenant:'BMWGroup',           board:'External' },
  // 📦 Logistics & Transport
  ups:            { host:'ups.wd5.myworkdayjobs.com',                  tenant:'UPS',                board:'External' },
  fedex:          { host:'fedex.wd5.myworkdayjobs.com',                tenant:'FedEx',              board:'External' },
  dhl:            { host:'dhl.wd3.myworkdayjobs.com',                  tenant:'DHL',                board:'External' },
  // 🏭 Industrial & Manufacturing
  ge:             { host:'ge.wd5.myworkdayjobs.com',                   tenant:'GE',                 board:'External' },
  honeywell:      { host:'honeywell.wd5.myworkdayjobs.com',            tenant:'Honeywell',          board:'External' },
  siemens:        { host:'siemens.wd3.myworkdayjobs.com',              tenant:'Siemens',            board:'External' },
  '3m':           { host:'3m.wd5.myworkdayjobs.com',                   tenant:'3M',                 board:'External' },
  caterpillar:    { host:'caterpillar.wd5.myworkdayjobs.com',          tenant:'Caterpillar',        board:'External' },
}

// ── Greenhouse companies (many tech companies) ────────────────────────────────
const GREENHOUSE = {
  stripe:     'stripe',
  airbnb:     'airbnb',
  lyft:       'lyft',
  coinbase:   'coinbase',
  doordash:   'doordash',
  reddit:     'reddit',
  databricks: 'databricks',
  snowflake:  'snowflake',
  palantir:   'palantir',
  robinhood:  'robinhoodmarkets',
  figma:      'figma',
  notion:     'notion',
  airtable:   'airtable',
  canva:      'canva',
}

// ── Lever companies ────────────────────────────────────────────────────────────
const LEVER = {
  shopify: 'shopify',
  netflix: 'netflix',
}

// ── Workday scraper — fetches CSRF token first, then searches ─────────────────
async function scrapeWorkday(keywords, slug) {
  const c = WORKDAY[slug.toLowerCase()]
  if (!c) return []
  try {
    // Step 1: GET the careers page to obtain CSRF token
    const pageUrl = `https://${c.host}/${c.tenant}/${c.board}`
    const page = await request(pageUrl, { headers:{ Accept:'text/html,*/*' } })

    // Extract CSRF from response body or set-cookie
    let csrf = ''
    const csrfMatch = page.body.match(/["']?CALYPSO_CSRF_TOKEN["']?\s*[=:]\s*["']([^"']{8,})["']/)
    if (csrfMatch) csrf = csrfMatch[1]

    // Step 2: POST search
    const payload = JSON.stringify({ appliedFacets:{}, limit:20, offset:0, searchText:keywords })
    const apiUrl  = `https://${c.host}/wday/cxs/${c.tenant}/${c.board}/jobs`
    const resp    = await request(apiUrl, {
      method: 'POST',
      body:   payload,
      headers: {
        'Content-Type':          'application/json',
        'Content-Length':        Buffer.byteLength(payload),
        'Accept':                'application/json',
        'X-Calypso-CSRF-Token':  csrf,
        'Origin':                `https://${c.host}`,
        'Referer':               pageUrl,
      }
    })

    if (resp.status >= 400) return []
    const data = JSON.parse(resp.body)
    const displayName = c.tenant.replace(/([A-Z])/g,' $1').trim()

    return (data?.jobPostings||[]).map(j => ({
      id:       `${slug}_${makeId(j.title||'', c.tenant)}`,
      title:    clean(j.title||''),
      company:  displayName,
      location: clean(j.locationsText || (j.bulletFields||[]).join(', ') || ''),
      salary:   '',
      url:      `https://${c.host}${j.externalPath||''}`,
      description: '',
      source:   'careers',
      type:     'onsite',
    })).filter(isReal)
  } catch { return [] }
}

// ── Greenhouse scraper ────────────────────────────────────────────────────────
async function scrapeGreenhouse(keywords, slug) {
  try {
    const data = await getJSON(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`)
    const kw   = keywords.toLowerCase().split(' ')
    return (data?.jobs||[])
      .filter(j => kw.some(w => j.title?.toLowerCase().includes(w)))
      .slice(0,15)
      .map(j => ({
        id:`gh_${j.id}`, title:clean(j.title||''), company:clean(data.company?.name||slug),
        location:clean(j.location?.name||''), salary:'',
        url:j.absolute_url||'', description:clean(j.content||'').slice(0,300),
        source:'careers', type:'onsite',
      })).filter(isReal)
  } catch { return [] }
}

// ── Lever scraper ─────────────────────────────────────────────────────────────
async function scrapeLever(keywords, slug) {
  try {
    const data = await getJSON(`https://api.lever.co/v0/postings/${slug}?mode=json`)
    const kw   = keywords.toLowerCase().split(' ')
    return (Array.isArray(data)?data:[])
      .filter(j => kw.some(w => j.text?.toLowerCase().includes(w)))
      .slice(0,15)
      .map(j => ({
        id:`lever_${j.id}`, title:clean(j.text||''), company:slug,
        location:clean(j.categories?.location||''), salary:'',
        url:j.hostedUrl||'', description:clean(j.descriptionPlain||'').slice(0,300),
        source:'careers', type:j.workplaceType==='remote'?'remote':'onsite',
      })).filter(isReal)
  } catch { return [] }
}

// ── Meta Careers ──────────────────────────────────────────────────────────────
async function scrapeMeta(keywords, location) {
  try {
    const data = await getJSON(`https://www.metacareers.com/jobs?q=${encodeURIComponent(keywords)}&location=${encodeURIComponent(location||'')}`)
    return (data?.data||[]).map(j => ({
      id:`meta_${j.id}`, title:clean(j.title||''), company:'Meta',
      location:clean((j.locations||[]).join(', ')||'Remote'), salary:'',
      url:`https://www.metacareers.com/jobs/${j.id}`, description:clean(j.description||'').slice(0,300),
      source:'careers', type:'onsite',
    })).filter(isReal)
  } catch { return [] }
}

// ── Google Careers ────────────────────────────────────────────────────────────
async function scrapeGoogle(keywords, location) {
  try {
    const data = await getJSON(`https://careers.google.com/api/v3/search/?q=${encodeURIComponent(keywords)}&location=${encodeURIComponent(location||'')}&hl=en&num=20`)
    return (data?.jobs||[]).map(j => ({
      id:`google_${j.job_id}`, title:clean(j.title||''), company:'Google',
      location:clean((j.locations||[]).map(l=>l.display).join(', ')||location||''), salary:'',
      url:`https://careers.google.com/jobs/results/${j.job_id}`, description:clean(j.summary||'').slice(0,300),
      source:'careers', type:'onsite',
    })).filter(isReal)
  } catch { return [] }
}

// ── TCS Careers ───────────────────────────────────────────────────────────────
async function scrapeTCS(keywords) {
  try {
    const data = await postJSON('https://ibegin.tcs.com/iBegin/api/v2/jobs/search', { keyword:keywords, location:'', pageNo:1, pageSize:20 })
    return (data?.jobs||data?.data||[]).map(j => ({
      id:`tcs_${j.jobId||makeId(j.jobTitle||'',j.location||'')}`, title:clean(j.jobTitle||j.title||''), company:'TCS',
      location:clean(j.location||j.jobLocation||''), salary:'',
      url:j.jobUrl||`https://ibegin.tcs.com`, description:'', source:'careers', type:'onsite',
    })).filter(isReal)
  } catch { return [] }
}

// ── Reed API ──────────────────────────────────────────────────────────────────
async function scrapeReed(keywords, location, apiKey) {
  if (!apiKey) return []
  try {
    const auth = Buffer.from(`${apiKey}:`).toString('base64')
    const data = await getJSON(
      `https://www.reed.co.uk/api/1.0/search?keywords=${encodeURIComponent(keywords)}&locationName=${encodeURIComponent(location||'')}&distancefromLocation=15&resultsToTake=25`,
      { headers:{ Authorization:`Basic ${auth}`, Accept:'application/json' } }
    )
    return (data?.results||[]).map(j => ({
      id:`reed_${j.jobId}`, title:clean(j.jobTitle||''), company:clean(j.employerName||''),
      location:clean(j.locationName||location||'UK'),
      salary:j.minimumSalary?`£${Math.round(j.minimumSalary/1000)}k${j.maximumSalary?`–£${Math.round(j.maximumSalary/1000)}k`:'+'}`: '',
      url:j.jobUrl||`https://www.reed.co.uk/jobs/${j.jobId}`,
      description:clean(j.jobDescription||'').slice(0,300), source:'reed', type:'onsite',
    })).filter(isReal)
  } catch { return [] }
}

// ── Adzuna ────────────────────────────────────────────────────────────────────
async function scrapeAdzuna(keywords, location, id, key) {
  if (!id||!key) return []
  try {
    const data = await getJSON(`https://api.adzuna.com/v1/api/jobs/gb/search/1?app_id=${id}&app_key=${key}&what=${encodeURIComponent(keywords)}&where=${encodeURIComponent(location||'london')}&results_per_page=25`)
    return (data?.results||[]).map(j => ({
      id:`adzuna_${j.id}`, title:clean(j.title||''), company:clean(j.company?.display_name||''),
      location:clean(j.location?.display_name||location||'UK'),
      salary:j.salary_min?`£${Math.round(j.salary_min/1000)}k${j.salary_max?`–£${Math.round(j.salary_max/1000)}k`:'+'}`:'',
      url:j.redirect_url||'', description:clean(j.description||'').slice(0,300), source:'adzuna', type:'onsite',
    })).filter(isReal)
  } catch { return [] }
}

// ── Remote boards ─────────────────────────────────────────────────────────────
async function fetchRemotive(kw) {
  try {
    const d = await getJSON(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(kw)}&limit=20`)
    return (d?.jobs||[]).map(j=>({ id:`remotive_${j.id}`, title:clean(j.title||''), company:clean(j.company_name||''), location:clean(j.candidate_required_location||'Remote'), salary:j.salary||'', url:j.url||'', description:clean(j.description||'').slice(0,300), source:'remotive', type:'remote' })).filter(isReal)
  } catch { return [] }
}
async function fetchRemoteOK(kw) {
  try {
    const tag = kw.split(' ').slice(0,2).join('-').toLowerCase()
    const d = await getJSON(`https://remoteok.com/api?tag=${encodeURIComponent(tag)}`)
    return (Array.isArray(d)?d.filter(j=>j.position):[]).slice(0,15).map(j=>({ id:String(j.id||makeId(j.position,j.company)), title:clean(j.position||''), company:clean(j.company||''), location:'Remote', salary:j.salary_min?`$${Math.round(j.salary_min/1000)}k–$${Math.round(j.salary_max/1000)}k`:'', url:j.url||`https://remoteok.com/jobs/${j.id}`, description:clean(j.description||'').slice(0,300), source:'remoteok', type:'remote' })).filter(isReal)
  } catch { return [] }
}

// ── CV domain detection ───────────────────────────────────────────────────────
const DOMAINS = {
  it:           { match:['software','technology','digital','agile','scrum','infrastructure','cloud','devops','technical','cybersecurity','it project','it programme','information technology','sdlc','jira','azure','aws','saas'], exclude:['construction','civil engineering','site manager','quantity surveyor','structural','architectural'] },
  finance:      { match:['financial','banking','investment','portfolio','trading','risk','compliance','audit','cfa','acca','treasury','excel','bloomberg'], exclude:['construction','civil','site','clinical','nursing'] },
  healthcare:   { match:['clinical','patient','nhs','medical','nursing','healthcare','pharmaceutical','gcp','regulatory affairs','drug'], exclude:['construction','civil','software','trading'] },
  construction: { match:['construction','civil','site','quantity surveyor','structural','cad','autocad','nec','bim','mep','rics'], exclude:['software','digital','it project','trading'] },
  marketing:    { match:['marketing','brand','campaign','seo','social media','content','analytics','crm','hubspot','google ads'], exclude:['construction','civil','clinical','nursing'] },
  hr:           { match:['human resources','talent','recruitment','payroll','hris','employment law','hrbp','workforce'], exclude:['construction','civil','software engineering'] },
}

function detectDomain(cvText) {
  if (!cvText) return null
  const text = cvText.toLowerCase()
  let best = null, bestScore = 0
  for (const [domain, cfg] of Object.entries(DOMAINS)) {
    const score = cfg.match.filter(k => text.includes(k)).length
    if (score > bestScore) { bestScore = score; best = domain }
  }
  return bestScore >= 2 ? best : null
}

function passedDomainFilter(job, domain) {
  if (!domain) return true
  const cfg = DOMAINS[domain]
  if (!cfg) return true
  const text = (job.title + ' ' + job.description).toLowerCase()
  // Reject if title/desc contains known exclusion words for this domain
  return !cfg.exclude.some(w => text.includes(w))
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function scrapeJobs(query, log = ()=>{}) {
  const { keywords='', location='', type='all', reedApiKey='', adzunaAppId='', adzunaAppKey='', targetCompanies=[], cvText='' } = query
  const isRemote = type==='remote', isOnsite = type==='onsite'

  log(`Searching: "${keywords}" | "${location||'anywhere'}" | ${type}`)
  if (targetCompanies.length) log(`Targeting companies: ${targetCompanies.join(', ')}`)

  const tasks = []

  // Job boards
  if (!isRemote) {
    tasks.push(scrapeReed(keywords, location, reedApiKey).then(r => { log(`Reed: ${r.length}`); return r }))
    tasks.push(scrapeAdzuna(keywords, location, adzunaAppId, adzunaAppKey).then(r => { log(`Adzuna: ${r.length}`); return r }))
  }
  if (!isOnsite) {
    tasks.push(fetchRemotive(keywords).then(r  => { log(`Remotive: ${r.length}`);  return r }))
    tasks.push(fetchRemoteOK(keywords).then(r  => { log(`RemoteOK: ${r.length}`);  return r }))
  }

  // Run job boards first (fast)
  const boardResults = (await Promise.allSettled(tasks)).flatMap(r => r.status==='fulfilled' ? r.value : [])

  // Build company scrapers
  const companyFns = (targetCompanies||[]).map(c => {
    const slug = c.toLowerCase()
    if (slug==='meta')   return () => scrapeMeta(keywords, location).then(r   => { log(`Meta: ${r.length}`);   return r })
    if (slug==='google') return () => scrapeGoogle(keywords, location).then(r => { log(`Google: ${r.length}`); return r })
    if (slug==='tcs')    return () => scrapeTCS(keywords).then(r              => { log(`TCS: ${r.length}`);    return r })
    if (WORKDAY[slug])   return () => scrapeWorkday(keywords, slug).then(r    => { log(`${c}: ${r.length}`);   return r })
    if (GREENHOUSE[slug])return () => scrapeGreenhouse(keywords, GREENHOUSE[slug]).then(r => { log(`${c}: ${r.length}`); return r })
    if (LEVER[slug])     return () => scrapeLever(keywords, LEVER[slug]).then(r => { log(`${c}: ${r.length}`); return r })
    return null
  }).filter(Boolean)

  // Run company scrapers in batches of 10 to avoid throttling
  const companyResults = []
  const BATCH = 10
  for (let i = 0; i < companyFns.length; i += BATCH) {
    const batch = companyFns.slice(i, i + BATCH)
    const batchResults = await Promise.allSettled(batch.map(fn => fn()))
    companyResults.push(...batchResults.flatMap(r => r.status==='fulfilled' ? r.value : []))
    log(`Company batch ${Math.floor(i/BATCH)+1}/${Math.ceil(companyFns.length/BATCH)} done`)
  }

  const all = [...boardResults, ...companyResults]
  // Dedupe
  const seen = new Set()
  const deduped = all.filter(j => {
    const k = `${j.title.toLowerCase()}|${j.company.toLowerCase()}`
    if (seen.has(k)) return false
    seen.add(k); return true
  })

  // Relevance filter — title must match search keywords
  const relevant = deduped.filter(j => isRelevant(j.title, keywords))

  // Domain filter — exclude jobs from wrong industry based on CV content
  const domain = detectDomain(cvText)
  if (domain) log(`CV domain detected: ${domain}`)
  const domainFiltered = relevant.filter(j => passedDomainFilter(j, domain))

  log(`Total: ${deduped.length} → Relevant: ${relevant.length} → Domain filtered: ${domainFiltered.length}`)
  return domainFiltered
}

module.exports = { scrapeJobs, WORKDAY, GREENHOUSE, LEVER }
