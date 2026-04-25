import { useState, useRef } from "react";

// ─── DESIGN TOKENS (Resume.io inspired — clean light professional) ─────────────
const C = {
  bg: "#f7f8fc",
  white: "#ffffff",
  navy: "#1a2332",
  navyLight: "#2d3f55",
  teal: "#0ea5a0",
  tealLight: "#e6f7f7",
  tealDark: "#0b8a86",
  blue: "#3b6ef8",
  blueLight: "#eef2ff",
  gray50: "#f8f9fa",
  gray100: "#f1f3f7",
  gray200: "#e4e8f0",
  gray300: "#cbd2dd",
  gray400: "#9aa5b8",
  gray500: "#6b7a92",
  gray600: "#4a5568",
  gray700: "#2d3748",
  green: "#10b981",
  greenLight: "#ecfdf5",
  amber: "#f59e0b",
  amberLight: "#fffbeb",
  red: "#ef4444",
  redLight: "#fef2f2",
  purple: "#7c3aed",
  purpleLight: "#f5f3ff",
  shadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
  shadowMd: "0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
  shadowLg: "0 10px 30px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04)",
};

// ─── RESUME FORMATS ───────────────────────────────────────────────────────────
const RESUME_FORMATS = [
  {
    id: "classic",
    name: "Classic",
    desc: "Traditional chronological — trusted by recruiters everywhere",
    icon: "📄",
    accentColor: "#1a2332",
    preview: "Single column, serif headings, clean bullets",
  },
  {
    id: "modern",
    name: "Modern",
    desc: "Two-column layout with colour accents — stands out visually",
    icon: "✨",
    accentColor: "#0ea5a0",
    preview: "Two-column, teal accents, skill bars",
  },
  {
    id: "executive",
    name: "Executive",
    desc: "Senior-level formatting for Director, VP and C-suite roles",
    icon: "👔",
    accentColor: "#1e40af",
    preview: "Bold header, navy accents, achievement-focused",
  },
  {
    id: "minimal",
    name: "Minimal",
    desc: "Ultra-clean design — lets your experience do the talking",
    icon: "◻",
    accentColor: "#374151",
    preview: "Whitespace-first, thin lines, no clutter",
  },
  {
    id: "ats",
    name: "ATS-Safe",
    desc: "100% plain text — beats every automated screening system",
    icon: "🤖",
    accentColor: "#059669",
    preview: "Plain text, no tables, no columns, maximum parseability",
  },
];

const TABS = [
  { id: "builder", label: "Resume Builder", icon: "✦" },
  { id: "jobs", label: "Job Search", icon: "⊕" },
  { id: "tracker", label: "Applications", icon: "◎" },
  { id: "cover", label: "Cover Letter", icon: "✉" },
  { id: "interview", label: "Interview Prep", icon: "◆" },
  { id: "pricing", label: "Pricing", icon: "◇" },
];

const COUNTRIES = [
  { code: "uk", label: "🇬🇧 United Kingdom", currency: "£" },
  { code: "us", label: "🇺🇸 United States", currency: "$" },
  { code: "in", label: "🇮🇳 India", currency: "₹" },
];

const JOB_PLATFORMS = [
  { id: "linkedin", name: "LinkedIn", color: "#0077b5" },
  { id: "indeed", name: "Indeed", color: "#003A9B" },
  { id: "reed", name: "Reed", color: "#cc0000" },
  { id: "adzuna", name: "Adzuna", color: "#00bcd4" },
  { id: "jsearch", name: "JSearch", color: "#7c3aed" },
];

const TIERS = [
  { name: "Free", price: "£0", period: "", features: ["3 tailored resumes/month","Basic ATS scoring","5 job searches/day","1 cover letter/month","Classic resume format"], cta: "Get Started Free", highlight: false, gumroad: null },
  { name: "Pro", price: "£19", period: "/month", features: ["Unlimited resume tailoring","All 5 resume formats","ATS + Hiring Manager scores","Salary intelligence","Visa sponsorship filter","Unlimited job search","Unlimited cover letters","Interview prep coaching","PDF + HTML download"], cta: "Start Pro — £19/mo", highlight: true, gumroad: "https://gumroad.com/l/careeros-pro" },
  { name: "Enterprise", price: "£99", period: "/month", features: ["Everything in Pro","Team workspace (up to 10)","Bulk resume optimization","API access","Recruiter dashboard","White-label option","Dedicated account manager"], cta: "Contact Sales", highlight: false, gumroad: "https://gumroad.com/l/careeros-enterprise" },
];

