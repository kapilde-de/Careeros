import { useState, useEffect, useRef } from 'react'

const api = window.agent

// ── Design tokens ─────────────────────────────────────────────────────────────
const s = {
  card:   { background:'#fff', border:'1px solid #e8eaed', borderRadius:10, padding:20, marginBottom:14 },
  inp:    { width:'100%', background:'#fafafa', border:'1.5px solid #e8eaed', borderRadius:8, padding:'9px 13px', fontSize:13, outline:'none', transition:'border-color .15s' },
  btn:    (x={}) => ({ background:'#0d9488', color:'#fff', border:'none', borderRadius:8, padding:'9px 18px', fontSize:13, fontWeight:600, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6, ...x }),
  ghost:  (x={}) => ({ background:'#fff', border:'1.5px solid #e8eaed', color:'#374151', borderRadius:8, padding:'8px 14px', fontSize:13, cursor:'pointer', ...x }),
  danger: (x={}) => ({ background:'#fef2f2', border:'1.5px solid #fecaca', color:'#dc2626', borderRadius:8, padding:'8px 14px', fontSize:13, cursor:'pointer', fontWeight:600, ...x }),
  label:  { fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:.8, marginBottom:5, display:'block' },
  row:    { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 },
}

const TABS = [
  { id:'profile',  icon:'👤', label:'Profile'   },
  { id:'cv',       icon:'📄', label:'My CV'      },
  { id:'search',   icon:'🔍', label:'Job Search' },
  { id:'queue',    icon:'📋', label:'Review Queue'},
  { id:'settings', icon:'⚙',  label:'Settings'  },
  { id:'log',      icon:'📡', label:'Activity'   },
]

const STATUS_COLORS = {
  pending:  { bg:'#fffbeb', text:'#d97706', border:'#fde68a' },
  approved: { bg:'#f0fdf4', text:'#16a34a', border:'#bbf7d0' },
  rejected: { bg:'#fef2f2', text:'#dc2626', border:'#fecaca' },
  applied:  { bg:'#f0fdfa', text:'#0d9488', border:'#99f6e4' },
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div style={{ position:'fixed', bottom:20, right:20, zIndex:9999, display:'flex', flexDirection:'column', gap:8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{ background:t.type==='error'?'#dc2626':t.type==='warning'?'#d97706':'#0d9488', color:'#fff', padding:'10px 16px', borderRadius:8, fontSize:13, fontWeight:500, boxShadow:'0 4px 16px rgba(0,0,0,0.15)', animation:'fadeIn .2s ease' }}>
          {t.msg}
        </div>
      ))}
    </div>
  )
}

// ── Fortune 500 Company Picker ────────────────────────────────────────────────
const COMPANY_SECTORS = [
  { label:'🏦 Banking & Finance', companies:[
    { id:'barclays',       name:'Barclays' },
    { id:'hsbc',           name:'HSBC' },
    { id:'lloyds',         name:'Lloyds' },
    { id:'natwest',        name:'NatWest' },
    { id:'jpmorgan',       name:'JPMorgan' },
    { id:'goldmansachs',   name:'Goldman Sachs' },
    { id:'wellsfargo',     name:'Wells Fargo' },
    { id:'citi',           name:'Citi' },
    { id:'morganstanley',  name:'Morgan Stanley' },
    { id:'americanexpress',name:'Amex' },
    { id:'capitalone',     name:'Capital One' },
    { id:'blackrock',      name:'BlackRock' },
  ]},
  { label:'💻 Technology', companies:[
    { id:'amazon',    name:'Amazon' },
    { id:'microsoft', name:'Microsoft' },
    { id:'google',    name:'Google' },
    { id:'meta',      name:'Meta' },
    { id:'ibm',       name:'IBM' },
    { id:'intel',     name:'Intel' },
    { id:'cisco',     name:'Cisco' },
    { id:'oracle',    name:'Oracle' },
    { id:'salesforce',name:'Salesforce' },
    { id:'dell',      name:'Dell' },
    { id:'hp',        name:'HP' },
    { id:'qualcomm',  name:'Qualcomm' },
    { id:'stripe',    name:'Stripe' },
    { id:'airbnb',    name:'Airbnb' },
    { id:'snowflake', name:'Snowflake' },
    { id:'palantir',  name:'Palantir' },
  ]},
  { label:'💼 Consulting & IT Services', companies:[
    { id:'deloitte',   name:'Deloitte' },
    { id:'pwc',        name:'PwC' },
    { id:'kpmg',       name:'KPMG' },
    { id:'ey',         name:'EY' },
    { id:'accenture',  name:'Accenture' },
    { id:'capgemini',  name:'Capgemini' },
    { id:'wipro',      name:'Wipro' },
    { id:'tcs',        name:'TCS' },
    { id:'hcl',        name:'HCL' },
    { id:'cognizant',  name:'Cognizant' },
  ]},
  { label:'🏥 Healthcare & Pharma', companies:[
    { id:'unitedhealth', name:'UnitedHealth' },
    { id:'cvs',          name:'CVS Health' },
    { id:'jnj',          name:'J&J' },
    { id:'pfizer',       name:'Pfizer' },
    { id:'merck',        name:'Merck' },
    { id:'abbott',       name:'Abbott' },
    { id:'astrazeneca',  name:'AstraZeneca' },
    { id:'gsk',          name:'GSK' },
    { id:'novartis',     name:'Novartis' },
    { id:'roche',        name:'Roche' },
    { id:'bayer',        name:'Bayer' },
  ]},
  { label:'✈️ Aerospace & Defence', companies:[
    { id:'boeing',          name:'Boeing' },
    { id:'lockheedmartin',  name:'Lockheed Martin' },
    { id:'northropgrumman', name:'Northrop Grumman' },
    { id:'generaldynamics', name:'General Dynamics' },
    { id:'raytheon',        name:'Raytheon (RTX)' },
    { id:'bae',             name:'BAE Systems' },
    { id:'rolls',           name:'Rolls-Royce' },
  ]},
  { label:'⚡ Energy', companies:[
    { id:'exxonmobil',   name:'ExxonMobil' },
    { id:'chevron',      name:'Chevron' },
    { id:'bp',           name:'BP' },
    { id:'shell',        name:'Shell' },
    { id:'totalenergies',name:'TotalEnergies' },
  ]},
  { label:'🛒 Retail & Consumer', companies:[
    { id:'walmart',  name:'Walmart' },
    { id:'target',   name:'Target' },
    { id:'homedepot',name:'Home Depot' },
    { id:'costco',   name:'Costco' },
    { id:'pg',       name:'P&G' },
    { id:'unilever', name:'Unilever' },
    { id:'nestle',   name:'Nestlé' },
  ]},
  { label:'📱 Telecom & Media', companies:[
    { id:'att',     name:'AT&T' },
    { id:'verizon', name:'Verizon' },
    { id:'comcast', name:'Comcast' },
    { id:'tmobile', name:'T-Mobile' },
    { id:'bt',      name:'BT Group' },
  ]},
  { label:'🚗 Automotive', companies:[
    { id:'ford',  name:'Ford' },
    { id:'gm',    name:'GM' },
    { id:'tesla', name:'Tesla' },
    { id:'bmw',   name:'BMW' },
  ]},
  { label:'🏭 Industrial', companies:[
    { id:'ge',          name:'GE' },
    { id:'honeywell',   name:'Honeywell' },
    { id:'siemens',     name:'Siemens' },
    { id:'3m',          name:'3M' },
    { id:'caterpillar', name:'Caterpillar' },
  ]},
  { label:'📦 Logistics', companies:[
    { id:'ups',   name:'UPS' },
    { id:'fedex', name:'FedEx' },
    { id:'dhl',   name:'DHL' },
  ]},
]

