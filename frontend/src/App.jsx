import { useState, useRef, useEffect } from "react";
import { supabase, signUp, signIn, signInWithGoogle, signOut, getUserProfile, saveResume, getUserResumes, saveApplication, getUserApplications, updateApplicationStatus } from "./supabase";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const RESUME_FORMATS = [
  { id:"classic", name:"Classic", desc:"Traditional, ATS-safe", icon:"📄", accentColor:"#1e3a5f", fontFamily:"'Georgia', serif" },
  { id:"modern", name:"Modern", desc:"Two-column, contemporary", icon:"✨", accentColor:"#0d9488", fontFamily:"'Helvetica Neue', sans-serif" },
  { id:"executive", name:"Executive", desc:"C-suite level", icon:"👔", accentColor:"#1e3a8a", fontFamily:"'Times New Roman', serif" },
  { id:"minimal", name:"Minimal", desc:"Clean whitespace", icon:"⬜", accentColor:"#374151", fontFamily:"'Garamond', serif" },
  { id:"ats", name:"ATS-Safe", desc:"Plain text, max parse", icon:"🤖", accentColor:"#0f766e", fontFamily:"'Courier New', monospace" },
  { id:"creative", name:"Creative", desc:"Bold, for creative roles", icon:"🎨", accentColor:"#7c3aed", fontFamily:"'Helvetica Neue', sans-serif" },
];

const TABS = [
  { id:"builder", label:"Resume Builder" },
  { id:"jobs", label:"Job Search" },
  { id:"tracker", label:"Applications" },
  { id:"history", label:"Resume History", pro: true },
  { id:"cover", label:"Cover Letter" },
  { id:"interview", label:"Interview Prep", pro: true },
  { id:"pricing", label:"Pricing" },
];

const COUNTRIES = [
  { code:"uk", label:"🇬🇧 UK" },
  { code:"us", label:"🇺🇸 US" },
  { code:"in", label:"🇮🇳 India" },
];

const JOB_PLATFORMS = [
  { id:"linkedin", name:"LinkedIn", color:"#0077b5", bg:"#e8f4fd", border:"#bfdbfe" },
  { id:"indeed", name:"Indeed", color:"#003A9B", bg:"#eef2ff", border:"#c7d2fe" },
  { id:"reed", name:"Reed", color:"#cc0000", bg:"#fef2f2", border:"#fecaca" },
  { id:"adzuna", name:"Adzuna", color:"#0891b2", bg:"#ecfeff", border:"#a5f3fc" },
  { id:"jsearch", name:"JSearch", color:"#7c3aed", bg:"#f5f3ff", border:"#ddd6fe" },
];

const TIERS = [
  { name:"Free", price:"£0", period:"forever", features:["3 resumes/month","Basic ATS score","5 searches/day","1 cover letter/month","Classic format only"], cta:"Get Started", highlight:false, color:"#6b7280", gumroad:null },
  { name:"Pro", price:"£9.99", period:"/month", badge:"Most Popular", features:["Unlimited resumes","ATS + Human scores","Salary intelligence","All 6 formats + preview","Unlimited searches","Unlimited cover letters","Interview prep AI","Resume history","Persistent tracker"], cta:"Start Pro — £9.99/mo", highlight:true, color:"#0d9488", gumroad:"https://gumroad.com/l/careeros-pro" },
  { name:"Enterprise", price:"£29.99", period:"/month", features:["Everything in Pro","Team workspace","Bulk optimization","API access","Recruiter dashboard","White-label option"], cta:"Start Enterprise", highlight:false, color:"#4f46e5", gumroad:"https://gumroad.com/l/careeros-enterprise" },
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
  { icon:"✨", text:"Finalising..." },
];

const SAMPLE_CV = `Sarah Chen | sarah@email.com | +44 7700 900123 | London, UK

EXPERIENCE
Senior Product Manager — FinTech (2021–2024)
• Led product strategy, growing ARR from £2M to £8M
• Coordinated 20+ engineers across 3 product lines
• Launched ML fraud detection, reducing chargebacks by 41%

Product Manager — Consumer App (2019–2021)
• Grew mobile app from MVP to 500k users
• Improved onboarding conversion by 28% via A/B tests

SKILLS: Product strategy, SQL, Figma, JIRA, Agile/Scrum, Python

EDUCATION: B.Sc Computer Science, University of Edinburgh, 2019`;

// ─── RESUME HTML ──────────────────────────────────────────────────────────────
function generateResumeHTML(resume, format) {
  if (!resume) return `<html><body style="font-family:sans-serif;padding:40px;color:#9ca3af;text-align:center"><p style="margin-top:80px">Generate a resume first</p></body></html>`;
  const f = RESUME_FORMATS.find(x=>x.id===format)||RESUME_FORMATS[0];
  const s = { name:resume.name||"", contact:resume.contact||"", summary:resume.summary||"", skills:resume.skills||[], experience:resume.experience||[], education:resume.education||"" };
  const expHTML = s.experience.map(e=>`<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between"><strong style="font-size:13px">${e.title}</strong><span style="font-size:11px;color:#888">${e.period}</span></div><div style="font-size:12px;color:#555;margin-bottom:3px">${e.company}</div>${e.bullets?.map(b=>`<div style="font-size:12px;color:#374151;padding-left:12px;position:relative;margin-bottom:2px"><span style="position:absolute;left:0;color:${f.accentColor}">•</span>${b}</div>`).join("")||""}</div>`).join("");
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${s.name}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:${f.fontFamily};color:#1a1a1a;background:#fff;max-width:750px;margin:32px auto;padding:44px}.st{font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${f.accentColor};margin:16px 0 7px;border-bottom:1px solid #e5e7eb;padding-bottom:3px}.sk{display:flex;flex-wrap:wrap;gap:5px}.s{padding:3px 9px;border:1px solid ${f.accentColor}30;border-radius:3px;font-size:11px}.ft{margin-top:24px;padding-top:8px;border-top:1px solid #e5e7eb;font-size:10px;color:#9ca3af;text-align:center}@media print{body{margin:0;padding:32px}}</style></head><body><h1 style="font-size:24px;font-weight:700;color:${f.accentColor};margin-bottom:3px">${s.name}</h1><div style="font-size:12px;color:#555;margin-bottom:18px;border-bottom:2px solid ${f.accentColor};padding-bottom:10px">${s.contact}</div><div class="st">Professional Summary</div><div style="font-size:13px;line-height:1.75;color:#374151;margin-bottom:8px">${s.summary}</div><div class="st">Core Skills</div><div class="sk" style="margin-bottom:8px">${s.skills.map(x=>`<span class="s">${x}</span>`).join("")}</div><div class="st">Experience</div>${expHTML}<div class="st">Education</div><div style="font-size:12px;color:#374151">${s.education}</div><div class="ft">Generated by CareerOS · careeros-rose.vercel.app</div></body></html>`;
}

