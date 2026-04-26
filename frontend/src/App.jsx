import { useState, useRef } from "react";

// ─── RESUME FORMATS (6 options) ───────────────────────────────────────────────
const RESUME_FORMATS = [
  { id:"classic", name:"Classic", desc:"Traditional chronological — trusted by recruiters everywhere", sub:"Single column, serif headings, clean bullets", icon:"📄", accentColor:"#1e3a5f", fontFamily:"'Georgia', serif" },
  { id:"modern", name:"Modern", desc:"Two-column layout with colour accents — stands out visually", sub:"Two-column, teal accents, skill bars", icon:"✨", accentColor:"#0d9488", fontFamily:"'Helvetica Neue', sans-serif" },
  { id:"executive", name:"Executive", desc:"Senior-level formatting for Director, VP and C-suite roles", sub:"Bold header, navy accents, achievement-focused", icon:"👔", accentColor:"#1e3a8a", fontFamily:"'Times New Roman', serif" },
  { id:"minimal", name:"Minimal", desc:"Ultra-clean design — lets your experience do the talking", sub:"Whitespace-first, thin lines, no clutter", icon:"⬜", accentColor:"#374151", fontFamily:"'Garamond', serif" },
  { id:"ats", name:"ATS-Safe", desc:"100% plain text — beats every automated screening system", sub:"Plain text, no tables, no columns, maximum parseability", icon:"🤖", accentColor:"#0f766e", fontFamily:"'Courier New', monospace" },
  { id:"creative", name:"Creative", desc:"Bold typography — perfect for marketing, design and media roles", sub:"Strong contrast, accent colour, modern sans-serif", icon:"🎨", accentColor:"#7c3aed", fontFamily:"'Helvetica Neue', sans-serif" },
];

const TABS = [
  { id:"builder", label:"Resume Builder" },
  { id:"jobs", label:"Job Search" },
  { id:"tracker", label:"Applications" },
  { id:"cover", label:"Cover Letter" },
  { id:"interview", label:"Interview Prep" },
  { id:"pricing", label:"Pricing" },
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
  {
    name:"Free", price:"£0", period:"forever",
    features:["3 tailored resumes/month","Basic ATS score","5 job searches/day","1 cover letter/month","Classic format only"],
    cta:"Get Started Free", highlight:false, color:"#6b7280", gumroad:null,
  },
  {
    name:"Pro", price:"£9.99", period:"/month",
    features:["Unlimited resume tailoring","ATS + Hiring Manager scores","Salary intelligence","All 6 resume formats","Unlimited job search","Unlimited cover letters","Interview prep AI","Visa sponsorship filter","Priority support"],
    cta:"Start Pro — £9.99/mo", highlight:true, color:"#0d9488", gumroad:"https://gumroad.com/l/careeros-pro",
    badge:"Most Popular",
  },
  {
    name:"Enterprise", price:"£29.99", period:"/month",
    features:["Everything in Pro","Team workspace (up to 10)","Bulk resume optimization","API access","Recruiter dashboard","Analytics & reporting","White-label option","Dedicated account manager"],
    cta:"Start Enterprise", highlight:false, color:"#4f46e5", gumroad:"https://gumroad.com/l/careeros-enterprise",
  },
];

const TESTIMONIALS = [
  { name:"Priya S.", role:"Software Engineer → Google", text:"Generated a tailored resume in 40 seconds. Got 3 interviews in the first week. Worth every penny.", rating:5, avatar:"P" },
  { name:"James T.", role:"Marketing Manager, London", text:"The ATS scoring alone saved me hours. I went from 0 callbacks to 4 interviews in 2 weeks.", rating:5, avatar:"J" },
  { name:"Rahul M.", role:"Product Manager, Bangalore", text:"Finally a tool that understands the UK job market. The salary intelligence feature is brilliant.", rating:5, avatar:"R" },
  { name:"Sarah K.", role:"Data Analyst → KPMG", text:"The hiring manager psychology section is something I've never seen anywhere else. Genuinely changed how I write applications.", rating:5, avatar:"S" },
  { name:"David L.", role:"Senior Developer, Manchester", text:"Switched from Resume.io and never looked back. The interview prep alone is worth the subscription.", rating:5, avatar:"D" },
  { name:"Anita P.", role:"Finance Director, Dubai", text:"Used it for an executive role. The Executive format and salary intel helped me negotiate £15k more than the initial offer.", rating:5, avatar:"A" },
];