const STATUS_COLORS = {
  Saved:     { bg: "#f1f5f9", text: "#64748b", border: "#e2e8f0", dot: "#94a3b8" },
  Applied:   { bg: "#eff6ff", text: "#3b82f6", border: "#bfdbfe", dot: "#3b82f6" },
  Interview: { bg: "#fffbeb", text: "#d97706", border: "#fde68a", dot: "#f59e0b" },
  Offer:     { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0", dot: "#22c55e" },
  Rejected:  { bg: "#fef2f2", text: "#dc2626", border: "#fecaca", dot: "#ef4444" },
};

const LOADING_PHASES = [
  { icon: "🔍", text: "Parsing job description..." },
  { icon: "👤", text: "Analysing your background..." },
  { icon: "🧠", text: "Running semantic matching..." },
  { icon: "📊", text: "Calculating ATS score..." },
  { icon: "🎯", text: "Scoring hiring manager appeal..." },
  { icon: "💰", text: "Running salary intelligence..." },
  { icon: "✍️", text: "Crafting tailored resume bullets..." },
  { icon: "✨", text: "Finalising your resume..." },
];

// ─── API ──────────────────────────────────────────────────────────────────────
async function callClaude(prompt, system) {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 8000,
      system: system || "You are an elite resume strategist. Return only valid JSON, no markdown, no backticks.",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  const text = data.content?.map(b => b.text || "").join("") || "{}";
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

// ─── RESUME HTML GENERATORS (5 formats) ──────────────────────────────────────
function generateResumeHTML(resume, atsScore, hmScore, format = "classic") {
  const name = resume.name || "";
  const contact = resume.contact || "";
  const summary = resume.summary || "";
  const skills = resume.skills || [];
  const experience = resume.experience || [];
  const education = resume.education || "";

  const expHTML = experience.map(exp => `
    <div class="job">
      <div class="job-header">
        <div><span class="job-title">${exp.title}</span> <span class="job-company">· ${exp.company}</span></div>
        <span class="job-period">${exp.period}</span>
      </div>
      ${(exp.bullets||[]).map(b => `<div class="bullet">${b}</div>`).join("")}
    </div>`).join("");

  const formats = {
    classic: `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${name}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Georgia,serif;color:#1a1a1a;background:#fff;max-width:780px;margin:32px auto;padding:40px;font-size:13px}
h1{font-size:26px;font-weight:700;color:#1a2332;letter-spacing:-0.3px;margin-bottom:3px}
.contact{font-size:12px;color:#6b7a92;margin-bottom:4px}
.scores{display:flex;gap:10px;margin:12px 0}
.badge{padding:3px 12px;border-radius:20px;font-size:11px;font-weight:600}
.ats{background:#ecfdf5;border:1px solid #6ee7b7;color:#065f46}
.hm{background:#fef9c3;border:1px solid #fde047;color:#713f12}
hr{border:none;border-top:2px solid #1a2332;margin:14px 0 10px}
.st{font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#1a2332;margin:16px 0 8px}
.summary{font-size:13px;line-height:1.75;color:#374151}
.skills{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:4px}
.skill{padding:3px 10px;background:#f1f5f9;border-radius:12px;font-size:11px;color:#374151;border:1px solid #e2e8f0}
.job{margin-bottom:16px}.job-header{display:flex;justify-content:space-between;margin-bottom:5px}
.job-title{font-size:13px;font-weight:700;color:#1a2332}.job-company{font-size:12px;color:#6b7a92}
.job-period{font-size:11px;color:#9aa5b8}
.bullet{font-size:12px;color:#374151;padding-left:14px;position:relative;line-height:1.65;margin-bottom:3px}
.bullet::before{content:"▸";position:absolute;left:0;color:#0ea5a0}
.education{font-size:12px;color:#374151;line-height:1.6}
.footer{margin-top:28px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:10px;color:#9aa5b8;text-align:center}
@media print{body{margin:0;padding:24px}}</style></head><body>
<h1>${name}</h1><div class="contact">${contact}</div>
<div class="scores"><span class="badge ats">ATS: ${atsScore}%</span>${hmScore?`<span class="badge hm">Human Appeal: ${hmScore}%</span>`:""}</div>
<hr><div class="st">Professional Summary</div><div class="summary">${summary}</div>
<div class="st">Core Skills</div><div class="skills">${skills.map(s=>`<span class="skill">${s}</span>`).join("")}</div>
<div class="st">Experience</div>${expHTML}
<div class="st">Education & Certifications</div><div class="education">${education}</div>
<div class="footer">Generated by CareerOS · careeros-rose.vercel.app</div></body></html>`,

    modern: `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${name}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;color:#1a1a1a;background:#fff;display:grid;grid-template-columns:240px 1fr;min-height:100vh;font-size:13px}
.sidebar{background:#0ea5a0;color:#fff;padding:32px 20px}
.main{padding:32px 28px;background:#fff}
h1{font-size:22px;font-weight:700;color:#fff;margin-bottom:4px}
.contact-item{font-size:11px;color:rgba(255,255,255,0.8);margin-bottom:3px}
.sidebar-st{font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,0.6);margin:20px 0 8px}
.skill{background:rgba(255,255,255,0.15);border-radius:4px;padding:3px 8px;font-size:11px;color:#fff;display:inline-block;margin:2px 2px 2px 0}
.ats-box{background:rgba(255,255,255,0.15);border-radius:8px;padding:10px;margin-top:16px;text-align:center}
.ats-num{font-size:28px;font-weight:800;color:#fff}.ats-label{font-size:10px;color:rgba(255,255,255,0.7)}
.st{font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#0ea5a0;margin:20px 0 8px;border-bottom:2px solid #e6f7f7;padding-bottom:4px}
.summary{font-size:13px;line-height:1.75;color:#374151}
.job{margin-bottom:16px}.job-header{display:flex;justify-content:space-between;margin-bottom:5px}
.job-title{font-weight:700;color:#1a2332}.job-company{color:#6b7a92;font-size:12px}
.job-period{font-size:11px;color:#9aa5b8;background:#f1f5f9;padding:2px 8px;border-radius:10px}
.bullet{font-size:12px;color:#374151;padding-left:14px;position:relative;line-height:1.65;margin-bottom:3px}
.bullet::before{content:"▸";position:absolute;left:0;color:#0ea5a0}
.education{font-size:12px;color:#374151}
@media print{body{display:block}.sidebar{padding:20px}.main{padding:20px}}</style></head>
<body>
<div class="sidebar">
  <h1>${name}</h1>
  ${contact.split("•").map(c=>`<div class="contact-item">${c.trim()}</div>`).join("")}
  <div class="ats-box"><div class="ats-num">${atsScore}%</div><div class="ats-label">ATS Match</div></div>
  ${hmScore?`<div class="ats-box" style="margin-top:8px"><div class="ats-num">${hmScore}%</div><div class="ats-label">Human Appeal</div></div>`:""}
  <div class="sidebar-st">Core Skills</div>
  ${skills.map(s=>`<span class="skill">${s}</span>`).join("")}
</div>
<div class="main">
  <div class="st">Profile</div><div class="summary">${summary}</div>
  <div class="st">Experience</div>${expHTML}
  <div class="st">Education & Certifications</div><div class="education">${education}</div>
</div></body></html>`,

    executive: `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${name}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Georgia',serif;color:#1e293b;background:#fff;max-width:780px;margin:32px auto;padding:44px;font-size:13px}
.header{border-bottom:3px solid #1e40af;padding-bottom:16px;margin-bottom:20px}
h1{font-size:30px;font-weight:700;color:#1e293b;letter-spacing:-0.5px;margin-bottom:4px}
.title-line{font-size:14px;color:#1e40af;font-weight:600;margin-bottom:6px}
.contact{font-size:12px;color:#64748b}
.scores{display:flex;gap:12px;margin-top:10px}
.badge{padding:4px 14px;border-radius:4px;font-size:11px;font-weight:700;letter-spacing:0.5px}
.ats{background:#1e40af;color:#fff}.hm{background:#0ea5a0;color:#fff}
.st{font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#1e40af;margin:18px 0 8px}
.summary{font-size:13px;line-height:1.8;color:#374151;border-left:3px solid #1e40af;padding-left:12px}
.skills{display:flex;flex-wrap:wrap;gap:8px}
.skill{padding:4px 12px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:3px;font-size:11px;color:#1e40af;font-weight:600}
.job{margin-bottom:18px;border-left:2px solid #e2e8f0;padding-left:14px}
.job-header{display:flex;justify-content:space-between;margin-bottom:6px}
.job-title{font-size:14px;font-weight:700;color:#1e293b}.job-company{font-size:12px;color:#1e40af;font-weight:600}
.job-period{font-size:11px;color:#94a3b8;font-style:italic}
.bullet{font-size:12px;color:#374151;padding-left:14px;position:relative;line-height:1.7;margin-bottom:4px}
.bullet::before{content:"■";position:absolute;left:0;color:#1e40af;font-size:7px;top:4px}
.education{font-size:12px;color:#374151;line-height:1.6}
.footer{margin-top:28px;font-size:10px;color:#94a3b8;text-align:center;border-top:1px solid #e2e8f0;padding-top:12px}
@media print{body{margin:0;padding:24px}}</style></head><body>
<div class="header">
  <h1>${name}</h1>
  <div class="contact">${contact}</div>
  <div class="scores"><span class="badge ats">ATS Score: ${atsScore}%</span>${hmScore?`<span class="badge hm">Human Appeal: ${hmScore}%</span>`:""}</div>
</div>
<div class="st">Executive Summary</div><div class="summary">${summary}</div>
<div class="st">Core Competencies</div><div class="skills">${skills.map(s=>`<span class="skill">${s}</span>`).join("")}</div>
<div class="st">Career History</div>${expHTML}
<div class="st">Education & Professional Development</div><div class="education">${education}</div>
<div class="footer">Generated by CareerOS · careeros-rose.vercel.app</div></body></html>`,

    minimal: `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${name}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Helvetica Neue',Helvetica,sans-serif;color:#111;background:#fff;max-width:720px;margin:48px auto;padding:0 40px;font-size:13px;line-height:1.6}
h1{font-size:24px;font-weight:300;letter-spacing:-0.5px;color:#111;margin-bottom:3px}
.contact{font-size:12px;color:#888;margin-bottom:16px}
.score-line{font-size:11px;color:#aaa;margin-bottom:24px}
.st{font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#888;margin:24px 0 10px;padding-bottom:6px;border-bottom:1px solid #eee}
.summary{font-size:13px;line-height:1.8;color:#333}
.skills{font-size:12px;color:#555;line-height:2}
.job{margin-bottom:18px}
.job-header{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px}
.job-title{font-size:13px;font-weight:600;color:#111}
.job-co{font-size:12px;color:#666}
.job-period{font-size:11px;color:#aaa}
.bullet{font-size:12px;color:#444;padding-left:12px;position:relative;line-height:1.7;margin-bottom:2px}
.bullet::before{content:"–";position:absolute;left:0;color:#bbb}
.education{font-size:12px;color:#555}
.footer{margin-top:36px;font-size:10px;color:#ccc;text-align:right}
@media print{body{margin:0;padding:20px}}</style></head><body>
<h1>${name}</h1><div class="contact">${contact}</div>
<div class="score-line">ATS Match ${atsScore}%${hmScore?` · Human Appeal ${hmScore}%`:""}</div>
<div class="st">Summary</div><div class="summary">${summary}</div>
<div class="st">Skills</div><div class="skills">${skills.join("  ·  ")}</div>
<div class="st">Experience</div>${expHTML}
<div class="st">Education</div><div class="education">${education}</div>
<div class="footer">CareerOS · careeros-rose.vercel.app</div></body></html>`,

    ats: `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${name}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Courier New',monospace;color:#000;background:#fff;max-width:700px;margin:32px auto;padding:40px;font-size:12px;line-height:1.6}
h1{font-size:18px;font-weight:700;margin-bottom:3px}
.contact{margin-bottom:8px}
.score-line{margin-bottom:16px;font-size:11px;color:#555}
.st{font-weight:700;font-size:12px;text-transform:uppercase;margin:16px 0 6px;border-bottom:1px solid #000;padding-bottom:2px}
.summary{margin-bottom:4px}
.skills{margin-bottom:4px}
.job{margin-bottom:14px}
.job-title{font-weight:700}
.job-meta{margin-bottom:4px}
.bullet{padding-left:16px;margin-bottom:2px}
.bullet::before{content:"- "}
.footer{margin-top:24px;font-size:10px;color:#888;border-top:1px solid #ccc;padding-top:8px}
@media print{body{margin:0;padding:16px}}</style></head><body>
<h1>${name}</h1>
<div class="contact">${contact}</div>
<div class="score-line">ATS Match: ${atsScore}% | Human Appeal: ${hmScore||"N/A"}%</div>
<div class="st">PROFESSIONAL SUMMARY</div><div class="summary">${summary}</div>
<div class="st">CORE SKILLS</div><div class="skills">${skills.join(" | ")}</div>
<div class="st">WORK EXPERIENCE</div>
${experience.map(exp=>`<div class="job"><div class="job-title">${exp.title}</div><div class="job-meta">${exp.company} | ${exp.period}</div>${(exp.bullets||[]).map(b=>`<div class="bullet">${b}</div>`).join("")}</div>`).join("")}
<div class="st">EDUCATION AND CERTIFICATIONS</div><div>${education}</div>
<div class="footer">Generated by CareerOS | careeros-rose.vercel.app</div></body></html>`,
  };

  return formats[format] || formats.classic;
}

function downloadResume(resume, atsScore, hmScore, format) {
  if (!resume) return;
  const html = generateResumeHTML(resume, atsScore, hmScore, format);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(resume.name||"Resume").replace(/\s+/g,"_")}_${format}_CareerOS.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 64, color = C.teal }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const s = Math.max(0, Math.min(100, score || 0));
  const dash = (s / 100) * circ;
  const c = color || (s >= 80 ? C.green : s >= 65 ? C.amber : s > 0 ? C.red : C.gray300);
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.gray100} strokeWidth={5}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={c} strokeWidth={5}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s ease" }}/>
      <text x={size/2} y={size/2+5} textAnchor="middle" fill={c}
        fontSize={size*0.22} fontWeight="700"
        style={{ transform:`rotate(90deg)`, transformOrigin:`${size/2}px ${size/2}px` }}>
        {s > 0 ? `${s}%` : "—"}
      </text>
    </svg>
  );
}

