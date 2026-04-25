import { useState, useRef } from "react";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const TABS = [
  { id: "builder", label: "Resume Builder", icon: "✦" },
  { id: "jobs", label: "Job Search", icon: "◈" },
  { id: "tracker", label: "My Applications", icon: "◉" },
  { id: "cover", label: "Cover Letter", icon: "◎" },
  { id: "interview", label: "Interview Prep", icon: "◆" },
  { id: "pricing", label: "Pricing", icon: "◇" },
];

const JOB_PLATFORMS = [
  { id: "linkedin", name: "LinkedIn", color: "#0077b5", bg: "rgba(0,119,181,0.1)", border: "rgba(0,119,181,0.3)", logo: "in", applyLabel: "Easy Apply", connected: true },
  { id: "indeed", name: "Indeed", color: "#003A9B", bg: "rgba(0,58,155,0.1)", border: "rgba(0,58,155,0.3)", logo: "id", applyLabel: "Apply Now", connected: false },
  { id: "glassdoor", name: "Glassdoor", color: "#0caa41", bg: "rgba(12,170,65,0.1)", border: "rgba(12,170,65,0.3)", logo: "gd", applyLabel: "Apply", connected: false },
  { id: "reed", name: "Reed", color: "#cc0000", bg: "rgba(204,0,0,0.1)", border: "rgba(204,0,0,0.3)", logo: "rd", applyLabel: "Apply", connected: false },
  { id: "monster", name: "Monster", color: "#6e00ff", bg: "rgba(110,0,255,0.1)", border: "rgba(110,0,255,0.3)", logo: "mn", applyLabel: "Apply", connected: false },
  { id: "totaljobs", name: "TotalJobs", color: "#e84a0c", bg: "rgba(232,74,12,0.1)", border: "rgba(232,74,12,0.3)", logo: "tj", applyLabel: "Apply", connected: false },
];

const SAMPLE_JOBS = [
  { id: 1, title: "Senior Product Manager – AI Platform", company: "DeepMind", location: "London, UK", type: "Full-time", salary: "£110k–£140k", platform: "linkedin", posted: "2h ago", match: 91, tags: ["AI/ML", "Product", "Strategy"], description: "Lead product roadmap for our ML developer platform. Own end-to-end product lifecycle, work with world-class researchers." },
  { id: 2, title: "Head of Product", company: "Monzo Bank", location: "London, UK (Hybrid)", type: "Full-time", salary: "£130k–£160k", platform: "linkedin", posted: "5h ago", match: 84, tags: ["Fintech", "Leadership", "Agile"], description: "Define and execute product strategy for our core banking product used by 8M+ customers. Cross-functional leadership role." },
  { id: 3, title: "Product Manager – Data & Analytics", company: "Deliveroo", location: "London, UK", type: "Full-time", salary: "£80k–£100k", platform: "indeed", posted: "1d ago", match: 78, tags: ["Data", "Analytics", "SQL"], description: "Drive data product vision across consumer and restaurant insights. Partner with data science and engineering teams." },
  { id: 4, title: "Senior PM – Developer Tools", company: "Atlassian", location: "Remote (UK)", type: "Full-time", salary: "£95k–£120k", platform: "glassdoor", posted: "2d ago", match: 88, tags: ["DevTools", "B2B", "SaaS"], description: "Shape the future of developer productivity tools. Join a globally distributed team building tools used by millions." },
  { id: 5, title: "Group Product Manager", company: "Wise", location: "London, UK", type: "Full-time", salary: "£120k–£150k", platform: "reed", posted: "3d ago", match: 72, tags: ["Fintech", "Growth", "International"], description: "Lead a squad of PMs across our international transfer product. Own OKRs, strategy, and team growth." },
  { id: 6, title: "Product Manager – Mobile", company: "ASOS", location: "London, UK", type: "Full-time", salary: "£70k–£90k", platform: "totaljobs", posted: "4d ago", match: 68, tags: ["Mobile", "E-commerce", "Consumer"], description: "Own the ASOS app roadmap for 25M+ users. Data-driven PM with strong consumer instincts required." },
];

const TIERS = [
  { name: "Free", price: "£0", features: ["3 tailored resumes/mo", "Basic ATS score", "5 job searches/day", "1 cover letter/mo"], cta: "Get Started", highlight: false, color: "#64748b", gumroad: null },
  { name: "Pro", price: "£19", period: "/mo", features: ["Unlimited resume tailoring", "Advanced ATS scoring", "Unlimited job search", "Unlimited cover letters", "PDF download", "Application tracker", "Interview prep AI", "LinkedIn import"], cta: "Buy Pro — £19/mo", highlight: true, color: "#f59e0b", gumroad: "https://gumroad.com/l/careeros-pro" },
  { name: "Enterprise", price: "£99", period: "/mo", features: ["Everything in Pro", "Recruiter dashboard", "Bulk optimization (100+)", "Team workspace", "API access", "White-label option", "Dedicated CSM"], cta: "Buy Enterprise", highlight: false, color: "#10b981", gumroad: "https://gumroad.com/l/careeros-enterprise" },
];

const STATUS_COLORS = {
  "Saved": { bg: "rgba(100,116,139,0.12)", text: "#94a3b8", border: "rgba(100,116,139,0.25)" },
  "Applied": { bg: "rgba(59,130,246,0.12)", text: "#60a5fa", border: "rgba(59,130,246,0.25)" },
  "Interview": { bg: "rgba(245,158,11,0.12)", text: "#fbbf24", border: "rgba(245,158,11,0.25)" },
  "Offer": { bg: "rgba(16,185,129,0.12)", text: "#34d399", border: "rgba(16,185,129,0.25)" },
  "Rejected": { bg: "rgba(239,68,68,0.1)", text: "#f87171", border: "rgba(239,68,68,0.2)" },
};

const SAMPLE_CV = `Sarah Johnson | sarah@email.com | London, UK | linkedin.com/in/sarahjohnson

EXPERIENCE
Senior Product Manager, FinTech Startup (2021–2024)
- Led product strategy for B2B SaaS platform, growing ARR from £2M to £8M
- Managed roadmap for 3 product lines, coordinating 20+ engineer team using Agile
- Launched ML-powered fraud detection feature, reducing chargebacks by 41%
- Used SQL, Mixpanel, and Amplitude for data-driven decisions

Product Manager, Scale-up (2019–2021)
- Owned mobile app roadmap from MVP to 500k users
- Ran A/B tests improving onboarding conversion by 28%
- Stakeholder management across C-suite, engineering, design, and sales

SKILLS: Product strategy, Roadmapping, SQL, Figma, JIRA, Stakeholder management, Data analysis, Python basics, API integrations, Agile/Scrum

EDUCATION: B.Sc Computer Science, University of Edinburgh, 2019`;

