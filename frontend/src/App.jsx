import { useState, useRef } from "react";

const RESUME_FORMATS = [
  { id:"classic", name:"Classic", desc:"Traditional, ATS-safe", accentColor:"#1e3a5f", fontFamily:"'Georgia', serif" },
  { id:"modern", name:"Modern", desc:"Bold, contemporary", accentColor:"#2563eb", fontFamily:"'Helvetica Neue', sans-serif" },
  { id:"minimal", name:"Minimal", desc:"Clean, whitespace-focused", accentColor:"#374151", fontFamily:"'Garamond', serif" },
  { id:"executive", name:"Executive", desc:"Senior-level gravitas", accentColor:"#92400e", fontFamily:"'Times New Roman', serif" },
];

const TABS = [
  { id:"builder", label:"Resume Builder", icon:"✦" },
  { id:"jobs", label:"Job Search", icon:"◈" },
  { id:"tracker", label:"My Applications", icon:"◉" },
  { id:"cover", label:"Cover Letter", icon:"◎" },
  { id:"interview", label:"Interview Prep", icon:"◆" },
  { id:"pricing", label:"Pricing", icon:"◇" },
];

const COUNTRIES = [
  { code:"uk", label:"🇬🇧 United Kingdom" },
  { code:"us", label:"🇺🇸 United States" },
  { code:"in", label:"🇮🇳 India" },
];

const JOB_PLATFORMS = [
  { id:"linkedin", name:"LinkedIn", color:"#0077b5", bg:"#e8f4fd", border:"#bfdbfe" },
  { id:"indeed", name:"Indeed", color:"#003A9B", bg:"#eef2ff", border:"#c7d2fe" },
  { id:"reed", name:"Reed", color:"#cc0000", bg:"#fef2f2", border:"#fecaca" },
  { id:"adzuna", name:"Adzuna", color:"#0891b2", bg:"#ecfeff", border:"#a5f3fc" },
  { id:"glassdoor", name:"Glassdoor", color:"#0caa41", bg:"#f0fdf4", border:"#bbf7d0" },
  { id:"jsearch", name:"JSearch", color:"#7c3aed", bg:"#f5f3ff", border:"#ddd6fe" },
];

const TIERS = [
  { name:"Free", price:"£0", features:["3 tailored resumes/mo","Basic ATS score","5 job searches/day","1 cover letter/mo"], cta:"Get Started", highlight:false, color:"#6b7280", gumroad:null },
  { name:"Pro", price:"£19", period:"/mo", features:["Unlimited resume tailoring","ATS + Hiring Manager scores","Salary intelligence","4 resume formats + preview","Unlimited job search","Cover letters","Interview prep AI"], cta:"Upgrade to Pro", highlight:true, color:"#4f46e5", gumroad:"https://gumroad.com/l/careeros-pro" },
  { name:"Enterprise", price:"£99", period:"/mo", features:["Everything in Pro","Team workspace","Bulk optimization","API access","Recruiter dashboard","White-label"], cta:"Contact Sales", highlight:false, color:"#059669", gumroad:"https://gumroad.com/l/careeros-enterprise" },
];

const STATUS_COLORS = {
  "Saved":{ bg:"#f8fafc", text:"#64748b", border:"#e2e8f0", dot:"#94a3b8" },
  "Applied":{ bg:"#eff6ff", text:"#2563eb", border:"#bfdbfe", dot:"#3b82f6" },
  "Interview":{ bg:"#fffbeb", text:"#d97706", border:"#fde68a", dot:"#f59e0b" },
  "Offer":{ bg:"#f0fdf4", text:"#16a34a", border:"#bbf7d0", dot:"#22c55e" },
  "Rejected":{ bg:"#fef2f2", text:"#dc2626", border:"#fecaca", dot:"#ef4444" },
};

const LOADING_PHASES = [
  { icon:"🔍", text:"Parsing job description..." },
  { icon:"🧠", text:"Matching your experience..." },
  { icon:"📊", text:"Calculating ATS score..." },
  { icon:"✍️", text:"Writing tailored resume..." },
  { icon:"✨", text:"Finalising results..." },
];

const SAMPLE_CV = `Sarah Chen | sarah.chen@email.com | +44 7700 900123 | London, UK

EXPERIENCE
Senior Product Manager — FinTech Scale-up (2021–2024)
• Led product strategy for B2B SaaS platform, growing ARR from £2M to £8M
• Managed roadmap across 3 product lines, coordinating 20+ engineers
• Launched ML-powered fraud detection, reducing chargebacks by 41%

Product Manager — Consumer App (2019–2021)
• Owned mobile app from MVP to 500k users
• A/B tests improved onboarding conversion by 28%

SKILLS: Product strategy, Roadmapping, SQL, Figma, JIRA, Agile/Scrum

EDUCATION: B.Sc Computer Science, University of Edinburgh, 2019`;

// ─── RESUME HTML GENERATORS ───────────────────────────────────────────────────