const STATUS_COLORS = {
  "Saved":{ bg:"#f8fafc", text:"#64748b", border:"#e2e8f0", dot:"#94a3b8" },
  "Applied":{ bg:"#eff6ff", text:"#2563eb", border:"#bfdbfe", dot:"#3b82f6" },
  "Interview":{ bg:"#f0fdfa", text:"#0d9488", border:"#99f6e4", dot:"#14b8a6" },
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
  if (!resume) return `<html><body style="font-family:sans-serif;padding:60px;color:#9ca3af;text-align:center;"><p style="margin-top:100px;">Generate a resume first to preview here.</p></body></html>`;
  const f = RESUME_FORMATS.find(x => x.id === format) || RESUME_FORMATS[0];

  const shared = {
    name: resume.name || "",
    contact: resume.contact || "",
    summary: resume.summary || "",
    skills: resume.skills || [],
    experience: resume.experience || [],
    education: resume.education || "",
  };

  if (format === "classic") return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${shared.name}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Georgia,serif;color:#1a1a1a;background:#fff;max-width:750px;margin:32px auto;padding:48px}h1{font-size:26px;font-weight:700;color:#1e3a5f;margin-bottom:3px}.contact{font-size:12px;color:#555;margin-bottom:18px;border-bottom:2px solid #1e3a5f;padding-bottom:10px}.st{font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#1e3a5f;margin:16px 0 7px;border-bottom:1px solid #e5e7eb;padding-bottom:3px}.summary{font-size:13px;line-height:1.75;color:#374151}.skills{display:flex;flex-wrap:wrap;gap:5px;margin-top:3px}.skill{padding:3px 9px;border:1px solid #1e3a5f30;border-radius:3px;font-size:11px;color:#374151}.job{margin-bottom:13px}.jh{display:flex;justify-content:space-between;margin-bottom:2px}.jt{font-size:13px;font-weight:700;color:#111}.jp{font-size:11px;color:#888}.jc{font-size:12px;color:#555;margin-bottom:3px}.b{font-size:12px;color:#374151;line-height:1.65;padding-left:12px;position:relative;margin-bottom:2px}.b::before{content:"•";position:absolute;left:0;color:#1e3a5f}.edu{font-size:12px;color:#374151}.footer{margin-top:24px;padding-top:8px;border-top:1px solid #e5e7eb;font-size:10px;color:#9ca3af;text-align:center}@media print{body{margin:0;padding:32px}}</style></head><body><h1>${shared.name}</h1><div class="contact">${shared.contact}</div><div class="st">Professional Summary</div><div class="summary">${shared.summary}</div><div class="st">Core Skills</div><div class="skills">${shared.skills.map(s=>`<span class="skill">${s}</span>`).join("")}</div><div class="st">Experience</div>${shared.experience.map(e=>`<div class="job"><div class="jh"><span class="jt">${e.title}</span><span class="jp">${e.period}</span></div><div class="jc">${e.company}</div>${e.bullets?.map(b=>`<div class="b">${b}</div>`).join("")||""}</div>`).join("")}<div class="st">Education & Certifications</div><div class="edu">${shared.education}</div><div class="footer">Generated by CareerOS · careeros-rose.vercel.app</div></body></html>`;

  if (format === "modern") return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${shared.name}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a1a;background:#fff;max-width:780px;margin:32px auto;display:grid;grid-template-columns:260px 1fr}.sidebar{background:#0d9488;color:#fff;padding:32px 22px;min-height:100vh}.main{padding:32px 28px}h1{font-size:22px;font-weight:800;margin-bottom:4px}.ctact{font-size:11px;opacity:0.85;line-height:1.8;margin-bottom:20px}.sst{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#99f6e4;margin:18px 0 8px}.skill{padding:4px 0;font-size:11px;border-bottom:1px solid rgba(255,255,255,0.12)}.mst{font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#0d9488;margin:16px 0 8px}.summary{font-size:13px;line-height:1.75;color:#374151}.job{margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid #f3f4f6}.jh{display:flex;justify-content:space-between;margin-bottom:2px}.jt{font-size:13px;font-weight:700;color:#111}.jp{font-size:11px;color:#888}.jc{font-size:12px;color:#0d9488;font-weight:600;margin-bottom:4px}.b{font-size:12px;color:#374151;line-height:1.65;padding-left:13px;position:relative;margin-bottom:2px}.b::before{content:"▸";position:absolute;left:0;color:#0d9488}.edu{font-size:12px;color:#374151}.footer{margin-top:16px;font-size:10px;color:#9ca3af;text-align:center;padding-top:10px;border-top:1px solid #f3f4f6}@media print{body{margin:0}}</style></head><body><div class="sidebar"><h1>${shared.name}</h1><div class="ctact">${shared.contact.replace(/•/g,"<br>")}</div><div class="sst">Skills</div>${shared.skills.map(s=>`<div class="skill">${s}</div>`).join("")}</div><div class="main"><div class="mst">Profile</div><div class="summary">${shared.summary}</div><div class="mst">Experience</div>${shared.experience.map(e=>`<div class="job"><div class="jh"><span class="jt">${e.title}</span><span class="jp">${e.period}</span></div><div class="jc">${e.company}</div>${e.bullets?.map(b=>`<div class="b">${b}</div>`).join("")||""}</div>`).join("")}<div class="mst">Education</div><div class="edu">${shared.education}</div><div class="footer">Generated by CareerOS</div></div></body></html>`;

  if (format === "executive") return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${shared.name}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Times New Roman',serif;color:#1a1a1a;background:#fff;max-width:760px;margin:32px auto;padding:50px}.top{height:4px;background:#1e3a8a;margin-bottom:28px}h1{font-size:30px;font-weight:700;color:#111;letter-spacing:0.5px;margin-bottom:3px}.contact{font-size:12px;color:#666;margin-bottom:5px}.tl{height:1px;background:#1e3a8a;margin:12px 0 20px}.section{margin-bottom:22px;padding-bottom:22px;border-bottom:1px solid #f0ece4}.st{font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#1e3a8a;margin-bottom:9px}.summary{font-size:13px;line-height:1.8;color:#2d2d2d;font-style:italic;padding-left:14px;border-left:3px solid #1e3a8a25}.skills{display:flex;flex-wrap:wrap;gap:7px}.skill{padding:3px 13px;border:1px solid #1e3a8a30;font-size:11px;color:#444;background:#fafafa}.job{margin-bottom:14px}.jh{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:2px}.jt{font-size:14px;font-weight:700;color:#111}.jp{font-size:11px;color:#888}.jc{font-size:12px;color:#1e3a8a;font-weight:600;margin-bottom:4px}.b{font-size:12px;color:#2d2d2d;line-height:1.7;padding-left:13px;position:relative;margin-bottom:3px}.b::before{content:"◆";position:absolute;left:0;color:#1e3a8a;font-size:7px;top:5px}.edu{font-size:12px;color:#444;line-height:1.8}.footer{margin-top:18px;font-size:10px;color:#bbb;text-align:right}@media print{body{margin:0;padding:36px}}</style></head><body><div class="top"></div><h1>${shared.name}</h1><div class="contact">${shared.contact}</div><div class="tl"></div><div class="section"><div class="st">Executive Profile</div><div class="summary">${shared.summary}</div></div><div class="section"><div class="st">Core Competencies</div><div class="skills">${shared.skills.map(s=>`<span class="skill">${s}</span>`).join("")}</div></div><div class="section"><div class="st">Career History</div>${shared.experience.map(e=>`<div class="job"><div class="jh"><span class="jt">${e.title}</span><span class="jp">${e.period}</span></div><div class="jc">${e.company}</div>${e.bullets?.map(b=>`<div class="b">${b}</div>`).join("")||""}</div>`).join("")}</div><div class="section"><div class="st">Education & Development</div><div class="edu">${shared.education}</div></div><div class="footer">Generated by CareerOS · careeros-rose.vercel.app</div></body></html>`;

  if (format === "minimal") return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${shared.name}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Garamond,Georgia,serif;color:#1a1a1a;background:#fff;max-width:700px;margin:48px auto;padding:60px}h1{font-size:30px;font-weight:300;letter-spacing:2px;text-transform:uppercase;color:#111;margin-bottom:4px}.contact{font-size:11px;color:#888;letter-spacing:1px;margin-bottom:32px}.st{font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#aaa;margin:24px 0 8px}.div{height:1px;background:#f0f0f0;margin-bottom:12px}.summary{font-size:13px;line-height:1.9;color:#444}.skills{font-size:12px;color:#555;line-height:2}.job{margin-bottom:16px}.jh{display:flex;justify-content:space-between;margin-bottom:2px}.jt{font-size:13px;font-weight:600;color:#111}.jp{font-size:11px;color:#aaa}.jc{font-size:11px;color:#888;margin-bottom:4px;font-style:italic}.b{font-size:12px;color:#444;line-height:1.75;padding-left:14px;position:relative;margin-bottom:2px}.b::before{content:"—";position:absolute;left:0;color:#ccc}.edu{font-size:12px;color:#555;line-height:1.7}.footer{margin-top:36px;font-size:10px;color:#ccc;text-align:center}@media print{body{margin:0;padding:40px}}</style></head><body><h1>${shared.name}</h1><div class="contact">${shared.contact}</div><div class="st">Summary</div><div class="div"></div><div class="summary">${shared.summary}</div><div class="st">Skills</div><div class="div"></div><div class="skills">${shared.skills.join("  ·  ")}</div><div class="st">Experience</div><div class="div"></div>${shared.experience.map(e=>`<div class="job"><div class="jh"><span class="jt">${e.title}</span><span class="jp">${e.period}</span></div><div class="jc">${e.company}</div>${e.bullets?.map(b=>`<div class="b">${b}</div>`).join("")||""}</div>`).join("")}<div class="st">Education</div><div class="div"></div><div class="edu">${shared.education}</div><div class="footer">Generated by CareerOS</div></body></html>`;

  if (format === "ats") return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${shared.name}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Courier New',monospace;color:#1a1a1a;background:#fff;max-width:720px;margin:32px auto;padding:40px}h1{font-size:20px;font-weight:700;margin-bottom:2px}.contact{font-size:12px;color:#374151;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #111}.st{font-size:12px;font-weight:700;text-transform:uppercase;margin:16px 0 6px;padding-bottom:4px;border-bottom:1px solid #374151}.summary{font-size:13px;line-height:1.75;color:#374151}.skills{font-size:12px;color:#374151;line-height:2}.job{margin-bottom:12px}.jh{display:flex;justify-content:space-between;margin-bottom:2px}.jt{font-size:13px;font-weight:700}.jp{font-size:12px}.jc{font-size:12px;color:#374151;margin-bottom:3px}.b{font-size:12px;color:#374151;line-height:1.65;padding-left:12px;margin-bottom:2px}.edu{font-size:12px;color:#374151}.footer{margin-top:20px;padding-top:8px;border-top:1px solid #e5e7eb;font-size:10px;color:#9ca3af;text-align:center}@media print{body{margin:0;padding:28px}}</style></head><body><h1>${shared.name}</h1><div class="contact">${shared.contact}</div><div class="st">PROFESSIONAL SUMMARY</div><div class="summary">${shared.summary}</div><div class="st">CORE SKILLS</div><div class="skills">${shared.skills.join(" | ")}</div><div class="st">PROFESSIONAL EXPERIENCE</div>${shared.experience.map(e=>`<div class="job"><div class="jh"><span class="jt">${e.title} - ${e.company}</span><span class="jp">${e.period}</span></div>${e.bullets?.map(b=>`<div class="b">- ${b}</div>`).join("")||""}</div>`).join("")}<div class="st">EDUCATION & CERTIFICATIONS</div><div class="edu">${shared.education}</div><div class="footer">Generated by CareerOS · careeros-rose.vercel.app</div></body></html>`;

  // creative
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${shared.name}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a1a;background:#fff;max-width:760px;margin:32px auto}.hdr{background:#1a1a2e;color:#fff;padding:36px 40px 28px;position:relative}.accent{position:absolute;top:0;right:0;width:6px;height:100%;background:#7c3aed}.nm{font-size:28px;font-weight:900;letter-spacing:-0.5px;margin-bottom:4px}.ct{font-size:12px;opacity:0.75}.body{padding:28px 40px}.st{display:flex;align-items:center;gap:8px;font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#7c3aed;margin:18px 0 10px}.st::after{content:"";flex:1;height:1px;background:#f3f4f6}.summary{font-size:13px;line-height:1.75;color:#374151}.skills{display:flex;flex-wrap:wrap;gap:6px}.skill{padding:4px 12px;background:#f5f3ff;border-radius:4px;font-size:11px;color:#7c3aed;font-weight:600}.job{margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid #f9fafb}.jh{display:flex;justify-content:space-between;margin-bottom:2px}.jt{font-size:14px;font-weight:800;color:#111}.jp{font-size:11px;color:#888;background:#f9fafb;padding:2px 8px;border-radius:10px}.jc{font-size:12px;color:#7c3aed;font-weight:600;margin-bottom:5px}.b{font-size:12px;color:#374151;line-height:1.65;padding-left:13px;position:relative;margin-bottom:2px}.b::before{content:"→";position:absolute;left:0;color:#7c3aed;font-size:10px}.edu{font-size:12px;color:#374151}.footer{margin-top:16px;font-size:10px;color:#9ca3af;text-align:center;padding-top:10px;border-top:1px solid #f3f4f6}@media print{body{margin:0}}</style></head><body><div class="hdr"><div class="accent"></div><div class="nm">${shared.name}</div><div class="ct">${shared.contact}</div></div><div class="body"><div class="st">Profile</div><div class="summary">${shared.summary}</div><div class="st">Skills</div><div class="skills">${shared.skills.map(s=>`<span class="skill">${s}</span>`).join("")}</div><div class="st">Experience</div>${shared.experience.map(e=>`<div class="job"><div class="jh"><span class="jt">${e.title}</span><span class="jp">${e.period}</span></div><div class="jc">${e.company}</div>${e.bullets?.map(b=>`<div class="b">${b}</div>`).join("")||""}</div>`).join("")}<div class="st">Education</div><div class="edu">${shared.education}</div><div class="footer">Generated by CareerOS</div></div></body></html>`;
}