// ─── API CALL ─────────────────────────────────────────────────────────────────

async function callClaude(userPrompt, systemPrompt) {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 8000,
      system: systemPrompt || "You are an elite resume strategist and executive career coach. Return only valid JSON with no markdown, no backticks, no extra text.",
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  const data = await res.json();
  const text = data.content?.map(b => b.text || "").join("") || "{}";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// ─── PDF DOWNLOAD ─────────────────────────────────────────────────────────────

function downloadPDF(resume) {
  if (!resume) return;

  const content = `
CURRICULUM VITAE
================

${resume.name}
${resume.contact}

PROFESSIONAL SUMMARY
--------------------
${resume.summary}

CORE SKILLS
-----------
${resume.skills?.join(" • ")}

EXPERIENCE
----------
${resume.experience?.map(exp => `
${exp.title} | ${exp.company} | ${exp.period}
${exp.bullets?.map(b => `• ${b}`).join("\n")}
`).join("\n")}

EDUCATION
---------
${resume.education}

---
Generated by CareerOS — AI Career Platform
  `.trim();

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${resume.name?.replace(/\s+/g, "_")}_Resume_CareerOS.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadHTML(resume, atsScore) {
  if (!resume) return;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${resume.name} — Resume</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Georgia', serif; color: #1a1a1a; background: #fff; max-width: 800px; margin: 40px auto; padding: 40px; }
  h1 { font-size: 28px; font-weight: 700; color: #0f172a; letter-spacing: -0.5px; margin-bottom: 4px; }
  .contact { font-size: 13px; color: #64748b; margin-bottom: 24px; }
  .section-title { font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #f59e0b; margin: 20px 0 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
  .summary { font-size: 14px; line-height: 1.8; color: #374151; margin-bottom: 8px; }
  .skills { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
  .skill { padding: 3px 10px; background: #f1f5f9; border-radius: 12px; font-size: 12px; color: #374151; }
  .job { margin-bottom: 18px; }
  .job-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
  .job-title { font-size: 14px; font-weight: 700; color: #0f172a; }
  .job-company { font-size: 13px; color: #64748b; }
  .job-period { font-size: 12px; color: #94a3b8; }
  .bullet { font-size: 13px; color: #374151; line-height: 1.7; padding-left: 14px; position: relative; margin-bottom: 3px; }
  .bullet::before { content: "▸"; position: absolute; left: 0; color: #f59e0b; }
  .education { font-size: 13px; color: #374151; }
  .ats-badge { display: inline-block; padding: 4px 12px; background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; font-size: 11px; color: #166534; font-weight: 600; margin-bottom: 20px; }
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
  @media print { body { margin: 0; padding: 24px; } }
</style>
</head>
<body>
  <h1>${resume.name}</h1>
  <div class="contact">${resume.contact}</div>
  <div class="ats-badge">ATS Match Score: ${atsScore}%</div>

  <div class="section-title">Professional Summary</div>
  <div class="summary">${resume.summary}</div>

  <div class="section-title">Core Skills</div>
  <div class="skills">${resume.skills?.map(s => `<span class="skill">${s}</span>`).join("")}</div>

  <div class="section-title">Experience</div>
  ${resume.experience?.map(exp => `
    <div class="job">
      <div class="job-header">
        <div>
          <span class="job-title">${exp.title}</span>
          <span class="job-company"> | ${exp.company}</span>
        </div>
        <span class="job-period">${exp.period}</span>
      </div>
      ${exp.bullets?.map(b => `<div class="bullet">${b}</div>`).join("")}
    </div>
  `).join("")}

  <div class="section-title">Education</div>
  <div class="education">${resume.education}</div>

  <div class="footer">Generated by CareerOS — AI Career Platform | careeros.vercel.app</div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${resume.name?.replace(/\s+/g, "_")}_Resume_CareerOS.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function ScoreRing({ score, size = 64 }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? "#10b981" : score >= 65 ? "#f59e0b" : "#ef4444";
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1.2s ease" }}/>
      <text x={size/2} y={size/2+5} textAnchor="middle" fill={color}
        fontSize={size*0.22} fontWeight="700"
        style={{ transform: `rotate(90deg)`, transformOrigin: `${size/2}px ${size/2}px` }}>
        {score}%
      </text>
    </svg>
  );
}

function Tag({ text, type = "neutral" }) {
  const styles = {
    neutral: { bg: "rgba(255,255,255,0.06)", c: "#94a3b8" },
    green: { bg: "rgba(16,185,129,0.12)", c: "#34d399" },
    amber: { bg: "rgba(245,158,11,0.12)", c: "#fbbf24" },
    red: { bg: "rgba(239,68,68,0.12)", c: "#f87171" },
    purple: { bg: "rgba(139,92,246,0.12)", c: "#a78bfa" },
    blue: { bg: "rgba(59,130,246,0.12)", c: "#60a5fa" },
  };
  const s = styles[type] || styles.neutral;
  return (
    <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 12, background: s.bg, color: s.c, fontSize: 11, fontWeight: 600, margin: "2px 3px 2px 0" }}>{text}</span>
  );
}

function PlatformBadge({ platform }) {
  const p = JOB_PLATFORMS.find(x => x.id === platform) || JOB_PLATFORMS[0];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 10px", borderRadius: 12, background: p.bg, border: `1px solid ${p.border}`, color: p.color, fontSize: 11, fontWeight: 700 }}>
      {p.name}
    </span>
  );
}

function Card({ children, style = {}, delay = 0 }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14, padding: 20, marginBottom: 16,
      animation: `fadeIn 0.4s ease forwards`, animationDelay: `${delay}s`, opacity: 0,
      ...style,
    }}>{children}</div>
  );
}

function SectionTitle({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#f59e0b", textTransform: "uppercase", marginBottom: 14 }}>{children}</div>;
}

function Spinner() {
  return <div style={{ width: 14, height: 14, border: "2px solid #0f172a", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }}/>;
}

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS["Saved"];
  return (
    <span style={{ padding: "3px 12px", borderRadius: 20, background: s.bg, border: `1px solid ${s.border}`, color: s.text, fontSize: 11, fontWeight: 600 }}>{status}</span>
  );
}

// ─── LOADING PHASES ───────────────────────────────────────────────────────────

const LOADING_PHASES = [
  { icon: "🔍", text: "Parsing job description..." },
  { icon: "👤", text: "Analysing your background..." },
  { icon: "🧠", text: "Running semantic matching..." },
  { icon: "📊", text: "Calculating ATS score..." },
  { icon: "✍️", text: "Crafting unique resume bullets..." },
  { icon: "🎯", text: "Optimising for hiring managers..." },
  { icon: "✨", text: "Finalising your tailored resume..." },
];

// ─── MAIN APP ────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState("builder");
  const [jd, setJd] = useState("");
  const [cv, setCv] = useState("");
  const [resumeResult, setResumeResult] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [coverResult, setCoverResult] = useState(null);
  const [coverLoading, setCoverLoading] = useState(false);
  const [interviewResult, setInterviewResult] = useState(null);
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [jobs, setJobs] = useState(SAMPLE_JOBS);
  const [jobFilter, setJobFilter] = useState("all");
  const [jobSearch, setJobSearch] = useState("");
  const [jobSearching, setJobSearching] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applications, setApplications] = useState([
    { id: 1, title: "Product Manager – AI Platform", company: "DeepMind", platform: "linkedin", status: "Interview", appliedDate: "Apr 18", match: 91 },
    { id: 2, title: "Senior PM – Developer Tools", company: "Atlassian", platform: "glassdoor", status: "Applied", appliedDate: "Apr 20", match: 88 },
    { id: 3, title: "Head of Product", company: "Monzo Bank", platform: "linkedin", status: "Saved", appliedDate: "—", match: 84 },
  ]);
  const [connectedPlatforms, setConnectedPlatforms] = useState(["linkedin"]);
  const [linkedInImported, setLinkedInImported] = useState(false);
  const [applyingJob, setApplyingJob] = useState(null);
  const [applySuccess, setApplySuccess] = useState(null);
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const resultRef = useRef(null);

  // ── Loading phase animation ──
  function startLoadingAnimation() {
    setLoadingPhase(0);
    const interval = setInterval(() => {
      setLoadingPhase(p => {
        if (p >= LOADING_PHASES.length - 1) { clearInterval(interval); return p; }
        return p + 1;
      });
    }, 3000);
    return interval;
  }

  // ── Resume Generation ──
  async function generateResume(customJd) {
    const targetJd = customJd || jd;
    if (!targetJd.trim() || !cv.trim()) return;
    setResumeLoading(true);
    setResumeResult(null);
    const interval = startLoadingAnimation();

    try {
      const result = await callClaude(`
You are an elite executive resume writer and career strategist used by top recruiters at McKinsey, Google, and Goldman Sachs.

Analyse this job description and candidate background. Return ONLY this exact JSON structure with NO markdown, NO backticks:

{
  "jdAnalysis": {
    "role": "exact job title",
    "company": "company name",
    "mustHave": ["specific skill 1", "specific skill 2", "specific skill 3", "specific skill 4", "specific skill 5", "specific skill 6"],
    "niceToHave": ["skill 1", "skill 2", "skill 3", "skill 4"],
    "keywords": ["kw1", "kw2", "kw3", "kw4", "kw5", "kw6", "kw7", "kw8", "kw9", "kw10", "kw11", "kw12", "kw13", "kw14", "kw15"],
    "seniorityLevel": "exact level",
    "hiringIntent": "2 sentence description of what hiring manager really wants"
  },
  "matchScore": 78,
  "gapAnalysis": {
    "strengths": ["specific strength with evidence 1", "specific strength 2", "specific strength 3", "specific strength 4", "specific strength 5", "specific strength 6", "specific strength 7"],
    "gaps": ["specific gap 1", "specific gap 2", "specific gap 3", "specific gap 4", "specific gap 5", "specific gap 6"],
    "transferable": ["transferable skill 1", "transferable skill 2", "transferable skill 3", "transferable skill 4", "transferable skill 5", "transferable skill 6", "transferable skill 7"]
  },
  "resume": {
    "name": "FULL NAME IN CAPS",
    "contact": "email • phone • location • linkedin",
    "summary": "3-4 sentence UNIQUE executive summary. Must: (1) open with a differentiating hook specific to THIS role, (2) quantify scale of impact, (3) directly address the hiring manager's top 2 needs, (4) avoid ALL generic phrases like 'results-driven' or 'proven track record'",
    "skills": ["skill 1", "skill 2", "skill 3", "skill 4", "skill 5", "skill 6", "skill 7", "skill 8", "skill 9", "skill 10"],
    "experience": [
      {
        "title": "Job Title",
        "company": "Company Name",
        "period": "dates",
        "bullets": [
          "Strong action verb + specific project/initiative + quantified business outcome (£/$/%/scale)",
          "Strong action verb + specific project/initiative + quantified business outcome",
          "Strong action verb + specific project/initiative + quantified business outcome",
          "Strong action verb + specific project/initiative + quantified business outcome",
          "Strong action verb + specific project/initiative + quantified business outcome"
        ]
      }
    ],
    "education": "Degree, Institution, Year | Certifications"
  },
  "improvements": [
    "Specific, actionable improvement tip 1 — explain exactly what to add/change",
    "Specific, actionable improvement tip 2 — explain exactly what to add/change",
    "Specific, actionable improvement tip 3 — explain exactly what to add/change",
    "Specific, actionable improvement tip 4 — explain exactly what to add/change",
    "Specific, actionable improvement tip 5 — explain exactly what to add/change"
  ]
}

CRITICAL RULES:
- Every bullet must start with a STRONG action verb (Architected, Spearheaded, Orchestrated, Negotiated, etc)
- Every bullet must have a specific metric or scale (£, $, %, headcount, time saved, revenue)
- Summary must be UNIQUE to this person and role — no generic phrases
- Keywords from JD must appear naturally in bullets
- Never fabricate experience — only elevate and reframe what exists
- Return ONLY the JSON object — no markdown, no backticks, no explanation

JOB DESCRIPTION:
${targetJd}

CANDIDATE BACKGROUND:
${cv}
`);
      clearInterval(interval);
      setResumeResult(result);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch(e) {
      clearInterval(interval);
      setResumeResult({ error: "Generation failed. Please check your inputs and try again." });
    } finally {
      setResumeLoading(false);
    }
  }

  // ── Cover Letter ──
  async function generateCover(customJd) {
    const targetJd = customJd || jd;
    if (!targetJd || !cv) return;
    setCoverLoading(true);
    setCoverResult(null);
    try {
      const result = await callClaude(`
Write a compelling, highly personalised cover letter. Return ONLY JSON:
{
  "subject": "Application for [Role] — [Name]",
  "letter": "4 paragraphs. Para 1: Hook opener that references something specific about the company — NOT 'I am writing to apply'. Para 2: Your most relevant achievement with metric. Para 3: Why this company specifically. Para 4: Confident close. Tone: professional but human. Total: 250-300 words."
}
JD: ${targetJd}
CV: ${cv}`);
      setCoverResult(result);
    } catch { setCoverResult({ error: "Failed. Please retry." }); }
    finally { setCoverLoading(false); }
  }

  // ── Interview Prep ──
  async function generateInterview(customJd) {
    const targetJd = customJd || jd;
    if (!targetJd || !cv) return;
    setInterviewLoading(true);
    setInterviewResult(null);
    try {
      const result = await callClaude(`
Generate detailed interview preparation. Return ONLY JSON:
{
  "keyThemes": ["theme1", "theme2", "theme3", "theme4"],
  "likelyQuestions": [
    {"question": "Q1", "tip": "Specific coaching tip for this exact question"},
    {"question": "Q2", "tip": "tip"},
    {"question": "Q3", "tip": "tip"},
    {"question": "Q4", "tip": "tip"},
    {"question": "Q5", "tip": "tip"}
  ],
  "starStories": [
    {"theme": "Leadership", "situation": "...", "task": "...", "action": "...", "result": "with specific metric"},
    {"theme": "Delivery Under Pressure", "situation": "...", "task": "...", "action": "...", "result": "with specific metric"}
  ],
  "questionsToAsk": ["Insightful question 1", "Insightful question 2", "Insightful question 3"],
  "redFlags": ["Potential concern the interviewer may raise and exactly how to address it proactively"]
}
JD: ${targetJd}
CV: ${cv}`);
      setInterviewResult(result);
    } catch { setInterviewResult({ error: "Failed. Please retry." }); }
    finally { setInterviewLoading(false); }
  }

  // ── Job Search ──
  async function searchJobs() {
    setJobSearching(true);
    await new Promise(r => setTimeout(r, 1800));
    const q = jobSearch.toLowerCase();
    if (q) {
      setJobs(SAMPLE_JOBS.filter(j => j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || j.tags.some(t => t.toLowerCase().includes(q))));
    } else {
      setJobs(SAMPLE_JOBS);
    }
    setJobSearching(false);
  }

  async function applyToJob(job) {
    setApplyingJob(job.id);
    await new Promise(r => setTimeout(r, 2200));
    setApplications(prev => {
      const exists = prev.find(a => a.title === job.title && a.company === job.company);
      if (exists) return prev.map(a => a.title === job.title && a.company === job.company ? { ...a, status: "Applied", appliedDate: "Today" } : a);
      return [...prev, { id: Date.now(), title: job.title, company: job.company, platform: job.platform, status: "Applied", appliedDate: "Today", match: job.match }];
    });
    setApplyingJob(null);
    setApplySuccess(job.id);
    setTimeout(() => setApplySuccess(null), 3000);
  }

  function connectPlatform(id) {
    setConnectedPlatforms(prev => prev.includes(id) ? prev : [...prev, id]);
  }

  function importLinkedIn() {
    setCv(SAMPLE_CV);
    setLinkedInImported(true);
    setTimeout(() => setLinkedInImported(false), 2000);
  }

  async function oneClickApply(job) {
    setJd(job.description + "\n\n" + job.title + " at " + job.company);
    if (!cv) setCv(SAMPLE_CV);
    await generateResume(job.description + "\n" + job.title + " at " + job.company);
    setTab("builder");
  }

  function handleDownload() {
    if (!resumeResult?.resume) return;
    downloadHTML(resumeResult.resume, resumeResult.matchScore);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2000);
  }

  const filteredJobs = jobs.filter(j => jobFilter === "all" || j.platform === jobFilter);

  const inputSt = {
    width: "100%", boxSizing: "border-box",
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 10, padding: "12px 14px", color: "#e2e8f0",
    fontSize: 13, fontFamily: "inherit", outline: "none",
    transition: "border-color 0.2s", lineHeight: 1.6,
  };

  const btnPrimary = (extra = {}) => ({
    background: "linear-gradient(135deg,#f59e0b,#d97706)",
    color: "#0f172a", border: "none", borderRadius: 10,
    padding: "12px 24px", fontSize: 14, fontWeight: 700,
    cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8,
    ...extra,
  });

  const btnGhost = (extra = {}) => ({
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    color: "#94a3b8", borderRadius: 10, padding: "10px 18px",
    fontSize: 13, cursor: "pointer", ...extra,
  });

  return (
    <div style={{ minHeight: "100vh", background: "#080d1a", backgroundImage: "radial-gradient(ellipse at 15% 15%, rgba(245,158,11,0.05) 0%,transparent 55%), radial-gradient(ellipse at 85% 85%, rgba(16,185,129,0.04) 0%,transparent 55%)", color: "#e2e8f0", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)} }
        @keyframes spin { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.5} }
        @keyframes slideUp { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
        @keyframes loadingPulse { 0%,100%{opacity:0.6}50%{opacity:1} }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(8,13,26,0.95)", backdropFilter: "blur(16px)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg,#f59e0b,#10b981)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, color: "#080d1a" }}>C</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.5 }}>CareerOS</div>
              <div style={{ fontSize: 9, color: "#475569", letterSpacing: 2, textTransform: "uppercase" }}>AI Career Platform</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 2 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                background: tab === t.id ? "rgba(245,158,11,0.12)" : "transparent",
                border: tab === t.id ? "1px solid rgba(245,158,11,0.25)" : "1px solid transparent",
                color: tab === t.id ? "#f59e0b" : "#64748b",
                borderRadius: 8, padding: "6px 13px", fontSize: 12, cursor: "pointer", fontWeight: 500,
                transition: "all 0.15s",
              }}>{t.icon} {t.label}</button>
            ))}
          </div>

          <button onClick={() => setTab("pricing")} style={btnPrimary({ padding: "8px 18px", fontSize: 12, borderRadius: 8 })}>↑ Upgrade Pro</button>
        </div>
      </div>

      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "36px 32px 80px" }}>

        {/* ════════ RESUME BUILDER ════════ */}
        {tab === "builder" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{ display: "inline-block", padding: "3px 14px", borderRadius: 20, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", color: "#f59e0b", fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>ATS-Optimized · Semantic Matching · Recruiter-Approved</div>
              <h1 style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.15, background: "linear-gradient(135deg,#f1f5f9 0%,#f59e0b 60%,#10b981 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 14, letterSpacing: -1.5 }}>One Resume. Every Job. Zero Guesswork.</h1>
              <p style={{ color: "#64748b", fontSize: 15, maxWidth: 480, margin: "0 auto" }}>Paste a JD or pick a job from search. AI tailors your resume, scores it, and helps you apply — all in one place.</p>
            </div>

            {/* LinkedIn Import Banner */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(0,119,181,0.08)", border: "1px solid rgba(0,119,181,0.2)", borderRadius: 12, padding: "14px 20px", marginBottom: 24 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "#0077b5", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14, flexShrink: 0 }}>in</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#60a5fa" }}>LinkedIn Profile Import</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>Download your LinkedIn profile as PDF → paste it in the CV box below. AI will extract everything automatically.</div>
              </div>
              <button onClick={importLinkedIn} style={{ background: linkedInImported ? "rgba(16,185,129,0.15)" : "rgba(0,119,181,0.15)", border: `1px solid ${linkedInImported ? "rgba(16,185,129,0.3)" : "rgba(0,119,181,0.3)"}`, color: linkedInImported ? "#34d399" : "#60a5fa", borderRadius: 8, padding: "8px 18px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                {linkedInImported ? "✓ Imported!" : "Use Sample →"}
              </button>
            </div>

            {/* Inputs */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: "#f59e0b", textTransform: "uppercase", marginBottom: 8 }}>Job Description</div>
                <textarea style={{ ...inputSt, height: 240, resize: "vertical" }} placeholder="Paste any job description here — or pick a job from the Job Search tab..." value={jd} onChange={e => setJd(e.target.value)} onFocus={e => e.target.style.borderColor = "rgba(245,158,11,0.35)"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.09)"}/>
                {!jd && <button onClick={() => setJd(SAMPLE_JOBS[0].description + "\n\nRole: " + SAMPLE_JOBS[0].title + "\nCompany: " + SAMPLE_JOBS[0].company + "\nSalary: " + SAMPLE_JOBS[0].salary)} style={{ ...btnGhost(), marginTop: 8, fontSize: 11, padding: "5px 12px" }}>Use sample JD →</button>}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: "#10b981", textTransform: "uppercase", marginBottom: 8 }}>Your CV / Background</div>
                <textarea style={{ ...inputSt, height: 240, resize: "vertical" }} placeholder="Paste your CV, LinkedIn export, or describe your experience..." value={cv} onChange={e => setCv(e.target.value)} onFocus={e => e.target.style.borderColor = "rgba(16,185,129,0.35)"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.09)"}/>
                {!cv && <button onClick={() => setCv(SAMPLE_CV)} style={{ ...btnGhost(), marginTop: 8, fontSize: 11, padding: "5px 12px" }}>Use sample CV →</button>}
              </div>
            </div>

            {/* Loading indicator */}
            {resumeLoading && (
              <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 12, padding: "20px 24px", marginBottom: 20, animation: "loadingPulse 2s infinite" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 20, height: 20, border: "2px solid rgba(245,158,11,0.3)", borderTopColor: "#f59e0b", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }}/>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#f59e0b" }}>{LOADING_PHASES[loadingPhase]?.icon} {LOADING_PHASES[loadingPhase]?.text}</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>This takes 20-40 seconds — Claude is writing a uniquely tailored resume for you</div>
                  </div>
                  <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                    {LOADING_PHASES.map((_, i) => (
                      <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: i <= loadingPhase ? "#f59e0b" : "rgba(255,255,255,0.1)", transition: "background 0.3s" }}/>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginBottom: 40, flexWrap: "wrap" }}>
              <button onClick={() => generateResume()} disabled={resumeLoading || !jd || !cv} style={{ ...btnPrimary(), opacity: resumeLoading || !jd || !cv ? 0.5 : 1 }}>
                {resumeLoading ? "Generating..." : "✦ Generate Tailored Resume"}
              </button>
              {resumeResult && !resumeResult.error && (
                <>
                  <button onClick={handleDownload} style={btnGhost({ color: downloadSuccess ? "#34d399" : "#60a5fa", borderColor: downloadSuccess ? "rgba(16,185,129,0.3)" : "rgba(59,130,246,0.25)" })}>
                    {downloadSuccess ? "✓ Downloaded!" : "⬇ Download Resume"}
                  </button>
                  <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(resumeResult.resume, null, 2)); setCopied(true); setTimeout(() => setCopied(false), 1800); }} style={btnGhost({ color: copied ? "#34d399" : "#94a3b8" })}>
                    {copied ? "✓ Copied" : "Copy Resume"}
                  </button>
                  <button onClick={() => { setTab("cover"); if (!coverResult) generateCover(); }} style={btnGhost({ color: "#a78bfa", borderColor: "rgba(139,92,246,0.25)" })}>✉ Cover Letter</button>
                  <button onClick={() => { setTab("interview"); if (!interviewResult) generateInterview(); }} style={btnGhost({ color: "#60a5fa", borderColor: "rgba(59,130,246,0.25)" })}>◆ Interview Prep</button>
                </>
              )}
            </div>

            {/* Results */}
            {resumeResult && !resumeResult.error && (
              <div ref={resultRef}>
                <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 16, marginBottom: 16 }}>
                  <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: 20 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: "#475569", textTransform: "uppercase" }}>ATS Match</div>
                    <ScoreRing score={resumeResult.matchScore || 0} size={80}/>
                    <div style={{ fontSize: 11, fontWeight: 600, color: resumeResult.matchScore >= 80 ? "#34d399" : resumeResult.matchScore >= 65 ? "#fbbf24" : "#f87171", textAlign: "center" }}>
                      {resumeResult.matchScore >= 80 ? "Strong Match" : resumeResult.matchScore >= 65 ? "Good Match" : "Needs Work"}
                    </div>
                  </Card>
                  <Card delay={0.1}>
                    <SectionTitle>JD Analysis — {resumeResult.jdAnalysis?.role}</SectionTitle>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <div><div style={{ fontSize: 10, color: "#475569", fontWeight: 600, marginBottom: 6 }}>MUST-HAVE</div>{resumeResult.jdAnalysis?.mustHave?.map(s => <Tag key={s} text={s} type="green"/>)}</div>
                      <div><div style={{ fontSize: 10, color: "#475569", fontWeight: 600, marginBottom: 6 }}>ATS KEYWORDS</div>{resumeResult.jdAnalysis?.keywords?.map(k => <Tag key={k} text={k} type="purple"/>)}</div>
                      <div><div style={{ fontSize: 10, color: "#475569", fontWeight: 600, marginBottom: 6 }}>NICE TO HAVE</div>{resumeResult.jdAnalysis?.niceToHave?.map(s => <Tag key={s} text={s} type="amber"/>)}</div>
                      <div><div style={{ fontSize: 10, color: "#475569", fontWeight: 600, marginBottom: 6 }}>HIRING INTENT</div><div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>{resumeResult.jdAnalysis?.hiringIntent}</div></div>
                    </div>
                  </Card>
                </div>

                <Card delay={0.15}>
                  <SectionTitle>Gap Analysis</SectionTitle>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                    {[["✓ Strengths","strengths","green"],["✗ Gaps","gaps","red"],["⇄ Transferable","transferable","amber"]].map(([label,key,type]) => (
                      <div key={key}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: type==="green"?"#34d399":type==="red"?"#f87171":"#fbbf24", marginBottom: 8 }}>{label}</div>
                        {resumeResult.gapAnalysis?.[key]?.map((s,i) => <div key={i} style={{ fontSize: 12, color: "#94a3b8", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>• {s}</div>)}
                      </div>
                    ))}
                  </div>
                </Card>

                <Card delay={0.2}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <SectionTitle style={{ marginBottom: 0 }}>✦ Tailored Resume</SectionTitle>
                    <button onClick={handleDownload} style={{ background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 700, padding: "8px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                      ⬇ Download as HTML
                    </button>
                  </div>
                  <div style={{ background: "#0d1424", borderRadius: 10, padding: 28 }}>
                    {resumeResult.resume && (<>
                      <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                        <div style={{ fontSize: 24, fontWeight: 800, color: "#f1f5f9", letterSpacing: -0.5 }}>{resumeResult.resume.name}</div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>{resumeResult.resume.contact}</div>
                      </div>
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Professional Summary</div>
                        <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.8, margin: 0 }}>{resumeResult.resume.summary}</p>
                      </div>
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Core Skills</div>
                        {resumeResult.resume.skills?.map(s => <Tag key={s} text={s} type="green"/>)}
                      </div>
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Experience</div>
                        {resumeResult.resume.experience?.map((exp,i) => (
                          <div key={i} style={{ marginBottom: 18, paddingBottom: 18, borderBottom: i < resumeResult.resume.experience.length-1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                              <div><span style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>{exp.title}</span><span style={{ color: "#475569", margin: "0 8px" }}>|</span><span style={{ fontSize: 13, color: "#94a3b8" }}>{exp.company}</span></div>
                              <span style={{ fontSize: 11, color: "#475569" }}>{exp.period}</span>
                            </div>
                            {exp.bullets?.map((b,j) => <div key={j} style={{ fontSize: 12, color: "#94a3b8", paddingLeft: 14, lineHeight: 1.7, position: "relative", marginBottom: 4 }}><span style={{ position: "absolute", left: 0, color: "#f59e0b" }}>▸</span>{b}</div>)}
                          </div>
                        ))}
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Education</div>
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>{resumeResult.resume.education}</div>
                      </div>
                    </>)}
                  </div>
                </Card>

                <Card delay={0.25}>
                  <SectionTitle>💡 Strategic Improvements</SectionTitle>
                  {resumeResult.improvements?.map((tip,i) => (
                    <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: i < resumeResult.improvements.length-1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i+1}</div>
                      <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>{tip}</div>
                    </div>
                  ))}
                </Card>
              </div>
            )}
            {resumeResult?.error && <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: 10, padding: 14, color: "#f87171", fontSize: 13 }}>⚠ {resumeResult.error}</div>}
          </div>
        )}

        {/* ════════ JOB SEARCH ════════ */}
        {tab === "jobs" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: "#f1f5f9", marginBottom: 6, letterSpacing: -0.5 }}>Job Search</h2>
              <p style={{ color: "#64748b", fontSize: 14 }}>Search across LinkedIn, Indeed, Glassdoor, Reed, Monster & more. AI scores each job against your profile.</p>
            </div>

            <Card>
              <SectionTitle>Connected Platforms</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10 }}>
                {JOB_PLATFORMS.map(p => (
                  <div key={p.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "12px 8px", borderRadius: 10, background: connectedPlatforms.includes(p.id) ? p.bg : "rgba(255,255,255,0.02)", border: `1px solid ${connectedPlatforms.includes(p.id) ? p.border : "rgba(255,255,255,0.07)"}`, cursor: "pointer", transition: "all 0.2s" }} onClick={() => connectPlatform(p.id)}>
                    <div style={{ width: 32, height: 32, borderRadius: 7, background: connectedPlatforms.includes(p.id) ? p.color : "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 800 }}>{p.logo.toUpperCase()}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: connectedPlatforms.includes(p.id) ? p.color : "#475569", textAlign: "center" }}>{p.name}</div>
                    <div style={{ fontSize: 9, color: connectedPlatforms.includes(p.id) ? p.color : "#334155", fontWeight: 600 }}>{connectedPlatforms.includes(p.id) ? "✓ Connected" : "Connect"}</div>
                  </div>
                ))}
              </div>
            </Card>

            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              <input style={{ ...inputSt, flex: 1 }} placeholder="Search jobs, companies, skills…" value={jobSearch} onChange={e => setJobSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && searchJobs()}/>
              <button onClick={searchJobs} disabled={jobSearching} style={btnPrimary({ flexShrink: 0 })}>
                {jobSearching ? "Searching…" : "Search Jobs"}
              </button>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {[{id:"all",name:"All Platforms"},...JOB_PLATFORMS].map(p => (
                <button key={p.id} onClick={() => setJobFilter(p.id)} style={{ padding: "5px 14px", borderRadius: 20, background: jobFilter===p.id ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${jobFilter===p.id ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.08)"}`, color: jobFilter===p.id ? "#f59e0b" : "#64748b", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                  {p.name}
                </button>
              ))}
            </div>

            {filteredJobs.map((job, i) => (
              <div key={job.id} style={{ background: "rgba(255,255,255,0.03)", border: selectedJob===job.id ? "1px solid rgba(245,158,11,0.3)" : "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 18, marginBottom: 12, cursor: "pointer" }} onClick={() => setSelectedJob(selectedJob===job.id ? null : job.id)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>{job.title}</span>
                      <PlatformBadge platform={job.platform}/>
                    </div>
                    <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: "#64748b" }}>{job.company}</span>
                      <span style={{ fontSize: 12, color: "#475569" }}>📍 {job.location}</span>
                      <span style={{ fontSize: 12, color: "#475569" }}>💰 {job.salary}</span>
                      <span style={{ fontSize: 12, color: "#475569" }}>🕐 {job.posted}</span>
                    </div>
                    <div>{job.tags.map(t => <Tag key={t} text={t} type="neutral"/>)}</div>
                  </div>
                  <ScoreRing score={job.match} size={56}/>
                </div>
                {selectedJob === job.id && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7, marginBottom: 16 }}>{job.description}</p>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button onClick={(e) => { e.stopPropagation(); oneClickApply(job); }} style={btnPrimary({ fontSize: 13 })}>✦ Tailor & Apply</button>
                      <button onClick={(e) => { e.stopPropagation(); applyToJob(job); }} disabled={applyingJob===job.id} style={btnGhost({ color: "#60a5fa", borderColor: "rgba(59,130,246,0.25)", fontSize: 13 })}>
                        {applyingJob===job.id ? "Applying…" : applySuccess===job.id ? "✓ Applied!" : `Apply on ${JOB_PLATFORMS.find(p=>p.id===job.platform)?.name}`}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setApplications(prev => prev.find(a=>a.title===job.title) ? prev : [...prev, {id:Date.now(), title:job.title, company:job.company, platform:job.platform, status:"Saved", appliedDate:"—", match:job.match}]); }} style={btnGhost({ fontSize: 13 })}>☆ Save</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ════════ TRACKER ════════ */}
        {tab === "tracker" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: "#f1f5f9", marginBottom: 6, letterSpacing: -0.5 }}>Application Tracker</h2>
              <p style={{ color: "#64748b", fontSize: 14 }}>Track every application. Know exactly where you stand.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 24 }}>
              {[
                { label: "Total Applied", value: applications.filter(a=>a.status!=="Saved").length, color: "#60a5fa" },
                { label: "Saved", value: applications.filter(a=>a.status==="Saved").length, color: "#94a3b8" },
                { label: "In Interview", value: applications.filter(a=>a.status==="Interview").length, color: "#fbbf24" },
                { label: "Offers", value: applications.filter(a=>a.status==="Offer").length, color: "#34d399" },
                { label: "Avg Match", value: Math.round(applications.reduce((s,a)=>s+a.match,0)/applications.length)+"%", color: "#f59e0b" },
              ].map(s => (
                <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px 18px" }}>
                  <div style={{ fontSize: 10, color: "#475569", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>{s.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12 }}>
              {["Saved","Applied","Interview","Offer","Rejected"].map(status => (
                <div key={status}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <StatusBadge status={status}/>
                    <span style={{ fontSize: 11, color: "#475569" }}>{applications.filter(a=>a.status===status).length}</span>
                  </div>
                  {applications.filter(a=>a.status===status).map(app => (
                    <div key={app.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 12, marginBottom: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", marginBottom: 4, lineHeight: 1.4 }}>{app.title}</div>
                      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>{app.company}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <PlatformBadge platform={app.platform}/>
                        <span style={{ fontSize: 10, color: app.match>=80?"#34d399":app.match>=65?"#fbbf24":"#f87171", fontWeight: 700 }}>{app.match}%</span>
                      </div>
                      <div style={{ display: "flex", gap: 4, marginTop: 10, flexWrap: "wrap" }}>
                        {["Applied","Interview","Offer"].filter(s=>s!==status).slice(0,2).map(s => (
                          <button key={s} onClick={() => setApplications(prev=>prev.map(a=>a.id===app.id?{...a,status:s}:a))} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#64748b", borderRadius: 6, padding: "3px 8px", fontSize: 9, fontWeight: 600, cursor: "pointer" }}>→ {s}</button>
                        ))}
                        <button onClick={() => setApplications(prev=>prev.filter(a=>a.id!==app.id))} style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", color: "#f87171", borderRadius: 6, padding: "3px 8px", fontSize: 9, fontWeight: 600, cursor: "pointer" }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════ COVER LETTER ════════ */}
        {tab === "cover" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "#f1f5f9", marginBottom: 6, letterSpacing: -0.5 }}>Cover Letter Generator</h2>
            <p style={{ color: "#64748b", fontSize: 14, marginBottom: 28 }}>AI writes a personalised, compelling cover letter tailored to the job and your background.</p>
            {(!jd||!cv) && <div style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.18)", borderRadius: 10, padding: 14, marginBottom: 20, color: "#fbbf24", fontSize: 13 }}>⚡ First add your JD and CV in the Resume Builder tab.</div>}
            <button onClick={() => generateCover()} disabled={coverLoading||!jd||!cv} style={{ ...btnPrimary(), opacity: coverLoading||!jd||!cv ? 0.5 : 1, marginBottom: 28 }}>
              {coverLoading ? "Writing cover letter…" : "✉ Generate Cover Letter"}
            </button>
            {coverResult && !coverResult.error && (
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <SectionTitle style={{ marginBottom: 0 }}>Cover Letter — {coverResult.subject}</SectionTitle>
                  <button onClick={() => { const blob = new Blob([coverResult.letter], {type:"text/plain"}); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href=url; a.download="cover_letter.txt"; a.click(); }} style={btnGhost({ fontSize: 11, padding: "6px 14px", color: "#60a5fa" })}>⬇ Download</button>
                </div>
                <div style={{ background: "#0d1424", borderRadius: 10, padding: 24, fontSize: 13, color: "#94a3b8", lineHeight: 2, whiteSpace: "pre-wrap" }}>{coverResult.letter}</div>
                <button onClick={() => navigator.clipboard.writeText(coverResult.letter)} style={{ ...btnGhost({ marginTop: 14, fontSize: 12 }) }}>Copy Cover Letter</button>
              </Card>
            )}
            {coverResult?.error && <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: 10, padding: 14, color: "#f87171", fontSize: 13 }}>⚠ {coverResult.error}</div>}
          </div>
        )}

        {/* ════════ INTERVIEW PREP ════════ */}
        {tab === "interview" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "#f1f5f9", marginBottom: 6, letterSpacing: -0.5 }}>Interview Preparation</h2>
            <p style={{ color: "#64748b", fontSize: 14, marginBottom: 28 }}>AI-powered insights, likely questions, STAR stories, and what to ask them.</p>
            {(!jd||!cv) && <div style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.18)", borderRadius: 10, padding: 14, marginBottom: 20, color: "#fbbf24", fontSize: 13 }}>⚡ Add your JD and CV in the Resume Builder tab first.</div>}
            <button onClick={() => generateInterview()} disabled={interviewLoading||!jd||!cv} style={{ ...btnPrimary(), opacity: interviewLoading||!jd||!cv ? 0.5 : 1, marginBottom: 28 }}>
              {interviewLoading ? "Preparing insights…" : "◆ Generate Interview Prep"}
            </button>
            {interviewResult && !interviewResult.error && (<>
              <Card delay={0}><SectionTitle>Key Themes</SectionTitle>{interviewResult.keyThemes?.map(t => <Tag key={t} text={t} type="green"/>)}</Card>
              <Card delay={0.1}>
                <SectionTitle>Likely Interview Questions</SectionTitle>
                {interviewResult.likelyQuestions?.map((q,i) => (
                  <div key={i} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: i < interviewResult.likelyQuestions.length-1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 6 }}>Q: {q.question}</div>
                    <div style={{ fontSize: 12, color: "#64748b", paddingLeft: 12, borderLeft: "2px solid rgba(245,158,11,0.3)", lineHeight: 1.6 }}>💡 {q.tip}</div>
                  </div>
                ))}
              </Card>
              <Card delay={0.2}>
                <SectionTitle>STAR Stories</SectionTitle>
                {interviewResult.starStories?.map((s,i) => (
                  <div key={i} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: i < interviewResult.starStories.length-1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b", marginBottom: 12 }}>⭐ {s.theme}</div>
                    {["situation","task","action","result"].map(k => (
                      <div key={k} style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 10, marginBottom: 6 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 1 }}>{k}</div>
                        <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>{s[k]}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </Card>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Card delay={0.3}><SectionTitle>Questions to Ask</SectionTitle>{interviewResult.questionsToAsk?.map((q,i) => <div key={i} style={{ fontSize: 12, color: "#94a3b8", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>→ {q}</div>)}</Card>
                <Card delay={0.3}><SectionTitle>Red Flags to Address</SectionTitle>{interviewResult.redFlags?.map((r,i) => <div key={i} style={{ fontSize: 12, color: "#94a3b8", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>• {r}</div>)}</Card>
              </div>
            </>)}
            {interviewResult?.error && <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: 10, padding: 14, color: "#f87171", fontSize: 13 }}>⚠ {interviewResult.error}</div>}
          </div>
        )}

        {/* ════════ PRICING ════════ */}
        {tab === "pricing" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <h2 style={{ fontSize: 36, fontWeight: 800, color: "#f1f5f9", marginBottom: 10, letterSpacing: -1 }}>Simple, Transparent Pricing</h2>
              <p style={{ color: "#64748b", fontSize: 15 }}>Start free. Upgrade when you're ready to land the role.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18, marginBottom: 60 }}>
              {TIERS.map((t,i) => (
                <div key={t.name} style={{ background: t.highlight ? "rgba(245,158,11,0.05)" : "rgba(255,255,255,0.02)", border: `1px solid ${t.highlight ? "rgba(245,158,11,0.25)" : "rgba(255,255,255,0.07)"}`, borderRadius: 16, padding: 28, position: "relative", transform: t.highlight ? "scale(1.02)" : "scale(1)" }}>
                  {t.highlight && <div style={{ position: "absolute", top: 14, right: 14, background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#0f172a", fontSize: 9, fontWeight: 800, padding: "3px 10px", borderRadius: 20, letterSpacing: 1, textTransform: "uppercase" }}>Most Popular</div>}
                  <div style={{ fontSize: 12, fontWeight: 700, color: t.color, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 14 }}>{t.name}</div>
                  <div style={{ marginBottom: 22 }}>
                    <span style={{ fontSize: 38, fontWeight: 800, color: "#f1f5f9" }}>{t.price}</span>
                    {t.period && <span style={{ fontSize: 13, color: "#64748b" }}>{t.period}</span>}
                  </div>
                  <div style={{ marginBottom: 28 }}>
                    {t.features.map(f => <div key={f} style={{ display: "flex", gap: 8, padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12, color: "#94a3b8" }}><span style={{ color: t.color }}>✓</span>{f}</div>)}
                  </div>
                  <button
                    onClick={() => {
                      if (t.gumroad) window.open(t.gumroad, "_blank");
                      else alert("You're already on the free plan!");
                    }}
                    style={{ width: "100%", padding: 12, background: t.highlight ? "linear-gradient(135deg,#f59e0b,#d97706)" : "rgba(255,255,255,0.04)", border: t.highlight ? "none" : `1px solid ${t.color}40`, color: t.highlight ? "#0f172a" : t.color, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    {t.cta}
                  </button>
                  {t.gumroad && <div style={{ fontSize: 10, color: "#475569", textAlign: "center", marginTop: 8 }}>Secure payment via Gumroad • Cancel anytime</div>}
                </div>
              ))}
            </div>

            <Card>
              <SectionTitle>Platform Integrations</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
                {[
                  { label: "LinkedIn PDF Import", detail: "Download your LinkedIn profile → paste into CV box → AI extracts everything", status: "Live", color: "#34d399" },
                  { label: "Indeed Job Listings", detail: "Search and import job descriptions directly", status: "Live", color: "#34d399" },
                  { label: "Glassdoor Salary Data", detail: "Salary insights integrated into job search", status: "Live", color: "#34d399" },
                  { label: "Reed / Monster UK", detail: "UK job listings and direct apply links", status: "Beta", color: "#fbbf24" },
                  { label: "Browser Extension", detail: "Auto-fill any job site form with your tailored resume", status: "Coming Soon", color: "#94a3b8" },
                  { label: "Workday / Greenhouse", detail: "Direct ATS integration for Fortune 500 apply flows", status: "Coming Soon", color: "#94a3b8" },
                ].map(item => (
                  <div key={item.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>{item.label}</div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: item.color, background: item.color+"18", padding: "2px 8px", borderRadius: 10 }}>{item.status}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.5 }}>{item.detail}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "20px 32px", textAlign: "center", color: "#334155", fontSize: 11 }}>
        <span style={{ color: "#f59e0b", fontWeight: 700 }}>CareerOS</span> — AI-powered one-stop career platform. Resume · Cover Letter · Job Search · Apply · Track · Interview.
      </div>
    </div>
  );
}