function generateResumeHTML(resume, format) {
  if (!resume) return `<html><body style="font-family:sans-serif;padding:40px;color:#999;text-align:center"><p style="margin-top:80px;font-size:14px">Generate a resume first to see preview</p></body></html>`;
  const f = RESUME_FORMATS.find(x => x.id === format) || RESUME_FORMATS[0];
  const templates = {
    classic:`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${resume.name}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:${f.fontFamily};color:#1a1a1a;background:#fff;max-width:750px;margin:32px auto;padding:48px}h1{font-size:26px;font-weight:700;color:${f.accentColor};margin-bottom:3px}.contact{font-size:12px;color:#555;margin-bottom:18px;border-bottom:2px solid ${f.accentColor};padding-bottom:10px}.st{font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${f.accentColor};margin:16px 0 7px;border-bottom:1px solid #e5e7eb;padding-bottom:3px}.summary{font-size:13px;line-height:1.75;color:#374151}.skills{display:flex;flex-wrap:wrap;gap:5px;margin-top:3px}.skill{padding:3px 9px;border:1px solid ${f.accentColor}30;border-radius:3px;font-size:11px;color:#374151}.job{margin-bottom:13px}.jh{display:flex;justify-content:space-between;margin-bottom:2px}.jt{font-size:13px;font-weight:700;color:#111}.jp{font-size:11px;color:#888}.jc{font-size:12px;color:#555;margin-bottom:3px}.b{font-size:12px;color:#374151;line-height:1.65;padding-left:12px;position:relative;margin-bottom:2px}.b::before{content:"•";position:absolute;left:0;color:${f.accentColor}}.edu{font-size:12px;color:#374151;line-height:1.6}.footer{margin-top:24px;padding-top:8px;border-top:1px solid #e5e7eb;font-size:10px;color:#9ca3af;text-align:center}@media print{body{margin:0;padding:32px}}</style></head><body><h1>${resume.name}</h1><div class="contact">${resume.contact}</div><div class="st">Professional Summary</div><div class="summary">${resume.summary}</div><div class="st">Core Skills</div><div class="skills">${resume.skills?.map(s=>`<span class="skill">${s}</span>`).join("")||""}</div><div class="st">Experience</div>${resume.experience?.map(e=>`<div class="job"><div class="jh"><span class="jt">${e.title}</span><span class="jp">${e.period}</span></div><div class="jc">${e.company}</div>${e.bullets?.map(b=>`<div class="b">${b}</div>`).join("")||""}</div>`).join("")||""}<div class="st">Education & Certifications</div><div class="edu">${resume.education}</div><div class="footer">Generated by CareerOS · careeros-rose.vercel.app</div></body></html>`,
    modern:`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${resume.name}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:${f.fontFamily};color:#1a1a1a;background:#fff;max-width:750px;margin:32px auto}.hdr{background:${f.accentColor};color:#fff;padding:26px 38px 20px}h1{font-size:27px;font-weight:800;margin-bottom:3px}.contact{font-size:12px;opacity:0.85}.body{padding:22px 38px}.st{font-size:10px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;color:${f.accentColor};margin:18px 0 9px}.summary{font-size:13px;line-height:1.75;color:#374151}.skills{display:flex;flex-wrap:wrap;gap:5px}.skill{padding:3px 11px;background:${f.accentColor}15;border-radius:20px;font-size:11px;color:${f.accentColor};font-weight:600}.job{margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid #f3f4f6}.jh{display:flex;justify-content:space-between;margin-bottom:2px}.jt{font-size:14px;font-weight:700;color:#111}.jp{font-size:11px;color:#888;background:#f9fafb;padding:2px 8px;border-radius:10px}.jc{font-size:12px;color:${f.accentColor};font-weight:600;margin-bottom:4px}.b{font-size:12px;color:#374151;line-height:1.65;padding-left:13px;position:relative;margin-bottom:2px}.b::before{content:"▸";position:absolute;left:0;color:${f.accentColor}}.edu{font-size:12px;color:#374151;line-height:1.6}.footer{margin-top:14px;font-size:10px;color:#9ca3af;text-align:center;padding:10px 0;border-top:1px solid #f3f4f6}@media print{body{margin:0}}</style></head><body><div class="hdr"><h1>${resume.name}</h1><div class="contact">${resume.contact}</div></div><div class="body"><div class="st">Profile</div><div class="summary">${resume.summary}</div><div class="st">Skills</div><div class="skills">${resume.skills?.map(s=>`<span class="skill">${s}</span>`).join("")||""}</div><div class="st">Experience</div>${resume.experience?.map(e=>`<div class="job"><div class="jh"><span class="jt">${e.title}</span><span class="jp">${e.period}</span></div><div class="jc">${e.company}</div>${e.bullets?.map(b=>`<div class="b">${b}</div>`).join("")||""}</div>`).join("")||""}<div class="st">Education</div><div class="edu">${resume.education}</div><div class="footer">Generated by CareerOS · careeros-rose.vercel.app</div></div></body></html>`,
    minimal:`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${resume.name}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:${f.fontFamily};color:#1a1a1a;background:#fff;max-width:700px;margin:48px auto;padding:60px}h1{font-size:30px;font-weight:300;letter-spacing:2px;text-transform:uppercase;color:#111;margin-bottom:4px}.contact{font-size:11px;color:#888;letter-spacing:1px;margin-bottom:32px}.st{font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#aaa;margin:24px 0 8px}.div{height:1px;background:#f0f0f0;margin-bottom:12px}.summary{font-size:13px;line-height:1.9;color:#444}.skills{font-size:12px;color:#555;line-height:2}.job{margin-bottom:16px}.jh{display:flex;justify-content:space-between;margin-bottom:2px}.jt{font-size:13px;font-weight:600;color:#111}.jp{font-size:11px;color:#aaa}.jc{font-size:11px;color:#888;margin-bottom:4px;font-style:italic}.b{font-size:12px;color:#444;line-height:1.75;padding-left:14px;position:relative;margin-bottom:2px}.b::before{content:"—";position:absolute;left:0;color:#ccc}.edu{font-size:12px;color:#555;line-height:1.7}.footer{margin-top:36px;font-size:10px;color:#ccc;text-align:center}@media print{body{margin:0;padding:40px}}</style></head><body><h1>${resume.name}</h1><div class="contact">${resume.contact}</div><div class="st">Summary</div><div class="div"></div><div class="summary">${resume.summary}</div><div class="st">Skills</div><div class="div"></div><div class="skills">${resume.skills?.join("  ·  ")||""}</div><div class="st">Experience</div><div class="div"></div>${resume.experience?.map(e=>`<div class="job"><div class="jh"><span class="jt">${e.title}</span><span class="jp">${e.period}</span></div><div class="jc">${e.company}</div>${e.bullets?.map(b=>`<div class="b">${b}</div>`).join("")||""}</div>`).join("")||""}<div class="st">Education</div><div class="div"></div><div class="edu">${resume.education}</div><div class="footer">Generated by CareerOS</div></body></html>`,
    executive:`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${resume.name}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:${f.fontFamily};color:#1a1a1a;background:#fff;max-width:760px;margin:32px auto;padding:50px}.top{height:4px;background:${f.accentColor};margin-bottom:28px}h1{font-size:29px;font-weight:700;color:#111;letter-spacing:0.5px;margin-bottom:3px}.contact{font-size:12px;color:#666;margin-bottom:5px}.tl{height:1px;background:${f.accentColor};margin:12px 0 20px}.section{margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid #f0ece4}.st{font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${f.accentColor};margin-bottom:9px}.summary{font-size:13px;line-height:1.8;color:#2d2d2d;font-style:italic;padding-left:14px;border-left:3px solid ${f.accentColor}25}.skills{display:flex;flex-wrap:wrap;gap:7px}.skill{padding:3px 13px;border:1px solid ${f.accentColor}30;font-size:11px;color:#444;background:#fafafa}.job{margin-bottom:14px}.jh{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:2px}.jt{font-size:14px;font-weight:700;color:#111}.jp{font-size:11px;color:#888}.jc{font-size:12px;color:${f.accentColor};font-weight:600;margin-bottom:4px}.b{font-size:12px;color:#2d2d2d;line-height:1.7;padding-left:13px;position:relative;margin-bottom:3px}.b::before{content:"◆";position:absolute;left:0;color:${f.accentColor};font-size:7px;top:5px}.edu{font-size:12px;color:#444;line-height:1.8}.footer{margin-top:18px;font-size:10px;color:#bbb;text-align:right}@media print{body{margin:0;padding:36px}}</style></head><body><div class="top"></div><h1>${resume.name}</h1><div class="contact">${resume.contact}</div><div class="tl"></div><div class="section"><div class="st">Executive Profile</div><div class="summary">${resume.summary}</div></div><div class="section"><div class="st">Core Competencies</div><div class="skills">${resume.skills?.map(s=>`<span class="skill">${s}</span>`).join("")||""}</div></div><div class="section"><div class="st">Career History</div>${resume.experience?.map(e=>`<div class="job"><div class="jh"><span class="jt">${e.title}</span><span class="jp">${e.period}</span></div><div class="jc">${e.company}</div>${e.bullets?.map(b=>`<div class="b">${b}</div>`).join("")||""}</div>`).join("")||""}</div><div class="section"><div class="st">Education & Professional Development</div><div class="edu">${resume.education}</div></div><div class="footer">Generated by CareerOS · careeros-rose.vercel.app</div></body></html>`,
  };
  return templates[format] || templates.classic;
}

