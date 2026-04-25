import { useState, useRef, useEffect } from "react";

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
  { name: "Free", price: "£0", features: ["3 tailored resumes/mo", "Basic ATS score", "5 job searches/day", "1 cover letter/mo", "PDF export"], cta: "Get Started", highlight: false, color: "#64748b" },
  { name: "Pro", price: "£19", period: "/mo", features: ["Unlimited resume tailoring", "Advanced ATS scoring", "Unlimited job search", "Unlimited cover letters", "Application tracker", "Interview prep AI", "LinkedIn import", "1-click apply assist"], cta: "Start Free Trial", highlight: true, color: "#f59e0b" },
  { name: "Enterprise", price: "£99", period: "/mo", features: ["Everything in Pro", "Recruiter dashboard", "Bulk optimization (100+)", "Team workspace", "API access", "White-label option", "Dedicated CSM", "Custom integrations"], cta: "Contact Sales", highlight: false, color: "#10b981" },
];

const STATUS_COLORS = {
  "Saved": { bg: "rgba(100,116,139,0.12)", text: "#94a3b8", border: "rgba(100,116,139,0.25)" },
  "Applied": { bg: "rgba(59,130,246,0.12)", text: "#60a5fa", border: "rgba(59,130,246,0.25)" },
  "Interview": { bg: "rgba(245,158,11,0.12)", text: "#fbbf24", border: "rgba(245,158,11,0.25)" },
  "Offer": { bg: "rgba(16,185,129,0.12)", text: "#34d399", border: "rgba(16,185,129,0.25)" },
  "Rejected": { bg: "rgba(239,68,68,0.1)", text: "#f87171", border: "rgba(239,68,68,0.2)" },
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

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

async function callClaude(userPrompt, systemPrompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt || "You are an elite resume strategist. Return only valid JSON, no markdown, no backticks.",
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  const data = await res.json();
  const text = data.content?.map(b => b.text || "").join("") || "{}";
  return JSON.parse(text.replace(/```json|```/g, "").trim());
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

// ─── MAIN APP ────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState("builder");
  const [jd, setJd] = useState("");
  const [cv, setCv] = useState("");
  const [resumeResult, setResumeResult] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumePhase, setResumePhase] = useState("");
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

  const resultRef = useRef(null);

  const phases = ["Parsing job description…", "Profiling candidate…", "Semantic matching…", "Calculating ATS score…", "Generating resume…", "Finalising…"];

  // ── Resume Generation ──
  async function generateResume(customJd) {
    const targetJd = customJd || jd;
    if (!targetJd.trim() || !cv.trim()) return;
    setResumeLoading(true);
    setResumeResult(null);
    let pi = 0;
    const interval = setInterval(() => { setResumePhase(phases[pi++ % phases.length]); }, 1100);
    try {
      const result = await callClaude(`
You are an elite AI resume strategist. Return ONLY this JSON structure:
{
  "jdAnalysis": { "role": "string", "company": "string", "mustHave": ["s1","s2"], "niceToHave": ["s1"], "keywords": ["k1","k2","k3","k4","k5","k6"], "seniorityLevel": "string", "hiringIntent": "string" },
  "matchScore": 82,
  "gapAnalysis": { "strengths": ["s1","s2","s3"], "gaps": ["g1","g2"], "transferable": ["t1","t2"] },
  "resume": {
    "name": "string", "contact": "string",
    "summary": "3-sentence executive summary tailored precisely to this JD",
    "skills": ["s1","s2","s3","s4","s5","s6","s7","s8"],
    "experience": [
      { "title": "string", "company": "string", "period": "string", "bullets": ["metric-driven achievement","metric-driven achievement","metric-driven achievement"] }
    ],
    "education": "string"
  },
  "improvements": ["actionable tip 1","actionable tip 2","actionable tip 3","actionable tip 4"]
}

JOB DESCRIPTION: ${targetJd}
CANDIDATE CV: ${cv}

Rules: Never fabricate. Rewrite bullets with strong action verbs + metrics. Return ONLY JSON.`);
      setResumeResult(result);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch {
      setResumeResult({ error: "Generation failed. Check inputs and retry." });
    } finally {
      clearInterval(interval);
      setResumePhase("");
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
      const result = await callClaude(`Write a compelling, personalised cover letter. Return ONLY JSON:
{"subject":"Application for [Role] – [Name]","letter":"Full 4-paragraph cover letter. No 'I am writing to apply' opener. Professional yet warm. Specific to the role and company."}
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
      const result = await callClaude(`Generate interview prep. Return ONLY JSON:
{
  "keyThemes":["t1","t2","t3","t4"],
  "likelyQuestions":[{"question":"Q1","tip":"tip1"},{"question":"Q2","tip":"tip2"},{"question":"Q3","tip":"tip3"},{"question":"Q4","tip":"tip4"},{"question":"Q5","tip":"tip5"}],
  "starStories":[{"theme":"Leadership","situation":"...","task":"...","action":"...","result":"..."},{"theme":"Data-driven decision","situation":"...","task":"...","action":"...","result":"..."}],
  "questionsToAsk":["q1","q2","q3"],
  "redFlags":["concern and how to address it"]
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

  // ── Apply to job ──
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

  // ── Connect platform ──
  function connectPlatform(id) {
    setConnectedPlatforms(prev => prev.includes(id) ? prev : [...prev, id]);
  }

  // ── Import LinkedIn ──
  function importLinkedIn() {
    setCv(SAMPLE_CV);
    setLinkedInImported(true);
    setTimeout(() => setLinkedInImported(false), 2000);
  }

  // ── 1-click prep & apply ──
  async function oneClickApply(job) {
    setJd(job.description + "\n\n" + job.title + " at " + job.company);
    if (!cv) setCv(SAMPLE_CV);
    await generateResume(job.description + "\n" + job.title + " at " + job.company);
    setTab("builder");
  }

  const filteredJobs = jobs.filter(j => jobFilter === "all" || j.platform === jobFilter);

  // ─── INPUT STYLES ───
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

          <button style={btnPrimary({ padding: "8px 18px", fontSize: 12, borderRadius: 8 })}>↑ Upgrade Pro</button>
        </div>
      </div>

      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "36px 32px 80px" }}>

        {/* ════════════════════════════════════════════════
            TAB: RESUME BUILDER
        ════════════════════════════════════════════════ */}
        {tab === "builder" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            {/* Hero */}
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
                <div style={{ fontSize: 12, color: "#64748b" }}>Connect LinkedIn to auto-import your experience, skills, and education.</div>
              </div>
              <button onClick={importLinkedIn} style={{ background: linkedInImported ? "rgba(16,185,129,0.15)" : "rgba(0,119,181,0.15)", border: `1px solid ${linkedInImported ? "rgba(16,185,129,0.3)" : "rgba(0,119,181,0.3)"}`, color: linkedInImported ? "#34d399" : "#60a5fa", borderRadius: 8, padding: "8px 18px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                {linkedInImported ? "✓ Imported!" : "Import Profile →"}
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

            <div style={{ display: "flex", gap: 10, marginBottom: 40, flexWrap: "wrap" }}>
              <button onClick={() => generateResume()} disabled={resumeLoading || !jd || !cv} style={{ ...btnPrimary(), opacity: resumeLoading || !jd || !cv ? 0.5 : 1 }}>
                {resumeLoading ? <><Spinner/> {resumePhase}</> : "✦ Generate Tailored Resume"}
              </button>
              {resumeResult && !resumeResult.error && (
                <>
                  <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(resumeResult.resume, null, 2)); setCopied(true); setTimeout(() => setCopied(false), 1800); }} style={btnGhost({ color: copied ? "#34d399" : "#94a3b8" })}>{copied ? "✓ Copied" : "Copy Resume"}</button>
                  <button onClick={() => { setTab("cover"); if (!coverResult) generateCover(); }} style={btnGhost({ color: "#a78bfa", borderColor: "rgba(139,92,246,0.25)" })}>✉ Cover Letter</button>
                  <button onClick={() => { setTab("interview"); if (!interviewResult) generateInterview(); }} style={btnGhost({ color: "#60a5fa", borderColor: "rgba(59,130,246,0.25)" })}>◆ Interview Prep</button>
                </>
              )}
            </div>

            {/* Results */}
            {resumeResult && !resumeResult.error && (
              <div ref={resultRef}>
                {/* Score row */}
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

                {/* Gap Analysis */}
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

                {/* Resume output */}
                <Card delay={0.2}>
                  <SectionTitle>✦ Tailored Resume</SectionTitle>
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
                            {exp.bullets?.map((b,j) => <div key={j} style={{ fontSize: 12, color: "#94a3b8", paddingLeft: 14, lineHeight: 1.7, position: "relative", marginBottom: 2 }}><span style={{ position: "absolute", left: 0, color: "#f59e0b" }}>▸</span>{b}</div>)}
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

                {/* Improvements */}
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
            {resumeResult?.error && <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: 16, color: "#f87171", fontSize: 13 }}>⚠ {resumeResult.error}</div>}
          </div>
        )}

        {/* ════════════════════════════════════════════════
            TAB: JOB SEARCH
        ════════════════════════════════════════════════ */}
        {tab === "jobs" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: "#f1f5f9", marginBottom: 6, letterSpacing: -0.5 }}>Job Search</h2>
              <p style={{ color: "#64748b", fontSize: 14 }}>Search across LinkedIn, Indeed, Glassdoor, Reed, Monster & more. AI scores each job against your profile.</p>
            </div>

            {/* Platform connectors */}
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

            {/* Search bar */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              <input style={{ ...inputSt, flex: 1 }} placeholder="Search jobs, companies, skills… (e.g. Product Manager AI London)" value={jobSearch} onChange={e => setJobSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && searchJobs()}/>
              <button onClick={searchJobs} disabled={jobSearching} style={btnPrimary({ flexShrink: 0 })}>
                {jobSearching ? <><Spinner/> Searching…</> : "Search Jobs"}
              </button>
            </div>

            {/* Platform filter */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {[{id:"all",name:"All Platforms"},...JOB_PLATFORMS].map(p => (
                <button key={p.id} onClick={() => setJobFilter(p.id)} style={{ padding: "5px 14px", borderRadius: 20, background: jobFilter===p.id ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${jobFilter===p.id ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.08)"}`, color: jobFilter===p.id ? "#f59e0b" : "#64748b", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                  {p.name}
                </button>
              ))}
            </div>

            {/* Job listings */}
            {filteredJobs.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "#475569" }}>No jobs found. Try a different search.</div>
            ) : filteredJobs.map((job, i) => (
              <div key={job.id} style={{ background: "rgba(255,255,255,0.03)", border: selectedJob===job.id ? "1px solid rgba(245,158,11,0.3)" : "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 18, marginBottom: 12, animation: `fadeIn 0.4s ease forwards`, animationDelay: `${i*0.06}s`, opacity: 0, cursor: "pointer", transition: "border-color 0.2s" }} onClick={() => setSelectedJob(selectedJob===job.id ? null : job.id)}>
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
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <ScoreRing score={job.match} size={56}/>
                    <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: 1 }}>Match</div>
                  </div>
                </div>

                {selectedJob === job.id && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)", animation: "slideUp 0.3s ease" }}>
                    <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7, marginBottom: 16 }}>{job.description}</p>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button onClick={(e) => { e.stopPropagation(); oneClickApply(job); }} style={btnPrimary({ fontSize: 13 })}>
                        {resumeLoading ? <><Spinner/> Tailoring resume…</> : "✦ Tailor & Apply (1-click)"}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); applyToJob(job); }} disabled={applyingJob===job.id} style={btnGhost({ color: "#60a5fa", borderColor: "rgba(59,130,246,0.25)", fontSize: 13 })}>
                        {applyingJob===job.id ? <><Spinner/> Applying…</> : applySuccess===job.id ? "✓ Applied!" : `Apply on ${JOB_PLATFORMS.find(p=>p.id===job.platform)?.name}`}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setApplications(prev => prev.find(a=>a.title===job.title) ? prev : [...prev, {id:Date.now(), title:job.title, company:job.company, platform:job.platform, status:"Saved", appliedDate:"—", match:job.match}]); }} style={btnGhost({ fontSize: 13 })}>
                        ☆ Save
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ════════════════════════════════════════════════
            TAB: APPLICATION TRACKER
        ════════════════════════════════════════════════ */}
        {tab === "tracker" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: "#f1f5f9", marginBottom: 6, letterSpacing: -0.5 }}>Application Tracker</h2>
              <p style={{ color: "#64748b", fontSize: 14 }}>Track every application in one place. Know exactly where you stand.</p>
            </div>

            {/* Stats */}
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

            {/* Kanban columns */}
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
                      {app.appliedDate !== "—" && <div style={{ fontSize: 10, color: "#334155", marginTop: 6 }}>Applied: {app.appliedDate}</div>}
                      {/* Status buttons */}
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

        {/* ════════════════════════════════════════════════
            TAB: COVER LETTER
        ════════════════════════════════════════════════ */}
        {tab === "cover" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "#f1f5f9", marginBottom: 6, letterSpacing: -0.5 }}>Cover Letter Generator</h2>
            <p style={{ color: "#64748b", fontSize: 14, marginBottom: 28 }}>AI writes a personalised, compelling cover letter tailored to the job and your background.</p>
            {(!jd||!cv) && <div style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.18)", borderRadius: 10, padding: 14, marginBottom: 20, color: "#fbbf24", fontSize: 13 }}>⚡ First add your JD and CV in the Resume Builder tab, then generate here.</div>}
            <button onClick={() => generateCover()} disabled={coverLoading||!jd||!cv} style={{ ...btnPrimary(), opacity: coverLoading||!jd||!cv ? 0.5 : 1, marginBottom: 28 }}>
              {coverLoading ? <><Spinner/> Writing cover letter…</> : "✉ Generate Cover Letter"}
            </button>
            {coverResult && !coverResult.error && (
              <Card>
                <SectionTitle>Cover Letter — {coverResult.subject}</SectionTitle>
                <div style={{ background: "#0d1424", borderRadius: 10, padding: 24, fontSize: 13, color: "#94a3b8", lineHeight: 2, whiteSpace: "pre-wrap" }}>{coverResult.letter}</div>
                <button onClick={() => navigator.clipboard.writeText(coverResult.letter)} style={{ ...btnGhost({ marginTop: 14, fontSize: 12 }) }}>Copy Cover Letter</button>
              </Card>
            )}
            {coverResult?.error && <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: 10, padding: 14, color: "#f87171", fontSize: 13 }}>⚠ {coverResult.error}</div>}
          </div>
        )}

        {/* ════════════════════════════════════════════════
            TAB: INTERVIEW PREP
        ════════════════════════════════════════════════ */}
        {tab === "interview" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "#f1f5f9", marginBottom: 6, letterSpacing: -0.5 }}>Interview Preparation</h2>
            <p style={{ color: "#64748b", fontSize: 14, marginBottom: 28 }}>AI-powered insights, likely questions, STAR stories, and what to ask them.</p>
            {(!jd||!cv) && <div style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.18)", borderRadius: 10, padding: 14, marginBottom: 20, color: "#fbbf24", fontSize: 13 }}>⚡ Add your JD and CV in the Resume Builder tab first.</div>}
            <button onClick={() => generateInterview()} disabled={interviewLoading||!jd||!cv} style={{ ...btnPrimary(), opacity: interviewLoading||!jd||!cv ? 0.5 : 1, marginBottom: 28 }}>
              {interviewLoading ? <><Spinner/> Preparing insights…</> : "◆ Generate Interview Prep"}
            </button>
            {interviewResult && !interviewResult.error && (<>
              <Card delay={0}>
                <SectionTitle>Key Themes to Emphasise</SectionTitle>
                {interviewResult.keyThemes?.map(t => <Tag key={t} text={t} type="green"/>)}
              </Card>
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
                <SectionTitle>STAR Stories to Prepare</SectionTitle>
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
                <Card delay={0.3}>
                  <SectionTitle>Questions to Ask Them</SectionTitle>
                  {interviewResult.questionsToAsk?.map((q,i) => <div key={i} style={{ fontSize: 12, color: "#94a3b8", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>→ {q}</div>)}
                </Card>
                <Card delay={0.3}>
                  <SectionTitle>Red Flags to Address</SectionTitle>
                  {interviewResult.redFlags?.map((r,i) => <div key={i} style={{ fontSize: 12, color: "#94a3b8", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>• {r}</div>)}
                </Card>
              </div>
            </>)}
            {interviewResult?.error && <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: 10, padding: 14, color: "#f87171", fontSize: 13 }}>⚠ {interviewResult.error}</div>}
          </div>
        )}

        {/* ════════════════════════════════════════════════
            TAB: PRICING
        ════════════════════════════════════════════════ */}
        {tab === "pricing" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <h2 style={{ fontSize: 36, fontWeight: 800, color: "#f1f5f9", marginBottom: 10, letterSpacing: -1 }}>Simple, Transparent Pricing</h2>
              <p style={{ color: "#64748b", fontSize: 15 }}>Start free. Upgrade when you're ready to land the role.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18, marginBottom: 60 }}>
              {TIERS.map((t,i) => (
                <div key={t.name} style={{ background: t.highlight ? "rgba(245,158,11,0.05)" : "rgba(255,255,255,0.02)", border: `1px solid ${t.highlight ? "rgba(245,158,11,0.25)" : "rgba(255,255,255,0.07)"}`, borderRadius: 16, padding: 28, position: "relative", transform: t.highlight ? "scale(1.02)" : "scale(1)", animation: `fadeIn 0.4s ease forwards`, animationDelay: `${i*0.1}s`, opacity: 0 }}>
                  {t.highlight && <div style={{ position: "absolute", top: 14, right: 14, background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#0f172a", fontSize: 9, fontWeight: 800, padding: "3px 10px", borderRadius: 20, letterSpacing: 1, textTransform: "uppercase" }}>Most Popular</div>}
                  <div style={{ fontSize: 12, fontWeight: 700, color: t.color, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 14 }}>{t.name}</div>
                  <div style={{ marginBottom: 22 }}>
                    <span style={{ fontSize: 38, fontWeight: 800, color: "#f1f5f9" }}>{t.price}</span>
                    {t.period && <span style={{ fontSize: 13, color: "#64748b" }}>{t.period}</span>}
                  </div>
                  <div style={{ marginBottom: 28 }}>
                    {t.features.map(f => <div key={f} style={{ display: "flex", gap: 8, padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12, color: "#94a3b8" }}><span style={{ color: t.color }}>✓</span>{f}</div>)}
                  </div>
                  <button style={{ width: "100%", padding: 12, background: t.highlight ? "linear-gradient(135deg,#f59e0b,#d97706)" : "rgba(255,255,255,0.04)", border: t.highlight ? "none" : `1px solid ${t.color}40`, color: t.highlight ? "#0f172a" : t.color, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{t.cta}</button>
                </div>
              ))}
            </div>

            {/* Integrations overview */}
            <Card>
              <SectionTitle>Platform Integrations Roadmap</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
                {[
                  { label: "LinkedIn OAuth", detail: "Profile import, Easy Apply deep-link, job sync", status: "Live", color: "#34d399" },
                  { label: "Indeed Publisher API", detail: "Job listings, apply redirect, salary data", status: "Live", color: "#34d399" },
                  { label: "Glassdoor API", detail: "Salary insights, company reviews, job listings", status: "Live", color: "#34d399" },
                  { label: "Reed Jobs API", detail: "UK job market, direct apply, recruiter contact", status: "Beta", color: "#fbbf24" },
                  { label: "Monster / TotalJobs", detail: "Global + UK listings, one-click apply assist", status: "Beta", color: "#fbbf24" },
                  { label: "Browser Extension", detail: "Auto-fill any job site form with tailored resume", status: "Q3 2025", color: "#94a3b8" },
                  { label: "Workday / Greenhouse", detail: "ATS platform direct integration, form auto-fill", status: "Q3 2025", color: "#94a3b8" },
                  { label: "Slack / Email Alerts", detail: "New job matches, interview reminders, follow-ups", status: "Q4 2025", color: "#94a3b8" },
                  { label: "Calendar Integration", detail: "Interview scheduling, reminder automation", status: "Q4 2025", color: "#94a3b8" },
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

      {/* Footer */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "20px 32px", textAlign: "center", color: "#334155", fontSize: 11 }}>
        <span style={{ color: "#f59e0b", fontWeight: 700 }}>CareerOS</span> — AI-powered one-stop career platform. Resume · Cover Letter · Job Search · Apply · Track · Interview.
      </div>
    </div>
  );
}