function CompanyPicker({ selected, onChange }) {
  const toggle = id => {
    if (selected.includes(id)) onChange(selected.filter(c => c !== id))
    else onChange([...selected, id])
  }
  const clearAll = () => onChange([])

  return (
    <div>
      {selected.length > 0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12, padding:'10px 12px', background:'#f0fdfa', border:'1px solid #99f6e4', borderRadius:8 }}>
          <span style={{ fontSize:11, fontWeight:700, color:'#0d9488', width:'100%', marginBottom:4 }}>✓ {selected.length} SELECTED</span>
          {selected.map(id => {
            const co = COMPANY_SECTORS.flatMap(s=>s.companies).find(c=>c.id===id)
            return <span key={id} onClick={()=>toggle(id)} style={{ fontSize:11, background:'#0d9488', color:'#fff', borderRadius:20, padding:'3px 10px', cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>{co?.name||id} ✕</span>
          })}
          <span onClick={clearAll} style={{ fontSize:11, color:'#dc2626', cursor:'pointer', marginLeft:'auto', alignSelf:'center' }}>Clear all</span>
        </div>
      )}
      {COMPANY_SECTORS.map(sector => (
        <div key={sector.label} style={{ marginBottom:10 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#6b7280', marginBottom:6, textTransform:'uppercase', letterSpacing:.6 }}>{sector.label}</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {sector.companies.map(co => {
              const on = selected.includes(co.id)
              return (
                <button key={co.id} onClick={()=>toggle(co.id)}
                  style={{ fontSize:11, padding:'4px 12px', borderRadius:20, border:`1.5px solid ${on?'#0d9488':'#e8eaed'}`, background:on?'#0d9488':'#fafafa', color:on?'#fff':'#374151', cursor:'pointer', fontWeight:on?600:400, transition:'all .12s' }}>
                  {co.name}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function App() {
  const [tab, setTab]         = useState('profile')
  const [profile, setProfile] = useState({ firstName:'', lastName:'', email:'', phone:'', location:'', linkedIn:'', targetRoles:'', minSalary:'', remoteOnly:false, targetCompanies:'' })
  const [cvText, setCvText]   = useState('')
  const [cvFile, setCvFile]   = useState('')
  const [jobs, setJobs]       = useState([])
  const [queue, setQueue]     = useState([])
  const [settings, setSettings] = useState({ anthropicKey:'', reedApiKey:'', adzunaAppId:'', adzunaAppKey:'', emailEnabled:false, emailTo:'', smtpUser:'', smtpPass:'', smtpHost:'smtp.gmail.com', smtpPort:'587' })
  const [logs, setLogs]       = useState([])
  const [searching, setSearching]     = useState(false)
  const [tailoring, setTailoring]     = useState(null)
  const [autoRunning, setAutoRunning] = useState(false)
  const [autoProgress, setAutoProgress] = useState('')
  const [toasts, setToasts]           = useState([])
  const [searchQ, setSearchQ]         = useState({ keywords:'', location:'', type:'all' })
  const [salaryFilter, setSalaryFilter] = useState('')
  const [showWelcome, setShowWelcome] = useState(false)
  const logsEndRef = useRef(null)

  function toast(msg, type='success') {
    const id = Date.now()
    setToasts(p => [...p, { id, msg, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500)
  }

  function addLog(msg) {
    setLogs(p => [...p.slice(-199), { time: new Date().toLocaleTimeString(), msg }])
  }

  // Load saved data on mount
  useEffect(() => {
    api?.loadProfile().then(p => p && setProfile(p))
    api?.loadSettings().then(s => s && Object.keys(s).length && setSettings(s))
    api?.loadQueue().then(q => q && setQueue(q))
    api?.onLog(({ time, msg }) => setLogs(p => [...p.slice(-199), { time, msg }]))
    api?.onJobFound(job => { setQueue(p => [job, ...p]) })
    api?.isFirstRun().then(first => { if (first) setShowWelcome(true) })
  }, [])

  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior:'smooth' }) }, [logs])

  async function saveProfile() {
    await api?.saveProfile(profile)
    toast('Profile saved')
  }

  async function saveSettings() {
    await api?.saveSettings(settings)
    toast('Settings saved')
  }

  async function pickCV() {
    const path = await api?.pickCVFile()
    if (!path) return
    setCvFile(path)
    addLog(`Parsing CV: ${path}`)
    const res = await api?.parseCV(path)
    if (res?.error) { toast(res.error, 'error'); return }
    const text = res.text || ''
    setCvText(text)
    toast('CV loaded — starting job search from your profile…')
    addLog(`CV parsed — ${text.length} chars`)
    // Auto-search using profile target roles
    setProfile(current => {
      const roles = current.targetRoles?.split(',').map(r=>r.trim()).filter(Boolean)
      if (roles?.length && text) {
        const keywords = roles[0]
        const location = current.location || ''
        const type = current.remoteOnly ? 'remote' : 'all'
        setTab('search')
        setSearchQ(q => ({ ...q, keywords, location, type }))
        setTimeout(() => {
          setSearching(true)
          setJobs([])
          addLog(`Auto-searching: "${keywords}" in ${location||'anywhere'}`)
          const allCompanies = COMPANY_SECTORS.flatMap(s => s.companies.map(c => c.id))
          api?.searchJobs({ keywords, location, type, profile: current, cvText: text.slice(0,3000), reedApiKey: settings.reedApiKey, adzunaAppId: settings.adzunaAppId, adzunaAppKey: settings.adzunaAppKey, targetCompanies: allCompanies }).then(results => {
            setJobs(results || [])
            setSearching(false)
            toast(`Found ${results?.length||0} jobs — click "Tailor & Apply All" to auto-apply`)
            addLog(`Auto-search done — ${results?.length||0} jobs found`)
          })
        }, 300)
      }
      return current
    })
  }

  async function searchJobs() {
    if (!cvText) { toast('Upload your CV first', 'warning'); return }
    setSearching(true)
    setJobs([])
    addLog(`Starting job search: "${searchQ.keywords}"`)
    const allCompanies = COMPANY_SECTORS.flatMap(s => s.companies.map(c => c.id))
    const results = await api?.searchJobs({ ...searchQ, profile, cvText: cvText.slice(0,3000), reedApiKey: settings.reedApiKey, adzunaAppId: settings.adzunaAppId, adzunaAppKey: settings.adzunaAppKey, targetCompanies: allCompanies })
    // Client-side relevance — require ALL keywords to appear in title
    const kw = (searchQ.keywords||'').toLowerCase().split(/\s+/).filter(w=>w.length>2)
    const filtered = (results||[]).filter(j => {
      if (!kw.length) return true
      if (/[\u{1F1E0}-\u{1F1FF}]/u.test(j.title)) return false   // no flag emojis
      const t = j.title.toLowerCase()
      const threshold = kw.length <= 2 ? 1.0 : 0.7
      return kw.filter(w => t.includes(w)).length / kw.length >= threshold
    })
    setJobs(filtered)
    setSearching(false)
    if (filtered.length) toast(`Found ${filtered.length} relevant jobs`)
    else toast('No matching jobs found — try broader keywords', 'warning')
  }

  async function tailorAndQueue(job) {
    if (!cvText) { toast('Upload your CV first', 'warning'); return }
    if (!settings.anthropicKey) { toast('Add your Anthropic API key in Settings', 'warning'); return }
    setTailoring(job.id)
    addLog(`Tailoring CV for: ${job.title} @ ${job.company}`)
    const res = await api?.tailorCV({ cvText, jobTitle: job.title, jobDescription: job.description || job.title, apiKey: settings.anthropicKey })
    if (res?.error) { toast(res.error, 'error'); setTailoring(null); return }
    const updated = jobs.map(j => j.id === job.id ? { ...j, tailored: res, status:'tailored' } : j)
    setJobs(updated)
    setTailoring(null)
    toast(`CV tailored — ${res.matchScore}% match`, 'success')
    addLog(`CV tailored for ${job.title} — match: ${res.matchScore}%`)
  }

  async function autoApplyAll() {
    if (!cvText) { toast('Upload your CV first', 'warning'); return }
    if (!settings.anthropicKey) { toast('Add your Anthropic API key in Settings first', 'warning'); return }
    const pending = jobs.filter(j => !j.tailored)
    if (!pending.length) { toast('All jobs already tailored', 'warning'); return }
    setAutoRunning(true)
    addLog(`Auto-apply starting for ${pending.length} jobs…`)
    for (let i = 0; i < pending.length; i++) {
      const job = pending[i]
      setAutoProgress(`Tailoring ${i+1}/${pending.length}: ${job.title} @ ${job.company}`)
      addLog(`[${i+1}/${pending.length}] Tailoring CV for: ${job.title} @ ${job.company}`)
      const res = await api?.tailorCV({ cvText, jobTitle: job.title, jobDescription: job.description || job.title, apiKey: settings.anthropicKey })
      if (res?.error) { addLog(`Tailor failed for ${job.title}: ${res.error}`); continue }
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, tailored: res } : j))
      addLog(`Tailored ${job.title} — match: ${res.matchScore}%`)
      // Apply
      setAutoProgress(`Applying ${i+1}/${pending.length}: ${job.title} @ ${job.company}`)
      const applied = await api?.applyJob({ job: { ...job, tailored: res }, profile, settings })
      if (applied?.error) { addLog(`Apply failed: ${applied.error}`); continue }
      addLog(`✓ Applied to ${job.title} @ ${job.company}`)
    }
    const q = await api?.loadQueue(); setQueue(q || [])
    setAutoRunning(false)
    setAutoProgress('')
    toast(`Auto-apply complete — ${pending.length} applications sent`)
    addLog(`Auto-apply complete`)
  }

  async function applyToJob(job) {
    addLog(`Applying to: ${job.title} @ ${job.company}`)
    const res = await api?.applyJob({ job, profile, settings })
    if (res?.error) { toast(res.error, 'error'); return }
    toast(`Applied to ${job.title} @ ${job.company}`)
    const q = await api?.loadQueue()
    setQueue(q || [])
    window.open(job.url, '_blank')
  }

  async function approveJob(id) {
    await api?.approveJob(id)
    const q = await api?.loadQueue(); setQueue(q || [])
    toast('Job approved')
  }

  async function rejectJob(id) {
    await api?.rejectJob(id)
    const q = await api?.loadQueue(); setQueue(q || [])
  }

  async function testEmail() {
    toast('Sending test email…')
    const res = await api?.testEmail(settings)
    if (res?.error) toast(`Failed: ${res.error}`, 'error')
    else toast('Test email sent!')
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function parseSalary(salaryStr) {
    if (!salaryStr) return null
    const nums = salaryStr.replace(/[£$,k]/gi, '').match(/\d+/g)
    if (!nums) return null
    const val = parseFloat(nums[0])
    return salaryStr.toLowerCase().includes('k') ? val * 1000 : val
  }

  function applyFilters(jobList) {
    const minSal = parseFloat(salaryFilter || profile.minSalary || 0)
    return jobList.filter(j => {
      if (minSal > 0) {
        const s = parseSalary(j.salary)
        if (s !== null && s < minSal) return false
      }
      return true
    })
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display:'flex', height:'100vh', background:'#f7f8fa', fontFamily:"'Inter',sans-serif" }}>
      <Toast toasts={toasts} />

      {/* ── Welcome modal ── */}
      {showWelcome && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'#fff', borderRadius:14, padding:32, maxWidth:560, width:'90%', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize:32, marginBottom:12 }}>🚀</div>
            <h2 style={{ fontSize:20, fontWeight:800, color:'#0f1117', marginBottom:8 }}>Welcome to CareerOS Desktop</h2>
            <p style={{ color:'#6b7280', fontSize:13, lineHeight:1.7, marginBottom:20 }}>Your AI-powered job hunting agent. Here's how to get started in 3 steps:</p>
            <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:24 }}>
              {[
                ['1️⃣  Fill your Profile','Add your name, location, target roles and minimum salary. This drives all searches.'],
                ['2️⃣  Upload your CV','Go to My CV tab → upload PDF or DOCX. The agent uses it to tailor applications automatically.'],
                ['3️⃣  Add API Keys in Settings','• Anthropic key (console.anthropic.com) — for CV tailoring\n• Reed key (reed.co.uk/developers) — for UK jobs\n• Adzuna key (developer.adzuna.com) — for more UK jobs'],
                ['4️⃣  Search Jobs','Hit Search Jobs — CareerOS searches Reed, Adzuna + 70 Fortune 500 career pages simultaneously.'],
                ['5️⃣  Tailor & Apply All','Click ⚡ Tailor & Apply All to auto-tailor your CV for every job and submit applications.'],
              ].map(([title, desc]) => (
                <div key={title} style={{ background:'#f8fafc', borderRadius:8, padding:'12px 14px' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#0f1117', marginBottom:3 }}>{title}</div>
                  <div style={{ fontSize:12, color:'#6b7280', lineHeight:1.6, whiteSpace:'pre-line' }}>{desc}</div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowWelcome(false)} style={{ width:'100%', background:'#0d9488', color:'#fff', border:'none', borderRadius:8, padding:'12px', fontSize:14, fontWeight:700, cursor:'pointer' }}>
              Get Started →
            </button>
          </div>
        </div>
      )}

      {/* ── Sidebar ── */}
      <div style={{ width:200, background:'#fff', borderRight:'1px solid #e8eaed', display:'flex', flexDirection:'column', flexShrink:0 }}>
        {/* Logo */}
        <div style={{ height:48, borderBottom:'1px solid #f0f1f3', display:'flex', alignItems:'center', padding:'0 16px', gap:8 }}>
          <div style={{ width:10, height:10, borderRadius:'50%', background:'#0d9488' }}/>
          <span style={{ fontSize:13, fontWeight:700, color:'#0f1117' }}>CareerOS</span>
        </div>
        <nav style={{ flex:1, padding:'8px 0' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 16px', background:tab===t.id?'#f0fdfa':'transparent', border:'none', borderLeft:`3px solid ${tab===t.id?'#0d9488':'transparent'}`, color:tab===t.id?'#0d9488':'#6b7280', fontSize:13, fontWeight:tab===t.id?600:400, cursor:'pointer', textAlign:'left', transition:'all .15s' }}>
              <span style={{ fontSize:15 }}>{t.icon}</span>{t.label}
              {t.id==='queue'&&queue.filter(j=>j.status==='pending').length>0&&(
                <span style={{ marginLeft:'auto', background:'#0d9488', color:'#fff', borderRadius:99, fontSize:10, fontWeight:700, padding:'1px 6px' }}>{queue.filter(j=>j.status==='pending').length}</span>
              )}
            </button>
          ))}
        </nav>
        <div style={{ padding:'12px 16px', borderTop:'1px solid #f0f1f3' }}>
          <div style={{ fontSize:10, color:'#9ca3af', fontWeight:600 }}>v1.0.0 · CareerOS Desktop</div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ flex:1, overflowY:'auto', padding:28 }}>

        {/* ════ PROFILE ════ */}
        {tab==='profile'&&(
          <div className="fade">
            <div style={{ marginBottom:22 }}>
              <h1 style={{ fontSize:22, fontWeight:800, color:'#0f1117', marginBottom:4 }}>Your Profile</h1>
              <p style={{ color:'#6b7280', fontSize:13 }}>Used to personalise every CV and application.</p>
            </div>
            <div style={s.card}>
              <div style={s.row}>
                <div><label style={s.label}>First name</label><input style={s.inp} value={profile.firstName} onChange={e=>setProfile(p=>({...p,firstName:e.target.value}))} placeholder="Jane"/></div>
                <div><label style={s.label}>Last name</label><input style={s.inp} value={profile.lastName} onChange={e=>setProfile(p=>({...p,lastName:e.target.value}))} placeholder="Smith"/></div>
              </div>
              <div style={s.row}>
                <div><label style={s.label}>Email</label><input style={s.inp} type="email" value={profile.email} onChange={e=>setProfile(p=>({...p,email:e.target.value}))} placeholder="jane@email.com"/></div>
                <div><label style={s.label}>Phone</label><input style={s.inp} value={profile.phone} onChange={e=>setProfile(p=>({...p,phone:e.target.value}))} placeholder="+44 7700 900123"/></div>
              </div>
              <div style={s.row}>
                <div><label style={s.label}>Location</label><input style={s.inp} value={profile.location} onChange={e=>setProfile(p=>({...p,location:e.target.value}))} placeholder="London, UK"/></div>
                <div><label style={s.label}>LinkedIn URL</label><input style={s.inp} value={profile.linkedIn} onChange={e=>setProfile(p=>({...p,linkedIn:e.target.value}))} placeholder="linkedin.com/in/jane"/></div>
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={s.label}>Target roles (comma-separated)</label>
                <input style={s.inp} value={profile.targetRoles} onChange={e=>setProfile(p=>({...p,targetRoles:e.target.value}))} placeholder="Product Manager, Senior PM, Head of Product"/>
              </div>
              <div style={s.row}>
                <div><label style={s.label}>Min salary (£/year)</label><input style={s.inp} type="number" value={profile.minSalary} onChange={e=>setProfile(p=>({...p,minSalary:e.target.value}))} placeholder="50000"/></div>
                <div style={{ display:'flex', alignItems:'center', gap:10, paddingTop:20 }}>
                  <input type="checkbox" id="remote" checked={profile.remoteOnly} onChange={e=>setProfile(p=>({...p,remoteOnly:e.target.checked}))} style={{ width:16, height:16, cursor:'pointer' }}/>
                  <label htmlFor="remote" style={{ fontSize:13, color:'#374151', cursor:'pointer', fontWeight:500 }}>Remote only</label>
                </div>
              </div>
              <button style={s.btn()} onClick={saveProfile}>Save Profile →</button>
            </div>
          </div>
        )}

        {/* ════ CV ════ */}
        {tab==='cv'&&(
          <div className="fade">
            <div style={{ marginBottom:22 }}>
              <h1 style={{ fontSize:22, fontWeight:800, color:'#0f1117', marginBottom:4 }}>My CV</h1>
              <p style={{ color:'#6b7280', fontSize:13 }}>
                Upload your CV — it will automatically search for <strong>{profile.targetRoles||'your target roles'}</strong> and tailor your application for each job found.
              </p>
            </div>
            <div style={s.card}>
              <div
                onClick={pickCV}
                style={{ border:'2px dashed #e8eaed', borderRadius:10, padding:'36px 24px', textAlign:'center', cursor:'pointer', background:'#fafafa', marginBottom:16, transition:'all .15s' }}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor='#0d9488'; e.currentTarget.style.background='#f0fdfa' }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor='#e8eaed'; e.currentTarget.style.background='#fafafa' }}>
                <div style={{ fontSize:36, marginBottom:10 }}>📄</div>
                <div style={{ fontSize:14, fontWeight:600, color:'#0f1117', marginBottom:4 }}>
                  {cvFile ? cvFile.split('\\').pop() : 'Click to upload your CV'}
                </div>
                <div style={{ fontSize:12, color:'#9ca3af' }}>PDF · DOCX · DOC · TXT</div>
              </div>
              {cvText&&(
                <>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <span style={{ fontSize:12, fontWeight:600, color:'#0d9488' }}>✓ CV loaded — {cvText.length.toLocaleString()} characters</span>
                    <button onClick={pickCV} style={s.ghost({ fontSize:11, padding:'5px 12px' })}>Replace</button>
                  </div>
                  <textarea
                    value={cvText}
                    onChange={e=>setCvText(e.target.value)}
                    style={{ ...s.inp, minHeight:320, fontFamily:'monospace', fontSize:12, lineHeight:1.7 }}
                    placeholder="Your CV text will appear here…"
                  />
                </>
              )}
              {!cvText&&(
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:12, color:'#9ca3af', marginBottom:10 }}>— or paste directly —</div>
                  <textarea
                    value={cvText}
                    onChange={e=>setCvText(e.target.value)}
                    style={{ ...s.inp, minHeight:200, fontSize:12 }}
                    placeholder="Paste your CV text here…"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════ JOB SEARCH ════ */}
        {tab==='search'&&(
          <div className="fade">
            <div style={{ marginBottom:22, display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
              <div>
                <h1 style={{ fontSize:22, fontWeight:800, color:'#0f1117', marginBottom:4 }}>Job Search</h1>
                <p style={{ color:'#6b7280', fontSize:13 }}>
                  Searches Reed, Adzuna + 70 Fortune 500 career pages (Barclays, Google, Meta, Deloitte, Shell, Boeing & more)
                </p>
              </div>
              {autoRunning&&<div style={{ fontSize:12, color:'#0d9488', fontWeight:600, background:'#f0fdfa', border:'1px solid #99f6e4', borderRadius:8, padding:'6px 12px' }}>⚡ {autoProgress}</div>}
            </div>

            <div style={s.card}>
              <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:12, marginBottom:12 }}>
                <div>
                  <label style={s.label}>Keywords</label>
                  <input style={s.inp} value={searchQ.keywords} onChange={e=>setSearchQ(p=>({...p,keywords:e.target.value}))}
                    placeholder="Product Manager, UX Designer, React Developer…"
                    onKeyDown={e=>e.key==='Enter'&&searchJobs()}/>
                </div>
                <div>
                  <label style={s.label}>Location</label>
                  <input style={s.inp} value={searchQ.location} onChange={e=>setSearchQ(p=>({...p,location:e.target.value}))}
                    placeholder="London, Remote, UK…"/>
                </div>
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:14 }}>
                {['all','remote','onsite'].map(t=>(
                  <button key={t} onClick={()=>setSearchQ(p=>({...p,type:t}))}
                    style={{ padding:'5px 13px', borderRadius:20, fontSize:12, fontWeight:500, cursor:'pointer', border:`1.5px solid ${searchQ.type===t?'#0d9488':'#e8eaed'}`, background:searchQ.type===t?'#0d9488':'#fafafa', color:searchQ.type===t?'#fff':'#374151' }}>
                    {t.charAt(0).toUpperCase()+t.slice(1)}
                  </button>
                ))}
                {profile.targetRoles&&(
                  <button onClick={()=>{ const r=profile.targetRoles.split(',')[0].trim(); setSearchQ(p=>({...p,keywords:r,location:profile.location||''})) }}
                    style={{ padding:'5px 13px', borderRadius:20, fontSize:12, fontWeight:500, cursor:'pointer', border:'1.5px solid #e8eaed', background:'#fafafa', color:'#374151', marginLeft:'auto' }}>
                    ↺ Use profile roles
                  </button>
                )}
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={searchJobs} disabled={searching||autoRunning} style={s.btn({ opacity:searching?.6:1, flex:1, justifyContent:'center', padding:11 })}>
                  {searching?<><span style={{ width:14,height:14,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .8s linear infinite',display:'inline-block'}}/>  Searching…</>:'🔍  Search Jobs'}
                </button>
                {jobs.length>0&&(
                  <button onClick={autoApplyAll} disabled={autoRunning||searching} style={s.btn({ opacity:autoRunning?.6:1, flex:1, justifyContent:'center', padding:11, background:'#16a34a' })}>
                    {autoRunning?<><span style={{ width:14,height:14,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .8s linear infinite',display:'inline-block'}}/>  {autoProgress||'Running…'}</>:'⚡ Tailor & Apply All'}
                  </button>
                )}
              </div>
            </div>

            {/* Filter bar */}
            {jobs.length>0&&(
              <div style={{ background:'#fff', border:'1px solid #e8eaed', borderRadius:10, padding:'12px 16px', marginBottom:12, display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
                <span style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:.6 }}>Filter</span>
                <div style={{ display:'flex', gap:6 }}>
                  {['all','remote','onsite'].map(t=>(
                    <button key={t} onClick={()=>setSearchQ(p=>({...p,type:t}))}
                      style={{ padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:500, cursor:'pointer', border:`1.5px solid ${searchQ.type===t?'#0d9488':'#e8eaed'}`, background:searchQ.type===t?'#0d9488':'#fafafa', color:searchQ.type===t?'#fff':'#374151' }}>
                      {t.charAt(0).toUpperCase()+t.slice(1)}
                    </button>
                  ))}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ fontSize:11, color:'#6b7280' }}>Min salary £</span>
                  <input value={salaryFilter} onChange={e=>setSalaryFilter(e.target.value)} placeholder={profile.minSalary||'e.g. 50000'} style={{ width:100, padding:'4px 8px', border:'1.5px solid #e8eaed', borderRadius:6, fontSize:12 }}/>
                </div>
                <div style={{ marginLeft:'auto', fontSize:12, color:'#6b7280', fontWeight:500 }}>
                  {applyFilters(jobs).length} of {jobs.length} jobs
                </div>
              </div>
            )}
            {applyFilters(jobs).map(job=>(
              <div key={job.id} style={{ ...s.card, marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' }}>
                      <span style={{ fontSize:15, fontWeight:700, color:'#0f1117' }}>{job.title}</span>
                      <span style={{ fontSize:10, fontWeight:700, background: job.source==='careers'?'#eff6ff':'#f0fdfa', color:job.source==='careers'?'#2563eb':'#0d9488', border:`1px solid ${job.source==='careers'?'#bfdbfe':'#99f6e4'}`, padding:'2px 8px', borderRadius:4 }}>{job.source==='careers'?'🏢 CAREERS PAGE':(job.source||job.platform||'').toUpperCase()}</span>
                      {job.tailored&&<span style={{ fontSize:10, fontWeight:700, background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0', padding:'2px 8px', borderRadius:4 }}>✓ Tailored {job.tailored.matchScore}%</span>}
                    </div>
                    <div style={{ display:'flex', gap:14, marginBottom:6, flexWrap:'wrap' }}>
                      <span style={{ fontSize:12, color:'#6b7280' }}>🏢 {job.company}</span>
                      <span style={{ fontSize:12, color:'#9ca3af' }}>📍 {job.location}</span>
                      {job.salary&&job.salary!=='Salary not listed'&&<span style={{ fontSize:12, color:'#9ca3af' }}>💰 {job.salary}</span>}
                    </div>
                    {job.description && !/\{|webkit|margin:|padding:|display:/.test(job.description) && (
                      <p style={{ fontSize:12, color:'#9ca3af', lineHeight:1.6, marginBottom:10 }}>{job.description.slice(0,180)}{job.description.length>180?'…':''}</p>
                    )}
                    {job.tailored?.keyChanges&&(
                      <div style={{ background:'#f0fdfa', border:'1px solid #99f6e4', borderRadius:7, padding:'8px 12px', marginBottom:10 }}>
                        <div style={{ fontSize:10, fontWeight:700, color:'#0d9488', marginBottom:4 }}>KEY CV CHANGES</div>
                        {job.tailored.keyChanges.map((c,i)=><div key={i} style={{ fontSize:11, color:'#374151' }}>• {c}</div>)}
                      </div>
                    )}
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      <button onClick={()=>tailorAndQueue(job)} disabled={tailoring===job.id}
                        style={s.ghost({ fontSize:11, padding:'6px 12px', color:'#0d9488', borderColor:'#99f6e4', opacity:tailoring===job.id?.6:1 })}>
                        {tailoring===job.id?'Tailoring…':'✦ Tailor CV'}
                      </button>
                      <button onClick={()=>applyToJob(job)} style={s.btn({ fontSize:11, padding:'6px 12px' })}>Apply →</button>
                      <a href={job.url} target="_blank" rel="noreferrer" style={s.ghost({ fontSize:11, padding:'6px 12px', textDecoration:'none', display:'inline-flex', alignItems:'center' })}>View ↗</a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {!searching&&jobs.length===0&&(
              <div style={{ textAlign:'center', padding:'60px 20px', color:'#9ca3af' }}>
                <div style={{ fontSize:40, marginBottom:12 }}>🔍</div>
                <div style={{ fontSize:15, fontWeight:600, color:'#374151', marginBottom:6 }}>Search for jobs above</div>
                <div style={{ fontSize:13 }}>Results from Reed, RemoteOK, Arbeitnow, Jobicy & more</div>
              </div>
            )}
          </div>
        )}

        {/* ════ REVIEW QUEUE ════ */}
        {tab==='queue'&&(
          <div className="fade">
            <div style={{ marginBottom:22 }}>
              <h1 style={{ fontSize:22, fontWeight:800, color:'#0f1117', marginBottom:4 }}>Review Queue</h1>
              <p style={{ color:'#6b7280', fontSize:13 }}>Jobs found by the agent. Approve to apply, reject to skip.</p>
            </div>
            {/* Stats */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 }}>
              {[['Pending','pending','#d97706'],['Approved','approved','#16a34a'],['Applied','applied','#0d9488'],['Rejected','rejected','#dc2626']].map(([l,s,c])=>(
                <div key={l} style={{ background:'#fff', border:'1px solid #e8eaed', borderRadius:10, padding:'14px 16px' }}>
                  <div style={{ fontSize:11, color:'#9ca3af', fontWeight:600, textTransform:'uppercase', letterSpacing:.6, marginBottom:4 }}>{l}</div>
                  <div style={{ fontSize:24, fontWeight:800, color:c }}>{queue.filter(j=>j.status===s).length}</div>
                </div>
              ))}
            </div>
            {queue.length===0&&(
              <div style={{ textAlign:'center', padding:'60px 20px', color:'#9ca3af' }}>
                <div style={{ fontSize:40, marginBottom:12 }}>📋</div>
                <div style={{ fontSize:15, fontWeight:600, color:'#374151', marginBottom:6 }}>Queue is empty</div>
                <div style={{ fontSize:13 }}>Run a job search to populate the queue</div>
                <button onClick={()=>setTab('search')} style={{ ...s.btn(), marginTop:14 }}>Go to Search →</button>
              </div>
            )}
            {queue.map(job=>{
              const sc = STATUS_COLORS[job.status]||STATUS_COLORS.pending
              return (
                <div key={job.id} style={{ ...s.card, marginBottom:10, borderLeft:`3px solid ${sc.border}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5, flexWrap:'wrap' }}>
                        <span style={{ fontSize:14, fontWeight:700 }}>{job.title}</span>
                        <span style={{ fontSize:10, fontWeight:700, background:sc.bg, color:sc.text, border:`1px solid ${sc.border}`, padding:'2px 8px', borderRadius:4 }}>{job.status.toUpperCase()}</span>
                        {job.platform&&<span style={{ fontSize:10, background:'#f8fafc', color:'#6b7280', border:'1px solid #e8eaed', padding:'2px 8px', borderRadius:4 }}>{job.platform}</span>}
                      </div>
                      <div style={{ display:'flex', gap:12, fontSize:12, color:'#6b7280', marginBottom:6 }}>
                        <span>🏢 {job.company}</span>
                        <span>📍 {job.location}</span>
                        {job.salary&&job.salary!=='Salary not listed'&&<span>💰 {job.salary}</span>}
                      </div>
                      <div style={{ fontSize:11, color:'#9ca3af' }}>Found {new Date(job.foundAt).toLocaleString('en-GB')}</div>
                    </div>
                    {job.status==='pending'&&(
                      <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                        <button onClick={()=>approveJob(job.id)} style={s.btn({ fontSize:11, padding:'6px 12px', background:'#16a34a' })}>✓ Approve</button>
                        <button onClick={()=>rejectJob(job.id)} style={s.danger({ fontSize:11, padding:'6px 12px' })}>✕</button>
                      </div>
                    )}
                    {job.status==='approved'&&(
                      <button onClick={()=>applyToJob(job)} style={s.btn({ fontSize:11, padding:'6px 12px' })}>Apply →</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ════ SETTINGS ════ */}
        {tab==='settings'&&(
          <div className="fade">
            <div style={{ marginBottom:22 }}>
              <h1 style={{ fontSize:22, fontWeight:800, color:'#0f1117', marginBottom:4 }}>Settings</h1>
              <p style={{ color:'#6b7280', fontSize:13 }}>API keys and notification preferences.</p>
            </div>

            <div style={s.card}>
              <div style={{ fontSize:12, fontWeight:700, color:'#0d9488', textTransform:'uppercase', letterSpacing:.8, marginBottom:14 }}>AI</div>
              <div style={{ marginBottom:14 }}>
                <label style={s.label}>Anthropic API Key</label>
                <input style={s.inp} type="password" value={settings.anthropicKey} onChange={e=>setSettings(p=>({...p,anthropicKey:e.target.value}))} placeholder="sk-ant-api03-…"/>
                <div style={{ fontSize:11, color:'#9ca3af', marginTop:4 }}>Get yours free at console.anthropic.com</div>
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={s.label}>Reed API Key <span style={{ color:'#16a34a', fontWeight:400, textTransform:'none' }}>(UK jobs)</span></label>
                <input style={s.inp} type="password" value={settings.reedApiKey} onChange={e=>setSettings(p=>({...p,reedApiKey:e.target.value}))} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"/>
                <div style={{ fontSize:11, color:'#9ca3af', marginTop:4 }}>Free at <strong>reed.co.uk/developers/jobseeker</strong></div>
              </div>
              <div style={{ marginBottom:4, background:'#f0fdfa', border:'1px solid #99f6e4', borderRadius:8, padding:'12px 14px' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#0d9488', marginBottom:8 }}>ADZUNA API — Best for UK Jobs (free)</div>
                <div style={s.row}>
                  <div>
                    <label style={s.label}>Adzuna App ID</label>
                    <input style={s.inp} value={settings.adzunaAppId} onChange={e=>setSettings(p=>({...p,adzunaAppId:e.target.value}))} placeholder="xxxxxxxx"/>
                  </div>
                  <div>
                    <label style={s.label}>Adzuna App Key</label>
                    <input style={s.inp} type="password" value={settings.adzunaAppKey} onChange={e=>setSettings(p=>({...p,adzunaAppKey:e.target.value}))} placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"/>
                  </div>
                </div>
                <div style={{ fontSize:11, color:'#0d9488' }}>Free at <strong>developer.adzuna.com</strong> — 250 calls/day free, real UK jobs with salary data</div>
              </div>
            </div>

            <div style={s.card}>
              <div style={{ fontSize:12, fontWeight:700, color:'#0d9488', textTransform:'uppercase', letterSpacing:.8, marginBottom:14 }}>Email Notifications</div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                <input type="checkbox" id="emailEnabled" checked={settings.emailEnabled} onChange={e=>setSettings(p=>({...p,emailEnabled:e.target.checked}))} style={{ width:16,height:16,cursor:'pointer' }}/>
                <label htmlFor="emailEnabled" style={{ fontSize:13, color:'#374151', cursor:'pointer', fontWeight:500 }}>Send email when job found or applied</label>
              </div>
              {settings.emailEnabled&&(
                <>
                  <div style={s.row}>
                    <div><label style={s.label}>Notify email (to)</label><input style={s.inp} type="email" value={settings.emailTo} onChange={e=>setSettings(p=>({...p,emailTo:e.target.value}))} placeholder="you@gmail.com"/></div>
                    <div><label style={s.label}>Your Gmail / SMTP address</label><input style={s.inp} type="email" value={settings.smtpUser} onChange={e=>setSettings(p=>({...p,smtpUser:e.target.value}))} placeholder="you@gmail.com"/></div>
                  </div>
                  <div style={s.row}>
                    <div><label style={s.label}>App password (Gmail)</label><input style={s.inp} type="password" value={settings.smtpPass} onChange={e=>setSettings(p=>({...p,smtpPass:e.target.value}))} placeholder="xxxx xxxx xxxx xxxx"/></div>
                    <div><label style={s.label}>SMTP host</label><input style={s.inp} value={settings.smtpHost} onChange={e=>setSettings(p=>({...p,smtpHost:e.target.value}))} placeholder="smtp.gmail.com"/></div>
                  </div>
                  <div style={{ fontSize:11, color:'#9ca3af', marginBottom:14, lineHeight:1.6 }}>
                    For Gmail: enable 2FA → Google Account → Security → App passwords → generate one for "Mail"
                  </div>
                  <button onClick={testEmail} style={s.ghost({ fontSize:12, padding:'7px 14px', color:'#0d9488', borderColor:'#99f6e4', marginBottom:4 })}>Send test email</button>
                </>
              )}
            </div>

            <button onClick={saveSettings} style={s.btn()}>Save Settings →</button>
          </div>
        )}

        {/* ════ ACTIVITY LOG ════ */}
        {tab==='log'&&(
          <div className="fade">
            <div style={{ marginBottom:22, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <h1 style={{ fontSize:22, fontWeight:800, color:'#0f1117', marginBottom:4 }}>Activity Log</h1>
                <p style={{ color:'#6b7280', fontSize:13 }}>Real-time agent activity.</p>
              </div>
              <button onClick={()=>setLogs([])} style={s.ghost({ fontSize:12, padding:'6px 12px', color:'#dc2626', borderColor:'#fecaca' })}>Clear</button>
            </div>
            <div style={{ background:'#0f1117', borderRadius:10, padding:20, minHeight:400, maxHeight:'calc(100vh - 200px)', overflowY:'auto', fontFamily:'monospace' }}>
              {logs.length===0&&<div style={{ color:'#4b5563', fontSize:12 }}>Waiting for activity…</div>}
              {logs.map((l,i)=>(
                <div key={i} style={{ fontSize:12, marginBottom:4, display:'flex', gap:12 }}>
                  <span style={{ color:'#4b5563', flexShrink:0 }}>{l.time}</span>
                  <span style={{ color: l.msg.includes('error')||l.msg.includes('Error')?'#f87171': l.msg.includes('✓')||l.msg.includes('success')?'#34d399':'#e5e7eb' }}>{l.msg}</span>
                </div>
              ))}
              <div ref={logsEndRef}/>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