function downloadResume(resume, format) {
  const html = generateResumeHTML(resume, format);
  const blob = new Blob([html], { type:"text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${resume.name?.replace(/\s+/g,"_")}_${format}_Resume.html`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function callClaude(prompt) {
  const res = await fetch("/api/claude", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ model:"claude-sonnet-4-5", max_tokens:4000,
      system:"You are an expert resume writer. Return only valid JSON. No markdown, no backticks.",
      messages:[{role:"user",content:prompt}] }),
  });
  const data = await res.json();
  const text = data.content?.map(b=>b.text||"").join("")||"{}";
  return JSON.parse(text.replace(/```json|```/g,"").trim());
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function ScoreRing({score,size=72,color}) {
  const r=(size-8)/2, circ=2*Math.PI*r, s=Math.max(0,Math.min(100,score||0));
  const c=color||(s>=80?"#16a34a":s>=65?"#d97706":s>0?"#dc2626":"#d1d5db");
  return (
    <svg width={size} height={size} style={{transform:"rotate(-90deg)",flexShrink:0}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={5}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={c} strokeWidth={5}
        strokeDasharray={`${(s/100)*circ} ${circ}`} strokeLinecap="round"
        style={{transition:"stroke-dasharray 1.2s ease"}}/>
      <text x={size/2} y={size/2+5} textAnchor="middle" fill={c} fontSize={size*0.2} fontWeight="700"
        style={{transform:`rotate(90deg)`,transformOrigin:`${size/2}px ${size/2}px`}}>
        {s>0?`${s}%`:"—"}
      </text>
    </svg>
  );
}

function Chip({text,color="#6b7280",bg="#f1f5f9"}) {
  return <span style={{display:"inline-block",padding:"3px 10px",borderRadius:5,background:bg,color,fontSize:11,fontWeight:500,margin:"2px 3px 2px 0"}}>{text}</span>;
}

function PBadge({platform}) {
  const p=JOB_PLATFORMS.find(x=>x.id===platform)||{name:platform||"Job Board",color:"#6b7280",bg:"#f1f5f9",border:"#e2e8f0"};
  return <span style={{display:"inline-flex",alignItems:"center",padding:"2px 9px",borderRadius:5,background:p.bg,border:`1px solid ${p.border}`,color:p.color,fontSize:11,fontWeight:600}}>{p.name}</span>;
}

function SBadge({status}) {
  const s=STATUS_COLORS[status]||STATUS_COLORS["Saved"];
  return <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:5,background:s.bg,border:`1px solid ${s.border}`,color:s.text,fontSize:11,fontWeight:600}}>
    <span style={{width:6,height:6,borderRadius:"50%",background:s.dot,flexShrink:0}}/>
    {status}
  </span>;
}

function Card({children,style={}}) {
  return <div style={{background:"#fff",border:"1px solid #e8ecf0",borderRadius:12,padding:22,marginBottom:14,boxShadow:"0 1px 3px rgba(0,0,0,0.04)",...style}}>{children}</div>;
}

function SLabel({children,color="#4f46e5"}) {
  return <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color,textTransform:"uppercase",marginBottom:12}}>{children}</div>;
}