function Badge({ children, color = C.gray500, bg = C.gray100 }) {
  return (
    <span style={{ display:"inline-block", padding:"3px 10px", borderRadius:20, background:bg, color, fontSize:11, fontWeight:600, margin:"2px 3px 2px 0" }}>
      {children}
    </span>
  );
}

function PlatformTag({ platform }) {
  const p = JOB_PLATFORMS.find(x => x.id === platform) || { name: platform||"Job Board", color: C.gray500 };
  return (
    <span style={{ display:"inline-flex", alignItems:"center", padding:"2px 9px", borderRadius:12, background:`${p.color}12`, border:`1px solid ${p.color}30`, color:p.color, fontSize:11, fontWeight:700 }}>
      {p.name}
    </span>
  );
}

function Card({ children, style = {}, noPad = false }) {
  return (
    <div style={{ background:C.white, borderRadius:12, boxShadow:C.shadow, border:`1px solid ${C.gray200}`, padding:noPad?0:24, marginBottom:16, ...style }}>
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, color:C.teal, textTransform:"uppercase", marginBottom:12 }}>
      {children}
    </div>
  );
}

function StatusDot({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.Saved;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px", borderRadius:20, background:s.bg, border:`1px solid ${s.border}`, color:s.text, fontSize:11, fontWeight:600 }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:s.dot, display:"inline-block" }}/>
      {status}
    </span>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("builder");
  const [jd, setJd] = useState("");
  const [cv, setCv] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("classic");
  const [resumeResult, setResumeResult] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [coverResult, setCoverResult] = useState(null);
  const [coverLoading, setCoverLoading] = useState(false);
  const [interviewResult, setInterviewResult] = useState(null);
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [jobSearch, setJobSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("uk");
  const [visaOnly, setVisaOnly] = useState(false);
  const [jobSearching, setJobSearching] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [applyingJob, setApplyingJob] = useState(null);
  const [applySuccess, setApplySuccess] = useState(null);
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const resultRef = useRef(null);

  function startLoadingAnimation() {
    setLoadingPhase(0);
    const iv = setInterval(() => {
      setLoadingPhase(p => { if (p >= LOADING_PHASES.length - 1) { clearInterval(iv); return p; } return p + 1; });
    }, 3500);
    return iv;
  }

  async function generateResume() {
    if (!jd?.trim() || !cv?.trim()) return;
    setResumeLoading(true);
    setResumeResult(null);
    const iv = startLoadingAnimation();
    try {
      const result = await callClaude(`
You are an elite executive resume writer trusted by top recruiters. You help professionals succeed across global job markets.

Return ONLY this exact JSON — NO markdown, NO backticks:

{
  "jdAnalysis": {
    "role": "exact job title",
    "company": "company name",
    "mustHave": ["req1","req2","req3","req4","req5","req6"],
    "niceToHave": ["nice1","nice2","nice3","nice4"],
    "keywords": ["kw1","kw2","kw3","kw4","kw5","kw6","kw7","kw8","kw9","kw10","kw11","kw12","kw13","kw14","kw15"],
    "seniorityLevel": "level",
    "hiringIntent": "2 specific sentences on what the hiring manager really wants"
  },
  "matchScore": 75,
  "hiringManagerScore": 70,
  "salaryIntelligence": {
    "marketMin": "£X",
    "marketMax": "£Y",
    "recommendedAsk": "£Z",
    "insight": "1 sentence salary negotiation insight"
  },
  "visaFriendly": true,
  "gapAnalysis": {
    "strengths": ["s1","s2","s3","s4","s5","s6"],
    "gaps": ["g1","g2","g3","g4","g5"],
    "transferable": ["t1","t2","t3","t4","t5"]
  },
  "resume": {
    "name": "FULL NAME IN CAPS",
    "contact": "email • phone • location",
    "summary": "3-4 sentence unique executive summary. No generic phrases. Specific hook. Quantified impact.",
    "skills": ["skill1","skill2","skill3","skill4","skill5","skill6","skill7","skill8","skill9","skill10"],
    "experience": [
      {
        "title": "Job Title",
        "company": "Company",
        "period": "dates",
        "bullets": ["Strong verb + initiative + quantified outcome","Strong verb + initiative + quantified outcome","Strong verb + initiative + quantified outcome","Strong verb + initiative + quantified outcome","Strong verb + initiative + quantified outcome"]
      }
    ],
    "education": "Degrees and certifications"
  },
  "hiringManagerInsights": {
    "firstImpression": "What hiring manager thinks in first 10 seconds",
    "humanAppeal": "What makes this resume compelling to a human",
    "redFlags": ["concern1","concern2"],
    "standoutFactors": ["standout1","standout2"]
  },
  "improvements": ["tip1","tip2","tip3","tip4","tip5"]
}

RULES: matchScore 0-100 based on keyword/experience/seniority fit. hiringManagerScore 0-100 based on narrative/achievement quality. Every bullet: strong verb + specific project + metric. visaFriendly: true if company likely sponsors Skilled Worker visas. Return ONLY JSON.

JOB DESCRIPTION: ${jd}
CANDIDATE BACKGROUND: ${cv}`);
      clearInterval(iv);
      setResumeResult(result);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch(e) {
      clearInterval(iv);
      setResumeResult({ error: "Generation failed. Please check your inputs and try again." });
    } finally {
      setResumeLoading(false);
    }
  }

  async function generateCover() {
    if (!jd || !cv) return;
    setCoverLoading(true);
    setCoverResult(null);
    try {
      const r = await callClaude(`Write a compelling, personalised cover letter. British English spelling. Return ONLY JSON:
{"subject":"Application for [Role] — [Name]","letter":"4 paragraphs. Para 1: Strong hook referencing something specific about the company — NOT 'I am writing to apply'. Para 2: Most relevant achievement with metric. Para 3: Why this specific company. Para 4: Confident direct close. 260-300 words total."}
JD: ${jd}
CV: ${cv}`);
      setCoverResult(r);
    } catch { setCoverResult({ error: "Failed. Please retry." }); }
    setCoverLoading(false);
  }

  async function generateInterview() {
    if (!jd || !cv) return;
    setInterviewLoading(true);
    setInterviewResult(null);
    try {
      const r = await callClaude(`Generate comprehensive interview preparation. Return ONLY JSON:
{"keyThemes":["t1","t2","t3","t4"],"likelyQuestions":[{"question":"Q1","tip":"coaching tip"},{"question":"Q2","tip":"tip"},{"question":"Q3","tip":"tip"},{"question":"Q4","tip":"tip"},{"question":"Q5","tip":"tip"}],"starStories":[{"theme":"Leadership","situation":"...","task":"...","action":"...","result":"metric"},{"theme":"Delivery Under Pressure","situation":"...","task":"...","action":"...","result":"metric"},{"theme":"Stakeholder Management","situation":"...","task":"...","action":"...","result":"metric"}],"questionsToAsk":["q1","q2","q3"],"redFlags":["concern + how to address it 1","concern + how to address it 2"]}
JD: ${jd}
CV: ${cv}`);
      setInterviewResult(r);
    } catch { setInterviewResult({ error: "Failed. Please retry." }); }
    setInterviewLoading(false);
  }

  async function searchJobs() {
    setJobSearching(true);
    setJobs([]);
    try {
      const vp = visaOnly ? "&visa=true" : "";
      const res = await fetch(`/api/jobs?query=${encodeURIComponent(jobSearch||"software engineer")}&country=${selectedCountry}${vp}`);
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch { setJobs([]); }
    setJobSearching(false);
  }

  async function applyToJob(job) {
    setApplyingJob(job.id);
    if (job.url) window.open(job.url, "_blank");
    setApplications(prev => prev.find(a=>a.title===job.title&&a.company===job.company) ? prev : [...prev, { id:Date.now(), title:job.title, company:job.company, platform:job.platform, status:"Applied", appliedDate:"Today", match:job.match||0, url:job.url }]);
    setApplyingJob(null);
    setApplySuccess(job.id);
    setTimeout(() => setApplySuccess(null), 3000);
  }

  function handleDownload() {
    if (!resumeResult?.resume) return;
    downloadResume(resumeResult.resume, resumeResult.matchScore||0, resumeResult.hiringManagerScore||0, selectedFormat);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2000);
  }

  // Styles
  const inp = { width:"100%", boxSizing:"border-box", background:C.white, border:`1.5px solid ${C.gray200}`, borderRadius:8, padding:"11px 14px", color:C.navy, fontSize:13, fontFamily:"inherit", outline:"none", transition:"border-color 0.2s", lineHeight:1.6 };
  const btnPrimary = (x={}) => ({ background:C.teal, color:"#fff", border:"none", borderRadius:8, padding:"11px 22px", fontSize:13, fontWeight:600, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:7, transition:"background 0.15s", ...x });
  const btnOutline = (x={}) => ({ background:"transparent", border:`1.5px solid ${C.gray200}`, color:C.gray600, borderRadius:8, padding:"10px 18px", fontSize:13, cursor:"pointer", transition:"all 0.15s", ...x });

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"'DM Sans','Segoe UI',system-ui,sans-serif", color:C.navy }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.6}}
        button:hover{opacity:0.9}
        input:focus,textarea:focus{border-color:${C.teal} !important;box-shadow:0 0 0 3px ${C.teal}18}
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ background:C.white, borderBottom:`1px solid ${C.gray200}`, position:"sticky", top:0, zIndex:100, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
        <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 32px", display:"flex", alignItems:"center", justifyContent:"space-between", height:60 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:`linear-gradient(135deg,${C.teal},${C.blue})`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:16, color:"#fff" }}>C</div>
            <div>
              <div style={{ fontSize:17, fontWeight:700, color:C.navy, letterSpacing:-0.5 }}>CareerOS</div>
              <div style={{ fontSize:9, color:C.gray400, letterSpacing:2, textTransform:"uppercase" }}>AI Career Platform</div>
            </div>
          </div>

          <nav style={{ display:"flex", gap:2 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ background:tab===t.id?C.tealLight:"transparent", border:tab===t.id?`1px solid ${C.teal}30`:"1px solid transparent", color:tab===t.id?C.teal:C.gray500, borderRadius:7, padding:"6px 14px", fontSize:12, cursor:"pointer", fontWeight:tab===t.id?600:400, transition:"all 0.15s" }}>
                {t.label}
              </button>
            ))}
          </nav>

          <button onClick={() => setTab("pricing")} style={{ background:`linear-gradient(135deg,${C.teal},${C.blue})`, color:"#fff", border:"none", borderRadius:8, padding:"8px 20px", fontSize:13, fontWeight:600, cursor:"pointer" }}>
            Upgrade to Pro →
          </button>
        </div>
      </div>

      <div style={{ maxWidth:1200, margin:"0 auto", padding:"40px 32px 80px" }}>

        {/* ══════════════ RESUME BUILDER ══════════════ */}
        {tab === "builder" && (
          <div style={{ animation:"fadeUp 0.35s ease" }}>

            {/* Hero */}
            <div style={{ textAlign:"center", marginBottom:44 }}>
              <div style={{ display:"inline-block", padding:"4px 16px", borderRadius:20, background:C.tealLight, color:C.teal, fontSize:11, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:16 }}>
                AI Resume Builder · ATS & Hiring Manager Scoring · Salary Intelligence
              </div>
              <h1 style={{ fontSize:44, fontWeight:800, color:C.navy, lineHeight:1.15, letterSpacing:-1.5, marginBottom:14 }}>
                Land more interviews.<br/>
                <span style={{ color:C.teal }}>Faster.</span>
              </h1>
              <p style={{ color:C.gray500, fontSize:16, maxWidth:480, margin:"0 auto 24px" }}>
                Paste a job description, paste your CV — get a tailored resume, ATS score, salary intelligence, and interview coaching in under 60 seconds.
              </p>
              <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" }}>
                {[{i:"🎯",l:"Dual ATS + Human Score"},{i:"💰",l:"Salary Intelligence"},{i:"🛂",l:"Visa Sponsorship Filter"},{i:"📄",l:"5 Resume Formats"},{i:"✉",l:"Cover Letter AI"},{i:"◆",l:"Interview Coach"}].map(f => (
                  <span key={f.l} style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"5px 13px", borderRadius:20, background:C.white, border:`1px solid ${C.gray200}`, fontSize:12, color:C.gray600, boxShadow:C.shadow }}>
                    <span>{f.i}</span><span>{f.l}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Resume Format Selector */}
            <Card style={{ marginBottom:24 }}>
              <SectionLabel>Choose Your Resume Format</SectionLabel>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10 }}>
                {RESUME_FORMATS.map(fmt => (
                  <div key={fmt.id} onClick={() => setSelectedFormat(fmt.id)} style={{ border:`2px solid ${selectedFormat===fmt.id?fmt.accentColor:C.gray200}`, borderRadius:10, padding:"14px 12px", cursor:"pointer", background:selectedFormat===fmt.id?`${fmt.accentColor}08`:C.white, transition:"all 0.15s" }}>
                    <div style={{ fontSize:22, marginBottom:6 }}>{fmt.icon}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:selectedFormat===fmt.id?fmt.accentColor:C.navy, marginBottom:3 }}>{fmt.name}</div>
                    <div style={{ fontSize:11, color:C.gray500, lineHeight:1.4, marginBottom:5 }}>{fmt.desc}</div>
                    <div style={{ fontSize:10, color:C.gray400, fontStyle:"italic" }}>{fmt.preview}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Inputs */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:C.gray700, display:"block", marginBottom:7 }}>JOB DESCRIPTION</label>
                <textarea style={{ ...inp, height:260, resize:"vertical" }} placeholder="Paste any job description here..." value={jd} onChange={e=>setJd(e.target.value)}/>
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:C.gray700, display:"block", marginBottom:7 }}>YOUR CV / BACKGROUND</label>
                <textarea style={{ ...inp, height:260, resize:"vertical" }} placeholder="Paste your CV, LinkedIn export, or describe your experience..." value={cv} onChange={e=>setCv(e.target.value)}/>
              </div>
            </div>

            {/* Loading bar */}
            {resumeLoading && (
              <div style={{ background:C.white, border:`1px solid ${C.teal}30`, borderRadius:10, padding:"16px 20px", marginBottom:20, boxShadow:C.shadowMd }}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:20, height:20, border:`2px solid ${C.teal}40`, borderTopColor:C.teal, borderRadius:"50%", animation:"spin 0.8s linear infinite", flexShrink:0 }}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:600, color:C.navy, marginBottom:3 }}>{LOADING_PHASES[loadingPhase]?.icon} {LOADING_PHASES[loadingPhase]?.text}</div>
                    <div style={{ height:4, background:C.gray100, borderRadius:4, overflow:"hidden" }}>
                      <div style={{ height:"100%", background:C.teal, borderRadius:4, width:`${((loadingPhase+1)/LOADING_PHASES.length)*100}%`, transition:"width 3.5s ease" }}/>
                    </div>
                  </div>
                  <div style={{ fontSize:12, color:C.gray400 }}>{loadingPhase+1}/{LOADING_PHASES.length}</div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display:"flex", gap:10, marginBottom:36, flexWrap:"wrap", alignItems:"center" }}>
              <button onClick={generateResume} disabled={resumeLoading||!jd||!cv} style={{ ...btnPrimary({ opacity:resumeLoading||!jd||!cv?0.5:1, padding:"13px 28px", fontSize:14, fontWeight:700 }) }}>
                {resumeLoading ? "Generating..." : "✦ Generate Tailored Resume"}
              </button>
              {resumeResult && !resumeResult.error && (<>
                <button onClick={handleDownload} style={btnOutline({ color:downloadSuccess?C.green:C.blue, borderColor:downloadSuccess?C.green:C.blue })}>
                  {downloadSuccess?"✓ Downloaded!":"⬇ Download Resume"}
                </button>
                <button onClick={()=>{navigator.clipboard.writeText(resumeResult.resume?.summary||"");setCopied(true);setTimeout(()=>setCopied(false),1800);}} style={btnOutline({ color:copied?C.green:C.gray600 })}>
                  {copied?"✓ Copied":"Copy Summary"}
                </button>
                <button onClick={()=>{setTab("cover");generateCover();}} style={btnOutline({ color:C.purple, borderColor:C.purple })}>✉ Cover Letter</button>
                <button onClick={()=>{setTab("interview");generateInterview();}} style={btnOutline({ color:C.blue, borderColor:C.blue })}>◆ Interview Prep</button>
              </>)}
            </div>

            {/* Results */}
            {resumeResult && !resumeResult.error && (
              <div ref={resultRef} style={{ animation:"fadeUp 0.4s ease" }}>

                {/* 4 score cards */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:14, marginBottom:16 }}>
                  <Card style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8, padding:20, textAlign:"center" }}>
                    <div style={{ fontSize:11, fontWeight:600, color:C.gray500, letterSpacing:1, textTransform:"uppercase" }}>ATS Score</div>
                    <ScoreRing score={resumeResult.matchScore} size={74} color={resumeResult.matchScore>=80?C.green:resumeResult.matchScore>=65?C.amber:C.red}/>
                    <div style={{ fontSize:11, fontWeight:700, color:resumeResult.matchScore>=80?C.green:resumeResult.matchScore>=65?C.amber:C.red }}>
                      {resumeResult.matchScore>=80?"Strong Match":resumeResult.matchScore>=65?"Good Match":"Needs Work"}
                    </div>
                  </Card>

                  <Card style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8, padding:20, textAlign:"center" }}>
                    <div style={{ fontSize:11, fontWeight:600, color:C.gray500, letterSpacing:1, textTransform:"uppercase" }}>Human Appeal</div>
                    <ScoreRing score={resumeResult.hiringManagerScore} size={74} color={C.purple}/>
                    <div style={{ fontSize:11, fontWeight:700, color:C.purple }}>Hiring Manager</div>
                  </Card>

                  <Card style={{ padding:20 }}>
                    <div style={{ fontSize:11, fontWeight:600, color:C.gray500, letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>💰 Salary Intelligence</div>
                    {resumeResult.salaryIntelligence ? (<>
                      <div style={{ fontSize:22, fontWeight:800, color:C.green, marginBottom:2 }}>{resumeResult.salaryIntelligence.recommendedAsk}</div>
                      <div style={{ fontSize:11, color:C.gray500, marginBottom:6 }}>Market: {resumeResult.salaryIntelligence.marketMin}–{resumeResult.salaryIntelligence.marketMax}</div>
                      <div style={{ fontSize:11, color:C.gray600, lineHeight:1.5 }}>{resumeResult.salaryIntelligence.insight}</div>
                    </>) : <div style={{ fontSize:12, color:C.gray400 }}>Not available</div>}
                  </Card>

                  <Card style={{ padding:20 }}>
                    <div style={{ fontSize:11, fontWeight:600, color:C.gray500, letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>🛂 Visa Status</div>
                    <div style={{ fontSize:24, marginBottom:6 }}>{resumeResult.visaFriendly?"✅":"⚠️"}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:resumeResult.visaFriendly?C.green:C.amber, marginBottom:4 }}>
                      {resumeResult.visaFriendly?"Likely Sponsors Visas":"Check Sponsorship"}
                    </div>
                    <div style={{ fontSize:11, color:C.gray500 }}>Based on company & sector analysis</div>
                  </Card>
                </div>

                {/* JD Analysis */}
                <Card>
                  <SectionLabel>JD Analysis — {resumeResult.jdAnalysis?.role} at {resumeResult.jdAnalysis?.company}</SectionLabel>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:18 }}>
                    <div>
                      <div style={{ fontSize:10, fontWeight:700, color:C.green, letterSpacing:1, textTransform:"uppercase", marginBottom:7 }}>Must-Have</div>
                      {resumeResult.jdAnalysis?.mustHave?.map(s=><Badge key={s} color={C.green} bg={C.greenLight}>{s}</Badge>)}
                    </div>
                    <div>
                      <div style={{ fontSize:10, fontWeight:700, color:C.amber, letterSpacing:1, textTransform:"uppercase", marginBottom:7 }}>Nice to Have</div>
                      {resumeResult.jdAnalysis?.niceToHave?.map(s=><Badge key={s} color={C.amber} bg={C.amberLight}>{s}</Badge>)}
                    </div>
                    <div>
                      <div style={{ fontSize:10, fontWeight:700, color:C.purple, letterSpacing:1, textTransform:"uppercase", marginBottom:7 }}>ATS Keywords</div>
                      {resumeResult.jdAnalysis?.keywords?.map(k=><Badge key={k} color={C.purple} bg={C.purpleLight}>{k}</Badge>)}
                    </div>
                  </div>
                  <div style={{ marginTop:14, padding:"12px 14px", background:C.tealLight, borderRadius:8, borderLeft:`3px solid ${C.teal}` }}>
                    <div style={{ fontSize:10, fontWeight:700, color:C.teal, marginBottom:4 }}>HIRING INTENT</div>
                    <div style={{ fontSize:12, color:C.gray700, lineHeight:1.6 }}>{resumeResult.jdAnalysis?.hiringIntent}</div>
                  </div>
                </Card>

                {/* Hiring Manager Psychology */}
                {resumeResult.hiringManagerInsights && (
                  <Card>
                    <SectionLabel>🧠 Hiring Manager Psychology</SectionLabel>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                      {[
                        {label:"FIRST IMPRESSION (10 seconds)",key:"firstImpression",color:C.purple,bg:C.purpleLight},
                        {label:"HUMAN APPEAL",key:"humanAppeal",color:C.green,bg:C.greenLight},
                      ].map(({label,key,color,bg})=>(
                        <div key={key}>
                          <div style={{ fontSize:10, fontWeight:700, color, letterSpacing:1, marginBottom:7 }}>{label}</div>
                          <div style={{ fontSize:12, color:C.gray700, lineHeight:1.6, padding:"10px 12px", background:bg, borderRadius:7 }}>{resumeResult.hiringManagerInsights[key]}</div>
                        </div>
                      ))}
                      <div>
                        <div style={{ fontSize:10, fontWeight:700, color:C.red, letterSpacing:1, marginBottom:7 }}>POTENTIAL RED FLAGS</div>
                        {resumeResult.hiringManagerInsights.redFlags?.map((r,i)=><div key={i} style={{ fontSize:12, color:C.gray700, padding:"4px 0", borderBottom:`1px solid ${C.gray100}` }}>⚠ {r}</div>)}
                      </div>
                      <div>
                        <div style={{ fontSize:10, fontWeight:700, color:C.amber, letterSpacing:1, marginBottom:7 }}>STANDOUT FACTORS</div>
                        {resumeResult.hiringManagerInsights.standoutFactors?.map((s,i)=><div key={i} style={{ fontSize:12, color:C.gray700, padding:"4px 0", borderBottom:`1px solid ${C.gray100}` }}>⭐ {s}</div>)}
                      </div>
                    </div>
                  </Card>
                )}

                {/* Gap Analysis */}
                <Card>
                  <SectionLabel>Gap Analysis</SectionLabel>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:18 }}>
                    {[["✓ Strengths","strengths",C.green,C.greenLight],["✗ Gaps","gaps",C.red,C.redLight],["⇄ Transferable","transferable",C.amber,C.amberLight]].map(([label,key,c,bg])=>(
                      <div key={key}>
                        <div style={{ fontSize:11, fontWeight:700, color:c, marginBottom:8 }}>{label}</div>
                        {resumeResult.gapAnalysis?.[key]?.map((s,i)=>(
                          <div key={i} style={{ fontSize:12, color:C.gray700, padding:"5px 0", borderBottom:`1px solid ${C.gray100}`, display:"flex", gap:7, alignItems:"flex-start" }}>
                            <span style={{ color:c, flexShrink:0 }}>•</span>{s}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Resume Preview with format picker */}
                <Card noPad>
                  <div style={{ padding:"20px 24px 16px", borderBottom:`1px solid ${C.gray100}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <SectionLabel style={{ marginBottom:2 }}>✦ Tailored Resume</SectionLabel>
                      <div style={{ fontSize:12, color:C.gray500 }}>Format: <strong style={{ color:C.navy }}>{RESUME_FORMATS.find(f=>f.id===selectedFormat)?.name}</strong> · Download to open/print as PDF</div>
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      {RESUME_FORMATS.map(fmt=>(
                        <button key={fmt.id} onClick={()=>setSelectedFormat(fmt.id)} style={{ padding:"5px 12px", borderRadius:6, border:`1.5px solid ${selectedFormat===fmt.id?fmt.accentColor:C.gray200}`, background:selectedFormat===fmt.id?`${fmt.accentColor}10`:C.white, color:selectedFormat===fmt.id?fmt.accentColor:C.gray500, fontSize:11, fontWeight:600, cursor:"pointer" }}>
                          {fmt.icon} {fmt.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ padding:"24px" }}>
                    {/* Resume content preview */}
                    <div style={{ background:C.gray50, borderRadius:8, padding:24, border:`1px solid ${C.gray200}` }}>
                      {resumeResult.resume && (<>
                        <div style={{ marginBottom:16, paddingBottom:14, borderBottom:`2px solid ${C.navy}` }}>
                          <div style={{ fontSize:22, fontWeight:800, color:C.navy }}>{resumeResult.resume.name}</div>
                          <div style={{ fontSize:12, color:C.gray500, marginTop:3 }}>{resumeResult.resume.contact}</div>
                          <div style={{ display:"flex", gap:8, marginTop:8 }}>
                            <span style={{ fontSize:11, fontWeight:600, color:C.green, background:C.greenLight, padding:"3px 10px", borderRadius:12 }}>ATS: {resumeResult.matchScore}%</span>
                            {resumeResult.hiringManagerScore && <span style={{ fontSize:11, fontWeight:600, color:C.purple, background:C.purpleLight, padding:"3px 10px", borderRadius:12 }}>Human: {resumeResult.hiringManagerScore}%</span>}
                          </div>
                        </div>
                        <div style={{ marginBottom:14 }}>
                          <div style={{ fontSize:10, fontWeight:700, color:C.teal, letterSpacing:1.5, textTransform:"uppercase", marginBottom:7 }}>Professional Summary</div>
                          <p style={{ fontSize:13, color:C.gray700, lineHeight:1.75, margin:0 }}>{resumeResult.resume.summary}</p>
                        </div>
                        <div style={{ marginBottom:14 }}>
                          <div style={{ fontSize:10, fontWeight:700, color:C.teal, letterSpacing:1.5, textTransform:"uppercase", marginBottom:7 }}>Core Skills</div>
                          {resumeResult.resume.skills?.map(s=><Badge key={s} color={C.teal} bg={C.tealLight}>{s}</Badge>)}
                        </div>
                        <div style={{ marginBottom:14 }}>
                          <div style={{ fontSize:10, fontWeight:700, color:C.teal, letterSpacing:1.5, textTransform:"uppercase", marginBottom:10 }}>Experience</div>
                          {resumeResult.resume.experience?.map((exp,i)=>(
                            <div key={i} style={{ marginBottom:16, paddingBottom:16, borderBottom:i<resumeResult.resume.experience.length-1?`1px solid ${C.gray100}`:"none" }}>
                              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
                                <div><span style={{ fontSize:13, fontWeight:700, color:C.navy }}>{exp.title}</span><span style={{ color:C.gray300, margin:"0 7px" }}>|</span><span style={{ fontSize:12, color:C.gray600 }}>{exp.company}</span></div>
                                <span style={{ fontSize:11, color:C.gray400 }}>{exp.period}</span>
                              </div>
                              {exp.bullets?.map((b,j)=><div key={j} style={{ fontSize:12, color:C.gray700, paddingLeft:14, lineHeight:1.65, position:"relative", marginBottom:3 }}><span style={{ position:"absolute", left:0, color:C.teal }}>▸</span>{b}</div>)}
                            </div>
                          ))}
                        </div>
                        <div>
                          <div style={{ fontSize:10, fontWeight:700, color:C.teal, letterSpacing:1.5, textTransform:"uppercase", marginBottom:7 }}>Education & Certifications</div>
                          <div style={{ fontSize:12, color:C.gray700 }}>{resumeResult.resume.education}</div>
                        </div>
                      </>)}
                    </div>
                    <div style={{ marginTop:16, display:"flex", gap:10 }}>
                      <button onClick={handleDownload} style={{ ...btnPrimary(), flex:1, justifyContent:"center" }}>
                        ⬇ Download as {RESUME_FORMATS.find(f=>f.id===selectedFormat)?.name} Format
                      </button>
                    </div>
                  </div>
                </Card>

                {/* Improvements */}
                <Card>
                  <SectionLabel>💡 Strategic Improvements</SectionLabel>
                  {resumeResult.improvements?.map((tip,i)=>(
                    <div key={i} style={{ display:"flex", gap:12, padding:"10px 0", borderBottom:i<resumeResult.improvements.length-1?`1px solid ${C.gray100}`:"none" }}>
                      <div style={{ width:24, height:24, borderRadius:"50%", background:C.tealLight, color:C.teal, fontSize:11, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{i+1}</div>
                      <div style={{ fontSize:13, color:C.gray700, lineHeight:1.65 }}>{tip}</div>
                    </div>
                  ))}
                </Card>
              </div>
            )}
            {resumeResult?.error && <div style={{ background:C.redLight, border:`1px solid #fecaca`, borderRadius:8, padding:"12px 16px", color:C.red, fontSize:13 }}>⚠ {resumeResult.error}</div>}
          </div>
        )}

        {/* ══════════════ JOB SEARCH ══════════════ */}
        {tab === "jobs" && (
          <div style={{ animation:"fadeUp 0.35s ease" }}>
            <div style={{ marginBottom:28 }}>
              <h2 style={{ fontSize:28, fontWeight:800, color:C.navy, marginBottom:6, letterSpacing:-0.5 }}>Job Search</h2>
              <p style={{ color:C.gray500, fontSize:14 }}>Real jobs from Adzuna, JSearch (LinkedIn/Indeed/Glassdoor) & Reed · UK · US · India</p>
            </div>

            <Card>
              <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
                {COUNTRIES.map(c=>(
                  <button key={c.code} onClick={()=>setSelectedCountry(c.code)} style={{ padding:"8px 18px", borderRadius:20, background:selectedCountry===c.code?C.teal:C.white, border:`1.5px solid ${selectedCountry===c.code?C.teal:C.gray200}`, color:selectedCountry===c.code?"#fff":C.gray600, fontSize:13, fontWeight:600, cursor:"pointer" }}>
                    {c.label}
                  </button>
                ))}
                <button onClick={()=>setVisaOnly(!visaOnly)} style={{ padding:"8px 18px", borderRadius:20, background:visaOnly?C.greenLight:C.white, border:`1.5px solid ${visaOnly?C.green:C.gray200}`, color:visaOnly?C.green:C.gray600, fontSize:13, fontWeight:600, cursor:"pointer" }}>
                  🛂 {visaOnly?"✓ Visa Sponsorship Only":"Visa Sponsorship Filter"}
                </button>
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <input style={{ ...inp, flex:1 }} placeholder={`Search jobs in ${COUNTRIES.find(c=>c.code===selectedCountry)?.label}...`} value={jobSearch} onChange={e=>setJobSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&searchJobs()}/>
                <button onClick={searchJobs} disabled={jobSearching} style={btnPrimary({ flexShrink:0, padding:"11px 24px" })}>
                  {jobSearching?"Searching...":"Search Jobs"}
                </button>
              </div>
            </Card>

            {jobSearching && (
              <div style={{ textAlign:"center", padding:48 }}>
                <div style={{ width:36, height:36, border:`3px solid ${C.teal}30`, borderTopColor:C.teal, borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 14px" }}/>
                <div style={{ color:C.gray500, fontSize:13 }}>Searching Adzuna, JSearch & Reed...</div>
              </div>
            )}

            {!jobSearching && jobs.length===0 && (
              <div style={{ textAlign:"center", padding:64 }}>
                <div style={{ fontSize:40, marginBottom:14 }}>🔍</div>
                <div style={{ fontSize:17, fontWeight:600, color:C.navy, marginBottom:8 }}>Search for real jobs above</div>
                <div style={{ fontSize:13, color:C.gray500 }}>Try "product manager", "software engineer", "data analyst"</div>
              </div>
            )}

            {jobs.map(job=>(
              <Card key={job.id} style={{ cursor:"pointer", border:selectedJob===job.id?`1.5px solid ${C.teal}`:`1px solid ${C.gray200}`, transition:"all 0.15s" }} onClick={()=>setSelectedJob(selectedJob===job.id?null:job.id)}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:14 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, flexWrap:"wrap" }}>
                      <span style={{ fontSize:15, fontWeight:700, color:C.navy }}>{job.title}</span>
                      <PlatformTag platform={job.platform}/>
                      {visaOnly && <span style={{ fontSize:10, fontWeight:700, color:C.green, background:C.greenLight, padding:"2px 8px", borderRadius:10 }}>🛂 Visa</span>}
                    </div>
                    <div style={{ display:"flex", gap:14, marginBottom:8, flexWrap:"wrap" }}>
                      <span style={{ fontSize:12, color:C.gray600, fontWeight:500 }}>🏢 {job.company}</span>
                      <span style={{ fontSize:12, color:C.gray500 }}>📍 {job.location}</span>
                      {job.salary&&job.salary!=="Competitive"&&<span style={{ fontSize:12, color:C.gray500 }}>💰 {job.salary}</span>}
                      <span style={{ fontSize:12, color:C.gray400 }}>🕐 {job.posted}</span>
                    </div>
                    {job.tags?.length>0&&<div>{job.tags.map(t=><Badge key={t}>{t}</Badge>)}</div>}
                  </div>
                  <ScoreRing score={job.match} size={52} color={C.teal}/>
                </div>

                {selectedJob===job.id&&(
                  <div style={{ marginTop:16, paddingTop:16, borderTop:`1px solid ${C.gray100}` }}>
                    <p style={{ fontSize:13, color:C.gray600, lineHeight:1.7, marginBottom:16 }}>{job.description}</p>
                    <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                      <button onClick={e=>{e.stopPropagation();setJd(job.description+"\n\nRole: "+job.title+"\nCompany: "+job.company);setTab("builder");}} style={btnPrimary()}>✦ Tailor Resume</button>
                      <button onClick={e=>{e.stopPropagation();applyToJob(job);}} disabled={applyingJob===job.id} style={btnOutline({color:C.blue,borderColor:C.blue})}>
                        {applyingJob===job.id?"Opening...":applySuccess===job.id?"✓ Opened!":"Apply Now →"}
                      </button>
                      <button onClick={e=>{e.stopPropagation();setApplications(prev=>prev.find(a=>a.title===job.title&&a.company===job.company)?prev:[...prev,{id:Date.now(),title:job.title,company:job.company,platform:job.platform,status:"Saved",appliedDate:"—",match:0}]);}} style={btnOutline()}>☆ Save</button>
                    </div>
                  </div>
                )}
              </Card>
            ))}

            {jobs.length>0&&<div style={{ textAlign:"center", padding:"12px 0", fontSize:11, color:C.gray400 }}>{jobs.length} real jobs · Adzuna + JSearch + Reed · Live data</div>}
          </div>
        )}

        {/* ══════════════ TRACKER ══════════════ */}
        {tab === "tracker" && (
          <div style={{ animation:"fadeUp 0.35s ease" }}>
            <div style={{ marginBottom:24 }}>
              <h2 style={{ fontSize:28, fontWeight:800, color:C.navy, marginBottom:6, letterSpacing:-0.5 }}>Application Tracker</h2>
              <p style={{ color:C.gray500, fontSize:14 }}>Track every application. Save from Job Search to populate this board.</p>
            </div>

            {applications.length===0 ? (
              <div style={{ textAlign:"center", padding:64 }}>
                <div style={{ fontSize:40, marginBottom:14 }}>📋</div>
                <div style={{ fontSize:17, fontWeight:600, color:C.navy, marginBottom:8 }}>No applications yet</div>
                <div style={{ fontSize:13, color:C.gray500 }}>Go to Job Search → click a job → Save or Apply</div>
              </div>
            ) : (<>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginBottom:24 }}>
                {[
                  {label:"Total Applied",value:applications.filter(a=>a.status!=="Saved").length,color:C.blue},
                  {label:"Saved",value:applications.filter(a=>a.status==="Saved").length,color:C.gray500},
                  {label:"Interviewing",value:applications.filter(a=>a.status==="Interview").length,color:C.amber},
                  {label:"Offers",value:applications.filter(a=>a.status==="Offer").length,color:C.green},
                  {label:"Response Rate",value:applications.length?Math.round((applications.filter(a=>["Interview","Offer"].includes(a.status)).length/Math.max(1,applications.filter(a=>a.status!=="Saved").length))*100)+"%":"—",color:C.teal},
                ].map(s=>(
                  <Card key={s.label} style={{ padding:"16px 18px" }}>
                    <div style={{ fontSize:10, color:C.gray500, fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>{s.label}</div>
                    <div style={{ fontSize:28, fontWeight:800, color:s.color }}>{s.value}</div>
                  </Card>
                ))}
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12 }}>
                {["Saved","Applied","Interview","Offer","Rejected"].map(status=>(
                  <div key={status}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                      <StatusDot status={status}/>
                      <span style={{ fontSize:11, color:C.gray400 }}>{applications.filter(a=>a.status===status).length}</span>
                    </div>
                    {applications.filter(a=>a.status===status).map(app=>(
                      <Card key={app.id} style={{ padding:14, marginBottom:10 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:C.navy, marginBottom:3, lineHeight:1.4 }}>{app.title}</div>
                        <div style={{ fontSize:11, color:C.gray500, marginBottom:10 }}>{app.company}</div>
                        <PlatformTag platform={app.platform}/>
                        <div style={{ display:"flex", gap:4, marginTop:10, flexWrap:"wrap" }}>
                          {["Applied","Interview","Offer","Rejected"].filter(s=>s!==status).slice(0,2).map(s=>(
                            <button key={s} onClick={()=>setApplications(prev=>prev.map(a=>a.id===app.id?{...a,status:s}:a))} style={{ background:C.gray50, border:`1px solid ${C.gray200}`, color:C.gray600, borderRadius:6, padding:"3px 8px", fontSize:10, cursor:"pointer" }}>→ {s}</button>
                          ))}
                          <button onClick={()=>setApplications(prev=>prev.filter(a=>a.id!==app.id))} style={{ background:C.redLight, border:`1px solid #fecaca`, color:C.red, borderRadius:6, padding:"3px 8px", fontSize:10, cursor:"pointer" }}>✕</button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ))}
              </div>
            </>)}
          </div>
        )}

        {/* ══════════════ COVER LETTER ══════════════ */}
        {tab === "cover" && (
          <div style={{ animation:"fadeUp 0.35s ease" }}>
            <h2 style={{ fontSize:28, fontWeight:800, color:C.navy, marginBottom:6, letterSpacing:-0.5 }}>Cover Letter Generator</h2>
            <p style={{ color:C.gray500, fontSize:14, marginBottom:28 }}>Professional cover letters — personalised, direct, no generic openers.</p>
            {(!jd||!cv)&&<div style={{ background:C.amberLight, border:`1px solid #fde68a`, borderRadius:8, padding:"12px 16px", marginBottom:20, color:"#92400e", fontSize:13 }}>⚡ Add your JD and CV in Resume Builder first.</div>}
            <button onClick={generateCover} disabled={coverLoading||!jd||!cv} style={{ ...btnPrimary({ opacity:coverLoading||!jd||!cv?0.5:1, marginBottom:28, padding:"13px 28px" }) }}>
              {coverLoading?"Writing cover letter...":"✉ Generate Cover Letter"}
            </button>
            {coverResult&&!coverResult.error&&(
              <Card>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                  <SectionLabel style={{ marginBottom:0 }}>Cover Letter</SectionLabel>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={()=>navigator.clipboard.writeText(coverResult.letter)} style={btnOutline({fontSize:12,padding:"7px 14px"})}>Copy</button>
                    <button onClick={()=>{const blob=new Blob([coverResult.letter],{type:"text/plain"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="cover_letter.txt";a.click();}} style={btnOutline({fontSize:12,padding:"7px 14px",color:C.blue,borderColor:C.blue})}>⬇ Download</button>
                  </div>
                </div>
                <div style={{ fontSize:12, color:C.gray500, marginBottom:12 }}>Subject: {coverResult.subject}</div>
                <div style={{ background:C.gray50, borderRadius:8, padding:24, fontSize:13, color:C.gray700, lineHeight:1.9, whiteSpace:"pre-wrap", border:`1px solid ${C.gray200}` }}>{coverResult.letter}</div>
              </Card>
            )}
            {coverResult?.error&&<div style={{ background:C.redLight, border:`1px solid #fecaca`, borderRadius:8, padding:"12px 16px", color:C.red, fontSize:13 }}>⚠ {coverResult.error}</div>}
          </div>
        )}

        {/* ══════════════ INTERVIEW PREP ══════════════ */}
        {tab === "interview" && (
          <div style={{ animation:"fadeUp 0.35s ease" }}>
            <h2 style={{ fontSize:28, fontWeight:800, color:C.navy, marginBottom:6, letterSpacing:-0.5 }}>Interview Preparation</h2>
            <p style={{ color:C.gray500, fontSize:14, marginBottom:28 }}>Likely questions, STAR stories, coaching tips, and red flags to prepare for.</p>
            {(!jd||!cv)&&<div style={{ background:C.amberLight, border:`1px solid #fde68a`, borderRadius:8, padding:"12px 16px", marginBottom:20, color:"#92400e", fontSize:13 }}>⚡ Add your JD and CV in Resume Builder first.</div>}
            <button onClick={generateInterview} disabled={interviewLoading||!jd||!cv} style={{ ...btnPrimary({ opacity:interviewLoading||!jd||!cv?0.5:1, marginBottom:28, padding:"13px 28px" }) }}>
              {interviewLoading?"Preparing insights...":"◆ Generate Interview Prep"}
            </button>

            {interviewResult&&!interviewResult.error&&(<>
              <Card>
                <SectionLabel>Key Themes</SectionLabel>
                {interviewResult.keyThemes?.map(t=><Badge key={t} color={C.green} bg={C.greenLight}>{t}</Badge>)}
              </Card>
              <Card>
                <SectionLabel>Likely Questions & Coaching Tips</SectionLabel>
                {interviewResult.likelyQuestions?.map((q,i)=>(
                  <div key={i} style={{ marginBottom:18, paddingBottom:18, borderBottom:i<interviewResult.likelyQuestions.length-1?`1px solid ${C.gray100}`:"none" }}>
                    <div style={{ fontSize:13, fontWeight:600, color:C.navy, marginBottom:7 }}>Q: {q.question}</div>
                    <div style={{ fontSize:12, color:C.gray600, paddingLeft:12, borderLeft:`2px solid ${C.teal}`, lineHeight:1.6 }}>💡 {q.tip}</div>
                  </div>
                ))}
              </Card>
              <Card>
                <SectionLabel>STAR Stories</SectionLabel>
                {interviewResult.starStories?.map((s,i)=>(
                  <div key={i} style={{ marginBottom:22, paddingBottom:22, borderBottom:i<interviewResult.starStories.length-1?`1px solid ${C.gray100}`:"none" }}>
                    <div style={{ fontSize:13, fontWeight:700, color:C.amber, marginBottom:10 }}>⭐ {s.theme}</div>
                    {["situation","task","action","result"].map(k=>(
                      <div key={k} style={{ display:"grid", gridTemplateColumns:"90px 1fr", gap:12, marginBottom:7 }}>
                        <div style={{ fontSize:10, fontWeight:700, color:C.gray400, textTransform:"uppercase", letterSpacing:1 }}>{k}</div>
                        <div style={{ fontSize:12, color:C.gray700, lineHeight:1.6 }}>{s[k]}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </Card>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <Card>
                  <SectionLabel>Questions to Ask Them</SectionLabel>
                  {interviewResult.questionsToAsk?.map((q,i)=><div key={i} style={{ fontSize:12, color:C.gray700, padding:"6px 0", borderBottom:`1px solid ${C.gray100}`, display:"flex", gap:7 }}><span style={{ color:C.teal }}>→</span>{q}</div>)}
                </Card>
                <Card>
                  <SectionLabel>Red Flags to Address</SectionLabel>
                  {interviewResult.redFlags?.map((r,i)=><div key={i} style={{ fontSize:12, color:C.gray700, padding:"6px 0", borderBottom:`1px solid ${C.gray100}`, display:"flex", gap:7 }}><span style={{ color:C.red }}>⚠</span>{r}</div>)}
                </Card>
              </div>
            </>)}
            {interviewResult?.error&&<div style={{ background:C.redLight, border:`1px solid #fecaca`, borderRadius:8, padding:"12px 16px", color:C.red, fontSize:13 }}>⚠ {interviewResult.error}</div>}
          </div>
        )}

        {/* ══════════════ PRICING ══════════════ */}
        {tab === "pricing" && (
          <div style={{ animation:"fadeUp 0.35s ease" }}>
            <div style={{ textAlign:"center", marginBottom:44 }}>
              <h2 style={{ fontSize:36, fontWeight:800, color:C.navy, marginBottom:10, letterSpacing:-1 }}>Simple, Transparent Pricing</h2>
              <p style={{ color:C.gray500, fontSize:16 }}>Start free. Upgrade when you're ready to get serious.</p>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:20, marginBottom:48 }}>
              {TIERS.map(t=>(
                <div key={t.name} style={{ background:t.highlight?C.navy:C.white, border:`1px solid ${t.highlight?C.navy:C.gray200}`, borderRadius:14, padding:28, position:"relative", transform:t.highlight?"scale(1.02)":"scale(1)", boxShadow:t.highlight?C.shadowLg:C.shadow }}>
                  {t.highlight&&<div style={{ position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)", background:C.teal, color:"#fff", fontSize:10, fontWeight:700, padding:"4px 16px", borderRadius:20, letterSpacing:1, textTransform:"uppercase", whiteSpace:"nowrap" }}>Most Popular</div>}
                  <div style={{ fontSize:12, fontWeight:700, color:t.highlight?C.teal:C.gray500, letterSpacing:1.5, textTransform:"uppercase", marginBottom:14 }}>{t.name}</div>
                  <div style={{ marginBottom:22 }}>
                    <span style={{ fontSize:40, fontWeight:800, color:t.highlight?"#fff":C.navy }}>{t.price}</span>
                    {t.period&&<span style={{ fontSize:14, color:t.highlight?"rgba(255,255,255,0.6)":C.gray400 }}>{t.period}</span>}
                  </div>
                  <div style={{ marginBottom:28 }}>
                    {t.features.map(f=>(
                      <div key={f} style={{ display:"flex", gap:9, padding:"7px 0", borderBottom:`1px solid ${t.highlight?"rgba(255,255,255,0.08)":C.gray100}`, fontSize:12, color:t.highlight?"rgba(255,255,255,0.8)":C.gray600 }}>
                        <span style={{ color:t.highlight?C.teal:C.teal, fontWeight:700 }}>✓</span>{f}
                      </div>
                    ))}
                  </div>
                  <button onClick={()=>{if(t.gumroad)window.open(t.gumroad,"_blank");else alert("You're on the free plan!");}} style={{ width:"100%", padding:13, background:t.highlight?C.teal:"transparent", border:t.highlight?"none":`1.5px solid ${C.gray300}`, color:t.highlight?"#fff":C.navy, borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer" }}>
                    {t.cta}
                  </button>
                  {t.gumroad&&<div style={{ fontSize:10, color:t.highlight?"rgba(255,255,255,0.4)":C.gray400, textAlign:"center", marginTop:8 }}>Secure payment via Gumroad · Cancel anytime</div>}
                </div>
              ))}
            </div>

            <Card>
              <SectionLabel>Why CareerOS</SectionLabel>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
                {[
                  {icon:"🎯",title:"Dual Scoring",desc:"ATS score AND Hiring Manager Psychology score — the only platform that does both"},
                  {icon:"📄",title:"5 Resume Formats",desc:"Classic, Modern, Executive, Minimal, ATS-Safe — download any format instantly"},
                  {icon:"🛂",title:"Visa Intelligence",desc:"Filter jobs by visa sponsorship availability — saves hours of research"},
                  {icon:"💰",title:"Salary Intelligence",desc:"Know your market value before every salary conversation"},
                  {icon:"🌍",title:"UK · US · India",desc:"Real jobs from Adzuna, JSearch, and Reed across three major markets"},
                  {icon:"🔄",title:"Full Circle Platform",desc:"Job → Resume → Cover Letter → Interview Prep → Tracker. All connected."},
                ].map(item=>(
                  <div key={item.title} style={{ padding:16, background:C.gray50, borderRadius:10, border:`1px solid ${C.gray200}` }}>
                    <div style={{ fontSize:22, marginBottom:8 }}>{item.icon}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:C.navy, marginBottom:5 }}>{item.title}</div>
                    <div style={{ fontSize:12, color:C.gray500, lineHeight:1.5 }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div style={{ borderTop:`1px solid ${C.gray200}`, padding:"20px 32px", textAlign:"center", background:C.white }}>
        <span style={{ color:C.teal, fontWeight:700 }}>CareerOS</span>
        <span style={{ color:C.gray400, fontSize:12 }}> — AI-powered career platform · Resume · Cover Letter · Job Search · Interview Prep · Application Tracker</span>
      </div>
    </div>
  );
}