function downloadResume(resume, format) {
  const html = generateResumeHTML(resume, format);
  const blob = new Blob([html], { type:"text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(resume.name||"Resume").replace(/\s+/g,"_")}_${format}.html`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── API ──────────────────────────────────────────────────────────────────────
async function callClaude(prompt, maxTokens = 3000) {
  const res = await fetch("/api/claude", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      model:"claude-sonnet-4-5", max_tokens: maxTokens,
      system:"You are an expert resume writer. Return only valid JSON. No markdown, no backticks, no preamble.",
      messages:[{role:"user",content:prompt}]
    }),
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
  return <span style={{display:"inline-flex",alignItems:"center",padding:"2px 8px",borderRadius:4,background:p.bg,border:`1px solid ${p.border}`,color:p.color,fontSize:11,fontWeight:600}}>{p.name}</span>;
}

function SBadge({status}) {
  const s=STATUS_COLORS[status]||STATUS_COLORS["Saved"];
  return <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:5,background:s.bg,border:`1px solid ${s.border}`,color:s.text,fontSize:11,fontWeight:600}}>
    <span style={{width:6,height:6,borderRadius:"50%",background:s.dot,flexShrink:0}}/>{status}
  </span>;
}

function Card({children,style={}}) {
  return <div style={{background:"#fff",border:"1px solid #e8ecf0",borderRadius:12,padding:22,marginBottom:14,boxShadow:"0 1px 3px rgba(0,0,0,0.04)",...style}}>{children}</div>;
}

function SLabel({children,color="#0d9488"}) {
  return <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color,textTransform:"uppercase",marginBottom:12}}>{children}</div>;
}