function FormatPicker({resume,selected,onSelect,onDownload}) {
  return (
    <div>
      <div style={{fontSize:12,fontWeight:600,color:"#374151",marginBottom:10}}>Choose your resume format:</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
        {RESUME_FORMATS.map(f=>(
          <div key={f.id} onClick={()=>onSelect(f.id)}
            style={{border:`2px solid ${selected===f.id?f.accentColor:"#e8ecf0"}`,borderRadius:9,padding:11,cursor:"pointer",background:selected===f.id?f.accentColor+"08":"#fafbfc",transition:"all 0.15s"}}>
            <div style={{background:"#fff",border:"1px solid #f3f4f6",borderRadius:5,padding:7,marginBottom:8,height:64,overflow:"hidden"}}>
              {f.id==="modern"&&<div style={{background:f.accentColor,height:14,margin:"-7px -7px 5px",borderRadius:"4px 4px 0 0"}}/>}
              {f.id==="executive"&&<div style={{background:f.accentColor,height:3,margin:"-7px -7px 5px"}}/>}
              <div style={{height:5,background:f.accentColor,borderRadius:2,marginBottom:3,width:"80%"}}/>
              <div style={{height:2,background:"#e5e7eb",borderRadius:1,marginBottom:4,width:"50%"}}/>
              {[1,2,3,4].map(i=><div key={i} style={{height:2,background:"#f3f4f6",borderRadius:1,marginBottom:2,width:`${55+i*10}%`}}/>)}
            </div>
            <div style={{fontSize:12,fontWeight:700,color:selected===f.id?f.accentColor:"#374151"}}>{f.name}</div>
            <div style={{fontSize:10,color:"#9ca3af",marginTop:1}}>{f.desc}</div>
          </div>
        ))}
      </div>
      <div style={{border:"1px solid #e8ecf0",borderRadius:9,overflow:"hidden",marginBottom:12}}>
        <div style={{background:"#f8fafc",borderBottom:"1px solid #e8ecf0",padding:"8px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:11,color:"#6b7280",fontWeight:500}}>Preview — {RESUME_FORMATS.find(f=>f.id===selected)?.name}</span>
          <button onClick={()=>onDownload(selected)} style={{background:"#4f46e5",color:"#fff",border:"none",borderRadius:6,padding:"4px 13px",fontSize:11,fontWeight:600,cursor:"pointer"}}>⬇ Download</button>
        </div>
        <iframe srcDoc={generateResumeHTML(resume,selected)} style={{width:"100%",height:460,border:"none",background:"#fff"}} title="Resume Preview"/>
      </div>
      <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
        {RESUME_FORMATS.map(f=>(
          <button key={f.id} onClick={()=>onDownload(f.id)}
            style={{background:selected===f.id?"#4f46e5":"#fff",border:`1px solid ${selected===f.id?"#4f46e5":"#e8ecf0"}`,color:selected===f.id?"#fff":"#374151",borderRadius:6,padding:"6px 13px",fontSize:11,fontWeight:500,cursor:"pointer"}}>
            ⬇ {f.name}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────

export default function App() {
  const [tab,setTab]=useState("builder");
  const [jd,setJd]=useState("");
  const [cv,setCv]=useState("");
  const [result,setResult]=useState(null);
  const [loading,setLoading]=useState(false);
  const [phase,setPhase]=useState(0);
  const [fmt,setFmt]=useState("classic");
  const [coverResult,setCoverResult]=useState(null);
  const [coverLoading,setCoverLoading]=useState(false);
  const [intResult,setIntResult]=useState(null);
  const [intLoading,setIntLoading]=useState(false);
  const [jobs,setJobs]=useState([]);
  const [jobQ,setJobQ]=useState("");
  const [country,setCountry]=useState("uk");
  const [jobLoading,setJobLoading]=useState(false);
  const [apps,setApps]=useState([]);
  const [applying,setApplying]=useState(null);
  const [applied,setApplied]=useState(null);
  const [copied,setCopied]=useState(false);
  const [jobFmt,setJobFmt]=useState(null);
  const [jobFmtSel,setJobFmtSel]=useState("classic");
  const ref=useRef(null);

  function startPhase() {
    setPhase(0);
    const iv=setInterval(()=>setPhase(p=>{if(p>=LOADING_PHASES.length-1){clearInterval(iv);return p;}return p+1;}),4000);
    return iv;
  }

  async function generate() {
    if(!jd?.trim()||!cv?.trim()) return;
    setLoading(true); setResult(null);
    const iv=startPhase();
    try {
      const r=await callClaude(`Analyse this JD and CV. Return ONLY JSON (no markdown):
{"jdAnalysis":{"role":"title","company":"name","mustHave":["r1","r2","r3","r4","r5"],"niceToHave":["n1","n2","n3"],"keywords":["k1","k2","k3","k4","k5","k6","k7","k8","k9","k10"],"hiringIntent":"1-2 sentences"},"matchScore":75,"hiringManagerScore":70,"salaryIntelligence":{"marketMin":"£X","marketMax":"£Y","recommendedAsk":"£Z","insight":"1 sentence"},"gapAnalysis":{"strengths":["s1","s2","s3","s4","s5"],"gaps":["g1","g2","g3"],"transferable":["t1","t2","t3","t4"]},"resume":{"name":"FULL NAME","contact":"email • phone • location","summary":"3 sentences. Unique hook. Quantified. No clichés.","skills":["sk1","sk2","sk3","sk4","sk5","sk6","sk7","sk8"],"experience":[{"title":"Title","company":"Co","period":"dates","bullets":["verb+initiative+metric","verb+initiative+metric","verb+initiative+metric","verb+initiative+metric"]}],"education":"Degree | certs"},"hiringManagerInsights":{"firstImpression":"10 second read","humanAppeal":"compelling factor","redFlags":["r1","r2"],"standoutFactors":["s1","s2"]},"improvements":["t1","t2","t3","t4"]}
Rules: matchScore 0-100. hiringManagerScore 0-100. Every bullet verb+metric. Return ONLY JSON.
JD: ${jd}
CV: ${cv}`);
      clearInterval(iv); setResult(r);
      setTimeout(()=>ref.current?.scrollIntoView({behavior:"smooth"}),100);
    } catch {
      clearInterval(iv); setResult({error:"Generation failed. Check inputs and retry."});
    } finally { setLoading(false); }
  }

  async function genCover() {
    if(!jd||!cv) return;
    setCoverLoading(true); setCoverResult(null);
    try {
      const r=await callClaude(`Write a professional cover letter. Return ONLY JSON:
{"subject":"Application for [Role] — [Name]","letter":"4 paragraphs. Para 1: Specific company hook (NOT 'I am writing to apply'). Para 2: Key achievement with metric. Para 3: Why this company. Para 4: Confident close. British English. 260 words max."}
JD: ${jd} CV: ${cv}`);
      setCoverResult(r);
    } catch { setCoverResult({error:"Failed. Retry."}); }
    finally { setCoverLoading(false); }
  }

  async function genInterview() {
    if(!jd||!cv) return;
    setIntLoading(true); setIntResult(null);
    try {
      const r=await callClaude(`Generate interview prep. Return ONLY JSON:
{"keyThemes":["t1","t2","t3","t4"],"likelyQuestions":[{"question":"Q","tip":"tip"},{"question":"Q","tip":"tip"},{"question":"Q","tip":"tip"},{"question":"Q","tip":"tip"},{"question":"Q","tip":"tip"}],"starStories":[{"theme":"Leadership","situation":"...","task":"...","action":"...","result":"metric"},{"theme":"Problem Solving","situation":"...","task":"...","action":"...","result":"metric"}],"questionsToAsk":["q1","q2","q3"],"redFlags":["concern + how to address"]}
JD: ${jd} CV: ${cv}`);
      setIntResult(r);
    } catch { setIntResult({error:"Failed. Retry."}); }
    finally { setIntLoading(false); }
  }

  async function searchJobs() {
    setJobLoading(true); setJobs([]);
    try {
      const res=await fetch(`/api/jobs?query=${encodeURIComponent(jobQ||"product manager")}&country=${country}&source=both`);
      const data=await res.json();
      setJobs(data.jobs||[]);
    } catch { setJobs([]); }
    setJobLoading(false);
  }

  function applyJob(job,e) {
    e.stopPropagation(); setApplying(job.id);
    const url=job.url?.startsWith("http")?job.url:`https://www.google.com/search?q=${encodeURIComponent(job.title+" "+job.company+" apply")}`;
    window.open(url,"_blank");
    setApps(prev=>prev.find(a=>a.title===job.title&&a.company===job.company)?prev:[...prev,{id:Date.now(),title:job.title,company:job.company,platform:job.platform,status:"Applied",appliedDate:"Today",match:job.match||0}]);
    setTimeout(()=>{setApplying(null);setApplied(job.id);setTimeout(()=>setApplied(null),2000);},600);
  }

  function saveJob(job,e) {
    e.stopPropagation();
    setApps(prev=>prev.find(a=>a.title===job.title&&a.company===job.company)?prev:[...prev,{id:Date.now(),title:job.title,company:job.company,platform:job.platform,status:"Saved",appliedDate:"—",match:job.match||0}]);
  }

  const inp={width:"100%",boxSizing:"border-box",background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"11px 14px",color:"#111827",fontSize:13,fontFamily:"inherit",outline:"none",lineHeight:1.6};
  const btn=(x={})=>({background:"#4f46e5",color:"#fff",border:"none",borderRadius:8,padding:"10px 20px",fontSize:13,fontWeight:600,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6,...x});
  const ghost=(x={})=>({background:"#fff",border:"1.5px solid #e2e8f0",color:"#374151",borderRadius:8,padding:"9px 16px",fontSize:13,cursor:"pointer",...x});

  return (
    <div style={{minHeight:"100vh",background:"#f4f6f9",color:"#111827",fontFamily:"'Inter','Segoe UI',system-ui,sans-serif"}}>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes prog{0%,100%{opacity:0.8}50%{opacity:1}}
        input:focus,textarea:focus{border-color:#4f46e5 !important;box-shadow:0 0 0 3px rgba(79,70,229,0.1) !important;outline:none}
        .jcard{transition:all 0.15s}
        .jcard:hover{border-color:#c7d2fe !important;box-shadow:0 2px 12px rgba(79,70,229,0.08) !important}
        button:active{transform:scale(0.98)}
      `}</style>

      {/* ── HEADER ── */}
      <div style={{background:"#fff",borderBottom:"1px solid #e8ecf0",position:"sticky",top:0,zIndex:100,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
        <div style={{maxWidth:1180,margin:"0 auto",padding:"0 28px",display:"flex",alignItems:"center",justifyContent:"space-between",height:60}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:34,height:34,borderRadius:9,background:"linear-gradient(135deg,#4f46e5,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:16,color:"#fff",letterSpacing:-0.5}}>C</div>
            <div>
              <div style={{fontSize:16,fontWeight:700,color:"#111827",letterSpacing:-0.4}}>CareerOS</div>
              <div style={{fontSize:9,color:"#9ca3af",letterSpacing:1.8,textTransform:"uppercase"}}>AI Career Platform</div>
            </div>
          </div>

          <nav style={{display:"flex",background:"#f4f6f9",borderRadius:9,padding:3,border:"1px solid #e8ecf0",gap:1}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{
                background:tab===t.id?"#fff":"transparent",
                border:"none",
                boxShadow:tab===t.id?"0 1px 3px rgba(0,0,0,0.1)":"none",
                color:tab===t.id?"#4f46e5":"#6b7280",
                borderRadius:7,padding:"5px 13px",fontSize:12,cursor:"pointer",
                fontWeight:tab===t.id?600:400,transition:"all 0.15s",
                display:"flex",alignItems:"center",gap:5,
              }}><span style={{fontSize:10}}>{t.icon}</span>{t.label}</button>
            ))}
          </nav>

          <button onClick={()=>setTab("pricing")} style={btn({padding:"8px 18px",fontSize:12,borderRadius:8,background:"linear-gradient(135deg,#4f46e5,#7c3aed)"})}>
            ↑ Upgrade Pro
          </button>
        </div>
      </div>

      <div style={{maxWidth:1180,margin:"0 auto",padding:"28px 28px 80px"}}>

        {/* ════ RESUME BUILDER ════ */}
        {tab==="builder"&&(
          <div style={{animation:"fadeIn 0.3s ease"}}>
            {/* Hero banner */}
            <div style={{background:"linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)",borderRadius:16,padding:"36px 44px",marginBottom:24,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:-20,right:-20,width:200,height:200,background:"rgba(255,255,255,0.05)",borderRadius:"50%"}}/>
              <div style={{position:"absolute",bottom:-40,right:80,width:120,height:120,background:"rgba(255,255,255,0.05)",borderRadius:"50%"}}/>
              <div style={{position:"relative"}}>
                <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 12px",borderRadius:20,background:"rgba(255,255,255,0.15)",color:"#e0e7ff",fontSize:11,fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:14}}>
                  ATS Score · Human Appeal · Salary Intelligence · 4 Formats
                </div>
                <h1 style={{fontSize:34,fontWeight:800,color:"#fff",lineHeight:1.2,marginBottom:10,letterSpacing:-0.8}}>
                  AI Resume Tailoring That<br/>Actually Gets Interviews
                </h1>
                <p style={{color:"rgba(255,255,255,0.75)",fontSize:14,maxWidth:440}}>
                  Paste a job description and your CV. Get a tailored resume, ATS score, salary insights, and interview prep in under 30 seconds.
                </p>
              </div>
            </div>

            {/* Feature pills */}
            <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
              {[{i:"🎯",l:"Dual Scoring"},{i:"💰",l:"Salary Intel"},{i:"📄",l:"4 Formats + Preview"},{i:"⚡",l:"30 Seconds"},{i:"✉",l:"Cover Letter"},{i:"◆",l:"Interview Prep"}].map(f=>(
                <div key={f.l} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:20,background:"#fff",border:"1px solid #e8ecf0",fontSize:11,color:"#6b7280",fontWeight:500,boxShadow:"0 1px 2px rgba(0,0,0,0.04)"}}>
                  {f.i} {f.l}
                </div>
              ))}
            </div>

            {/* Inputs */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
              <div>
                <label style={{display:"block",fontSize:11,fontWeight:700,color:"#374151",marginBottom:6,letterSpacing:0.5,textTransform:"uppercase"}}>Job Description</label>
                <textarea style={{...inp,height:240,resize:"vertical"}} placeholder="Paste any job description here..." value={jd} onChange={e=>setJd(e.target.value)}/>
              </div>
              <div>
                <label style={{display:"block",fontSize:11,fontWeight:700,color:"#374151",marginBottom:6,letterSpacing:0.5,textTransform:"uppercase"}}>Your CV / Background</label>
                <textarea style={{...inp,height:240,resize:"vertical"}} placeholder="Paste your CV or describe your experience..." value={cv} onChange={e=>setCv(e.target.value)}/>
                {!cv&&<button onClick={()=>setCv(SAMPLE_CV)} style={{...ghost(),marginTop:8,fontSize:11,padding:"5px 12px"}}>Use sample CV →</button>}
              </div>
            </div>

            {/* Progress bar */}
            {loading&&(
              <div style={{background:"#fff",border:"1px solid #e0e7ff",borderRadius:10,padding:"14px 18px",marginBottom:14,boxShadow:"0 1px 4px rgba(79,70,229,0.1)",animation:"prog 2s infinite"}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:16,height:16,border:"2px solid #e0e7ff",borderTopColor:"#4f46e5",borderRadius:"50%",animation:"spin 0.8s linear infinite",flexShrink:0}}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,color:"#4f46e5",marginBottom:6}}>{LOADING_PHASES[phase]?.icon} {LOADING_PHASES[phase]?.text}</div>
                    <div style={{height:4,background:"#e0e7ff",borderRadius:2}}>
                      <div style={{height:4,background:"linear-gradient(90deg,#4f46e5,#7c3aed)",borderRadius:2,width:`${((phase+1)/LOADING_PHASES.length)*100}%`,transition:"width 0.5s ease"}}/>
                    </div>
                  </div>
                  <div style={{fontSize:11,color:"#a5b4fc",fontWeight:600}}>{Math.round(((phase+1)/LOADING_PHASES.length)*100)}%</div>
                </div>
              </div>
            )}

            <div style={{display:"flex",gap:10,marginBottom:24,flexWrap:"wrap"}}>
              <button onClick={generate} disabled={loading||!jd||!cv} style={{...btn(),opacity:loading||!jd||!cv?0.5:1,background:"linear-gradient(135deg,#4f46e5,#7c3aed)"}}>
                {loading?"Generating...":"✦ Generate Tailored Resume"}
              </button>
              {result&&!result.error&&(<>
                <button onClick={()=>{setTab("cover");genCover();}} style={ghost({color:"#7c3aed",borderColor:"#ddd6fe"})}>✉ Cover Letter</button>
                <button onClick={()=>{setTab("interview");genInterview();}} style={ghost({color:"#0891b2",borderColor:"#bae6fd"})}>◆ Interview Prep</button>
                <button onClick={()=>{navigator.clipboard.writeText([result.resume?.name,result.resume?.contact,"",result.resume?.summary].join("\n"));setCopied(true);setTimeout(()=>setCopied(false),1500);}} style={ghost({color:copied?"#16a34a":"#6b7280"})}>
                  {copied?"✓ Copied":"Copy Text"}
                </button>
              </>)}
            </div>

            {result&&!result.error&&(
              <div ref={ref}>
                {/* 3 score cards */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:14}}>
                  <Card style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
                    <SLabel>ATS Score</SLabel>
                    <ScoreRing score={result.matchScore} size={76}/>
                    <div style={{fontSize:11,fontWeight:600,color:result.matchScore>=80?"#16a34a":result.matchScore>=65?"#d97706":"#dc2626"}}>
                      {result.matchScore>=80?"Strong Match":result.matchScore>=65?"Good Match":"Needs Work"}
                    </div>
                  </Card>
                  <Card style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
                    <SLabel color="#7c3aed">Human Appeal</SLabel>
                    <ScoreRing score={result.hiringManagerScore} size={76} color="#7c3aed"/>
                    <div style={{fontSize:11,fontWeight:600,color:"#7c3aed"}}>Hiring Manager View</div>
                  </Card>
                  <Card>
                    <SLabel color="#059669">💰 Salary Intelligence</SLabel>
                    {result.salaryIntelligence?(<>
                      <div style={{fontSize:24,fontWeight:800,color:"#059669",marginBottom:2}}>{result.salaryIntelligence.recommendedAsk}</div>
                      <div style={{fontSize:10,color:"#9ca3af",marginBottom:5}}>Market: {result.salaryIntelligence.marketMin} – {result.salaryIntelligence.marketMax}</div>
                      <div style={{fontSize:11,color:"#6b7280",lineHeight:1.6}}>{result.salaryIntelligence.insight}</div>
                    </>):<div style={{fontSize:12,color:"#9ca3af"}}>Not available</div>}
                  </Card>
                </div>

                {/* JD Analysis */}
                <Card>
                  <SLabel>JD Analysis — {result.jdAnalysis?.role} at {result.jdAnalysis?.company}</SLabel>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
                    <div>
                      <div style={{fontSize:10,color:"#9ca3af",fontWeight:600,marginBottom:6,letterSpacing:1}}>MUST-HAVE</div>
                      {result.jdAnalysis?.mustHave?.map(s=><Chip key={s} text={s} color="#16a34a" bg="#f0fdf4"/>)}
                    </div>
                    <div>
                      <div style={{fontSize:10,color:"#9ca3af",fontWeight:600,marginBottom:6,letterSpacing:1}}>NICE TO HAVE</div>
                      {result.jdAnalysis?.niceToHave?.map(s=><Chip key={s} text={s} color="#d97706" bg="#fffbeb"/>)}
                    </div>
                    <div>
                      <div style={{fontSize:10,color:"#9ca3af",fontWeight:600,marginBottom:6,letterSpacing:1}}>ATS KEYWORDS</div>
                      {result.jdAnalysis?.keywords?.map(k=><Chip key={k} text={k} color="#7c3aed" bg="#f5f3ff"/>)}
                    </div>
                  </div>
                  {result.jdAnalysis?.hiringIntent&&(
                    <div style={{marginTop:12,padding:11,background:"#f0f0ff",borderRadius:7,borderLeft:"3px solid #4f46e5"}}>
                      <div style={{fontSize:10,fontWeight:700,color:"#4f46e5",marginBottom:3}}>HIRING INTENT</div>
                      <div style={{fontSize:12,color:"#374151",lineHeight:1.6}}>{result.jdAnalysis.hiringIntent}</div>
                    </div>
                  )}
                </Card>

                {/* HM Psychology */}
                {result.hiringManagerInsights&&(
                  <Card>
                    <SLabel color="#7c3aed">🧠 Hiring Manager Psychology</SLabel>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
                      <div style={{padding:11,background:"#f5f3ff",borderRadius:7}}>
                        <div style={{fontSize:10,fontWeight:700,color:"#7c3aed",marginBottom:5}}>FIRST IMPRESSION (10 seconds)</div>
                        <div style={{fontSize:12,color:"#374151",lineHeight:1.6}}>{result.hiringManagerInsights.firstImpression}</div>
                      </div>
                      <div style={{padding:11,background:"#f0fdf4",borderRadius:7}}>
                        <div style={{fontSize:10,fontWeight:700,color:"#16a34a",marginBottom:5}}>HUMAN APPEAL</div>
                        <div style={{fontSize:12,color:"#374151",lineHeight:1.6}}>{result.hiringManagerInsights.humanAppeal}</div>
                      </div>
                      <div>
                        <div style={{fontSize:10,fontWeight:700,color:"#dc2626",marginBottom:5}}>POTENTIAL RED FLAGS</div>
                        {result.hiringManagerInsights.redFlags?.map((r,i)=><div key={i} style={{fontSize:12,color:"#6b7280",padding:"3px 0"}}>⚠ {r}</div>)}
                      </div>
                      <div>
                        <div style={{fontSize:10,fontWeight:700,color:"#d97706",marginBottom:5}}>STANDOUT FACTORS</div>
                        {result.hiringManagerInsights.standoutFactors?.map((s,i)=><div key={i} style={{fontSize:12,color:"#6b7280",padding:"3px 0"}}>⭐ {s}</div>)}
                      </div>
                    </div>
                  </Card>
                )}

                {/* Gap Analysis */}
                <Card>
                  <SLabel>Gap Analysis</SLabel>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
                    {[["✓ Strengths","strengths","#16a34a"],["✗ Gaps","gaps","#dc2626"],["⇄ Transferable","transferable","#d97706"]].map(([label,key,color])=>(
                      <div key={key}>
                        <div style={{fontSize:11,fontWeight:700,color,marginBottom:8}}>{label}</div>
                        {result.gapAnalysis?.[key]?.map((s,i)=><div key={i} style={{fontSize:12,color:"#6b7280",padding:"3px 0",borderBottom:"1px solid #f9fafb"}}>• {s}</div>)}
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Format picker + resume preview */}
                <Card>
                  <SLabel>✦ Your Tailored Resume</SLabel>
                  <FormatPicker resume={result.resume} selected={fmt} onSelect={setFmt} onDownload={f=>downloadResume(result.resume,f)}/>
                </Card>

                {/* Improvements */}
                <Card>
                  <SLabel>💡 Strategic Improvements</SLabel>
                  {result.improvements?.map((tip,i)=>(
                    <div key={i} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:i<result.improvements.length-1?"1px solid #f9fafb":"none"}}>
                      <div style={{width:22,height:22,borderRadius:"50%",background:"#f0f0ff",border:"1px solid #c7d2fe",color:"#4f46e5",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{i+1}</div>
                      <div style={{fontSize:12,color:"#6b7280",lineHeight:1.7}}>{tip}</div>
                    </div>
                  ))}
                </Card>
              </div>
            )}
            {result?.error&&<div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,padding:14,color:"#dc2626",fontSize:13}}>⚠ {result.error}</div>}
          </div>
        )}

        {/* ════ JOB SEARCH ════ */}
        {tab==="jobs"&&(
          <div style={{animation:"fadeIn 0.3s ease"}}>
            <div style={{marginBottom:20}}>
              <h2 style={{fontSize:26,fontWeight:800,color:"#111827",marginBottom:4,letterSpacing:-0.5}}>Job Search</h2>
              <p style={{color:"#6b7280",fontSize:14}}>Real jobs from Adzuna, JSearch, Reed · UK · US · India</p>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
              {COUNTRIES.map(c=>(
                <button key={c.code} onClick={()=>setCountry(c.code)} style={{padding:"8px 18px",borderRadius:20,background:country===c.code?"#4f46e5":"#fff",border:`1.5px solid ${country===c.code?"#4f46e5":"#e2e8f0"}`,color:country===c.code?"#fff":"#374151",fontSize:13,fontWeight:500,cursor:"pointer",boxShadow:country===c.code?"0 2px 6px rgba(79,70,229,0.25)":"none"}}>{c.label}</button>
              ))}
            </div>
            <div style={{display:"flex",gap:10,marginBottom:20}}>
              <input style={{...inp,flex:1}} placeholder={`Search jobs in ${COUNTRIES.find(c=>c.code===country)?.label}...`} value={jobQ} onChange={e=>setJobQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&searchJobs()}/>
              <button onClick={searchJobs} disabled={jobLoading} style={btn({flexShrink:0,background:"linear-gradient(135deg,#4f46e5,#7c3aed)"})}>{jobLoading?"Searching...":"Search Jobs"}</button>
            </div>

            {jobLoading&&(
              <div style={{textAlign:"center",padding:48}}>
                <div style={{width:28,height:28,border:"3px solid #e0e7ff",borderTopColor:"#4f46e5",borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 12px"}}/>
                <div style={{color:"#6b7280",fontSize:13}}>Searching Adzuna, JSearch, Reed...</div>
              </div>
            )}

            {!jobLoading&&jobs.length===0&&(
              <div style={{textAlign:"center",padding:60,color:"#9ca3af"}}>
                <div style={{fontSize:44,marginBottom:14}}>🔍</div>
                <div style={{fontSize:16,fontWeight:600,color:"#374151",marginBottom:6}}>Search for jobs above</div>
                <div style={{fontSize:13}}>Try "product manager", "software engineer", "data analyst"</div>
              </div>
            )}

            {jobs.map(job=>(
              <div key={job.id} className="jcard" style={{background:"#fff",border:"1.5px solid #e8ecf0",borderRadius:12,padding:18,marginBottom:10,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5,flexWrap:"wrap"}}>
                      <span style={{fontSize:15,fontWeight:700,color:"#111827"}}>{job.title}</span>
                      <PBadge platform={job.platform}/>
                      {job.visaSponsorship&&(
                        <span style={{fontSize:10,fontWeight:700,color:"#16a34a",background:"#f0fdf4",border:"1px solid #bbf7d0",padding:"2px 8px",borderRadius:10}}>🛂 Visa Sponsorship</span>
                      )}
                    </div>
                    <div style={{display:"flex",gap:14,marginBottom:6,flexWrap:"wrap"}}>
                      <span style={{fontSize:12,color:"#6b7280"}}>🏢 {job.company}</span>
                      <span style={{fontSize:12,color:"#9ca3af"}}>📍 {job.location}</span>
                      {job.salary&&job.salary!=="Competitive"&&<span style={{fontSize:12,color:"#9ca3af"}}>💰 {job.salary}</span>}
                      <span style={{fontSize:12,color:"#9ca3af"}}>🕐 {job.posted}</span>
                    </div>
                    {job.tags?.length>0&&<div style={{marginBottom:8}}>{job.tags.map(t=><Chip key={t} text={t}/>)}</div>}
                    {job.description&&<p style={{fontSize:12,color:"#9ca3af",lineHeight:1.6,marginBottom:12}}>{job.description}</p>}
                    <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                      <button onClick={e=>applyJob(job,e)} disabled={applying===job.id}
                        style={btn({fontSize:12,padding:"8px 16px",background:applied===job.id?"#16a34a":"linear-gradient(135deg,#4f46e5,#7c3aed)"})}>
                        {applying===job.id?"Opening...":applied===job.id?"✓ Applied!":"Apply Now →"}
                      </button>
                      <button onClick={e=>{e.stopPropagation();setJd((job.description||job.title)+"\n\nRole: "+job.title+"\nCompany: "+job.company);setTab("builder");}}
                        style={ghost({fontSize:12,color:"#4f46e5",borderColor:"#c7d2fe"})}>✦ Tailor Resume</button>
                      <button onClick={e=>saveJob(job,e)}
                        style={ghost({fontSize:12,color:apps.find(a=>a.title===job.title&&a.company===job.company)?"#16a34a":"#6b7280",borderColor:apps.find(a=>a.title===job.title&&a.company===job.company)?"#bbf7d0":"#e2e8f0"})}>
                        {apps.find(a=>a.title===job.title&&a.company===job.company)?"✓ Saved":"☆ Save"}
                      </button>
                      {result?.resume&&(
                        <button onClick={e=>{e.stopPropagation();setJobFmt(jobFmt===job.id?null:job.id);setJobFmtSel("classic");}}
                          style={ghost({fontSize:12,color:"#7c3aed",borderColor:"#ddd6fe"})}>
                          {jobFmt===job.id?"✕ Close":"📄 Download Resume"}
                        </button>
                      )}
                    </div>
                    {jobFmt===job.id&&result?.resume&&(
                      <div style={{marginTop:14,padding:16,background:"#f8fafc",borderRadius:8,border:"1px solid #e8ecf0"}}>
                        <FormatPicker resume={result.resume} selected={jobFmtSel} onSelect={setJobFmtSel} onDownload={f=>downloadResume(result.resume,f)}/>
                      </div>
                    )}
                  </div>
                  <ScoreRing score={job.match} size={52}/>
                </div>
              </div>
            ))}
            {jobs.length>0&&<div style={{textAlign:"center",padding:"12px 0",fontSize:11,color:"#d1d5db"}}>{jobs.length} live jobs · Adzuna + JSearch + Reed</div>}
          </div>
        )}

        {/* ════ TRACKER ════ */}
        {tab==="tracker"&&(
          <div style={{animation:"fadeIn 0.3s ease"}}>
            <div style={{marginBottom:20}}>
              <h2 style={{fontSize:26,fontWeight:800,color:"#111827",marginBottom:4,letterSpacing:-0.5}}>Application Tracker</h2>
              <p style={{color:"#6b7280",fontSize:14}}>Track every application from saved to offer.</p>
            </div>
            {apps.length===0?(
              <div style={{textAlign:"center",padding:60,color:"#9ca3af"}}>
                <div style={{fontSize:44,marginBottom:14}}>📋</div>
                <div style={{fontSize:16,fontWeight:600,color:"#374151",marginBottom:6}}>No applications yet</div>
                <div style={{fontSize:13}}>Go to Job Search and apply or save jobs</div>
              </div>
            ):(<>
              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:20}}>
                {[
                  {label:"Applied",value:apps.filter(a=>a.status!=="Saved").length,color:"#4f46e5"},
                  {label:"Saved",value:apps.filter(a=>a.status==="Saved").length,color:"#6b7280"},
                  {label:"Interview",value:apps.filter(a=>a.status==="Interview").length,color:"#d97706"},
                  {label:"Offers",value:apps.filter(a=>a.status==="Offer").length,color:"#16a34a"},
                  {label:"Avg Match",value:apps.length?Math.round(apps.reduce((s,a)=>s+(a.match||0),0)/apps.length)+"%":"—",color:"#7c3aed"},
                ].map(s=>(
                  <div key={s.label} style={{background:"#fff",border:"1px solid #e8ecf0",borderRadius:10,padding:"14px 16px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                    <div style={{fontSize:10,color:"#9ca3af",fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:6}}>{s.label}</div>
                    <div style={{fontSize:26,fontWeight:800,color:s.color}}>{s.value}</div>
                  </div>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12}}>
                {["Saved","Applied","Interview","Offer","Rejected"].map(status=>(
                  <div key={status}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                      <SBadge status={status}/>
                      <span style={{fontSize:11,color:"#9ca3af"}}>{apps.filter(a=>a.status===status).length}</span>
                    </div>
                    {apps.filter(a=>a.status===status).map(app=>(
                      <div key={app.id} style={{background:"#fff",border:"1px solid #e8ecf0",borderRadius:8,padding:12,marginBottom:8,boxShadow:"0 1px 2px rgba(0,0,0,0.03)"}}>
                        <div style={{fontSize:12,fontWeight:600,color:"#111827",marginBottom:3,lineHeight:1.4}}>{app.title}</div>
                        <div style={{fontSize:11,color:"#9ca3af",marginBottom:8}}>{app.company}</div>
                        <PBadge platform={app.platform}/>
                        <div style={{display:"flex",gap:4,marginTop:10,flexWrap:"wrap"}}>
                          {["Applied","Interview","Offer","Rejected"].filter(s=>s!==status).slice(0,2).map(s=>(
                            <button key={s} onClick={()=>setApps(prev=>prev.map(a=>a.id===app.id?{...a,status:s}:a))} style={{background:"#f8fafc",border:"1px solid #e8ecf0",color:"#6b7280",borderRadius:5,padding:"2px 8px",fontSize:9,fontWeight:600,cursor:"pointer"}}>→{s}</button>
                          ))}
                          <button onClick={()=>setApps(prev=>prev.filter(a=>a.id!==app.id))} style={{background:"#fef2f2",border:"1px solid #fecaca",color:"#dc2626",borderRadius:5,padding:"2px 8px",fontSize:9,fontWeight:600,cursor:"pointer"}}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </>)}
          </div>
        )}

        {/* ════ COVER LETTER ════ */}
        {tab==="cover"&&(
          <div style={{animation:"fadeIn 0.3s ease"}}>
            <h2 style={{fontSize:26,fontWeight:800,color:"#111827",marginBottom:4,letterSpacing:-0.5}}>Cover Letter</h2>
            <p style={{color:"#6b7280",fontSize:14,marginBottom:18}}>Personalised, professional cover letters in seconds.</p>
            {(!jd||!cv)&&<div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:8,padding:12,marginBottom:14,color:"#92400e",fontSize:13}}>⚡ Add your JD and CV in Resume Builder first.</div>}
            <button onClick={genCover} disabled={coverLoading||!jd||!cv} style={{...btn(),opacity:coverLoading||!jd||!cv?0.5:1,marginBottom:18,background:"linear-gradient(135deg,#4f46e5,#7c3aed)"}}>
              {coverLoading?"Writing...":"✉ Generate Cover Letter"}
            </button>
            {coverResult&&!coverResult.error&&(
              <Card>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <div style={{fontSize:12,color:"#6b7280"}}>Subject: <strong>{coverResult.subject}</strong></div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>navigator.clipboard.writeText(coverResult.letter)} style={ghost({fontSize:11,padding:"5px 12px"})}>Copy</button>
                    <button onClick={()=>{const b=new Blob([coverResult.letter],{type:"text/plain"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download="cover_letter.txt";a.click();}} style={ghost({fontSize:11,padding:"5px 12px",color:"#4f46e5",borderColor:"#c7d2fe"})}>⬇ Download</button>
                  </div>
                </div>
                <div style={{background:"#f8fafc",borderRadius:8,padding:20,fontSize:13,color:"#374151",lineHeight:2,whiteSpace:"pre-wrap"}}>{coverResult.letter}</div>
              </Card>
            )}
            {coverResult?.error&&<div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:12,color:"#dc2626",fontSize:13}}>⚠ {coverResult.error}</div>}
          </div>
        )}

        {/* ════ INTERVIEW PREP ════ */}
        {tab==="interview"&&(
          <div style={{animation:"fadeIn 0.3s ease"}}>
            <h2 style={{fontSize:26,fontWeight:800,color:"#111827",marginBottom:4,letterSpacing:-0.5}}>Interview Preparation</h2>
            <p style={{color:"#6b7280",fontSize:14,marginBottom:18}}>AI coaching — questions, STAR stories, and what to ask them.</p>
            {(!jd||!cv)&&<div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:8,padding:12,marginBottom:14,color:"#92400e",fontSize:13}}>⚡ Add your JD and CV in Resume Builder first.</div>}
            <button onClick={genInterview} disabled={intLoading||!jd||!cv} style={{...btn(),opacity:intLoading||!jd||!cv?0.5:1,marginBottom:18,background:"linear-gradient(135deg,#4f46e5,#7c3aed)"}}>
              {intLoading?"Preparing...":"◆ Generate Interview Prep"}
            </button>
            {intResult&&!intResult.error&&(<>
              <Card>
                <SLabel>Key Themes</SLabel>
                {intResult.keyThemes?.map(t=><Chip key={t} text={t} color="#4f46e5" bg="#eef2ff"/>)}
              </Card>
              <Card>
                <SLabel>Likely Questions</SLabel>
                {intResult.likelyQuestions?.map((q,i)=>(
                  <div key={i} style={{marginBottom:14,paddingBottom:14,borderBottom:i<intResult.likelyQuestions.length-1?"1px solid #f9fafb":"none"}}>
                    <div style={{fontSize:13,fontWeight:600,color:"#111827",marginBottom:5}}>Q: {q.question}</div>
                    <div style={{fontSize:12,color:"#6b7280",paddingLeft:12,borderLeft:"2px solid #c7d2fe",lineHeight:1.6}}>💡 {q.tip}</div>
                  </div>
                ))}
              </Card>
              <Card>
                <SLabel>STAR Stories</SLabel>
                {intResult.starStories?.map((s,i)=>(
                  <div key={i} style={{marginBottom:18,paddingBottom:18,borderBottom:i<intResult.starStories.length-1?"1px solid #f9fafb":"none"}}>
                    <div style={{fontSize:12,fontWeight:700,color:"#d97706",marginBottom:10}}>⭐ {s.theme}</div>
                    {["situation","task","action","result"].map(k=>(
                      <div key={k} style={{display:"grid",gridTemplateColumns:"80px 1fr",gap:8,marginBottom:5}}>
                        <div style={{fontSize:10,fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:1}}>{k}</div>
                        <div style={{fontSize:12,color:"#374151",lineHeight:1.6}}>{s[k]}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </Card>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <Card><SLabel>Questions to Ask</SLabel>{intResult.questionsToAsk?.map((q,i)=><div key={i} style={{fontSize:12,color:"#6b7280",padding:"5px 0",borderBottom:"1px solid #f9fafb"}}>→ {q}</div>)}</Card>
                <Card><SLabel>Red Flags to Address</SLabel>{intResult.redFlags?.map((r,i)=><div key={i} style={{fontSize:12,color:"#6b7280",padding:"5px 0",borderBottom:"1px solid #f9fafb"}}>⚠ {r}</div>)}</Card>
              </div>
            </>)}
            {intResult?.error&&<div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:12,color:"#dc2626",fontSize:13}}>⚠ {intResult.error}</div>}
          </div>
        )}

        {/* ════ PRICING ════ */}
        {tab==="pricing"&&(
          <div style={{animation:"fadeIn 0.3s ease"}}>
            <div style={{textAlign:"center",marginBottom:32}}>
              <h2 style={{fontSize:34,fontWeight:800,color:"#111827",marginBottom:8,letterSpacing:-0.8}}>Simple Pricing</h2>
              <p style={{color:"#6b7280",fontSize:15}}>Start free. Upgrade when ready.</p>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:32}}>
              {TIERS.map(t=>(
                <div key={t.name} style={{background:"#fff",border:`2px solid ${t.highlight?"#4f46e5":"#e8ecf0"}`,borderRadius:14,padding:28,position:"relative",boxShadow:t.highlight?"0 8px 28px rgba(79,70,229,0.15)":"0 1px 4px rgba(0,0,0,0.04)"}}>
                  {t.highlight&&<div style={{position:"absolute",top:-12,left:"50%",transform:"translateX(-50%)",background:"linear-gradient(135deg,#4f46e5,#7c3aed)",color:"#fff",fontSize:10,fontWeight:700,padding:"3px 14px",borderRadius:20,letterSpacing:1,textTransform:"uppercase",whiteSpace:"nowrap"}}>Most Popular</div>}
                  <div style={{fontSize:13,fontWeight:700,color:t.color,marginBottom:12}}>{t.name}</div>
                  <div style={{marginBottom:20}}>
                    <span style={{fontSize:36,fontWeight:800,color:"#111827"}}>{t.price}</span>
                    {t.period&&<span style={{fontSize:13,color:"#6b7280"}}>{t.period}</span>}
                  </div>
                  <div style={{marginBottom:24}}>
                    {t.features.map(f=><div key={f} style={{display:"flex",gap:8,padding:"6px 0",borderBottom:"1px solid #f9fafb",fontSize:12,color:"#6b7280"}}><span style={{color:t.color}}>✓</span>{f}</div>)}
                  </div>
                  <button onClick={()=>{if(t.gumroad)window.open(t.gumroad,"_blank");else alert("You're on the free plan!");}}
                    style={{width:"100%",padding:12,background:t.highlight?"linear-gradient(135deg,#4f46e5,#7c3aed)":"#fff",border:t.highlight?"none":`2px solid ${t.color}`,color:t.highlight?"#fff":t.color,borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer"}}>
                    {t.cta}
                  </button>
                </div>
              ))}
            </div>
            <Card>
              <SLabel>Why CareerOS</SLabel>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
                {[
                  {i:"🎯",t:"Dual Scoring",d:"ATS score AND Hiring Manager psychology — the only platform that does both"},
                  {i:"💰",t:"Salary Intelligence",d:"Know your market value and what to negotiate before every interview"},
                  {i:"📄",t:"4 Resume Formats",d:"Classic, Modern, Minimal, Executive — with live preview before download"},
                  {i:"⚡",t:"30 Second Results",d:"Full analysis in under 30 seconds"},
                  {i:"🔄",t:"Full Circle",d:"Job search → resume → cover letter → interview prep → tracker"},
                  {i:"🌍",t:"Global Jobs",d:"Real jobs from Adzuna, JSearch, Reed across UK, US and India"},
                ].map(item=>(
                  <div key={item.t} style={{padding:14,background:"#f8fafc",borderRadius:10,border:"1px solid #e8ecf0"}}>
                    <div style={{fontSize:20,marginBottom:8}}>{item.i}</div>
                    <div style={{fontSize:13,fontWeight:700,color:"#111827",marginBottom:4}}>{item.t}</div>
                    <div style={{fontSize:12,color:"#6b7280",lineHeight:1.5}}>{item.d}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>

      <div style={{borderTop:"1px solid #e8ecf0",padding:"16px 28px",textAlign:"center",color:"#d1d5db",fontSize:11,background:"#fff"}}>
        <span style={{color:"#4f46e5",fontWeight:700}}>CareerOS</span> · AI Career Platform · Resume · Jobs · Cover Letter · Interview Prep · Tracker
      </div>
    </div>
  );
}