function downloadResume(resume, format) {
  const html = generateResumeHTML(resume, format);
  const blob = new Blob([html], {type:"text/html;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href=url; a.download=`${(resume.name||"Resume").replace(/\s+/g,"_")}_${format}.html`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── API ──────────────────────────────────────────────────────────────────────
async function callClaude(prompt, maxTokens=2500) {
  const res = await fetch("/api/claude", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ model:"claude-sonnet-4-5", max_tokens:maxTokens,
      system:"You are an expert resume writer. Return only valid JSON. No markdown, no backticks.",
      messages:[{role:"user",content:prompt}] }),
  });
  const data = await res.json();
  const text = data.content?.map(b=>b.text||"").join("")||"{}";
  return JSON.parse(text.replace(/```json|```/g,"").trim());
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────
function ScoreRing({score,size=72,color}) {
  const r=(size-8)/2,circ=2*Math.PI*r,s=Math.max(0,Math.min(100,score||0));
  const c=color||(s>=80?"#16a34a":s>=65?"#d97706":s>0?"#dc2626":"#d1d5db");
  return (
    <svg width={size} height={size} style={{transform:"rotate(-90deg)",flexShrink:0}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={5}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={c} strokeWidth={5}
        strokeDasharray={`${(s/100)*circ} ${circ}`} strokeLinecap="round"/>
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
  return <div style={{background:"#fff",border:"1px solid #e8ecf0",borderRadius:12,padding:20,marginBottom:14,boxShadow:"0 1px 3px rgba(0,0,0,0.04)",...style}}>{children}</div>;
}

function SLabel({children,color="#0d9488"}) {
  return <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color,textTransform:"uppercase",marginBottom:12}}>{children}</div>;
}

function FormatPicker({resume,selected,onSelect,onDownload}) {
  return (
    <div>
      <div style={{fontSize:12,fontWeight:600,color:"#374151",marginBottom:10}}>Choose format:</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
        {RESUME_FORMATS.map(f=>(
          <div key={f.id} onClick={()=>onSelect(f.id)}
            style={{border:`2px solid ${selected===f.id?f.accentColor:"#e8ecf0"}`,borderRadius:8,padding:10,cursor:"pointer",background:selected===f.id?f.accentColor+"08":"#fafbfc",transition:"all 0.15s",textAlign:"center"}}>
            <div style={{fontSize:22,marginBottom:4}}>{f.icon}</div>
            <div style={{fontSize:11,fontWeight:700,color:selected===f.id?f.accentColor:"#374151"}}>{f.name}</div>
            <div style={{fontSize:9,color:"#9ca3af"}}>{f.desc}</div>
          </div>
        ))}
      </div>
      <div style={{border:"1px solid #e8ecf0",borderRadius:8,overflow:"hidden",marginBottom:10}}>
        <div style={{background:"#f8fafc",borderBottom:"1px solid #e8ecf0",padding:"7px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:11,color:"#6b7280"}}>Preview — {RESUME_FORMATS.find(f=>f.id===selected)?.name}</span>
          <button onClick={()=>onDownload(selected)} style={{background:"#0d9488",color:"#fff",border:"none",borderRadius:5,padding:"4px 12px",fontSize:11,fontWeight:600,cursor:"pointer"}}>⬇ Download</button>
        </div>
        <iframe srcDoc={generateResumeHTML(resume,selected)} style={{width:"100%",height:380,border:"none"}} title="Preview"/>
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {RESUME_FORMATS.map(f=>(
          <button key={f.id} onClick={()=>onDownload(f.id)}
            style={{background:selected===f.id?"#0d9488":"#fff",border:`1px solid ${selected===f.id?"#0d9488":"#e8ecf0"}`,color:selected===f.id?"#fff":"#374151",borderRadius:5,padding:"5px 10px",fontSize:11,cursor:"pointer"}}>
            {f.icon} {f.name}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── AUTH MODAL ───────────────────────────────────────────────────────────────
function AuthModal({onClose, onSuccess, initialMode="login"}) {
  const [mode,setMode]=useState(initialMode);
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [name,setName]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");

  const inp={width:"100%",boxSizing:"border-box",background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"11px 14px",color:"#111827",fontSize:13,fontFamily:"inherit",outline:"none",marginBottom:10,display:"block"};

  async function handleSubmit() {
    if (!email||!password) { setError("Please enter email and password"); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      if (mode==="signup") {
        const {data,error:e} = await signUp(email,password,name||email.split("@")[0]);
        if (e) { setError(e.message||"Signup failed"); return; }
        if (data?.user) {
          setSuccess("Account created! Signing you in...");
          setTimeout(()=>{onSuccess(data.user);onClose();},1500);
        } else {
          setSuccess("Check your email to confirm your account, then sign in.");
        }
      } else {
        const {data,error:e} = await signIn(email,password);
        if (e) { setError(e.message||"Invalid email or password"); return; }
        if (data?.user) { onSuccess(data.user); onClose(); }
      }
    } catch(e) {
      setError("Something went wrong. Please try again.");
    } finally { setLoading(false); }
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div style={{background:"#fff",borderRadius:16,padding:28,width:"100%",maxWidth:400,boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}} onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:30,height:30,borderRadius:8,background:"linear-gradient(135deg,#0d9488,#0891b2)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:15,color:"#fff"}}>C</div>
            <div>
              <div style={{fontSize:15,fontWeight:800,color:"#111827"}}>{mode==="login"?"Welcome back":"Join CareerOS"}</div>
              <div style={{fontSize:11,color:"#9ca3af"}}>{mode==="login"?"Sign in to your account":"Free forever · No credit card"}</div>
            </div>
          </div>
          <button onClick={onClose} style={{background:"#f1f5f9",border:"none",borderRadius:"50%",width:28,height:28,cursor:"pointer",fontSize:14,color:"#6b7280",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>

        {/* Google */}
        <button onClick={async()=>{setLoading(true);await signInWithGoogle();setLoading(false);}}
          style={{width:"100%",padding:"10px",background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:14,fontWeight:500,color:"#374151"}}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <div style={{flex:1,height:1,background:"#e8ecf0"}}/><span style={{fontSize:11,color:"#9ca3af"}}>or</span><div style={{flex:1,height:1,background:"#e8ecf0"}}/>
        </div>

        {mode==="signup"&&<input style={inp} placeholder="Your name" value={name} onChange={e=>setName(e.target.value)}/>}
        <input style={inp} placeholder="Email address" type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()}/>
        <input style={{...inp,marginBottom:14}} placeholder="Password (min 6 characters)" type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()}/>

        {error&&<div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:7,padding:"9px 12px",color:"#dc2626",fontSize:12,marginBottom:12}}>⚠ {error}</div>}
        {success&&<div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:7,padding:"9px 12px",color:"#16a34a",fontSize:12,marginBottom:12}}>✓ {success}</div>}

        <button onClick={handleSubmit} disabled={loading}
          style={{width:"100%",padding:"12px",background:"linear-gradient(135deg,#0d9488,#0891b2)",color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:700,cursor:loading?"not-allowed":"pointer",opacity:loading?0.7:1,marginBottom:14}}>
          {loading?"Please wait...":(mode==="login"?"Sign In →":"Create Free Account →")}
        </button>

        <div style={{textAlign:"center",fontSize:12,color:"#6b7280"}}>
          {mode==="login"
            ?<span>No account? <button onClick={()=>{setMode("signup");setError("");}} style={{background:"none",border:"none",color:"#0d9488",fontWeight:600,cursor:"pointer",fontSize:12}}>Sign up free</button></span>
            :<span>Have an account? <button onClick={()=>{setMode("login");setError("");}} style={{background:"none",border:"none",color:"#0d9488",fontWeight:600,cursor:"pointer",fontSize:12}}>Sign in</button></span>
          }
        </div>
      </div>
    </div>
  );
}

// ─── UPGRADE MODAL ────────────────────────────────────────────────────────────
function UpgradeModal({onClose,feature}) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div style={{background:"#fff",borderRadius:16,padding:28,width:"100%",maxWidth:420,boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}} onClick={e=>e.stopPropagation()}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:36,marginBottom:10}}>⚡</div>
          <div style={{fontSize:20,fontWeight:800,color:"#111827",marginBottom:6}}>Upgrade to Pro</div>
          <div style={{fontSize:13,color:"#6b7280"}}><strong>{feature}</strong> is a Pro feature — unlock everything for £9.99/month.</div>
        </div>
        <div style={{background:"#f0fdfa",border:"1px solid #99f6e4",borderRadius:10,padding:14,marginBottom:18}}>
          {["Unlimited resume tailoring","All 6 resume formats + preview","ATS + Hiring Manager scores","Salary intelligence","Resume history","Persistent application tracker","Unlimited cover letters","Interview prep AI"].map(f=>(
            <div key={f} style={{display:"flex",gap:8,padding:"5px 0",fontSize:13,color:"#374151"}}><span style={{color:"#0d9488"}}>✓</span>{f}</div>
          ))}
        </div>
        <button onClick={()=>window.open("https://gumroad.com/l/careeros-pro","_blank")}
          style={{width:"100%",padding:12,background:"linear-gradient(135deg,#0d9488,#0891b2)",color:"#fff",border:"none",borderRadius:9,fontSize:15,fontWeight:700,cursor:"pointer",marginBottom:8}}>
          Start Pro — £9.99/month →
        </button>
        <button onClick={onClose} style={{width:"100%",padding:9,background:"transparent",border:"none",color:"#9ca3af",fontSize:13,cursor:"pointer"}}>Maybe later</button>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [user,setUser]=useState(null);
  const [profile,setProfile]=useState(null);
  const [authLoading,setAuthLoading]=useState(true);
  const [showAuth,setShowAuth]=useState(false);
  const [authMode,setAuthMode]=useState("login");
  const [showUpgrade,setShowUpgrade]=useState(false);
  const [upgradeFeature,setUpgradeFeature]=useState("");
  const [menuOpen,setMenuOpen]=useState(false);

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
  const [resumeHistory,setResumeHistory]=useState([]);
  const [historyLoading,setHistoryLoading]=useState(false);
  const ref=useRef(null);

  const isPro = profile?.plan==="pro"||profile?.plan==="enterprise";

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{
      if(session?.user) loadUser(session.user);
      else setAuthLoading(false);
    });
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_,session)=>{
      if(session?.user) loadUser(session.user);
      else { setUser(null);setProfile(null);setAuthLoading(false); }
    });
    return ()=>subscription.unsubscribe();
  },[]);

  async function loadUser(u) {
    setUser(u);
    const p = await getUserProfile(u.id);
    setProfile(p);
    if(p) {
      const userApps = await getUserApplications(u.id);
      setApps(userApps.map(a=>({id:a.id,title:a.title,company:a.company,platform:a.platform,status:a.status,appliedDate:a.applied_date||"—",match:a.match_score||0})));
    }
    setAuthLoading(false);
  }

  function requireAuth(feature) {
    if(!user){setAuthMode("signup");setShowAuth(true);return false;}
    return true;
  }

  function requirePro(feature) {
    if(!requireAuth(feature)) return false;
    if(!isPro){setUpgradeFeature(feature);setShowUpgrade(true);return false;}
    return true;
  }

  function startPhase() {
    setPhase(0);
    const iv=setInterval(()=>setPhase(p=>{if(p>=LOADING_PHASES.length-1){clearInterval(iv);return p;}return p+1;}),3500);
    return iv;
  }

  async function generate() {
    if(!jd?.trim()||!cv?.trim()) return;
    setLoading(true);setResult(null);
    const iv=startPhase();
    try {
      const r=await callClaude(`Analyse JD and CV. Return ONLY JSON:
{"jdAnalysis":{"role":"title","company":"name","mustHave":["r1","r2","r3","r4"],"niceToHave":["n1","n2","n3"],"keywords":["k1","k2","k3","k4","k5","k6","k7","k8"],"hiringIntent":"1 sentence"},"matchScore":75,"hiringManagerScore":70,"salaryIntelligence":{"marketMin":"£X","marketMax":"£Y","recommendedAsk":"£Z","insight":"1 sentence"},"gapAnalysis":{"strengths":["s1","s2","s3","s4"],"gaps":["g1","g2","g3"],"transferable":["t1","t2","t3"]},"resume":{"name":"NAME","contact":"email • phone • location","summary":"2-3 sentences. Unique hook. Quantified. No clichés.","skills":["sk1","sk2","sk3","sk4","sk5","sk6","sk7","sk8"],"experience":[{"title":"Title","company":"Co","period":"dates","bullets":["verb+initiative+metric","verb+initiative+metric","verb+initiative+metric"]}],"education":"Degree | certs"},"hiringManagerInsights":{"firstImpression":"10s","humanAppeal":"factor","redFlags":["r1"],"standoutFactors":["s1","s2"]},"improvements":["t1","t2","t3"]}
Rules: every bullet verb+metric. Return ONLY JSON.
JD: ${jd.slice(0,1800)}
CV: ${cv.slice(0,1800)}`);
      clearInterval(iv);setResult(r);
      if(user&&r.resume) saveResume(user.id,r,r.jdAnalysis?.role,r.jdAnalysis?.company,r.matchScore);
      setTimeout(()=>ref.current?.scrollIntoView({behavior:"smooth"}),100);
    } catch {
      clearInterval(iv);setResult({error:"Generation failed. Check inputs and retry."});
    } finally { setLoading(false); }
  }

  async function genCover() {
    if(!jd||!cv) return;
    setCoverLoading(true);setCoverResult(null);
    try {
      const r=await callClaude(`Write cover letter. Return ONLY JSON:
{"subject":"Application for [Role] — [Name]","letter":"3 paragraphs. Hook about company. Best achievement with metric. Why this role + confident close. British English. 200 words max."}
JD: ${jd.slice(0,1200)} CV: ${cv.slice(0,1200)}`,1000);
      setCoverResult(r);
    } catch { setCoverResult({error:"Failed. Retry."}); }
    finally { setCoverLoading(false); }
  }

  async function genInterview() {
    if(!jd||!cv) return;
    if(!requirePro("Interview Prep")) return;
    setIntLoading(true);setIntResult(null);
    try {
      const r=await callClaude(`Interview prep. Return ONLY JSON:
{"keyThemes":["t1","t2","t3"],"likelyQuestions":[{"question":"Q","tip":"tip"},{"question":"Q","tip":"tip"},{"question":"Q","tip":"tip"},{"question":"Q","tip":"tip"}],"starStories":[{"theme":"Leadership","situation":"brief","task":"brief","action":"brief","result":"metric"},{"theme":"Problem Solving","situation":"brief","task":"brief","action":"brief","result":"metric"}],"questionsToAsk":["q1","q2","q3"],"redFlags":["concern + how to address"]}
JD: ${jd.slice(0,1200)} CV: ${cv.slice(0,1200)}`,1500);
      setIntResult(r);
    } catch { setIntResult({error:"Failed. Retry."}); }
    finally { setIntLoading(false); }
  }

  async function searchJobs() {
    setJobLoading(true);setJobs([]);
    try {
      const res=await fetch(`/api/jobs?query=${encodeURIComponent(jobQ||"product manager")}&country=${country}&source=both`);
      const data=await res.json();
      setJobs(data.jobs||[]);
    } catch { setJobs([]); }
    setJobLoading(false);
  }

  function applyJob(job,e) {
    e.stopPropagation();setApplying(job.id);
    const url=job.url?.startsWith("http")?job.url:`https://www.google.com/search?q=${encodeURIComponent(job.title+" "+job.company+" apply")}`;
    window.open(url,"_blank");
    const newApp={id:Date.now().toString(),title:job.title,company:job.company,platform:job.platform,status:"Applied",appliedDate:"Today",match:job.match||0};
    setApps(prev=>prev.find(a=>a.title===job.title&&a.company===job.company)?prev:[...prev,newApp]);
    if(user) saveApplication(user.id,{title:job.title,company:job.company,platform:job.platform,status:"Applied",applied_date:"Today",match_score:job.match||0,job_url:job.url||""});
    setTimeout(()=>{setApplying(null);setApplied(job.id);setTimeout(()=>setApplied(null),2000);},600);
  }

  function saveJob(job,e) {
    e.stopPropagation();
    if(apps.find(a=>a.title===job.title&&a.company===job.company)) return;
    const newApp={id:Date.now().toString(),title:job.title,company:job.company,platform:job.platform,status:"Saved",appliedDate:"—",match:job.match||0};
    setApps(prev=>[...prev,newApp]);
    if(user) saveApplication(user.id,{title:job.title,company:job.company,platform:job.platform,status:"Saved",match_score:job.match||0,job_url:job.url||""});
  }

  async function loadHistory() {
    if(!user) return;
    setHistoryLoading(true);
    const data = await getUserResumes(user.id);
    setResumeHistory(data);
    setHistoryLoading(false);
  }

  function handleTabChange(t) {
    if(t.id==="history"){if(!requireAuth("Resume History")||!requirePro("Resume History"))return;loadHistory();}
    if(t.id==="interview"){if(!jd||!cv){setTab(t.id);return;}}
    setTab(t.id);setMenuOpen(false);
  }

  async function handleSignOut() {
    await signOut();
    setUser(null);setProfile(null);setApps([]);setResumeHistory([]);
  }

  const inp={width:"100%",boxSizing:"border-box",background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"11px 14px",color:"#111827",fontSize:13,fontFamily:"inherit",outline:"none",lineHeight:1.6};
  const btn=(x={})=>({background:"#0d9488",color:"#fff",border:"none",borderRadius:8,padding:"10px 18px",fontSize:13,fontWeight:600,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6,...x});
  const ghost=(x={})=>({background:"#fff",border:"1.5px solid #e2e8f0",color:"#374151",borderRadius:8,padding:"9px 16px",fontSize:13,cursor:"pointer",...x});

  if(authLoading) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f0f4f8"}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:32,height:32,border:"3px solid #99f6e4",borderTopColor:"#0d9488",borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 12px"}}/>
        <div style={{color:"#6b7280",fontSize:13}}>Loading...</div>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#f0f4f8",color:"#111827",fontFamily:"'Inter','Segoe UI',system-ui,sans-serif"}}>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:0.85}50%{opacity:1}}
        input:focus,textarea:focus{border-color:#0d9488 !important;box-shadow:0 0 0 3px rgba(13,148,136,0.1) !important;outline:none}
        .jcard:hover{border-color:#99f6e4 !important;box-shadow:0 2px 8px rgba(13,148,136,0.08) !important}
        @media(max-width:768px){.desktop-nav{display:none!important}.mobile-menu-btn{display:flex!important}}
        @media(min-width:769px){.mobile-menu-btn{display:none!important}.mobile-menu{display:none!important}}
      `}</style>

      {showAuth&&<AuthModal onClose={()=>setShowAuth(false)} onSuccess={u=>loadUser(u)} initialMode={authMode}/>}
      {showUpgrade&&<UpgradeModal onClose={()=>setShowUpgrade(false)} feature={upgradeFeature}/>}

      {/* ── HEADER ── */}
      <div style={{background:"#fff",borderBottom:"1px solid #e8ecf0",position:"sticky",top:0,zIndex:100,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
        <div style={{maxWidth:1200,margin:"0 auto",padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",height:60}}>
          {/* Logo */}
          <div style={{display:"flex",alignItems:"center",gap:9,cursor:"pointer",flexShrink:0}} onClick={()=>setTab("builder")}>
            <div style={{width:34,height:34,borderRadius:9,background:"linear-gradient(135deg,#0d9488,#0891b2)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:16,color:"#fff"}}>C</div>
            <div>
              <div style={{fontSize:16,fontWeight:800,color:"#111827",letterSpacing:-0.4}}>CareerOS</div>
              <div style={{fontSize:8,color:"#9ca3af",letterSpacing:1.5,textTransform:"uppercase",lineHeight:1}}>AI Career Platform</div>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="desktop-nav" style={{display:"flex",gap:0,flex:1,justifyContent:"center"}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>handleTabChange(t)} style={{background:"transparent",border:"none",borderBottom:`2px solid ${tab===t.id?"#0d9488":"transparent"}`,color:tab===t.id?"#0d9488":"#6b7280",padding:"0 12px",height:60,fontSize:12,cursor:"pointer",fontWeight:tab===t.id?600:400,transition:"all 0.15s",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:4}}>
                {t.label}
                {t.pro&&<span style={{background:"#0d9488",color:"#fff",fontSize:8,fontWeight:700,padding:"1px 5px",borderRadius:8,letterSpacing:0.5}}>PRO</span>}
              </button>
            ))}
          </nav>

          {/* Desktop Auth */}
          <div className="desktop-nav" style={{display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
            {user?(
              <>
                {!isPro&&<button onClick={()=>setTab("pricing")} style={btn({padding:"7px 14px",fontSize:12,background:"linear-gradient(135deg,#0d9488,#0891b2)"})}>Upgrade Pro ✦</button>}
                <div style={{display:"flex",alignItems:"center",gap:7,padding:"5px 10px",background:"#f8fafc",borderRadius:8,border:"1px solid #e8ecf0",cursor:"pointer"}} onClick={handleSignOut}>
                  <div style={{width:26,height:26,borderRadius:"50%",background:"linear-gradient(135deg,#0d9488,#0891b2)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:12}}>
                    {(user.user_metadata?.full_name||user.email||"U")[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{fontSize:11,fontWeight:600,color:"#111827",lineHeight:1.2}}>{user.user_metadata?.full_name||user.email?.split("@")[0]}</div>
                    <div style={{fontSize:9,color:isPro?"#0d9488":"#9ca3af",fontWeight:600,textTransform:"uppercase",letterSpacing:0.5}}>{isPro?"Pro":"Free"} · Sign out</div>
                  </div>
                </div>
              </>
            ):(
              <>
                <button onClick={()=>{setAuthMode("login");setShowAuth(true);}} style={ghost({fontSize:12,padding:"7px 14px"})}>Sign in</button>
                <button onClick={()=>{setAuthMode("signup");setShowAuth(true);}} style={btn({fontSize:12,padding:"7px 14px",background:"linear-gradient(135deg,#0d9488,#0891b2)"})}>Get Started Free →</button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="mobile-menu-btn" onClick={()=>setMenuOpen(!menuOpen)}
            style={{background:"#f8fafc",border:"1px solid #e8ecf0",borderRadius:8,padding:"7px 10px",cursor:"pointer",display:"flex",flexDirection:"column",gap:4}}>
            <span style={{width:18,height:2,background:"#374151",borderRadius:1,display:"block"}}/>
            <span style={{width:18,height:2,background:"#374151",borderRadius:1,display:"block"}}/>
            <span style={{width:18,height:2,background:"#374151",borderRadius:1,display:"block"}}/>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen&&(
          <div className="mobile-menu" style={{background:"#fff",borderTop:"1px solid #e8ecf0",padding:"8px 0"}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>handleTabChange(t)}
                style={{width:"100%",background:tab===t.id?"#f0fdfa":"transparent",border:"none",borderLeft:`3px solid ${tab===t.id?"#0d9488":"transparent"}`,color:tab===t.id?"#0d9488":"#374151",padding:"12px 20px",fontSize:14,cursor:"pointer",fontWeight:tab===t.id?600:400,textAlign:"left",display:"flex",alignItems:"center",gap:8}}>
                {t.label}
                {t.pro&&<span style={{background:"#0d9488",color:"#fff",fontSize:8,fontWeight:700,padding:"1px 5px",borderRadius:8}}>PRO</span>}
              </button>
            ))}
            <div style={{padding:"12px 20px",borderTop:"1px solid #e8ecf0",display:"flex",gap:8}}>
              {user?(
                <>
                  {!isPro&&<button onClick={()=>{setTab("pricing");setMenuOpen(false);}} style={btn({fontSize:12,flex:1,justifyContent:"center",background:"linear-gradient(135deg,#0d9488,#0891b2)"})}>Upgrade Pro ✦</button>}
                  <button onClick={()=>{handleSignOut();setMenuOpen(false);}} style={ghost({fontSize:12,flex:1,textAlign:"center",justifyContent:"center"})}>Sign out</button>
                </>
              ):(
                <>
                  <button onClick={()=>{setAuthMode("login");setShowAuth(true);setMenuOpen(false);}} style={ghost({fontSize:12,flex:1,textAlign:"center"})}>Sign in</button>
                  <button onClick={()=>{setAuthMode("signup");setShowAuth(true);setMenuOpen(false);}} style={btn({fontSize:12,flex:1,justifyContent:"center",background:"linear-gradient(135deg,#0d9488,#0891b2)"})}>Get Started →</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{maxWidth:1200,margin:"0 auto",padding:"24px 16px 80px"}}>

        {/* ════ BUILDER ════ */}
        {tab==="builder"&&(
          <div style={{animation:"fadeIn 0.3s ease"}}>
            {/* Hero */}
            <div style={{textAlign:"center",padding:"40px 16px 32px",background:"#fff",borderRadius:16,marginBottom:20,border:"1px solid #e8ecf0",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
              <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 14px",borderRadius:20,background:"#f0fdfa",border:"1px solid #99f6e4",color:"#0d9488",fontSize:11,fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:16}}>
                AI Resume Builder · ATS & Hiring Manager Scoring · Salary Intelligence
              </div>
              <h1 style={{fontSize:"clamp(32px,6vw,52px)",fontWeight:900,color:"#0f172a",lineHeight:1.1,marginBottom:10,letterSpacing:-1.5}}>
                Land more interviews.<br/><span style={{color:"#0d9488"}}>Faster.</span>
              </h1>
              <p style={{color:"#6b7280",fontSize:15,maxWidth:480,margin:"0 auto 20px"}}>
                Paste a job description and your CV — get a tailored resume, ATS score, salary intelligence, and interview coaching in under 60 seconds.
              </p>
              {!user&&(
                <button onClick={()=>{setAuthMode("signup");setShowAuth(true);}} style={{...btn({padding:"12px 28px",fontSize:15,background:"linear-gradient(135deg,#0d9488,#0891b2)",borderRadius:10})}}>
                  Create Free Account →
                </button>
              )}
            </div>

            {/* Format picker */}
            <Card>
              <SLabel>Choose Your Resume Format</SLabel>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:10}}>
                {RESUME_FORMATS.map(f=>(
                  <div key={f.id} onClick={()=>setFmt(f.id)}
                    style={{border:`2px solid ${fmt===f.id?f.accentColor:"#e8ecf0"}`,borderRadius:8,padding:12,cursor:"pointer",background:fmt===f.id?f.accentColor+"08":"#fafbfc",transition:"all 0.15s",textAlign:"center"}}>
                    <div style={{fontSize:24,marginBottom:6}}>{f.icon}</div>
                    <div style={{fontSize:12,fontWeight:700,color:fmt===f.id?f.accentColor:"#374151",marginBottom:2}}>{f.name}</div>
                    <div style={{fontSize:10,color:"#9ca3af"}}>{f.desc}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Inputs */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:14,marginBottom:14}}>
              <div>
                <label style={{display:"block",fontSize:11,fontWeight:700,color:"#374151",marginBottom:6,textTransform:"uppercase",letterSpacing:0.5}}>Job Description</label>
                <textarea style={{...inp,height:200,resize:"vertical"}} placeholder="Paste any job description here..." value={jd} onChange={e=>setJd(e.target.value)}/>
              </div>
              <div>
                <label style={{display:"block",fontSize:11,fontWeight:700,color:"#374151",marginBottom:6,textTransform:"uppercase",letterSpacing:0.5}}>Your CV / Background</label>
                <textarea style={{...inp,height:200,resize:"vertical"}} placeholder="Paste your CV or describe your experience..." value={cv} onChange={e=>setCv(e.target.value)}/>
                {!cv&&<button onClick={()=>setCv(SAMPLE_CV)} style={{...ghost(),marginTop:8,fontSize:11,padding:"5px 12px"}}>Use sample CV →</button>}
              </div>
            </div>

            {loading&&(
              <div style={{background:"#f0fdfa",border:"1px solid #99f6e4",borderRadius:10,padding:"14px 18px",marginBottom:14,animation:"pulse 2s infinite"}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:16,height:16,border:"2px solid #99f6e4",borderTopColor:"#0d9488",borderRadius:"50%",animation:"spin 0.8s linear infinite",flexShrink:0}}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,color:"#0d9488",marginBottom:5}}>{LOADING_PHASES[phase]?.icon} {LOADING_PHASES[phase]?.text}</div>
                    <div style={{height:4,background:"#ccfbf1",borderRadius:2}}>
                      <div style={{height:4,background:"linear-gradient(90deg,#0d9488,#0891b2)",borderRadius:2,width:`${((phase+1)/LOADING_PHASES.length)*100}%`,transition:"width 0.5s ease"}}/>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div style={{display:"flex",gap:10,marginBottom:24,flexWrap:"wrap"}}>
              <button onClick={generate} disabled={loading||!jd||!cv} style={{...btn({background:"linear-gradient(135deg,#0d9488,#0891b2)",padding:"12px 24px",fontSize:14}),opacity:loading||!jd||!cv?0.5:1}}>
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
                {/* Score cards */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:14}}>
                  <Card style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
                    <SLabel>ATS Score</SLabel>
                    <ScoreRing score={result.matchScore} size={70}/>
                    <div style={{fontSize:11,fontWeight:600,color:result.matchScore>=80?"#16a34a":result.matchScore>=65?"#d97706":"#dc2626"}}>
                      {result.matchScore>=80?"Strong":result.matchScore>=65?"Good":"Needs Work"}
                    </div>
                  </Card>
                  <Card style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
                    <SLabel color="#7c3aed">Human Appeal</SLabel>
                    <ScoreRing score={result.hiringManagerScore} size={70} color="#7c3aed"/>
                    <div style={{fontSize:11,fontWeight:600,color:"#7c3aed"}}>HM View</div>
                  </Card>
                  <Card>
                    <SLabel color="#059669">💰 Salary Intel</SLabel>
                    {result.salaryIntelligence?(<>
                      <div style={{fontSize:22,fontWeight:800,color:"#059669",marginBottom:2}}>{result.salaryIntelligence.recommendedAsk}</div>
                      <div style={{fontSize:10,color:"#9ca3af",marginBottom:4}}>Market: {result.salaryIntelligence.marketMin}–{result.salaryIntelligence.marketMax}</div>
                      <div style={{fontSize:11,color:"#6b7280",lineHeight:1.5}}>{result.salaryIntelligence.insight}</div>
                    </>):<div style={{fontSize:12,color:"#9ca3af"}}>Not available</div>}
                  </Card>
                </div>

                <Card>
                  <SLabel>JD Analysis — {result.jdAnalysis?.role} at {result.jdAnalysis?.company}</SLabel>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12}}>
                    <div><div style={{fontSize:10,color:"#9ca3af",fontWeight:600,marginBottom:5,letterSpacing:1}}>MUST-HAVE</div>{result.jdAnalysis?.mustHave?.map(s=><Chip key={s} text={s} color="#16a34a" bg="#f0fdf4"/>)}</div>
                    <div><div style={{fontSize:10,color:"#9ca3af",fontWeight:600,marginBottom:5,letterSpacing:1}}>NICE TO HAVE</div>{result.jdAnalysis?.niceToHave?.map(s=><Chip key={s} text={s} color="#d97706" bg="#fffbeb"/>)}</div>
                    <div><div style={{fontSize:10,color:"#9ca3af",fontWeight:600,marginBottom:5,letterSpacing:1}}>KEYWORDS</div>{result.jdAnalysis?.keywords?.map(k=><Chip key={k} text={k} color="#7c3aed" bg="#f5f3ff"/>)}</div>
                  </div>
                  {result.jdAnalysis?.hiringIntent&&<div style={{marginTop:10,padding:10,background:"#f0fdfa",borderRadius:7,borderLeft:"3px solid #0d9488",marginTop:12}}><div style={{fontSize:10,fontWeight:700,color:"#0d9488",marginBottom:3}}>HIRING INTENT</div><div style={{fontSize:12,color:"#374151",lineHeight:1.6}}>{result.jdAnalysis.hiringIntent}</div></div>}
                </Card>

                {result.hiringManagerInsights&&(
                  <Card>
                    <SLabel color="#7c3aed">🧠 Hiring Manager Psychology</SLabel>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10}}>
                      <div style={{padding:10,background:"#f5f3ff",borderRadius:7}}><div style={{fontSize:10,fontWeight:700,color:"#7c3aed",marginBottom:4}}>FIRST IMPRESSION</div><div style={{fontSize:12,color:"#374151",lineHeight:1.6}}>{result.hiringManagerInsights.firstImpression}</div></div>
                      <div style={{padding:10,background:"#f0fdf4",borderRadius:7}}><div style={{fontSize:10,fontWeight:700,color:"#16a34a",marginBottom:4}}>HUMAN APPEAL</div><div style={{fontSize:12,color:"#374151",lineHeight:1.6}}>{result.hiringManagerInsights.humanAppeal}</div></div>
                      <div><div style={{fontSize:10,fontWeight:700,color:"#dc2626",marginBottom:4}}>RED FLAGS</div>{result.hiringManagerInsights.redFlags?.map((r,i)=><div key={i} style={{fontSize:12,color:"#6b7280",padding:"2px 0"}}>⚠ {r}</div>)}</div>
                      <div><div style={{fontSize:10,fontWeight:700,color:"#d97706",marginBottom:4}}>STANDOUT</div>{result.hiringManagerInsights.standoutFactors?.map((s,i)=><div key={i} style={{fontSize:12,color:"#6b7280",padding:"2px 0"}}>⭐ {s}</div>)}</div>
                    </div>
                  </Card>
                )}

                <Card>
                  <SLabel>Gap Analysis</SLabel>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12}}>
                    {[["✓ Strengths","strengths","#16a34a"],["✗ Gaps","gaps","#dc2626"],["⇄ Transferable","transferable","#d97706"]].map(([label,key,color])=>(
                      <div key={key}><div style={{fontSize:11,fontWeight:700,color,marginBottom:7}}>{label}</div>{result.gapAnalysis?.[key]?.map((s,i)=><div key={i} style={{fontSize:12,color:"#6b7280",padding:"3px 0",borderBottom:"1px solid #f9fafb"}}>• {s}</div>)}</div>
                    ))}
                  </div>
                </Card>

                <Card>
                  <SLabel>✦ Your Tailored Resume</SLabel>
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
          </div>
        )}

        {/* ════ JOB SEARCH ════ */}
        {tab==="jobs"&&(
          <div style={{animation:"fadeIn 0.3s ease"}}>
            <div style={{marginBottom:16}}><h2 style={{fontSize:24,fontWeight:800,color:"#111827",marginBottom:4,letterSpacing:-0.5}}>Job Search</h2><p style={{color:"#6b7280",fontSize:14}}>Real jobs from Adzuna, JSearch, Reed · UK · US · India</p></div>
            <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
              {COUNTRIES.map(c=>(
                <button key={c.code} onClick={()=>setCountry(c.code)} style={{padding:"8px 16px",borderRadius:20,background:country===c.code?"#0d9488":"#fff",border:`1.5px solid ${country===c.code?"#0d9488":"#e2e8f0"}`,color:country===c.code?"#fff":"#374151",fontSize:13,fontWeight:500,cursor:"pointer"}}>{c.label}</button>
              ))}
            </div>
            <div style={{display:"flex",gap:10,marginBottom:16}}>
              <input style={{...inp,flex:1}} placeholder="Search jobs..." value={jobQ} onChange={e=>setJobQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&searchJobs()}/>
              <button onClick={searchJobs} disabled={jobLoading} style={btn({flexShrink:0})}>{jobLoading?"...":"Search"}</button>
            </div>
            {jobLoading&&<div style={{textAlign:"center",padding:40}}><div style={{width:24,height:24,border:"3px solid #ccfbf1",borderTopColor:"#0d9488",borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 10px"}}/><div style={{color:"#6b7280",fontSize:13}}>Searching...</div></div>}
            {!jobLoading&&jobs.length===0&&<div style={{textAlign:"center",padding:48,color:"#9ca3af"}}><div style={{fontSize:36,marginBottom:10}}>🔍</div><div style={{fontSize:15,fontWeight:600,color:"#374151",marginBottom:4}}>Search for jobs above</div><div style={{fontSize:13}}>Try "product manager", "software engineer"</div></div>}
            {jobs.map(job=>(
              <div key={job.id} className="jcard" style={{background:"#fff",border:"1.5px solid #e8ecf0",borderRadius:12,padding:16,marginBottom:10,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:4,flexWrap:"wrap"}}>
                      <span style={{fontSize:14,fontWeight:700,color:"#111827"}}>{job.title}</span>
                      <PBadge platform={job.platform}/>
                      {job.visaSponsorship&&<span style={{fontSize:10,fontWeight:700,color:"#16a34a",background:"#f0fdf4",border:"1px solid #bbf7d0",padding:"1px 7px",borderRadius:10}}>🛂 Visa</span>}
                    </div>
                    <div style={{display:"flex",gap:10,marginBottom:5,flexWrap:"wrap"}}>
                      <span style={{fontSize:12,color:"#6b7280"}}>🏢 {job.company}</span>
                      <span style={{fontSize:12,color:"#9ca3af"}}>📍 {job.location}</span>
                      {job.salary&&job.salary!=="Competitive"&&<span style={{fontSize:12,color:"#9ca3af"}}>💰 {job.salary}</span>}
                    </div>
                    {job.description&&<p style={{fontSize:11,color:"#9ca3af",lineHeight:1.5,marginBottom:10}}>{job.description}</p>}
                    <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                      <button onClick={e=>applyJob(job,e)} disabled={applying===job.id} style={btn({fontSize:11,padding:"7px 14px",background:applied===job.id?"#16a34a":"#0d9488"})}>
                        {applying===job.id?"...":applied===job.id?"✓ Applied":"Apply →"}
                      </button>
                      <button onClick={e=>{e.stopPropagation();setJd((job.description||job.title)+"\n\nRole: "+job.title+"\nCompany: "+job.company);setTab("builder");}} style={ghost({fontSize:11,padding:"7px 12px",color:"#0d9488",borderColor:"#99f6e4"})}>✦ Tailor</button>
                      <button onClick={e=>saveJob(job,e)} style={ghost({fontSize:11,padding:"7px 12px",color:apps.find(a=>a.title===job.title)?"#16a34a":"#6b7280"})}>
                        {apps.find(a=>a.title===job.title&&a.company===job.company)?"✓":"☆"}
                      </button>
                      {result?.resume&&<button onClick={e=>{e.stopPropagation();setJobFmt(jobFmt===job.id?null:job.id);}} style={ghost({fontSize:11,padding:"7px 12px",color:"#7c3aed",borderColor:"#ddd6fe"})}>📄</button>}
                    </div>
                    {jobFmt===job.id&&result?.resume&&<div style={{marginTop:12,padding:14,background:"#f8fafc",borderRadius:8,border:"1px solid #e8ecf0"}}><FormatPicker resume={result.resume} selected={jobFmtSel} onSelect={setJobFmtSel} onDownload={f=>downloadResume(result.resume,f)}/></div>}
                  </div>
                  <ScoreRing score={job.match} size={46}/>
                </div>
              </div>
            ))}
            {jobs.length>0&&<div style={{textAlign:"center",padding:"10px 0",fontSize:11,color:"#d1d5db"}}>{jobs.length} live jobs · Adzuna + JSearch + Reed</div>}
          </div>
        )}

        {/* ════ TRACKER ════ */}
        {tab==="tracker"&&(
          <div style={{animation:"fadeIn 0.3s ease"}}>
            <div style={{marginBottom:16}}><h2 style={{fontSize:24,fontWeight:800,color:"#111827",marginBottom:4,letterSpacing:-0.5}}>Application Tracker</h2><p style={{color:"#6b7280",fontSize:14}}>{user?"Saved to your account.":"Sign in to save permanently."}</p></div>
            {!user&&<div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:8,padding:12,marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}><span style={{fontSize:13,color:"#92400e"}}>Sign in to save applications across devices</span><button onClick={()=>{setAuthMode("signup");setShowAuth(true);}} style={btn({fontSize:12,padding:"7px 14px"})}>Sign in →</button></div>}
            {apps.length===0?(
              <div style={{textAlign:"center",padding:48,color:"#9ca3af"}}><div style={{fontSize:36,marginBottom:10}}>📋</div><div style={{fontSize:15,fontWeight:600,color:"#374151",marginBottom:4}}>No applications yet</div><div style={{fontSize:13}}>Apply or save jobs from Job Search</div></div>
            ):(<>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10,marginBottom:16}}>
                {[{label:"Applied",value:apps.filter(a=>a.status!=="Saved").length,color:"#0d9488"},{label:"Saved",value:apps.filter(a=>a.status==="Saved").length,color:"#6b7280"},{label:"Interview",value:apps.filter(a=>a.status==="Interview").length,color:"#d97706"},{label:"Offers",value:apps.filter(a=>a.status==="Offer").length,color:"#16a34a"}].map(s=>(
                  <div key={s.label} style={{background:"#fff",border:"1px solid #e8ecf0",borderRadius:10,padding:"12px 14px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}><div style={{fontSize:10,color:"#9ca3af",fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:5}}>{s.label}</div><div style={{fontSize:24,fontWeight:800,color:s.color}}>{s.value}</div></div>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:10}}>
                {["Saved","Applied","Interview","Offer","Rejected"].map(status=>(
                  <div key={status}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}><SBadge status={status}/><span style={{fontSize:11,color:"#9ca3af"}}>{apps.filter(a=>a.status===status).length}</span></div>
                    {apps.filter(a=>a.status===status).map(app=>(
                      <div key={app.id} style={{background:"#fff",border:"1px solid #e8ecf0",borderRadius:8,padding:11,marginBottom:8}}>
                        <div style={{fontSize:12,fontWeight:600,color:"#111827",marginBottom:2,lineHeight:1.3}}>{app.title}</div>
                        <div style={{fontSize:11,color:"#9ca3af",marginBottom:8}}>{app.company}</div>
                        <PBadge platform={app.platform}/>
                        <div style={{display:"flex",gap:4,marginTop:8,flexWrap:"wrap"}}>
                          {["Applied","Interview","Offer","Rejected"].filter(s=>s!==status).slice(0,2).map(s=>(
                            <button key={s} onClick={()=>{setApps(prev=>prev.map(a=>a.id===app.id?{...a,status:s}:a));if(user)updateApplicationStatus(app.id,s);}} style={{background:"#f8fafc",border:"1px solid #e8ecf0",color:"#6b7280",borderRadius:5,padding:"2px 7px",fontSize:9,fontWeight:600,cursor:"pointer"}}>→{s}</button>
                          ))}
                          <button onClick={()=>setApps(prev=>prev.filter(a=>a.id!==app.id))} style={{background:"#fef2f2",border:"1px solid #fecaca",color:"#dc2626",borderRadius:5,padding:"2px 7px",fontSize:9,fontWeight:600,cursor:"pointer"}}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </>)}
          </div>
        )}

        {/* ════ RESUME HISTORY ════ */}
        {tab==="history"&&(
          <div style={{animation:"fadeIn 0.3s ease"}}>
            <div style={{marginBottom:16}}><h2 style={{fontSize:24,fontWeight:800,color:"#111827",marginBottom:4,letterSpacing:-0.5}}>Resume History</h2><p style={{color:"#6b7280",fontSize:14}}>Every resume you've generated, saved automatically.</p></div>
            {historyLoading&&<div style={{textAlign:"center",padding:40}}><div style={{width:24,height:24,border:"3px solid #ccfbf1",borderTopColor:"#0d9488",borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto"}}/></div>}
            {!historyLoading&&resumeHistory.length===0&&<div style={{textAlign:"center",padding:48,color:"#9ca3af"}}><div style={{fontSize:36,marginBottom:10}}>📂</div><div style={{fontSize:15,fontWeight:600,color:"#374151",marginBottom:4}}>No history yet</div><div style={{fontSize:13}}>Generate resumes and they'll appear here</div></div>}
            {resumeHistory.map(r=>(
              <Card key={r.id}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
                  <div>
                    <div style={{fontSize:15,fontWeight:700,color:"#111827",marginBottom:2}}>{r.job_title} at {r.company}</div>
                    <div style={{fontSize:12,color:"#9ca3af",marginBottom:8}}>{new Date(r.created_at).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</div>
                    <div style={{display:"flex",gap:7}}>
                      {r.ats_score>0&&<span style={{background:"#f0fdf4",border:"1px solid #bbf7d0",color:"#16a34a",padding:"2px 9px",borderRadius:10,fontSize:11,fontWeight:600}}>ATS: {r.ats_score}%</span>}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>{setResult(r.content);setTab("builder");setTimeout(()=>ref.current?.scrollIntoView({behavior:"smooth"}),200);}} style={ghost({fontSize:12,color:"#0d9488",borderColor:"#99f6e4"})}>Load</button>
                    {r.content?.resume&&<button onClick={()=>downloadResume(r.content.resume,"classic")} style={ghost({fontSize:12})}>⬇ Download</button>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* ════ COVER LETTER ════ */}
        {tab==="cover"&&(
          <div style={{animation:"fadeIn 0.3s ease"}}>
            <h2 style={{fontSize:24,fontWeight:800,color:"#111827",marginBottom:4,letterSpacing:-0.5}}>Cover Letter</h2>
            <p style={{color:"#6b7280",fontSize:14,marginBottom:16}}>Personalised cover letters in seconds.</p>
            {(!jd||!cv)&&<div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:8,padding:12,marginBottom:12,color:"#92400e",fontSize:13}}>⚡ Add your JD and CV in Resume Builder first.</div>}
            <button onClick={genCover} disabled={coverLoading||!jd||!cv} style={{...btn(),opacity:coverLoading||!jd||!cv?0.5:1,marginBottom:16}}>
              {coverLoading?"Writing...":"✉ Generate Cover Letter"}
            </button>
            {coverResult&&!coverResult.error&&(
              <Card>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
                  <div style={{fontSize:12,color:"#6b7280"}}>Subject: <strong>{coverResult.subject}</strong></div>
                  <div style={{display:"flex",gap:7}}>
                    <button onClick={()=>navigator.clipboard.writeText(coverResult.letter)} style={ghost({fontSize:11,padding:"5px 11px"})}>Copy</button>
                    <button onClick={()=>{const b=new Blob([coverResult.letter],{type:"text/plain"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download="cover_letter.txt";a.click();}} style={ghost({fontSize:11,padding:"5px 11px",color:"#0d9488",borderColor:"#99f6e4"})}>⬇</button>
                  </div>
                </div>
                <div style={{background:"#f8fafc",borderRadius:8,padding:16,fontSize:13,color:"#374151",lineHeight:2,whiteSpace:"pre-wrap"}}>{coverResult.letter}</div>
              </Card>
            )}
            {coverResult?.error&&<div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:12,color:"#dc2626",fontSize:13}}>⚠ {coverResult.error}</div>}
          </div>
        )}

        {/* ════ INTERVIEW PREP ════ */}
        {tab==="interview"&&(
          <div style={{animation:"fadeIn 0.3s ease"}}>
            <h2 style={{fontSize:24,fontWeight:800,color:"#111827",marginBottom:4,letterSpacing:-0.5}}>Interview Preparation</h2>
            <p style={{color:"#6b7280",fontSize:14,marginBottom:16}}>AI coaching — questions, STAR stories, and what to ask them.</p>
            {(!jd||!cv)&&<div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:8,padding:12,marginBottom:12,color:"#92400e",fontSize:13}}>⚡ Add your JD and CV in Resume Builder first.</div>}
            <button onClick={genInterview} disabled={intLoading||!jd||!cv} style={{...btn(),opacity:intLoading||!jd||!cv?0.5:1,marginBottom:16}}>
              {intLoading?"Preparing...":"◆ Generate Interview Prep"}
            </button>
            {intResult&&!intResult.error&&(<>
              <Card><SLabel>Key Themes</SLabel>{intResult.keyThemes?.map(t=><Chip key={t} text={t} color="#0d9488" bg="#f0fdfa"/>)}</Card>
              <Card>
                <SLabel>Likely Questions</SLabel>
                {intResult.likelyQuestions?.map((q,i)=>(
                  <div key={i} style={{marginBottom:12,paddingBottom:12,borderBottom:i<intResult.likelyQuestions.length-1?"1px solid #f9fafb":"none"}}>
                    <div style={{fontSize:13,fontWeight:600,color:"#111827",marginBottom:4}}>Q: {q.question}</div>
                    <div style={{fontSize:12,color:"#6b7280",paddingLeft:10,borderLeft:"2px solid #99f6e4",lineHeight:1.6}}>💡 {q.tip}</div>
                  </div>
                ))}
              </Card>
              <Card>
                <SLabel>STAR Stories</SLabel>
                {intResult.starStories?.map((s,i)=>(
                  <div key={i} style={{marginBottom:16,paddingBottom:16,borderBottom:i<intResult.starStories.length-1?"1px solid #f9fafb":"none"}}>
                    <div style={{fontSize:12,fontWeight:700,color:"#d97706",marginBottom:8}}>⭐ {s.theme}</div>
                    {["situation","task","action","result"].map(k=>(
                      <div key={k} style={{display:"grid",gridTemplateColumns:"75px 1fr",gap:8,marginBottom:4}}>
                        <div style={{fontSize:10,fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:1}}>{k}</div>
                        <div style={{fontSize:12,color:"#374151",lineHeight:1.6}}>{s[k]}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </Card>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12}}>
                <Card><SLabel>Questions to Ask</SLabel>{intResult.questionsToAsk?.map((q,i)=><div key={i} style={{fontSize:12,color:"#6b7280",padding:"4px 0",borderBottom:"1px solid #f9fafb"}}>→ {q}</div>)}</Card>
                <Card><SLabel>Red Flags to Address</SLabel>{intResult.redFlags?.map((r,i)=><div key={i} style={{fontSize:12,color:"#6b7280",padding:"4px 0",borderBottom:"1px solid #f9fafb"}}>⚠ {r}</div>)}</Card>
              </div>
            </>)}
            {intResult?.error&&<div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:12,color:"#dc2626",fontSize:13}}>⚠ {intResult.error}</div>}
          </div>
        )}

        {/* ════ PRICING ════ */}
        {tab==="pricing"&&(
          <div style={{animation:"fadeIn 0.3s ease"}}>
            <div style={{textAlign:"center",marginBottom:28}}>
              <h2 style={{fontSize:"clamp(24px,5vw,34px)",fontWeight:900,color:"#0f172a",marginBottom:8,letterSpacing:-0.8}}>Simple, transparent pricing</h2>
              <p style={{color:"#6b7280",fontSize:15}}>Start free. Upgrade when ready.</p>
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:10}}>
                <span style={{color:"#f59e0b",fontSize:16}}>★★★★★</span>
                <span style={{fontSize:13,color:"#6b7280"}}>4.9/5 · 12,000+ users</span>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:16,marginBottom:32}}>
              {TIERS.map(t=>(
                <div key={t.name} style={{background:"#fff",border:`2px solid ${t.highlight?"#0d9488":"#e8ecf0"}`,borderRadius:14,padding:26,position:"relative",boxShadow:t.highlight?"0 8px 32px rgba(13,148,136,0.15)":"0 1px 4px rgba(0,0,0,0.04)"}}>
                  {t.badge&&<div style={{position:"absolute",top:-12,left:"50%",transform:"translateX(-50%)",background:"linear-gradient(135deg,#0d9488,#0891b2)",color:"#fff",fontSize:10,fontWeight:700,padding:"3px 14px",borderRadius:20,letterSpacing:1,textTransform:"uppercase",whiteSpace:"nowrap"}}>{t.badge}</div>}
                  <div style={{fontSize:13,fontWeight:700,color:t.color,marginBottom:8,textTransform:"uppercase"}}>{t.name}</div>
                  <div style={{marginBottom:6}}><span style={{fontSize:36,fontWeight:900,color:"#0f172a",letterSpacing:-1}}>{t.price}</span><span style={{fontSize:13,color:"#6b7280"}}>{t.period}</span></div>
                  <div style={{fontSize:11,color:"#9ca3af",marginBottom:18}}>Cancel anytime</div>
                  <div style={{marginBottom:22}}>{t.features.map(f=><div key={f} style={{display:"flex",gap:8,padding:"6px 0",borderBottom:"1px solid #f9fafb",fontSize:12,color:"#374151"}}><span style={{color:t.color,flexShrink:0}}>✓</span>{f}</div>)}</div>
                  <button onClick={()=>{if(!t.gumroad){if(!user){setAuthMode("signup");setShowAuth(true);}}else{if(!user){setAuthMode("signup");setShowAuth(true);}else window.open(t.gumroad,"_blank");}}}
                    style={{width:"100%",padding:12,background:t.highlight?"linear-gradient(135deg,#0d9488,#0891b2)":"#fff",border:t.highlight?"none":`2px solid ${t.color}`,color:t.highlight?"#fff":t.color,borderRadius:9,fontSize:13,fontWeight:700,cursor:"pointer"}}>
                    {t.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{borderTop:"1px solid #e8ecf0",padding:"14px 20px",textAlign:"center",color:"#d1d5db",fontSize:11,background:"#fff"}}>
        <span style={{color:"#0d9488",fontWeight:700}}>CareerOS</span> · AI Career Platform · Resume · Jobs · Cover Letter · Interview Prep · Tracker
      </div>
    </div>
  );
}