// ─── FORMAT PICKER ────────────────────────────────────────────────────────────
function FormatPicker({resume,selected,onSelect,onDownload}) {
  return (
    <div>
      <div style={{fontSize:12,fontWeight:600,color:"#374151",marginBottom:10}}>Choose your resume format:</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:8,marginBottom:14}}>
        {RESUME_FORMATS.map(f=>(
          <div key={f.id} onClick={()=>onSelect(f.id)}
            style={{border:`2px solid ${selected===f.id?f.accentColor:"#e8ecf0"}`,borderRadius:8,padding:10,cursor:"pointer",background:selected===f.id?f.accentColor+"08":"#fafbfc",transition:"all 0.15s",textAlign:"center"}}>
            <div style={{fontSize:22,marginBottom:5}}>{f.icon}</div>
            <div style={{fontSize:11,fontWeight:700,color:selected===f.id?f.accentColor:"#374151",marginBottom:2}}>{f.name}</div>
            <div style={{fontSize:9,color:"#9ca3af",lineHeight:1.3}}>{f.desc}</div>
          </div>
        ))}
      </div>
      <div style={{border:"1px solid #e8ecf0",borderRadius:8,overflow:"hidden",marginBottom:12}}>
        <div style={{background:"#f8fafc",borderBottom:"1px solid #e8ecf0",padding:"7px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:11,color:"#6b7280",fontWeight:500}}>Preview — {RESUME_FORMATS.find(f=>f.id===selected)?.name}</span>
          <button onClick={()=>onDownload(selected)} style={{background:"#0d9488",color:"#fff",border:"none",borderRadius:5,padding:"4px 13px",fontSize:11,fontWeight:600,cursor:"pointer"}}>⬇ Download</button>
        </div>
        <iframe srcDoc={generateResumeHTML(resume,selected)} style={{width:"100%",height:420,border:"none",background:"#fff"}} title="Resume Preview"/>
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {RESUME_FORMATS.map(f=>(
          <button key={f.id} onClick={()=>onDownload(f.id)}
            style={{background:selected===f.id?"#0d9488":"#fff",border:`1px solid ${selected===f.id?"#0d9488":"#e8ecf0"}`,color:selected===f.id?"#fff":"#374151",borderRadius:5,padding:"5px 11px",fontSize:11,fontWeight:500,cursor:"pointer"}}>
            {f.icon} {f.name}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── LOGIN MODAL ──────────────────────────────────────────────────────────────
function LoginModal({onClose}) {
  const [mode,setMode]=useState("login");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [name,setName]=useState("");
  const inp={width:"100%",boxSizing:"border-box",background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"11px 14px",color:"#111827",fontSize:13,fontFamily:"inherit",outline:"none",marginBottom:12};
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:"#fff",borderRadius:16,padding:32,width:400,boxShadow:"0 20px 60px rgba(0,0,0,0.15)"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <div>
            <div style={{fontSize:18,fontWeight:800,color:"#111827"}}>{mode==="login"?"Welcome back":"Create account"}</div>
            <div style={{fontSize:12,color:"#6b7280",marginTop:2}}>{mode==="login"?"Sign in to CareerOS":"Start your free CareerOS account"}</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,color:"#9ca3af",cursor:"pointer"}}>✕</button>
        </div>

        {mode==="signup"&&<input style={inp} placeholder="Full name" value={name} onChange={e=>setName(e.target.value)}/>}
        <input style={inp} placeholder="Email address" type="email" value={email} onChange={e=>setEmail(e.target.value)}/>
        <input style={inp} placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)}/>

        <button onClick={()=>alert("Auth coming soon! For now explore CareerOS freely.")}
          style={{width:"100%",padding:"12px",background:"linear-gradient(135deg,#0d9488,#0891b2)",color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:700,cursor:"pointer",marginBottom:16}}>
          {mode==="login"?"Sign In →":"Create Free Account →"}
        </button>

        <div style={{textAlign:"center",marginBottom:16}}>
          <div style={{fontSize:12,color:"#9ca3af",marginBottom:12}}>or continue with</div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>alert("Google auth coming soon!")} style={{flex:1,padding:"9px",background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              <span style={{fontSize:16}}>G</span> Google
            </button>
            <button onClick={()=>alert("LinkedIn auth coming soon!")} style={{flex:1,padding:"9px",background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              <span style={{fontSize:14,color:"#0077b5"}}>in</span> LinkedIn
            </button>
          </div>
        </div>

        <div style={{textAlign:"center",fontSize:12,color:"#6b7280"}}>
          {mode==="login"?(
            <span>Don't have an account? <button onClick={()=>setMode("signup")} style={{background:"none",border:"none",color:"#0d9488",fontWeight:600,cursor:"pointer"}}>Sign up free</button></span>
          ):(
            <span>Already have an account? <button onClick={()=>setMode("login")} style={{background:"none",border:"none",color:"#0d9488",fontWeight:600,cursor:"pointer"}}>Sign in</button></span>
          )}
        </div>
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
  const [showLogin,setShowLogin]=useState(false);
  const [loggedIn,setLoggedIn]=useState(false);
  const ref=useRef(null);

  function startPhase() {
    setPhase(0);
    const iv=setInterval(()=>setPhase(p=>{if(p>=LOADING_PHASES.length-1){clearInterval(iv);return p;}return p+1;}),3500);
    return iv;
  }

  async function generate() {
    if(!jd?.trim()||!cv?.trim()) return;
    setLoading(true); setResult(null);
    const iv=startPhase();
    try {
      // Shorter, faster prompt
      const r=await callClaude(`Analyse JD and CV. Return ONLY JSON:
{"jdAnalysis":{"role":"title","company":"name","mustHave":["r1","r2","r3","r4","r5"],"niceToHave":["n1","n2","n3"],"keywords":["k1","k2","k3","k4","k5","k6","k7","k8"],"hiringIntent":"1 sentence"},"matchScore":75,"hiringManagerScore":70,"salaryIntelligence":{"marketMin":"£X","marketMax":"£Y","recommendedAsk":"£Z","insight":"1 sentence"},"gapAnalysis":{"strengths":["s1","s2","s3","s4"],"gaps":["g1","g2","g3"],"transferable":["t1","t2","t3"]},"resume":{"name":"NAME","contact":"email • phone • location","summary":"2-3 sentences. Unique hook. Quantified. No clichés.","skills":["sk1","sk2","sk3","sk4","sk5","sk6","sk7","sk8"],"experience":[{"title":"Title","company":"Co","period":"dates","bullets":["verb+initiative+metric","verb+initiative+metric","verb+initiative+metric"]}],"education":"Degree | certs"},"hiringManagerInsights":{"firstImpression":"10s read","humanAppeal":"compelling factor","redFlags":["r1"],"standoutFactors":["s1","s2"]},"improvements":["t1","t2","t3"]}
Rules: every bullet verb+metric. Return ONLY JSON.
JD: ${jd.slice(0,2000)}
CV: ${cv.slice(0,2000)}`, 2500);
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
      const r=await callClaude(`Write cover letter. Return ONLY JSON:
{"subject":"Application for [Role] — [Name]","letter":"3 paragraphs. Para 1: Specific hook about company (NOT 'I am writing'). Para 2: Best achievement with metric. Para 3: Why this role + confident close. British English. 200 words max."}
JD: ${jd.slice(0,1500)} CV: ${cv.slice(0,1500)}`, 1000);
      setCoverResult(r);
    } catch { setCoverResult({error:"Failed. Retry."}); }
    finally { setCoverLoading(false); }
  }

  async function genInterview() {
    if(!jd||!cv) return;
    setIntLoading(true); setIntResult(null);
    try {
      const r=await callClaude(`Generate interview prep. Return ONLY JSON:
{"keyThemes":["t1","t2","t3"],"likelyQuestions":[{"question":"Q","tip":"tip"},{"question":"Q","tip":"tip"},{"question":"Q","tip":"tip"},{"question":"Q","tip":"tip"}],"starStories":[{"theme":"Leadership","situation":"brief","task":"brief","action":"brief","result":"metric"}],"questionsToAsk":["q1","q2","q3"],"redFlags":["concern + how to address"]}
JD: ${jd.slice(0,1500)} CV: ${cv.slice(0,1500)}`, 1500);
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
  const btn=(x={})=>({background:"#0d9488",color:"#fff",border:"none",borderRadius:8,padding:"10px 20px",fontSize:13,fontWeight:600,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6,...x});
  const ghost=(x={})=>({background:"#fff",border:"1.5px solid #e2e8f0",color:"#374151",borderRadius:8,padding:"9px 16px",fontSize:13,cursor:"pointer",...x});

  return (
    <div style={{minHeight:"100vh",background:"#f0f4f8",color:"#111827",fontFamily:"'Inter','Segoe UI',system-ui,sans-serif"}}>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes prog{0%,100%{opacity:0.85}50%{opacity:1}}
        input:focus,textarea:focus{border-color:#0d9488 !important;box-shadow:0 0 0 3px rgba(13,148,136,0.1) !important;outline:none}
        .jcard:hover{border-color:#99f6e4 !important;box-shadow:0 2px 12px rgba(13,148,136,0.08) !important}
        button:active{transform:scale(0.98)}
        .tab-btn:hover{color:#111827 !important}
        .fmt-card:hover{border-color:#0d9488 !important}
      `}</style>

      {showLogin&&<LoginModal onClose={()=>setShowLogin(false)}/>}

      {/* ── HEADER ── */}
      <div style={{background:"#fff",borderBottom:"1px solid #e8ecf0",position:"sticky",top:0,zIndex:100,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
        <div style={{maxWidth:1200,margin:"0 auto",padding:"0 32px",display:"flex",alignItems:"center",justifyContent:"space-between",height:64}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#0d9488,#0891b2)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:17,color:"#fff"}}>C</div>
            <div>
              <div style={{fontSize:17,fontWeight:800,color:"#111827",letterSpacing:-0.5}}>CareerOS</div>
              <div style={{fontSize:9,color:"#9ca3af",letterSpacing:1.8,textTransform:"uppercase"}}>AI Career Platform</div>
            </div>
          </div>

          <nav style={{display:"flex",gap:0}}>
            {TABS.map(t=>(
              <button key={t.id} className="tab-btn" onClick={()=>setTab(t.id)} style={{
                background:"transparent", border:"none",
                borderBottom:`2px solid ${tab===t.id?"#0d9488":"transparent"}`,
                color:tab===t.id?"#0d9488":"#6b7280",
                padding:"0 16px", height:64, fontSize:13, cursor:"pointer",
                fontWeight:tab===t.id?600:400, transition:"all 0.15s",
              }}>{t.label}</button>
            ))}
          </nav>

          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            {loggedIn?(
              <button onClick={()=>setLoggedIn(false)} style={ghost({fontSize:12,padding:"7px 14px",color:"#6b7280"})}>Sign out</button>
            ):(
              <button onClick={()=>setShowLogin(true)} style={ghost({fontSize:12,padding:"7px 14px"})}>Sign in</button>
            )}
            <button onClick={()=>setTab("pricing")} style={btn({padding:"8px 18px",fontSize:12,borderRadius:8})}>Upgrade Pro →</button>
          </div>
        </div>
      </div>

      <div style={{maxWidth:1200,margin:"0 auto",padding:"32px 32px 80px"}}>

        {/* ════ RESUME BUILDER ════ */}
        {tab==="builder"&&(
          <div style={{animation:"fadeIn 0.3s ease"}}>
            {/* Hero */}
            <div style={{textAlign:"center",padding:"48px 20px 36px",background:"#fff",borderRadius:16,marginBottom:24,border:"1px solid #e8ecf0",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
              <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 14px",borderRadius:20,background:"#f0fdfa",border:"1px solid #99f6e4",color:"#0d9488",fontSize:11,fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:18}}>
                AI Resume Builder · ATS & Hiring Manager Scoring · Salary Intelligence
              </div>
              <h1 style={{fontSize:52,fontWeight:900,color:"#0f172a",lineHeight:1.1,marginBottom:12,letterSpacing:-2}}>
                Land more interviews.<br/>
                <span style={{color:"#0d9488"}}>Faster.</span>
              </h1>
              <p style={{color:"#6b7280",fontSize:16,maxWidth:520,margin:"0 auto 28px"}}>
                Paste a job description, paste your CV — get a tailored resume, ATS score, salary intelligence, and interview coaching in under 60 seconds.
              </p>
              <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
                {[
                  {i:"🎯",l:"Dual ATS + Human Score"},
                  {i:"💰",l:"Salary Intelligence"},
                  {i:"🛂",l:"Visa Sponsorship Filter"},
                  {i:"📄",l:"5 Resume Formats"},
                  {i:"✉",l:"Cover Letter AI"},
                  {i:"◆",l:"Interview Coach"},
                ].map(f=>(
                  <div key={f.l} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 14px",borderRadius:20,background:"#f8fafc",border:"1px solid #e8ecf0",fontSize:12,color:"#6b7280",fontWeight:500}}>
                    {f.i} {f.l}
                  </div>
                ))}
              </div>
            </div>

            {/* Format picker ABOVE inputs (like screenshot) */}
            <div style={{background:"#fff",border:"1px solid #e8ecf0",borderRadius:14,padding:24,marginBottom:20,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
              <div style={{fontSize:11,fontWeight:700,color:"#0d9488",letterSpacing:2,textTransform:"uppercase",marginBottom:16}}>Choose Your Resume Format</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10}}>
                {RESUME_FORMATS.map(f=>(
                  <div key={f.id} className="fmt-card" onClick={()=>setFmt(f.id)}
                    style={{border:`2px solid ${fmt===f.id?f.accentColor:"#e8ecf0"}`,borderRadius:10,padding:14,cursor:"pointer",background:fmt===f.id?f.accentColor+"06":"#fafbfc",transition:"all 0.15s"}}>
                    <div style={{fontSize:28,marginBottom:8}}>{f.icon}</div>
                    <div style={{fontSize:13,fontWeight:700,color:fmt===f.id?f.accentColor:"#111827",marginBottom:3}}>{f.name}</div>
                    <div style={{fontSize:11,color:"#6b7280",lineHeight:1.4,marginBottom:3}}>{f.desc}</div>
                    <div style={{fontSize:10,color:"#9ca3af",fontStyle:"italic",lineHeight:1.3}}>{f.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inputs */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:14}}>
              <div>
                <label style={{display:"block",fontSize:11,fontWeight:700,color:"#374151",marginBottom:6,letterSpacing:0.5,textTransform:"uppercase"}}>Job Description</label>
                <textarea style={{...inp,height:220,resize:"vertical"}} placeholder="Paste any job description here..." value={jd} onChange={e=>setJd(e.target.value)}/>
              </div>
              <div>
                <label style={{display:"block",fontSize:11,fontWeight:700,color:"#374151",marginBottom:6,letterSpacing:0.5,textTransform:"uppercase"}}>Your CV / Background</label>
                <textarea style={{...inp,height:220,resize:"vertical"}} placeholder="Paste your CV or describe your experience..." value={cv} onChange={e=>setCv(e.target.value)}/>
                {!cv&&<button onClick={()=>setCv(SAMPLE_CV)} style={{...ghost(),marginTop:8,fontSize:11,padding:"5px 12px"}}>Use sample CV →</button>}
              </div>
            </div>

            {/* Progress */}
            {loading&&(
              <div style={{background:"#f0fdfa",border:"1px solid #99f6e4",borderRadius:10,padding:"14px 18px",marginBottom:14,animation:"prog 2s infinite"}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:16,height:16,border:"2px solid #99f6e4",borderTopColor:"#0d9488",borderRadius:"50%",animation:"spin 0.8s linear infinite",flexShrink:0}}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,color:"#0d9488",marginBottom:6}}>{LOADING_PHASES[phase]?.icon} {LOADING_PHASES[phase]?.text}</div>
                    <div style={{height:4,background:"#ccfbf1",borderRadius:2}}>
                      <div style={{height:4,background:"linear-gradient(90deg,#0d9488,#0891b2)",borderRadius:2,width:`${((phase+1)/LOADING_PHASES.length)*100}%`,transition:"width 0.5s ease"}}/>
                    </div>
                  </div>
                  <div style={{fontSize:11,color:"#5eead4",fontWeight:600}}>{Math.round(((phase+1)/LOADING_PHASES.length)*100)}%</div>
                </div>
              </div>
            )}

            <div style={{display:"flex",gap:10,marginBottom:28,flexWrap:"wrap"}}>
              <button onClick={generate} disabled={loading||!jd||!cv} style={{...btn({background:"linear-gradient(135deg,#0d9488,#0891b2)"}),opacity:loading||!jd||!cv?0.5:1,padding:"12px 28px",fontSize:14}}>
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

                <Card>
                  <SLabel>JD Analysis — {result.jdAnalysis?.role} at {result.jdAnalysis?.company}</SLabel>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
                    <div><div style={{fontSize:10,color:"#9ca3af",fontWeight:600,marginBottom:6,letterSpacing:1}}>MUST-HAVE</div>{result.jdAnalysis?.mustHave?.map(s=><Chip key={s} text={s} color="#16a34a" bg="#f0fdf4"/>)}</div>
                    <div><div style={{fontSize:10,color:"#9ca3af",fontWeight:600,marginBottom:6,letterSpacing:1}}>NICE TO HAVE</div>{result.jdAnalysis?.niceToHave?.map(s=><Chip key={s} text={s} color="#d97706" bg="#fffbeb"/>)}</div>
                    <div><div style={{fontSize:10,color:"#9ca3af",fontWeight:600,marginBottom:6,letterSpacing:1}}>ATS KEYWORDS</div>{result.jdAnalysis?.keywords?.map(k=><Chip key={k} text={k} color="#7c3aed" bg="#f5f3ff"/>)}</div>
                  </div>
                  {result.jdAnalysis?.hiringIntent&&<div style={{marginTop:12,padding:11,background:"#f0fdfa",borderRadius:7,borderLeft:"3px solid #0d9488"}}><div style={{fontSize:10,fontWeight:700,color:"#0d9488",marginBottom:3}}>HIRING INTENT</div><div style={{fontSize:12,color:"#374151",lineHeight:1.6}}>{result.jdAnalysis.hiringIntent}</div></div>}
                </Card>

                {result.hiringManagerInsights&&(
                  <Card>
                    <SLabel color="#7c3aed">🧠 Hiring Manager Psychology</SLabel>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
                      <div style={{padding:11,background:"#f5f3ff",borderRadius:7}}><div style={{fontSize:10,fontWeight:700,color:"#7c3aed",marginBottom:5}}>FIRST IMPRESSION</div><div style={{fontSize:12,color:"#374151",lineHeight:1.6}}>{result.hiringManagerInsights.firstImpression}</div></div>
                      <div style={{padding:11,background:"#f0fdf4",borderRadius:7}}><div style={{fontSize:10,fontWeight:700,color:"#16a34a",marginBottom:5}}>HUMAN APPEAL</div><div style={{fontSize:12,color:"#374151",lineHeight:1.6}}>{result.hiringManagerInsights.humanAppeal}</div></div>
                      <div><div style={{fontSize:10,fontWeight:700,color:"#dc2626",marginBottom:5}}>RED FLAGS</div>{result.hiringManagerInsights.redFlags?.map((r,i)=><div key={i} style={{fontSize:12,color:"#6b7280",padding:"3px 0"}}>⚠ {r}</div>)}</div>
                      <div><div style={{fontSize:10,fontWeight:700,color:"#d97706",marginBottom:5}}>STANDOUT FACTORS</div>{result.hiringManagerInsights.standoutFactors?.map((s,i)=><div key={i} style={{fontSize:12,color:"#6b7280",padding:"3px 0"}}>⭐ {s}</div>)}</div>
                    </div>
                  </Card>
                )}

                <Card>
                  <SLabel>Gap Analysis</SLabel>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
                    {[["✓ Strengths","strengths","#16a34a"],["✗ Gaps","gaps","#dc2626"],["⇄ Transferable","transferable","#d97706"]].map(([label,key,color])=>(
                      <div key={key}><div style={{fontSize:11,fontWeight:700,color,marginBottom:8}}>{label}</div>{result.gapAnalysis?.[key]?.map((s,i)=><div key={i} style={{fontSize:12,color:"#6b7280",padding:"3px 0",borderBottom:"1px solid #f9fafb"}}>• {s}</div>)}</div>
                    ))}
                  </div>
                </Card>

                <Card>
                  <SLabel>✦ Your Tailored Resume — Preview & Download</SLabel>
                  <FormatPicker resume={result.resume} selected={fmt} onSelect={setFmt} onDownload={f=>downloadResume(result.resume,f)}/>
                </Card>

                <Card>
                  <SLabel>💡 Strategic Improvements</SLabel>
                  {result.improvements?.map((tip,i)=>(
                    <div key={i} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:i<result.improvements.length-1?"1px solid #f9fafb":"none"}}>
                      <div style={{width:22,height:22,borderRadius:"50%",background:"#f0fdfa",border:"1px solid #99f6e4",color:"#0d9488",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{i+1}</div>
                      <div style={{fontSize:12,color:"#6b7280",lineHeight:1.7}}>{tip}</div>
                    </div>
                  ))}
                </Card>
              </div>
            )}
            {result?.error&&<div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,padding:14,color:"#dc2626",fontSize:13}}>⚠ {result.error}</div>}

            {/* Testimonials */}
            <div style={{marginTop:48}}>
              <div style={{textAlign:"center",marginBottom:28}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:8}}>
                  <div style={{display:"flex",gap:2}}>{"★★★★★".split("").map((s,i)=><span key={i} style={{color:"#f59e0b",fontSize:18}}>{s}</span>)}</div>
                  <div style={{fontSize:14,fontWeight:700,color:"#111827"}}>4.9/5 on Trustpilot</div>
                </div>
                <div style={{fontSize:13,color:"#6b7280"}}>Trusted by 12,000+ job seekers across UK, US and India</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
                {TESTIMONIALS.map((t,i)=>(
                  <div key={i} style={{background:"#fff",border:"1px solid #e8ecf0",borderRadius:12,padding:20,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                    <div style={{display:"flex",gap:3,marginBottom:10}}>{"★★★★★".split("").map((s,j)=><span key={j} style={{color:"#f59e0b",fontSize:14}}>{s}</span>)}</div>
                    <div style={{fontSize:13,color:"#374151",lineHeight:1.7,marginBottom:14,fontStyle:"italic"}}>"{t.text}"</div>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#0d9488,#0891b2)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14,color:"#fff",flexShrink:0}}>{t.avatar}</div>
                      <div>
                        <div style={{fontSize:12,fontWeight:700,color:"#111827"}}>{t.name}</div>
                        <div style={{fontSize:11,color:"#9ca3af"}}>{t.role}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
                <button key={c.code} onClick={()=>setCountry(c.code)} style={{padding:"8px 18px",borderRadius:20,background:country===c.code?"#0d9488":"#fff",border:`1.5px solid ${country===c.code?"#0d9488":"#e2e8f0"}`,color:country===c.code?"#fff":"#374151",fontSize:13,fontWeight:500,cursor:"pointer"}}>{c.label}</button>
              ))}
            </div>
            <div style={{display:"flex",gap:10,marginBottom:20}}>
              <input style={{...inp,flex:1}} placeholder={`Search jobs...`} value={jobQ} onChange={e=>setJobQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&searchJobs()}/>
              <button onClick={searchJobs} disabled={jobLoading} style={btn({flexShrink:0})}>{jobLoading?"Searching...":"Search Jobs"}</button>
            </div>
            {jobLoading&&<div style={{textAlign:"center",padding:48}}><div style={{width:28,height:28,border:"3px solid #ccfbf1",borderTopColor:"#0d9488",borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 12px"}}/><div style={{color:"#6b7280",fontSize:13}}>Searching real jobs...</div></div>}
            {!jobLoading&&jobs.length===0&&<div style={{textAlign:"center",padding:60,color:"#9ca3af"}}><div style={{fontSize:44,marginBottom:14}}>🔍</div><div style={{fontSize:16,fontWeight:600,color:"#374151",marginBottom:6}}>Search for jobs above</div><div style={{fontSize:13}}>Try "product manager", "software engineer", "data analyst"</div></div>}
            {jobs.map(job=>(
              <div key={job.id} className="jcard" style={{background:"#fff",border:"1.5px solid #e8ecf0",borderRadius:12,padding:18,marginBottom:10,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5,flexWrap:"wrap"}}>
                      <span style={{fontSize:15,fontWeight:700,color:"#111827"}}>{job.title}</span>
                      <PBadge platform={job.platform}/>
                      {job.visaSponsorship&&<span style={{fontSize:10,fontWeight:700,color:"#16a34a",background:"#f0fdf4",border:"1px solid #bbf7d0",padding:"2px 8px",borderRadius:10}}>🛂 Visa Sponsorship</span>}
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
                      <button onClick={e=>applyJob(job,e)} disabled={applying===job.id} style={btn({fontSize:12,padding:"8px 16px",background:applied===job.id?"#16a34a":"#0d9488"})}>
                        {applying===job.id?"Opening...":applied===job.id?"✓ Applied!":"Apply Now →"}
                      </button>
                      <button onClick={e=>{e.stopPropagation();setJd((job.description||job.title)+"\n\nRole: "+job.title+"\nCompany: "+job.company);setTab("builder");}} style={ghost({fontSize:12,color:"#0d9488",borderColor:"#99f6e4"})}>✦ Tailor Resume</button>
                      <button onClick={e=>saveJob(job,e)} style={ghost({fontSize:12,color:apps.find(a=>a.title===job.title&&a.company===job.company)?"#16a34a":"#6b7280"})}>
                        {apps.find(a=>a.title===job.title&&a.company===job.company)?"✓ Saved":"☆ Save"}
                      </button>
                      {result?.resume&&<button onClick={e=>{e.stopPropagation();setJobFmt(jobFmt===job.id?null:job.id);setJobFmtSel("classic");}} style={ghost({fontSize:12,color:"#7c3aed",borderColor:"#ddd6fe"})}>{jobFmt===job.id?"✕ Close":"📄 Download Resume"}</button>}
                    </div>
                    {jobFmt===job.id&&result?.resume&&<div style={{marginTop:14,padding:16,background:"#f8fafc",borderRadius:8,border:"1px solid #e8ecf0"}}><FormatPicker resume={result.resume} selected={jobFmtSel} onSelect={setJobFmtSel} onDownload={f=>downloadResume(result.resume,f)}/></div>}
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
            <div style={{marginBottom:20}}><h2 style={{fontSize:26,fontWeight:800,color:"#111827",marginBottom:4,letterSpacing:-0.5}}>Application Tracker</h2><p style={{color:"#6b7280",fontSize:14}}>Track every application from saved to offer.</p></div>
            {apps.length===0?(<div style={{textAlign:"center",padding:60,color:"#9ca3af"}}><div style={{fontSize:44,marginBottom:14}}>📋</div><div style={{fontSize:16,fontWeight:600,color:"#374151",marginBottom:6}}>No applications yet</div><div style={{fontSize:13}}>Go to Job Search and apply or save jobs</div></div>):(<>
              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:20}}>
                {[{label:"Applied",value:apps.filter(a=>a.status!=="Saved").length,color:"#0d9488"},{label:"Saved",value:apps.filter(a=>a.status==="Saved").length,color:"#6b7280"},{label:"Interview",value:apps.filter(a=>a.status==="Interview").length,color:"#d97706"},{label:"Offers",value:apps.filter(a=>a.status==="Offer").length,color:"#16a34a"},{label:"Avg Match",value:apps.length?Math.round(apps.reduce((s,a)=>s+(a.match||0),0)/apps.length)+"%":"—",color:"#7c3aed"}].map(s=>(
                  <div key={s.label} style={{background:"#fff",border:"1px solid #e8ecf0",borderRadius:10,padding:"14px 16px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}><div style={{fontSize:10,color:"#9ca3af",fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:6}}>{s.label}</div><div style={{fontSize:26,fontWeight:800,color:s.color}}>{s.value}</div></div>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12}}>
                {["Saved","Applied","Interview","Offer","Rejected"].map(status=>(
                  <div key={status}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}><SBadge status={status}/><span style={{fontSize:11,color:"#9ca3af"}}>{apps.filter(a=>a.status===status).length}</span></div>
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
            <p style={{color:"#6b7280",fontSize:14,marginBottom:18}}>Personalised cover letters in seconds.</p>
            {(!jd||!cv)&&<div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:8,padding:12,marginBottom:14,color:"#92400e",fontSize:13}}>⚡ Add your JD and CV in Resume Builder first.</div>}
            <button onClick={genCover} disabled={coverLoading||!jd||!cv} style={{...btn(),opacity:coverLoading||!jd||!cv?0.5:1,marginBottom:18}}>
              {coverLoading?"Writing...":"✉ Generate Cover Letter"}
            </button>
            {coverResult&&!coverResult.error&&(
              <Card>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <div style={{fontSize:12,color:"#6b7280"}}>Subject: <strong>{coverResult.subject}</strong></div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>navigator.clipboard.writeText(coverResult.letter)} style={ghost({fontSize:11,padding:"5px 12px"})}>Copy</button>
                    <button onClick={()=>{const b=new Blob([coverResult.letter],{type:"text/plain"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download="cover_letter.txt";a.click();}} style={ghost({fontSize:11,padding:"5px 12px",color:"#0d9488",borderColor:"#99f6e4"})}>⬇ Download</button>
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
            <button onClick={genInterview} disabled={intLoading||!jd||!cv} style={{...btn(),opacity:intLoading||!jd||!cv?0.5:1,marginBottom:18}}>
              {intLoading?"Preparing...":"◆ Generate Interview Prep"}
            </button>
            {intResult&&!intResult.error&&(<>
              <Card><SLabel>Key Themes</SLabel>{intResult.keyThemes?.map(t=><Chip key={t} text={t} color="#0d9488" bg="#f0fdfa"/>)}</Card>
              <Card>
                <SLabel>Likely Questions</SLabel>
                {intResult.likelyQuestions?.map((q,i)=>(
                  <div key={i} style={{marginBottom:14,paddingBottom:14,borderBottom:i<intResult.likelyQuestions.length-1?"1px solid #f9fafb":"none"}}>
                    <div style={{fontSize:13,fontWeight:600,color:"#111827",marginBottom:5}}>Q: {q.question}</div>
                    <div style={{fontSize:12,color:"#6b7280",paddingLeft:12,borderLeft:"2px solid #99f6e4",lineHeight:1.6}}>💡 {q.tip}</div>
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
            <div style={{textAlign:"center",marginBottom:36}}>
              <h2 style={{fontSize:36,fontWeight:900,color:"#0f172a",marginBottom:10,letterSpacing:-1}}>Simple, transparent pricing</h2>
              <p style={{color:"#6b7280",fontSize:15,maxWidth:400,margin:"0 auto"}}>Start free. Upgrade when you're ready to accelerate your job search.</p>
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:14}}>
                <div style={{display:"flex",gap:2}}>{"★★★★★".split("").map((s,i)=><span key={i} style={{color:"#f59e0b",fontSize:16}}>{s}</span>)}</div>
                <span style={{fontSize:13,color:"#6b7280"}}>4.9/5 · 12,000+ users · Trustpilot</span>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:20,marginBottom:48}}>
              {TIERS.map(t=>(
                <div key={t.name} style={{background:"#fff",border:`2px solid ${t.highlight?"#0d9488":"#e8ecf0"}`,borderRadius:16,padding:30,position:"relative",boxShadow:t.highlight?"0 8px 32px rgba(13,148,136,0.15)":"0 1px 4px rgba(0,0,0,0.04)"}}>
                  {t.badge&&<div style={{position:"absolute",top:-13,left:"50%",transform:"translateX(-50%)",background:"linear-gradient(135deg,#0d9488,#0891b2)",color:"#fff",fontSize:10,fontWeight:700,padding:"4px 16px",borderRadius:20,letterSpacing:1,textTransform:"uppercase",whiteSpace:"nowrap"}}>{t.badge}</div>}
                  <div style={{fontSize:13,fontWeight:700,color:t.color,marginBottom:8,textTransform:"uppercase",letterSpacing:0.5}}>{t.name}</div>
                  <div style={{marginBottom:6}}>
                    <span style={{fontSize:40,fontWeight:900,color:"#0f172a",letterSpacing:-1}}>{t.price}</span>
                    <span style={{fontSize:13,color:"#6b7280"}}>{t.period}</span>
                  </div>
                  <div style={{fontSize:12,color:"#9ca3af",marginBottom:22}}>Cancel anytime · No contracts</div>
                  <div style={{marginBottom:26}}>
                    {t.features.map(f=><div key={f} style={{display:"flex",gap:9,padding:"7px 0",borderBottom:"1px solid #f9fafb",fontSize:12,color:"#374151"}}><span style={{color:t.color,flexShrink:0}}>✓</span>{f}</div>)}
                  </div>
                  <button onClick={()=>{if(t.gumroad)window.open(t.gumroad,"_blank");else{setShowLogin(true);}}}
                    style={{width:"100%",padding:13,background:t.highlight?"linear-gradient(135deg,#0d9488,#0891b2)":"#fff",border:t.highlight?"none":`2px solid ${t.color}`,color:t.highlight?"#fff":t.color,borderRadius:9,fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:t.highlight?"0 4px 12px rgba(13,148,136,0.3)":"none"}}>
                    {t.cta}
                  </button>
                </div>
              ))}
            </div>

            {/* Testimonials on pricing page */}
            <div style={{background:"#fff",border:"1px solid #e8ecf0",borderRadius:14,padding:32,marginBottom:24}}>
              <div style={{fontSize:11,fontWeight:700,color:"#0d9488",letterSpacing:2,textTransform:"uppercase",marginBottom:20,textAlign:"center"}}>What our users say</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
                {TESTIMONIALS.slice(0,3).map((t,i)=>(
                  <div key={i} style={{padding:16,background:"#f8fafc",borderRadius:10,border:"1px solid #e8ecf0"}}>
                    <div style={{display:"flex",gap:2,marginBottom:8}}>{"★★★★★".split("").map((s,j)=><span key={j} style={{color:"#f59e0b",fontSize:13}}>{s}</span>)}</div>
                    <div style={{fontSize:12,color:"#374151",lineHeight:1.7,marginBottom:12,fontStyle:"italic"}}>"{t.text}"</div>
                    <div style={{fontSize:11,fontWeight:700,color:"#111827"}}>{t.name}</div>
                    <div style={{fontSize:10,color:"#9ca3af"}}>{t.role}</div>
                  </div>
                ))}
              </div>
            </div>

            <Card>
              <SLabel>Why CareerOS</SLabel>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
                {[{i:"🎯",t:"Dual Scoring",d:"ATS score AND Hiring Manager psychology"},{i:"💰",t:"Salary Intelligence",d:"Know your market value before every interview"},{i:"📄",t:"6 Resume Formats",d:"Live preview before you download"},{i:"⚡",t:"Under 60 Seconds",d:"Faster than any competitor"},{i:"🔄",t:"Full Circle",d:"Job search → resume → interview prep → tracker"},{i:"🌍",t:"Global Jobs",d:"Real jobs from Adzuna, JSearch, Reed"}].map(item=>(
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

      <div style={{borderTop:"1px solid #e8ecf0",padding:"16px 32px",textAlign:"center",color:"#d1d5db",fontSize:11,background:"#fff"}}>
        <span style={{color:"#0d9488",fontWeight:700}}>CareerOS</span> · AI Career Platform · Resume · Jobs · Cover Letter · Interview Prep · Tracker
        <span style={{margin:"0 12px"}}>·</span>
        <span style={{color:"#f59e0b"}}>★★★★★</span> 4.9/5 on Trustpilot · 12,000+ users
      </div>
    </div>
  );
}
