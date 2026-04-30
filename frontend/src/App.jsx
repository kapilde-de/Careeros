import { useState, useRef, useEffect } from "react";
import { supabase, signUp, signIn, signInWithGoogle, signOut, getUserProfile, saveResume, getUserResumes, getMonthlyUsage, saveApplication, getUserApplications, updateApplicationStatus } from "./supabase";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const RESUME_FORMATS = [
  { id:"classic", name:"Classic", desc:"Traditional, ATS-safe", icon:"📄", accentColor:"#1e3a5f", fontFamily:"'Georgia', serif" },
  { id:"modern", name:"Modern", desc:"Two-column, contemporary", icon:"✨", accentColor:"#0d9488", fontFamily:"'Helvetica Neue', sans-serif" },
  { id:"executive", name:"Executive", desc:"C-suite level", icon:"👔", accentColor:"#1e3a8a", fontFamily:"'Times New Roman', serif" },
  { id:"minimal", name:"Minimal", desc:"Clean whitespace", icon:"⬜", accentColor:"#374151", fontFamily:"'Garamond', serif" },
  { id:"ats", name:"ATS-Safe", desc:"Plain text, max parse", icon:"🤖", accentColor:"#0f766e", fontFamily:"'Courier New', monospace" },
  { id:"creative", name:"Creative", desc:"Bold, creative roles", icon:"🎨", accentColor:"#7c3aed", fontFamily:"'Helvetica Neue', sans-serif" },
];

const TABS = [
  { id:"builder", label:"Builder" },
  { id:"jobs", label:"Jobs" },
  { id:"tracker", label:"Tracker" },
  { id:"scores", label:"CV Scores" },
  { id:"history", label:"History", pro:true },
  { id:"cover", label:"Cover Letter" },
  { id:"interview", label:"Interview", pro:true },
  { id:"simulator", label:"Simulator", pro:true },
  { id:"agent", label:"🤖 Agent", agent:true },
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
  { name:"Free", price:"£0", period:"forever", features:["2 resumes/month","Interview Probability Score","Basic ATS score","5 job searches/day","1 cover letter","Classic format only"], cta:"Get Started Free", highlight:false, color:"#6b7280", gumroad:null },
  { name:"Pro", price:"£9", period:"/month", badge:"Most Popular", features:["Unlimited resumes","ATS + Rejection Risk score","Salary intelligence + negotiation script","One-URL Apply","All 6 formats + preview","Unlimited searches","Interview prep AI","Interview Simulator","Resume history","Persistent tracker"], cta:"Start Pro — £9/mo", highlight:true, color:"#0d9488", gumroad:"https://gumroad.com/l/careeros-pro" },
  { name:"Enterprise", price:"£29", period:"/month", features:["Everything in Pro","Team workspace","Bulk optimization","API access","Recruiter dashboard","White-label"], cta:"Start Enterprise — £29/mo", highlight:false, color:"#4f46e5", gumroad:"https://gumroad.com/l/careeros-enterprise" },
  { name:"Agent", price:"Beta", period:"free for now", badge:"🤖 ULTRA", features:["Everything in Pro","🤖 24/7 autonomous job hunter","Scans 160+ company job pages","AI evaluates every job for you","Auto-tailored CV per match","Daily review queue at 8am","Autopilot mode after 7 days","Local dashboard at localhost:3939","Windows · Mac · Linux","Feedback welcome!"], cta:"⬇ Download Agent (Beta)", highlight:false, color:"#dc2626", gumroad:"/downloads/careeros-agent.zip", isAgent:true },
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
  { icon:"📊", text:"Calculating ATS + Rejection Risk..." },
  { icon:"✍️", text:"Writing tailored resume..." },
  { icon:"💰", text:"Running salary intelligence..." },
  { icon:"✨", text:"Finalising all insights..." },
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

SKILLS: Product strategy, SQL, Figma, JIRA, Agile/Scrum

EDUCATION: B.Sc Computer Science, University of Edinburgh, 2019`;

// ─── RESUME HTML ──────────────────────────────────────────────────────────────
function generateResumeHTML(resume, format) {
  if (!resume) return `<html><body style="font-family:sans-serif;padding:40px;color:#9ca3af;text-align:center"><p style="margin-top:80px">Generate a resume first</p></body></html>`;
  const f = RESUME_FORMATS.find(x=>x.id===format)||RESUME_FORMATS[0];
  const s = { name:resume.name||"", contact:resume.contact||"", summary:resume.summary||"", skills:resume.skills||[], experience:resume.experience||[], education:resume.education||"" };
  const expHTML = s.experience.map(e=>`<div style="margin-bottom:14px"><div style="display:flex;justify-content:space-between;margin-bottom:2px"><strong style="font-size:13px;color:#111">${e.title}</strong><span style="font-size:11px;color:#888">${e.period}</span></div><div style="font-size:12px;color:#555;margin-bottom:4px">${e.company}</div>${e.bullets?.map(b=>`<div style="font-size:12px;color:#374151;padding-left:14px;position:relative;margin-bottom:2px"><span style="position:absolute;left:0;color:${f.accentColor}">•</span>${b}</div>`).join("")||""}</div>`).join("");
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
      system:"You are an expert resume writer and career coach. Return only valid JSON. No markdown, no backticks.",
      messages:[{role:"user",content:prompt}] }),
  });
  const data = await res.json();
  const text = data.content?.map(b=>b.text||"").join("")||"{}";
  return JSON.parse(text.replace(/```json|```/g,"").trim());
}

async function scrapeJobURL(url) {
  const res = await fetch("/api/scrape", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ url }),
  });
  return res.json();
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────
function ScoreRing({score,size=72,color,label}) {
  const r=(size-8)/2,circ=2*Math.PI*r,s=Math.max(0,Math.min(100,score||0));
  const c=color||(s>=80?"#16a34a":s>=65?"#d97706":s>0?"#dc2626":"#d1d5db");
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
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
      {label&&<div style={{fontSize:10,fontWeight:600,color:c,textAlign:"center"}}>{label}</div>}
    </div>
  );
}

function Chip({text,color="#6b7280",bg="#f1f5f9"}) {
  return <span style={{display:"inline-block",padding:"4px 11px",borderRadius:5,background:bg,color,fontSize:12,fontWeight:500,margin:"3px 4px 3px 0",lineHeight:1.4,whiteSpace:"nowrap"}}>{text}</span>;
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
  return <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color,textTransform:"uppercase",marginBottom:12}}>{children}</div>;
}

function ProBadge() {
  return <span style={{background:"#e0fdf4",color:"#0d9488",fontSize:9,fontWeight:700,padding:"1px 5px",borderRadius:4,letterSpacing:0.3,textTransform:"uppercase",marginLeft:4,lineHeight:"14px",display:"inline-block"}}>PRO</span>;
}

function ViralBadge({text="🔥 VIRAL"}) {
  return <span style={{background:"linear-gradient(135deg,#ef4444,#f97316)",color:"#fff",fontSize:8,fontWeight:700,padding:"2px 7px",borderRadius:8,letterSpacing:0.5,marginLeft:5}}>{text}</span>;
}

function FormatPicker({resume,selected,onSelect,onDownload}) {
  return (
    <div>
      <div style={{fontSize:12,fontWeight:600,color:"#374151",marginBottom:8}}>Choose format:</div>
      <div className="fmt-scroll" style={{display:"flex",gap:7,marginBottom:12,overflowX:"auto",paddingBottom:4}}>
        {RESUME_FORMATS.map(f=>(
          <div key={f.id} onClick={()=>onSelect(f.id)} className="fmt-item"
            style={{border:`2px solid ${selected===f.id?f.accentColor:"#e8ecf0"}`,borderRadius:8,padding:"8px 10px",cursor:"pointer",background:selected===f.id?f.accentColor+"10":"#fafbfc",transition:"all 0.15s",textAlign:"center",flexShrink:0,minWidth:80}}>
            <div style={{fontSize:18,marginBottom:3}}>{f.icon}</div>
            <div style={{fontSize:10,fontWeight:700,color:selected===f.id?f.accentColor:"#374151"}}>{f.name}</div>
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
// ─── VALIDATORS ──────────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
function validateEmail(v){ return EMAIL_RE.test(v.trim()) ? "" : "Enter a valid email address"; }
function validatePassword(v,mode){ if(!v) return "Password is required"; if(mode==="signup"&&v.length<8) return "Password must be at least 8 characters"; return ""; }
function validateName(v){ return v.trim().length>=2 ? "" : "Name must be at least 2 characters"; }
function validateJD(v){ if(!v?.trim()) return "Paste a job description first"; if(v.trim().length<80) return "Job description seems too short — paste the full text"; return ""; }
function validateCV(v){ if(!v?.trim()) return "Add your CV or background"; if(v.trim().length<50) return "CV seems too short — add more detail"; return ""; }

function AuthModal({onClose,onSuccess,initialMode="login"}) {
  const [mode,setMode]=useState(initialMode);
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [name,setName]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");
  const [touched,setTouched]=useState({});
  const [pwVisible,setPwVisible]=useState(false);

  const emailErr = touched.email ? validateEmail(email) : "";
  const pwErr = touched.password ? validatePassword(password, mode) : "";
  const nameErr = touched.name && mode==="signup" ? validateName(name) : "";

  function fieldInp(err) {
    return {width:"100%",boxSizing:"border-box",background:"#f8fafc",border:`1.5px solid ${err?"#fca5a5":"#e2e8f0"}`,borderRadius:8,padding:"11px 14px",color:"#111827",fontSize:13,fontFamily:"inherit",outline:"none",marginBottom:2,display:"block"};
  }

  function touch(field){ setTouched(p=>({...p,[field]:true})); }

  async function handleSubmit() {
    // Touch all fields to show errors
    const allTouched = mode==="signup" ? {email:true,password:true,name:true} : {email:true,password:true};
    setTouched(allTouched);
    const eErr=validateEmail(email), pErr=validatePassword(password,mode);
    const nErr=mode==="signup"?validateName(name):"";
    if(eErr||pErr||nErr){ setError(eErr||pErr||nErr); return; }
    setLoading(true);setError("");setSuccess("");
    try {
      if(mode==="signup"){
        const {data,error:e}=await signUp(email.trim(),password,name.trim()||email.split("@")[0]);
        if(e){setError(e.message||"Signup failed");return;}
        if(data?.user){setSuccess("Account created!");setTimeout(()=>{onSuccess(data.user);onClose();},1000);}
        else setSuccess("Check your email to confirm, then sign in.");
      } else {
        const {data,error:e}=await signIn(email.trim(),password);
        if(e){setError("Incorrect email or password. Try again.");return;}
        if(data?.user){onSuccess(data.user);onClose();}
      }
    } catch(ex){console.error("Auth error:",ex);setError("Something went wrong. Try again.");}
    finally{setLoading(false);}
  }

  const pwStrength = password.length===0?0:password.length<6?1:password.length<8?2:(/[A-Z]/.test(password)&&/[0-9]/.test(password))?4:3;
  const pwColors=["#e2e8f0","#ef4444","#f97316","#d97706","#16a34a"];
  const pwLabels=["","Weak","Fair","Good","Strong"];

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div style={{background:"#fff",borderRadius:16,padding:28,width:"100%",maxWidth:400,boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:30,height:30,borderRadius:8,background:"linear-gradient(135deg,#0d9488,#0891b2)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:15,color:"#fff"}}>C</div>
            <div>
              <div style={{fontSize:15,fontWeight:800,color:"#111827"}}>{mode==="login"?"Welcome back":"Join CareerOS"}</div>
              <div style={{fontSize:11,color:"#9ca3af"}}>{mode==="login"?"Sign in to your account":"Free forever · No credit card"}</div>
            </div>
          </div>
          <button onClick={onClose} style={{background:"#f1f5f9",border:"none",borderRadius:"50%",width:28,height:28,cursor:"pointer",fontSize:14,color:"#6b7280"}}>✕</button>
        </div>
        <button onClick={async()=>{setLoading(true);await signInWithGoogle();setLoading(false);}}
          style={{width:"100%",padding:"10px",background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:14,fontWeight:500,color:"#374151"}}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <div style={{flex:1,height:1,background:"#e8ecf0"}}/><span style={{fontSize:11,color:"#9ca3af"}}>or</span><div style={{flex:1,height:1,background:"#e8ecf0"}}/>
        </div>
        {mode==="signup"&&(<>
          <input style={fieldInp(nameErr)} placeholder="Your full name" value={name}
            onChange={e=>setName(e.target.value)} onBlur={()=>touch("name")}/>
          {nameErr&&<div style={{fontSize:11,color:"#dc2626",marginBottom:8}}>⚠ {nameErr}</div>}
        </>)}
        <input style={fieldInp(emailErr)} placeholder="Email address" type="email" value={email}
          onChange={e=>setEmail(e.target.value)} onBlur={()=>touch("email")} onKeyDown={e=>e.key==="Enter"&&handleSubmit()}/>
        {emailErr&&<div style={{fontSize:11,color:"#dc2626",marginBottom:8}}>⚠ {emailErr}</div>}
        <div style={{position:"relative",marginBottom:4}}>
          <input style={{...fieldInp(pwErr),paddingRight:44,marginBottom:0}} placeholder="Password (min 8 characters)" type={pwVisible?"text":"password"} value={password}
            onChange={e=>setPassword(e.target.value)} onBlur={()=>touch("password")} onKeyDown={e=>e.key==="Enter"&&handleSubmit()}/>
          <button onClick={()=>setPwVisible(v=>!v)} type="button" style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:13,color:"#9ca3af",padding:0}}>{pwVisible?"🙈":"👁"}</button>
        </div>
        {pwErr&&<div style={{fontSize:11,color:"#dc2626",marginBottom:6}}>⚠ {pwErr}</div>}
        {mode==="signup"&&password.length>0&&(
          <div style={{marginBottom:12}}>
            <div style={{display:"flex",gap:3,marginBottom:3}}>
              {[1,2,3,4].map(i=><div key={i} style={{flex:1,height:3,borderRadius:2,background:i<=pwStrength?pwColors[pwStrength]:"#e2e8f0",transition:"background 0.2s"}}/>)}
            </div>
            <div style={{fontSize:10,color:pwColors[pwStrength],fontWeight:600}}>{pwLabels[pwStrength]}</div>
          </div>
        )}
        {error&&<div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:7,padding:"9px 12px",color:"#dc2626",fontSize:12,marginBottom:12}}>⚠ {error}</div>}
        {success&&<div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:7,padding:"9px 12px",color:"#16a34a",fontSize:12,marginBottom:12}}>✓ {success}</div>}
        <button onClick={handleSubmit} disabled={loading}
          style={{width:"100%",padding:"12px",background:"linear-gradient(135deg,#0d9488,#0891b2)",color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:700,cursor:loading?"not-allowed":"pointer",opacity:loading?0.7:1,marginBottom:14,marginTop:8}}>
          {loading?"Please wait...":(mode==="login"?"Sign In →":"Create Free Account →")}
        </button>
        <div style={{textAlign:"center",fontSize:12,color:"#6b7280"}}>
          {mode==="login"
            ?<span>No account? <button onClick={()=>{setMode("signup");setError("");setTouched({});}} style={{background:"none",border:"none",color:"#0d9488",fontWeight:600,cursor:"pointer",fontSize:12}}>Sign up free</button></span>
            :<span>Have account? <button onClick={()=>{setMode("login");setError("");setTouched({});}} style={{background:"none",border:"none",color:"#0d9488",fontWeight:600,cursor:"pointer",fontSize:12}}>Sign in</button></span>}
        </div>
      </div>
    </div>
  );
}

function UpgradeModal({onClose,feature}) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div style={{background:"#fff",borderRadius:16,padding:28,width:"100%",maxWidth:420,boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}} onClick={e=>e.stopPropagation()}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:36,marginBottom:10}}>⚡</div>
          <div style={{fontSize:20,fontWeight:800,color:"#111827",marginBottom:6}}>Upgrade to Pro</div>
          <div style={{fontSize:13,color:"#6b7280"}}><strong>{feature}</strong> is a Pro feature.</div>
        </div>
        <div style={{background:"#f0fdfa",border:"1px solid #99f6e4",borderRadius:10,padding:14,marginBottom:18}}>
          {["One-URL Apply — paste any job URL","Rejection Risk Score — why you'll get rejected","Salary Negotiation Script — word-for-word","Interview Simulator — AI mock interviews","All 6 resume formats","Unlimited everything"].map(f=>(
            <div key={f} style={{display:"flex",gap:8,padding:"5px 0",fontSize:13,color:"#374151"}}><span style={{color:"#0d9488"}}>✓</span>{f}</div>
          ))}
        </div>
        <button onClick={()=>window.open("https://gumroad.com/l/careeros-pro","_blank")}
          style={{width:"100%",padding:12,background:"linear-gradient(135deg,#0d9488,#0891b2)",color:"#fff",border:"none",borderRadius:9,fontSize:15,fontWeight:700,cursor:"pointer",marginBottom:8}}>
          Start Pro — £9/month →
        </button>
        <button onClick={onClose} style={{width:"100%",padding:9,background:"transparent",border:"none",color:"#9ca3af",fontSize:13,cursor:"pointer"}}>Maybe later</button>
      </div>
    </div>
  );
}

function LogoIcon({size=36}) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{flexShrink:0}}>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0d9488"/><stop offset="100%" stopColor="#0891b2"/>
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="22" fill="url(#lg)"/>
      <text x="46" y="74" fontSize="64" fontWeight="900" textAnchor="middle" fill="white" fontFamily="'Arial Black',Arial,sans-serif">C</text>
      <g transform="translate(73,19) rotate(42)">
        <ellipse cx="0" cy="0" rx="5" ry="9" fill="white"/>
        <polygon points="-4,7 4,7 0,14" fill="#fcd34d"/>
        <ellipse cx="-5" cy="4" rx="3" ry="2" fill="rgba(255,255,255,0.35)"/>
        <ellipse cx="5" cy="4" rx="3" ry="2" fill="rgba(255,255,255,0.35)"/>
      </g>
    </svg>
  );
}

function PrivacyModal({onClose}) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16,overflowY:"auto"}} onClick={onClose}>
      <div style={{background:"#fff",borderRadius:16,padding:32,width:"100%",maxWidth:620,boxShadow:"0 20px 60px rgba(0,0,0,0.2)",maxHeight:"85vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{fontSize:18,fontWeight:800,color:"#111827"}}>Privacy Policy</div>
          <button onClick={onClose} style={{background:"#f1f5f9",border:"none",borderRadius:"50%",width:30,height:30,cursor:"pointer",fontSize:14,color:"#6b7280"}}>✕</button>
        </div>
        <div style={{fontSize:12,color:"#9ca3af",marginBottom:20}}>Last updated: {new Date().toLocaleDateString("en-GB",{month:"long",year:"numeric"})}</div>
        {[
          {h:"1. What We Collect",b:"We collect your email address and name when you sign up, the CVs and job descriptions you paste or import, resumes we generate for you, and your application tracking data. We do not collect payment card details — these are handled by Gumroad."},
          {h:"2. How We Use Your Data",b:"Your data is used solely to provide the CareerOS service: generating tailored resumes, tracking applications, and delivering AI career insights. We never sell your data to third parties or use it for advertising."},
          {h:"3. AI Processing",b:"Content you submit (CVs, job descriptions) is sent to Anthropic's Claude API for processing. This is governed by Anthropic's privacy policy. We do not use your content to train AI models."},
          {h:"4. Data Storage",b:"Your account data is stored securely in Supabase (EU region). Resumes and applications are linked to your account and deleted upon account deletion."},
          {h:"5. Cookies",b:"We use only essential cookies for authentication. We do not use tracking or advertising cookies."},
          {h:"6. Your Rights",b:"You can request deletion of your account and all associated data at any time by emailing us. You can also export your resume history from within the app."},
          {h:"7. Contact",b:"For privacy questions, contact: kapil.de@gmail.com"},
        ].map(s=>(
          <div key={s.h} style={{marginBottom:18}}>
            <div style={{fontSize:14,fontWeight:700,color:"#111827",marginBottom:6}}>{s.h}</div>
            <div style={{fontSize:13,color:"#6b7280",lineHeight:1.7}}>{s.b}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TOAST ───────────────────────────────────────────────────────────────────
function Toast({toasts}) {
  return (
    <div style={{position:"fixed",bottom:24,right:16,zIndex:2000,display:"flex",flexDirection:"column",gap:8,maxWidth:340}}>
      {toasts.map(t=>(
        <div key={t.id} style={{
          background:t.type==="error"?"#dc2626":t.type==="warning"?"#d97706":t.type==="success"?"#16a34a":"#111827",
          color:"#fff",borderRadius:10,padding:"12px 16px",fontSize:13,fontWeight:500,
          boxShadow:"0 4px 16px rgba(0,0,0,0.2)",animation:"fadeIn 0.2s ease",
          display:"flex",alignItems:"flex-start",gap:8,lineHeight:1.5
        }}>
          <span style={{flexShrink:0,fontSize:15}}>{t.type==="error"?"⚠":t.type==="warning"?"⚡":t.type==="success"?"✓":"ℹ"}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

// ─── ANONYMOUS USAGE ─────────────────────────────────────────────────────────
const ANON_KEY = "careeros_anon_usage";
function getAnonUsage() {
  try {
    const raw = localStorage.getItem(ANON_KEY);
    if (!raw) return { count: 0, month: new Date().getMonth() };
    return JSON.parse(raw);
  } catch { return { count: 0, month: new Date().getMonth() }; }
}
function incrementAnonUsage() {
  const cur = getAnonUsage();
  const thisMonth = new Date().getMonth();
  const count = cur.month === thisMonth ? cur.count + 1 : 1;
  try { localStorage.setItem(ANON_KEY, JSON.stringify({ count, month: thisMonth })); } catch {}
  return count;
}
function checkAnonLimit() {
  const cur = getAnonUsage();
  const thisMonth = new Date().getMonth();
  if (cur.month !== thisMonth) return 0;
  return cur.count;
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
  const [showPrivacy,setShowPrivacy]=useState(false);
  const [menuOpen,setMenuOpen]=useState(false);
  const [toasts,setToasts]=useState([]);

  function showToast(message, type="info", duration=4000) {
    const id = Date.now();
    setToasts(prev=>[...prev, {id, message, type}]);
    setTimeout(()=>setToasts(prev=>prev.filter(t=>t.id!==id)), duration);
  }

  const [tab,setTab]=useState("builder");
  const [jd,setJd]=useState("");
  const [cv,setCv]=useState("");
  const [jobUrl,setJobUrl]=useState("");
  const [urlLoading,setUrlLoading]=useState(false);
  const [urlError,setUrlError]=useState("");
  const [result,setResult]=useState(null);
  const [loading,setLoading]=useState(false);
  const [phase,setPhase]=useState(0);
  const [fmt,setFmt]=useState("classic");
  const [originalCv,setOriginalCv]=useState("");
  const [showBefore,setShowBefore]=useState(false);
  const [fileUploading,setFileUploading]=useState(false);
  const [optimising,setOptimising]=useState(false);
  const [showShareCard,setShowShareCard]=useState(false);
  const [shareCopied,setShareCopied]=useState(false);
  const [coverResult,setCoverResult]=useState(null);
  const [coverLoading,setCoverLoading]=useState(false);
  const [intResult,setIntResult]=useState(null);
  const [intLoading,setIntLoading]=useState(false);
  const [simState,setSimState]=useState(null); // interview simulator
  const [simInput,setSimInput]=useState("");
  const [simLoading,setSimLoading]=useState(false);
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
  const simEndRef=useRef(null);

  const isPro = profile?.plan==="pro"||profile?.plan==="enterprise";

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{
      if(session?.user) loadUser(session.user);
      else setAuthLoading(false);
    });
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>{
      if(session?.user) loadUser(session.user);
      else{setUser(null);setProfile(null);setAuthLoading(false);}
    });
    return()=>subscription.unsubscribe();
  },[]);

  async function loadUser(u) {
    setUser(u);
    const p=await getUserProfile(u.id);
    setProfile(p);
    if(p){
      const userApps=await getUserApplications(u.id);
      setApps(userApps.map(a=>({id:a.id,title:a.title,company:a.company,platform:a.platform,status:a.status,appliedDate:a.applied_date||"—",match:a.match_score||0})));
    }
    setAuthLoading(false);
  }

  function requireAuth(feature){if(!user){setAuthMode("signup");setShowAuth(true);return false;}return true;}
  function requirePro(feature){if(!requireAuth(feature))return false;if(!isPro){setUpgradeFeature(feature);setShowUpgrade(true);return false;}return true;}

  function startPhase(){
    setPhase(0);
    const iv=setInterval(()=>setPhase(p=>{if(p>=LOADING_PHASES.length-1){clearInterval(iv);return p;}return p+1;}),3500);
    return iv;
  }

  // ── One-URL Apply ──────────────────────────────────────────────────────────
  async function handleUrlImport() {
    if(!jobUrl.trim()) return;
    setUrlLoading(true);setUrlError("");
    try {
      const data = await scrapeJobURL(jobUrl.trim());
      if(data.error==="linkedin_blocked"){
        setUrlError("LinkedIn requires login — can't auto-import. Open the job on LinkedIn → copy the full job description → paste it in the box below.");
        return;
      }
      if(data.error==="glassdoor_blocked"){
        setUrlError("Glassdoor blocks auto-import. Please copy and paste the job description manually.");
        return;
      }
      if(data.error||!data.content){
        setUrlError(data.message||"Could not extract job description. Please paste it manually.");
        return;
      }
      setJd(data.content);
      setUrlError("");
      setJobUrl("");
      setTimeout(()=>document.getElementById("generate-btn")?.scrollIntoView({behavior:"smooth"}),200);
    } catch(e) {
      console.error("URL import error:",e);
      setUrlError("Could not fetch this URL. Please paste the job description manually.");
    } finally {setUrlLoading(false);}
  }

  // ── Generate Resume ────────────────────────────────────────────────────────
  async function generate() {
    const jdErr=validateJD(jd), cvErr=validateCV(cv);
    if(jdErr||cvErr){ showToast(jdErr||cvErr,"warning"); return; }

    // ── Usage limit check ──
    if(user) {
      if(!isPro) {
        const used = await getMonthlyUsage(user.id);
        if(used >= 2) {
          setUpgradeFeature("More than 2 resumes/month");
          setShowUpgrade(true);
          showToast("Free plan: 2 resumes/month. Upgrade to Pro for unlimited.", "warning");
          return;
        }
      }
    } else {
      // Anonymous user
      const anonUsed = checkAnonLimit();
      if(anonUsed >= 1) {
        setAuthMode("signup");
        setShowAuth(true);
        showToast("Create a free account to generate more resumes.", "info");
        return;
      }
    }

    setLoading(true);setResult(null);
    setOriginalCv(cv);setShowBefore(false);
    const iv=startPhase();
    try {
      const r=await callClaude(`Analyse JD and CV. Return ONLY JSON:
{
  "jdAnalysis":{"role":"title","company":"name","mustHave":["r1","r2","r3","r4"],"niceToHave":["n1","n2","n3"],"keywords":["k1","k2","k3","k4","k5","k6","k7","k8"],"hiringIntent":"1 sentence"},
  "matchScore":75,
  "hiringManagerScore":70,
  "rejectionRisk":{
    "score":35,
    "topReasons":["reason why they will reject — be brutal and specific","reason 2","reason 3"],
    "ghostingRisk":"HIGH/MEDIUM/LOW",
    "cvScreenRisk":"HIGH/MEDIUM/LOW",
    "interviewRisk":"HIGH/MEDIUM/LOW",
    "howToFix":["specific fix 1","specific fix 2","specific fix 3"]
  },
  "salaryIntelligence":{
    "marketMin":"£X","marketMax":"£Y","recommendedAsk":"£Z",
    "insight":"1 sentence",
    "negotiationScript":"Word-for-word script: 'When they offer [amount], say exactly: [script]' — be very specific"
  },
  "gapAnalysis":{"strengths":["s1","s2","s3","s4"],"gaps":["g1","g2","g3"],"transferable":["t1","t2","t3"]},
  "resume":{"name":"NAME","contact":"email • phone • location","summary":"2-3 sentences. Unique hook. Quantified. No clichés.","skills":["sk1","sk2","sk3","sk4","sk5","sk6","sk7","sk8"],"experience":[{"title":"Title","company":"Co","period":"dates","bullets":["verb+initiative+metric","verb+initiative+metric","verb+initiative+metric"]}],"education":"Degree | certs"},
  "hiringManagerInsights":{"firstImpression":"10s read","humanAppeal":"factor","redFlags":["r1"],"standoutFactors":["s1","s2"]},
  "improvements":["t1","t2","t3"]
}
Rules: rejectionRisk.score = probability of rejection 0-100 (higher = more likely to be rejected). Be brutally honest. Every bullet verb+metric. Return ONLY JSON.
JD: ${jd.slice(0,1800)}
CV: ${cv.slice(0,1800)}`, 3000);
      clearInterval(iv);setResult(r);
      if(user&&r.resume) saveResume(user.id,r,r.jdAnalysis?.role,r.jdAnalysis?.company,r.matchScore);
      else if(!user) incrementAnonUsage();
      showToast("Resume generated! Scroll down for your results.", "success");
      setTimeout(()=>ref.current?.scrollIntoView({behavior:"smooth"}),100);
    } catch(e) {
      console.error("Generate error:", e);
      clearInterval(iv);setResult({error:"Generation failed. Check your inputs and retry."});
      showToast("Generation failed. Please try again.", "error");
    } finally {setLoading(false);}
  }

  async function genCover() {
    if(!jd||!cv) return;
    setCoverLoading(true);setCoverResult(null);
    try {
      const r=await callClaude(`Write cover letter. Return ONLY JSON:
{"subject":"Application for [Role] — [Name]","letter":"3 paragraphs. Hook about company. Best achievement with metric. Why this role + confident close. British English. 200 words max."}
JD: ${jd.slice(0,1200)} CV: ${cv.slice(0,1200)}`,1000);
      setCoverResult(r);
      showToast("Cover letter ready!", "success");
    } catch(e){console.error("genCover error:",e);setCoverResult({error:"Failed. Retry."});showToast("Cover letter failed. Try again.","error");}
    finally{setCoverLoading(false);}
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
      showToast("Interview prep ready!", "success");
    } catch(e){console.error("genInterview error:",e);setIntResult({error:"Failed. Retry."});showToast("Interview prep failed. Try again.","error");}
    finally{setIntLoading(false);}
  }

  // ── 1-Click Resume Optimiser ───────────────────────────────────────────────
  async function optimiseResume() {
    if(!result?.resume||!jd) return;
    if(!requirePro("1-Click Resume Optimiser")) return;
    setOptimising(true);
    try {
      const r = await callClaude(`You are an elite resume writer. Rewrite ONLY the experience bullets to maximise ATS score and human appeal for this specific job. Keep same structure, improve impact, add metrics where plausible, mirror job keywords naturally.
Return ONLY JSON matching the same resume schema:
{"name":"${result.resume.name}","contact":"${result.resume.contact}","summary":"improved 2-sentence summary","skills":["sk1","sk2","sk3","sk4","sk5","sk6","sk7","sk8"],"experience":[{"title":"Title","company":"Co","period":"dates","bullets":["stronger bullet with verb+metric","stronger bullet with verb+metric","stronger bullet with verb+metric"]}],"education":"${result.resume.education}"}
Rules: Every bullet must start with a strong action verb. Add or infer plausible metrics. Mirror keywords from the JD. No clichés.
JD: ${jd.slice(0,1400)}
Current resume: ${JSON.stringify(result.resume).slice(0,1400)}`, 2000);
      setResult(prev=>({...prev, resume:r, _optimised:true}));
      showToast("Resume optimised! Bullets rewritten for maximum impact.", "success");
    } catch(e){console.error("optimise error:",e);showToast("Optimisation failed. Try again.","error");}
    finally{setOptimising(false);}
  }

  // ── Share Score Card ───────────────────────────────────────────────────────
  function getInterviewProb(r) {
    if(!r) return 0;
    return Math.round((r.matchScore||0)*0.35 + ((100-(r.rejectionRisk?.score||50))*0.40) + (r.hiringManagerScore||0)*0.25);
  }

  function copyShareCard() {
    if(!result) return;
    const prob = getInterviewProb(result);
    const text = `🎯 My CareerOS AI Career Report

📊 Interview Probability:  ${prob}%
✅ ATS Match Score:        ${result.matchScore||0}%
🧠 Hiring Manager Appeal:  ${result.hiringManagerScore||0}%
💀 Rejection Risk:         ${result.rejectionRisk?.score||0}%
💰 Recommended Salary:     ${result.salaryIntelligence?.recommendedAsk||"—"}

Generated by CareerOS AI → careeros-rose.vercel.app
#CareerOS #JobSearch #AI`;
    navigator.clipboard.writeText(text);
    setShareCopied(true);
    setTimeout(()=>setShareCopied(false),2000);
    showToast("Score card copied — paste anywhere to share!", "success");
  }

  // ── Interview Simulator ────────────────────────────────────────────────────
  async function startSimulator() {
    // Pro gate removed for testing
    if(!jd||!cv){alert("Add your JD and CV in Resume Builder first.");return;}
    setSimLoading(true);
    try {
      const r=await callClaude(`You are a tough interviewer for: ${jd.slice(0,500)}
Generate the first interview question. Return ONLY JSON:
{"question":"Your first interview question","context":"What they are testing with this question","difficulty":"EASY/MEDIUM/HARD","tips":"What a great answer looks like"}`, 500);
      setSimState({
        messages:[{role:"interviewer",content:r.question,context:r.context,tips:r.tips,difficulty:r.difficulty}],
        questionCount:1,
        scores:[],
        finished:false
      });
    } catch{alert("Failed to start. Try again.");}
    finally{setSimLoading(false);}
  }

  async function submitSimAnswer() {
    if(!simInput.trim()||!simState) return;
    setSimLoading(true);
    const currentQ = simState.messages[simState.messages.length-1];
    const newMessages=[...simState.messages,{role:"candidate",content:simInput}];
    setSimInput("");

    try {
      const isLastQuestion = simState.questionCount >= 4;
      const r=await callClaude(`Interview context: ${jd.slice(0,400)}
Question asked: ${currentQ.content}
Candidate answer: ${simInput}

${isLastQuestion ? 'This is the last question. Provide final feedback and overall score.' : 'Provide feedback and ask the next question.'}

Return ONLY JSON:
{
  "feedback":"Specific feedback on this answer — what was good, what was weak",
  "score":75,
  "whatWasMissing":"What the ideal answer would have included",
  ${isLastQuestion ? '"overallScore":72,"overallFeedback":"Overall interview performance summary","topStrength":"Best thing about their interview","topImprovement":"The one thing to improve most"' : '"nextQuestion":"Next interview question","context":"What this tests","difficulty":"EASY/MEDIUM/HARD","tips":"What a great answer looks like"'}
}`, 600);

      const feedbackMsg={role:"feedback",content:r.feedback,score:r.score,whatWasMissing:r.whatWasMissing};
      
      if(isLastQuestion||r.overallScore) {
        setSimState({
          ...simState,
          messages:[...newMessages,feedbackMsg],
          scores:[...simState.scores,r.score],
          finished:true,
          overallScore:r.overallScore||Math.round((simState.scores.reduce((a,b)=>a+b,0)+r.score)/(simState.scores.length+1)),
          overallFeedback:r.overallFeedback,
          topStrength:r.topStrength,
          topImprovement:r.topImprovement,
        });
      } else {
        const nextMsg={role:"interviewer",content:r.nextQuestion,context:r.context,tips:r.tips,difficulty:r.difficulty};
        setSimState({
          ...simState,
          messages:[...newMessages,feedbackMsg,nextMsg],
          scores:[...simState.scores,r.score],
          questionCount:simState.questionCount+1,
        });
      }
      setTimeout(()=>simEndRef.current?.scrollIntoView({behavior:"smooth"}),100);
    } catch{alert("Error. Try again.");}
    finally{setSimLoading(false);}
  }

  async function searchJobs() {
    setJobLoading(true);setJobs([]);
    try {
      const res=await fetch(`/api/jobs?query=${encodeURIComponent(jobQ||"product manager")}&country=${country}&source=both`);
      const data=await res.json();
      setJobs(data.jobs||[]);
    } catch(e){console.error("searchJobs error:",e);setJobs([]);showToast("Job search failed. Try again.","error");}
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
    setApps(prev=>[...prev,{id:Date.now().toString(),title:job.title,company:job.company,platform:job.platform,status:"Saved",appliedDate:"—",match:job.match||0}]);
    if(user) saveApplication(user.id,{title:job.title,company:job.company,platform:job.platform,status:"Saved",match_score:job.match||0,job_url:job.url||""});
  }

  async function loadHistory(){
    if(!user) return;
    setHistoryLoading(true);
    const data=await getUserResumes(user.id);
    setResumeHistory(data);
    setHistoryLoading(false);
  }

  function handleTabChange(t){
    if(t.id==="history"){if(!requireAuth("Resume History")||!requirePro("Resume History"))return;loadHistory();}
    if(t.id==="scores"&&user){loadHistory();}
    if(t.id==="simulator"){if(!requireAuth("Interview Simulator"))return;}
    setTab(t.id);setMenuOpen(false);
  }

  async function handleSignOut(){await signOut();setUser(null);setProfile(null);setApps([]);setResumeHistory([]);}

  // ── CV File Upload ─────────────────────────────────────────────────────────
  async function handleCvFile(file) {
    if(!file) return;
    const name = file.name.toLowerCase();
    setFileUploading(true);
    try {
      if(name.endsWith(".txt")||name.endsWith(".md")) {
        const text = await file.text();
        setCv(text);
        showToast(`Loaded ${file.name}`, "success");
      } else if(name.endsWith(".pdf")) {
        // Use PDF.js if available
        if(window.pdfjsLib) {
          const buf = await file.arrayBuffer();
          const pdf = await window.pdfjsLib.getDocument({data:buf}).promise;
          let fullText = "";
          for(let i=1;i<=pdf.numPages;i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            fullText += content.items.map(s=>s.str).join(" ") + "\n";
          }
          setCv(fullText.trim());
          showToast(`PDF loaded (${pdf.numPages} pages)`, "success");
        } else {
          showToast("PDF support loading — please try again in a moment.", "warning");
        }
      } else {
        showToast("Supported formats: PDF, TXT, MD", "warning");
      }
    } catch(e) {
      console.error("File upload error:", e);
      showToast("Could not read file. Please paste your CV manually.", "error");
    }
    setFileUploading(false);
  }

  const inp={width:"100%",boxSizing:"border-box",background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"11px 14px",color:"#111827",fontSize:14,fontFamily:"inherit",outline:"none",lineHeight:1.6};
  const btn=(x={})=>({background:"#0d9488",color:"#fff",border:"none",borderRadius:8,padding:"10px 18px",fontSize:13,fontWeight:600,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6,...x});
  const ghost=(x={})=>({background:"#fff",border:"1.5px solid #e2e8f0",color:"#374151",borderRadius:8,padding:"9px 16px",fontSize:13,cursor:"pointer",...x});

  if(authLoading) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f0f4f8"}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:32,height:32,border:"3px solid #99f6e4",borderTopColor:"#0d9488",borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 12px"}}/>
        <div style={{color:"#6b7280",fontSize:13}}>Loading CareerOS...</div>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#f0f4f8",color:"#111827",fontFamily:"'Inter','Segoe UI',system-ui,sans-serif",fontSize:"15px"}}>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:0.85}50%{opacity:1}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
        input:focus,textarea:focus{border-color:#0d9488 !important;box-shadow:0 0 0 3px rgba(13,148,136,0.1) !important;outline:none}
        .jcard:hover{border-color:#99f6e4 !important;box-shadow:0 2px 8px rgba(13,148,136,0.08) !important}
        .tab-nav::-webkit-scrollbar{display:none}
        .tab-nav{-ms-overflow-style:none;scrollbar-width:none}
        .fmt-scroll::-webkit-scrollbar{height:4px}.fmt-scroll::-webkit-scrollbar-track{background:#f1f5f9}.fmt-scroll::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:2px}
        @media(max-width:768px){
          .desktop-nav{display:none!important}.mob-btn{display:flex!important}
          .hero-pad{padding:24px 14px 20px!important}
          .main-pad{padding:14px 10px 70px!important}
          .score-grid{grid-template-columns:repeat(2,1fr)!important}
          .gap-grid{grid-template-columns:1fr!important}
          .input-grid{grid-template-columns:1fr!important}
          .action-btns{flex-direction:column!important}
          .action-btns button{width:100%!important;justify-content:center!important}
          .header-logo{order:2!important}
          .mob-btn{order:1!important}
        }
        @media(min-width:769px){.mob-btn{display:none!important}.mobile-menu{display:none!important}}
        @media(max-width:480px){
          .pricing-grid{grid-template-columns:1fr!important}
          .fmt-item{min-width:90px!important;padding:8px 6px!important}
        }
      `}</style>

      {showAuth&&<AuthModal onClose={()=>setShowAuth(false)} onSuccess={u=>loadUser(u)} initialMode={authMode}/>}
      {showUpgrade&&<UpgradeModal onClose={()=>setShowUpgrade(false)} feature={upgradeFeature}/>}
      {showPrivacy&&<PrivacyModal onClose={()=>setShowPrivacy(false)}/>}
      <Toast toasts={toasts}/>

      {/* ── AGENT ANNOUNCEMENT BAR ── */}
      <div style={{background:"linear-gradient(90deg,#4c1d95,#7c3aed,#dc2626)",padding:"7px 16px",textAlign:"center",cursor:"pointer"}} onClick={()=>setTab("agent")}>
        <div style={{display:"inline-flex",alignItems:"center",gap:8,flexWrap:"wrap",justifyContent:"center"}}>
          <span style={{fontSize:13}}>🤖</span>
          <span style={{fontSize:12,fontWeight:700,color:"#fff",letterSpacing:0.2}}>CareerOS Agent — 24/7 autonomous job hunter. Scans 50+ boards, tailors your CV, delivers matches daily.</span>
          <span style={{background:"rgba(255,255,255,0.2)",color:"#fff",fontSize:10,fontWeight:700,padding:"2px 10px",borderRadius:10,border:"1px solid rgba(255,255,255,0.4)",whiteSpace:"nowrap"}}>See how it works →</span>
        </div>
      </div>

      {/* ── HEADER ── */}
      <div style={{background:"#fff",borderBottom:"1px solid #e8ecf0",position:"sticky",top:0,zIndex:100,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
        <div style={{maxWidth:1280,margin:"0 auto",padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",height:60}}>
          <div className="header-logo" style={{display:"flex",alignItems:"center",gap:9,cursor:"pointer",flexShrink:0}} onClick={()=>setTab("builder")}>
            <LogoIcon size={36}/>
            <div>
              <div style={{fontSize:16,fontWeight:800,color:"#111827",letterSpacing:-0.4}}>CareerOS</div>
              <div style={{fontSize:8,color:"#9ca3af",letterSpacing:1.5,textTransform:"uppercase"}}>AI Career Platform</div>
            </div>
          </div>

          <nav className="desktop-nav tab-nav" style={{display:"flex",flex:1,minWidth:0,overflowX:"auto",overflowY:"visible",alignItems:"stretch"}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>handleTabChange(t)}
                style={{
                  background:t.agent?(tab===t.id?"linear-gradient(135deg,#7c3aed,#dc2626)":"linear-gradient(135deg,#7c3aed22,#dc262622)"):"transparent",
                  border:"none",
                  borderBottom:`2.5px solid ${t.agent?(tab===t.id?"#dc2626":"transparent"):(tab===t.id?"#0d9488":"transparent")}`,
                  borderTop:"2.5px solid transparent",
                  color:t.agent?(tab===t.id?"#fff":"#7c3aed"):(tab===t.id?"#0d9488":"#6b7280"),
                  padding:t.agent?"0 14px":"0 13px",
                  height:60,fontSize:13,cursor:"pointer",
                  fontWeight:tab===t.id?700:500,
                  transition:"all 0.15s",whiteSpace:"nowrap",
                  display:"inline-flex",alignItems:"center",gap:4,
                  flexShrink:0,minWidth:"max-content",lineHeight:"60px",
                  borderRadius:t.agent?"0":"0",
                  margin:t.agent?"0 4px":"0",
                }}>
                {t.label}
                {t.pro&&<ProBadge/>}
              </button>
            ))}
          </nav>

          <div className="desktop-nav" style={{display:"flex",gap:8,alignItems:"center",flexShrink:0,marginLeft:8}}>
            {user?(
              <div style={{display:"flex",alignItems:"center",gap:7,padding:"5px 10px",background:"#f8fafc",borderRadius:8,border:"1px solid #e8ecf0",cursor:"pointer"}} onClick={handleSignOut}>
                <div style={{width:26,height:26,borderRadius:"50%",background:"linear-gradient(135deg,#0d9488,#0891b2)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:12}}>
                  {(user.user_metadata?.full_name||user.email||"U")[0].toUpperCase()}
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:600,color:"#111827",lineHeight:1.2}}>{user.user_metadata?.full_name||user.email?.split("@")[0]}</div>
                  <div style={{fontSize:9,color:isPro?"#0d9488":"#9ca3af",fontWeight:600,textTransform:"uppercase",letterSpacing:0.5}}>{isPro?"Pro":"Free"} · Sign out</div>
                </div>
              </div>
            ):(
              <>
                <button onClick={()=>{setAuthMode("login");setShowAuth(true);}} style={ghost({fontSize:12,padding:"7px 14px"})}>Sign in</button>
                <button onClick={()=>{setAuthMode("signup");setShowAuth(true);}} style={btn({fontSize:12,padding:"7px 14px",background:"linear-gradient(135deg,#0d9488,#0891b2)"})}>Get Started Free →</button>
              </>
            )}
          </div>

          <button className="mob-btn" onClick={()=>setMenuOpen(!menuOpen)}
            style={{background:menuOpen?"#0d9488":"#f8fafc",border:`1px solid ${menuOpen?"#0d9488":"#e8ecf0"}`,borderRadius:10,padding:"10px 12px",cursor:"pointer",display:"none",flexDirection:"column",gap:5,transition:"all 0.2s"}}>
            <span style={{width:20,height:2,background:menuOpen?"#fff":"#374151",borderRadius:1,display:"block",transition:"all 0.2s"}}/>
            <span style={{width:20,height:2,background:menuOpen?"#fff":"#374151",borderRadius:1,display:"block",transition:"all 0.2s"}}/>
            <span style={{width:20,height:2,background:menuOpen?"#fff":"#374151",borderRadius:1,display:"block",transition:"all 0.2s"}}/>
          </button>
        </div>

        {menuOpen&&(
          <div className="mobile-menu" style={{background:"#fff",borderTop:"1px solid #e8ecf0",boxShadow:"0 8px 24px rgba(0,0,0,0.08)"}}>
            {/* User info strip */}
            {user&&(
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 20px",background:"#f0fdfa",borderBottom:"1px solid #e8ecf0"}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#0d9488,#0891b2)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:14,flexShrink:0}}>
                  {(user.user_metadata?.full_name||user.email||"U")[0].toUpperCase()}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:"#111827",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.user_metadata?.full_name||user.email}</div>
                  <div style={{fontSize:11,color:isPro?"#0d9488":"#9ca3af",fontWeight:600,textTransform:"uppercase",letterSpacing:0.5}}>{isPro?"Pro Plan":"Free Plan"}</div>
                </div>
              </div>
            )}
            {/* Nav items */}
            <div style={{padding:"8px 0"}}>
              {TABS.map(t=>(
                <button key={t.id} onClick={()=>handleTabChange(t)}
                  style={{width:"100%",background:t.agent?(tab===t.id?"linear-gradient(135deg,#4c1d95,#7c2d12)":"linear-gradient(135deg,#1e1b4b11,#7c2d1211)"):(tab===t.id?"#f0fdfa":"transparent"),border:"none",borderLeft:`4px solid ${t.agent?"#7c3aed":(tab===t.id?"#0d9488":"transparent")}`,color:t.agent?"#a78bfa":(tab===t.id?"#0d9488":"#374151"),padding:"15px 20px",fontSize:15,cursor:"pointer",fontWeight:t.agent?700:(tab===t.id?700:400),textAlign:"left",display:"flex",alignItems:"center",justifyContent:"space-between",boxSizing:"border-box"}}>
                  <span style={{display:"flex",alignItems:"center",gap:8}}>{t.label}{t.pro&&<ProBadge/>}</span>
                  {tab===t.id&&<span style={{color:t.agent?"#a78bfa":"#0d9488",fontSize:12}}>●</span>}
                </button>
              ))}
            </div>
            {/* Bottom actions */}
            <div style={{padding:"14px 20px",borderTop:"1px solid #e8ecf0",display:"flex",flexDirection:"column",gap:10}}>
              {user?(
                <>
                  {!isPro&&<button onClick={()=>{setTab("pricing");setMenuOpen(false);}} style={btn({fontSize:14,justifyContent:"center",padding:"13px",background:"linear-gradient(135deg,#0d9488,#0891b2)"})}>⚡ Upgrade to Pro</button>}
                  <button onClick={()=>{handleSignOut();setMenuOpen(false);}} style={ghost({fontSize:14,textAlign:"center",padding:"12px"})}>Sign out</button>
                </>
              ):(
                <>
                  <button onClick={()=>{setAuthMode("signup");setShowAuth(true);setMenuOpen(false);}} style={btn({fontSize:14,justifyContent:"center",padding:"13px",background:"linear-gradient(135deg,#0d9488,#0891b2)"})}>Get Started Free →</button>
                  <button onClick={()=>{setAuthMode("login");setShowAuth(true);setMenuOpen(false);}} style={ghost({fontSize:14,textAlign:"center",padding:"12px"})}>Sign in</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="main-pad" style={{maxWidth:1280,margin:"0 auto",padding:"24px 16px 80px"}}>

        {/* ════ RESUME BUILDER ════ */}
        {tab==="builder"&&(
          <div style={{animation:"fadeIn 0.3s ease"}}>

            {/* ── HERO ── */}
            <div className="hero-pad" style={{textAlign:"center",padding:"48px 20px 40px",background:"#fff",borderRadius:16,marginBottom:16,border:"1px solid #e8ecf0",boxShadow:"0 1px 6px rgba(0,0,0,0.04)"}}>
              <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 14px",borderRadius:20,background:"#f0fdfa",border:"1px solid #99f6e4",color:"#0d9488",fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:18}}>
                ✦ AI Resume Builder
              </div>
              <h1 style={{fontSize:"clamp(30px,6vw,54px)",fontWeight:900,color:"#0f172a",lineHeight:1.08,marginBottom:12,letterSpacing:-1.5}}>
                Get the interview.<br/><span style={{color:"#0d9488"}}>Not the rejection.</span>
              </h1>
              <p style={{color:"#6b7280",fontSize:15,maxWidth:480,margin:"0 auto 24px",lineHeight:1.7}}>
                Paste a job description, upload your CV — get a tailored resume, ATS score, rejection risk, salary intel and interview coaching in 60 seconds.
              </p>
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:20,flexWrap:"wrap",marginBottom:user?0:20}}>
                {[["⚡","ATS scored"],["💀","Rejection risk"],["💰","Salary script"],["🎯","Tailored per job"]].map(([icon,label])=>(
                  <div key={label} style={{display:"flex",alignItems:"center",gap:5,fontSize:12,color:"#6b7280",fontWeight:500}}>
                    <span style={{fontSize:14}}>{icon}</span>{label}
                  </div>
                ))}
              </div>
              {!user&&<button onClick={()=>{setAuthMode("signup");setShowAuth(true);}} style={{...btn({padding:"13px 32px",fontSize:15,background:"linear-gradient(135deg,#0d9488,#0891b2)",borderRadius:10,boxShadow:"0 4px 14px rgba(13,148,136,0.3)"})}}>Start Free — No Card Needed →</button>}
            </div>

            {/* ── AGENT CALLOUT (compact) ── */}
            <div onClick={()=>setTab("agent")} style={{cursor:"pointer",background:"linear-gradient(135deg,#1e1b4b,#4c1d95)",borderRadius:12,padding:"14px 20px",marginBottom:16,display:"flex",alignItems:"center",gap:14,border:"1px solid rgba(139,92,246,0.25)"}}>
              <div style={{width:40,height:40,background:"linear-gradient(135deg,#7c3aed,#dc2626)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🤖</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:800,color:"#fff",marginBottom:2}}>CareerOS Agent — 24/7 autonomous job hunting</div>
                <div style={{fontSize:11,color:"rgba(196,181,253,0.8)"}}>Scans 160+ companies, tailors your CV, builds your daily shortlist. Free beta — download now.</div>
              </div>
              <div style={{fontSize:11,fontWeight:700,color:"#c4b5fd",whiteSpace:"nowrap",flexShrink:0}}>Learn more →</div>
            </div>

            {/* ── INPUTS ── */}
            <Card style={{marginBottom:14}}>
              <div className="input-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:20}}>

                {/* Job Description */}
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <label style={{fontSize:12,fontWeight:700,color:"#111827",letterSpacing:-0.2}}>Job Description</label>
                    <span style={{fontSize:10,color:jd.length<80&&jd.length>0?"#f97316":jd.length>=80?"#16a34a":"#9ca3af",fontWeight:600}}>
                      {jd.length>0?`${jd.length} chars${jd.length<80?" — need more":"  ✓"}`:""}
                    </span>
                  </div>
                  {/* URL import — inline */}
                  <div style={{display:"flex",gap:6,marginBottom:8}}>
                    <input
                      style={{flex:1,background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:7,padding:"8px 12px",color:"#111827",fontSize:12,fontFamily:"inherit",outline:"none"}}
                      placeholder="⚡ Paste job URL to auto-import (Reed, Adzuna, TotalJobs…)"
                      value={jobUrl} onChange={e=>{setJobUrl(e.target.value);setUrlError("");}}
                      onKeyDown={e=>e.key==="Enter"&&handleUrlImport()}
                    />
                    <button onClick={handleUrlImport}
                      style={{background:urlLoading||!jobUrl?"#f1f5f9":"#0d9488",color:urlLoading||!jobUrl?"#9ca3af":"#fff",border:"none",borderRadius:7,padding:"8px 14px",fontSize:12,fontWeight:600,cursor:urlLoading||!jobUrl?"not-allowed":"pointer",flexShrink:0,whiteSpace:"nowrap",transition:"all 0.15s"}}>
                      {urlLoading?"…":"Import"}
                    </button>
                  </div>
                  {urlError&&(
                    <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:7,padding:"8px 12px",marginBottom:8,fontSize:11,color:"#dc2626",lineHeight:1.5}}>
                      {urlError}
                      {(urlError.includes("LinkedIn")||urlError.includes("login"))&&(
                        <button onClick={async()=>{try{const t=await navigator.clipboard.readText();if(t&&t.length>100){setJd(t);setUrlError("");}else setUrlError("Clipboard empty — paste manually below.");}catch{setUrlError("Could not read clipboard — paste manually below.");}}}
                          style={{display:"block",marginTop:6,background:"#dc2626",color:"#fff",border:"none",borderRadius:5,padding:"4px 10px",fontSize:10,fontWeight:600,cursor:"pointer"}}>📋 Paste from clipboard</button>
                      )}
                    </div>
                  )}
                  {!urlError&&jd&&!urlLoading&&jobUrl===""&&<div style={{fontSize:11,color:"#16a34a",marginBottom:6,fontWeight:600}}>✓ Imported successfully</div>}
                  <textarea
                    style={{...inp,height:200,resize:"vertical",borderColor:jd.length>0&&jd.length<80?"#fca5a5":undefined}}
                    placeholder="Or paste the full job description here…"
                    value={jd} onChange={e=>setJd(e.target.value)}/>
                  {jd.length>0&&jd.length<80&&<div style={{fontSize:11,color:"#f97316",marginTop:4}}>⚠ Paste the full job description for best results</div>}
                </div>

                {/* CV */}
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <label style={{fontSize:12,fontWeight:700,color:"#111827",letterSpacing:-0.2}}>Your CV / Background</label>
                    <span style={{fontSize:10,color:cv.length<50&&cv.length>0?"#f97316":cv.length>=50?"#16a34a":"#9ca3af",fontWeight:600}}>
                      {cv.length>0?`${cv.length} chars${cv.length<50?" — need more":"  ✓"}`:""}
                    </span>
                  </div>
                  <div
                    onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)handleCvFile(f);}}
                    onDragOver={e=>e.preventDefault()}
                    onClick={()=>document.getElementById("cv-file-input").click()}
                    style={{border:"1.5px dashed #d1d5db",borderRadius:7,padding:"10px 14px",marginBottom:8,background:"#fafbfc",display:"flex",alignItems:"center",gap:10,cursor:"pointer",transition:"border-color 0.15s"}}
                    onMouseEnter={e=>e.currentTarget.style.borderColor="#0d9488"}
                    onMouseLeave={e=>e.currentTarget.style.borderColor="#d1d5db"}>
                    <span style={{fontSize:16,flexShrink:0}}>{fileUploading?"⏳":"📎"}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:600,color:"#374151"}}>{fileUploading?"Reading file…":"Upload CV"}</div>
                      <div style={{fontSize:10,color:"#9ca3af"}}>PDF, TXT or MD · drag & drop or click</div>
                    </div>
                    <input id="cv-file-input" type="file" accept=".pdf,.txt,.md" style={{display:"none"}}
                      onChange={e=>{const f=e.target.files[0];if(f){handleCvFile(f);e.target.value="";}}}/>
                  </div>
                  <textarea
                    style={{...inp,height:200,resize:"vertical"}}
                    placeholder="Or paste your CV / describe your experience here…"
                    value={cv} onChange={e=>setCv(e.target.value)}/>
                  {!cv&&<button onClick={()=>setCv(SAMPLE_CV)} style={{...ghost(),marginTop:6,fontSize:11,padding:"4px 12px"}}>Use sample CV →</button>}
                </div>
              </div>

              {/* Format picker — inside the card, below inputs */}
              <div style={{borderTop:"1px solid #f1f5f9",marginTop:16,paddingTop:14}}>
                <div style={{fontSize:11,fontWeight:700,color:"#6b7280",letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Resume Format</div>
                <div className="fmt-scroll" style={{display:"flex",gap:7,overflowX:"auto",paddingBottom:2}}>
                  {RESUME_FORMATS.map(f=>(
                    <div key={f.id} onClick={()=>setFmt(f.id)} className="fmt-item"
                      style={{border:`2px solid ${fmt===f.id?f.accentColor:"#e8ecf0"}`,borderRadius:8,padding:"8px 12px",cursor:"pointer",background:fmt===f.id?f.accentColor+"10":"transparent",transition:"all 0.15s",textAlign:"center",flexShrink:0,minWidth:80}}>
                      <div style={{fontSize:16,marginBottom:3}}>{f.icon}</div>
                      <div style={{fontSize:10,fontWeight:700,color:fmt===f.id?f.accentColor:"#374151"}}>{f.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

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
                  <div style={{fontSize:11,color:"#5eead4",fontWeight:600}}>{Math.round(((phase+1)/LOADING_PHASES.length)*100)}%</div>
                </div>
              </div>
            )}

            <div className="action-btns" style={{display:"flex",gap:10,marginBottom:24,flexWrap:"wrap"}}>
              <button id="generate-btn" onClick={generate} disabled={loading} style={{...btn({background:"linear-gradient(135deg,#0d9488,#0891b2)",padding:"12px 24px",fontSize:14}),opacity:loading||!jd||!cv?0.5:1}}>
                {loading?"Generating...":"✦ Generate Tailored Resume"}
              </button>
              {result&&!result.error&&(<>
                <button onClick={()=>{setTab("cover");genCover();}} style={ghost({color:"#7c3aed",borderColor:"#ddd6fe"})}>✉ Cover Letter</button>
                <button onClick={()=>{setTab("interview");genInterview();}} style={ghost({color:"#0891b2",borderColor:"#bae6fd"})}>◆ Interview Prep</button>
                <button onClick={()=>handleTabChange({id:"simulator",pro:true})} style={ghost({color:"#ef4444",borderColor:"#fecaca"})}>🎭 Sim</button>
                <button onClick={()=>{navigator.clipboard.writeText([result.resume?.name,result.resume?.contact,"",result.resume?.summary].join("\n"));setCopied(true);setTimeout(()=>setCopied(false),1500);}} style={ghost({color:copied?"#16a34a":"#6b7280"})}>
                  {copied?"✓ Copied":"Copy"}
                </button>
              </>)}
            </div>

            {result&&!result.error&&(
              <div ref={ref}>

                {/* ── INTERVIEW PROBABILITY — HERO METRIC ── */}
                {(()=>{
                  const prob = getInterviewProb(result);
                  const probColor = prob>=70?"#16a34a":prob>=50?"#d97706":"#dc2626";
                  const probLabel = prob>=70?"Strong Candidate":prob>=50?"Competitive":"Needs Work";
                  return (
                    <div style={{background:"#fff",border:"2px solid #e8ecf0",borderRadius:16,padding:"24px 28px",marginBottom:14,display:"flex",alignItems:"center",gap:24,flexWrap:"wrap",boxShadow:"0 2px 12px rgba(0,0,0,0.05)"}}>
                      <div style={{display:"flex",alignItems:"center",gap:18,flex:1,minWidth:220}}>
                        <div style={{position:"relative",flexShrink:0}}>
                          <ScoreRing score={prob} size={96} color={probColor}/>
                        </div>
                        <div>
                          <div style={{fontSize:11,fontWeight:700,color:"#9ca3af",letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Interview Probability</div>
                          <div style={{fontSize:28,fontWeight:900,color:probColor,letterSpacing:-1,lineHeight:1}}>{prob}%</div>
                          <div style={{fontSize:13,fontWeight:600,color:probColor,marginTop:3}}>{probLabel}</div>
                          <div style={{fontSize:11,color:"#9ca3af",marginTop:4}}>Based on ATS fit, human appeal & rejection risk</div>
                        </div>
                      </div>
                      <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                        {result._optimised&&<span style={{background:"#f0fdf4",color:"#16a34a",border:"1px solid #bbf7d0",borderRadius:6,fontSize:11,fontWeight:700,padding:"4px 10px"}}>✦ Optimised</span>}
                        <button onClick={optimiseResume} disabled={optimising} style={{...btn({background:optimising?"#f1f5f9":"linear-gradient(135deg,#7c3aed,#6d28d9)",padding:"9px 18px",fontSize:12}),opacity:optimising?0.6:1}}>
                          {optimising?"Optimising…":"✨ 1-Click Optimise"}
                        </button>
                        <button onClick={copyShareCard} style={ghost({fontSize:12,padding:"9px 16px",color:shareCopied?"#16a34a":"#374151",borderColor:shareCopied?"#bbf7d0":"#e2e8f0"})}>
                          {shareCopied?"✓ Copied!":"📤 Share Score"}
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* ── Score Cards Row ── */}
                <div className="score-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:14}}>
                  <Card style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                    <SLabel>ATS Score</SLabel>
                    <ScoreRing score={result.matchScore} size={70}/>
                    <div style={{fontSize:10,fontWeight:600,color:result.matchScore>=80?"#16a34a":result.matchScore>=65?"#d97706":"#dc2626"}}>
                      {result.matchScore>=80?"Strong":result.matchScore>=65?"Good":"Needs Work"}
                    </div>
                  </Card>
                  <Card style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                    <SLabel color="#7c3aed">Human Appeal</SLabel>
                    <ScoreRing score={result.hiringManagerScore} size={70} color="#7c3aed"/>
                    <div style={{fontSize:10,fontWeight:600,color:"#7c3aed"}}>HM View</div>
                  </Card>
                  <Card style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                    <SLabel color="#dc2626">Rejection Risk</SLabel>
                    <ScoreRing score={result.rejectionRisk?.score} size={70} color={result.rejectionRisk?.score>60?"#dc2626":result.rejectionRisk?.score>35?"#d97706":"#16a34a"}/>
                    <div style={{fontSize:10,fontWeight:600,color:result.rejectionRisk?.score>60?"#dc2626":result.rejectionRisk?.score>35?"#d97706":"#16a34a"}}>
                      {result.rejectionRisk?.score>60?"High Risk":result.rejectionRisk?.score>35?"Medium Risk":"Low Risk"}
                    </div>
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

                {/* ── VIRAL FEATURE 2: Rejection Risk ── */}
                {result.rejectionRisk&&(
                  <div style={{background:"linear-gradient(135deg,#fef2f2,#fff5f5)",border:"2px solid #fecaca",borderRadius:12,padding:20,marginBottom:14}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                      <span style={{fontSize:20}}>💀</span>
                      <div>
                        <div style={{fontSize:14,fontWeight:800,color:"#dc2626",display:"flex",alignItems:"center",gap:8}}>
                          Why You'll Get Rejected
                          <ViralBadge text="🔥 BRUTAL HONESTY"/>
                        </div>
                        <div style={{fontSize:11,color:"#9ca3af"}}>The real reasons hiring managers will pass on your application</div>
                      </div>
                    </div>

                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:14}}>
                      {[
                        {label:"CV Screen Risk",value:result.rejectionRisk.cvScreenRisk},
                        {label:"Ghosting Risk",value:result.rejectionRisk.ghostingRisk},
                        {label:"Interview Risk",value:result.rejectionRisk.interviewRisk},
                      ].map(r=>(
                        <div key={r.label} style={{textAlign:"center",padding:10,background:"#fff",borderRadius:8,border:"1px solid #fecaca"}}>
                          <div style={{fontSize:10,color:"#9ca3af",fontWeight:600,marginBottom:4}}>{r.label}</div>
                          <div style={{fontSize:14,fontWeight:800,color:r.value==="HIGH"?"#dc2626":r.value==="MEDIUM"?"#d97706":"#16a34a"}}>{r.value||"—"}</div>
                        </div>
                      ))}
                    </div>

                    {/* Rejection details — Pro only */}
                    {isPro ? (<>
                      <div style={{marginBottom:12}}>
                        <div style={{fontSize:11,fontWeight:700,color:"#dc2626",marginBottom:8}}>TOP REJECTION REASONS:</div>
                        {result.rejectionRisk.topReasons?.map((r,i)=>(
                          <div key={i} style={{display:"flex",gap:8,padding:"7px 10px",background:"#fff",borderRadius:7,border:"1px solid #fecaca",marginBottom:6}}>
                            <span style={{color:"#dc2626",fontWeight:800,flexShrink:0}}>{i+1}.</span>
                            <span style={{fontSize:12,color:"#374151",lineHeight:1.5}}>{r}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <div style={{fontSize:11,fontWeight:700,color:"#16a34a",marginBottom:8}}>HOW TO FIX IT:</div>
                        {result.rejectionRisk.howToFix?.map((fix,i)=>(
                          <div key={i} style={{display:"flex",gap:8,padding:"6px 0",borderBottom:"1px solid #fee2e2"}}>
                            <span style={{color:"#16a34a",flexShrink:0}}>✓</span>
                            <span style={{fontSize:12,color:"#374151",lineHeight:1.5}}>{fix}</span>
                          </div>
                        ))}
                      </div>
                    </>) : (
                      <div style={{position:"relative",overflow:"hidden",borderRadius:8}}>
                        <div style={{filter:"blur(4px)",pointerEvents:"none",userSelect:"none",opacity:0.5}}>
                          {result.rejectionRisk.topReasons?.slice(0,2).map((r,i)=>(
                            <div key={i} style={{display:"flex",gap:8,padding:"7px 10px",background:"#fff",borderRadius:7,border:"1px solid #fecaca",marginBottom:6}}>
                              <span style={{color:"#dc2626",fontWeight:800,flexShrink:0}}>{i+1}.</span>
                              <span style={{fontSize:12,color:"#374151"}}>{r}</span>
                            </div>
                          ))}
                        </div>
                        <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"rgba(255,255,255,0.7)",backdropFilter:"blur(2px)",borderRadius:8,gap:8}}>
                          <div style={{fontSize:13,fontWeight:700,color:"#111827"}}>🔒 Pro Feature</div>
                          <div style={{fontSize:11,color:"#6b7280",textAlign:"center",maxWidth:220}}>Full rejection breakdown + how to fix each reason</div>
                          <button onClick={()=>{setUpgradeFeature("Rejection Breakdown");setShowUpgrade(true);}} style={btn({fontSize:11,padding:"6px 16px",background:"linear-gradient(135deg,#dc2626,#b91c1c)"})}>Unlock with Pro →</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Salary Negotiation Script — Pro paywall ── */}
                {result.salaryIntelligence?.negotiationScript&&(
                  <div style={{background:"linear-gradient(135deg,#f0fdf4,#ecfdf5)",border:"2px solid #bbf7d0",borderRadius:12,padding:20,marginBottom:14}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                      <span style={{fontSize:20}}>💰</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:14,fontWeight:800,color:"#16a34a",display:"flex",alignItems:"center",gap:8}}>
                          Salary Negotiation Script
                          <ViralBadge text="🔥 WORD-FOR-WORD"/>
                        </div>
                        <div style={{fontSize:11,color:"#9ca3af"}}>Exactly what to say when they make you an offer</div>
                      </div>
                      {!isPro&&<span style={{background:"#0d9488",color:"#fff",fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:6,letterSpacing:0.5}}>PRO</span>}
                    </div>
                    {isPro ? (<>
                      <div style={{background:"#fff",borderRadius:8,border:"1px solid #bbf7d0",padding:16,fontSize:13,color:"#374151",lineHeight:1.8,fontStyle:"italic",position:"relative"}}>
                        <div style={{position:"absolute",top:-10,left:16,background:"#16a34a",color:"#fff",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:10}}>Script</div>
                        {result.salaryIntelligence.negotiationScript}
                      </div>
                      <div style={{marginTop:10,fontSize:11,color:"#6b7280"}}>💡 Tip: Stay silent after your ask. The first person to speak usually loses.</div>
                    </>) : (
                      <div style={{position:"relative",borderRadius:8,overflow:"hidden"}}>
                        <div style={{filter:"blur(5px)",pointerEvents:"none",userSelect:"none",background:"#fff",borderRadius:8,border:"1px solid #bbf7d0",padding:16,fontSize:13,color:"#374151",lineHeight:1.8,fontStyle:"italic"}}>
                          When they make an offer say: "Thank you so much — I'm really excited about this role. Based on my research and experience, I was expecting something closer to [X]. Is there flexibility there?"
                        </div>
                        <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,background:"rgba(255,255,255,0.6)",backdropFilter:"blur(2px)"}}>
                          <div style={{fontSize:13,fontWeight:700,color:"#111827"}}>🔒 Word-for-word script — Pro only</div>
                          <button onClick={()=>{setUpgradeFeature("Salary Negotiation Script");setShowUpgrade(true);}} style={btn({fontSize:11,padding:"7px 18px",background:"linear-gradient(135deg,#059669,#0d9488)"})}>Unlock with Pro →</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* JD Analysis */}
                <Card>
                  <SLabel>JD Analysis — {result.jdAnalysis?.role} at {result.jdAnalysis?.company}</SLabel>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12}}>
                    <div><div style={{fontSize:10,color:"#9ca3af",fontWeight:600,marginBottom:5,letterSpacing:1}}>MUST-HAVE</div>{result.jdAnalysis?.mustHave?.map(s=><Chip key={s} text={s} color="#16a34a" bg="#f0fdf4"/>)}</div>
                    <div><div style={{fontSize:10,color:"#9ca3af",fontWeight:600,marginBottom:5,letterSpacing:1}}>NICE TO HAVE</div>{result.jdAnalysis?.niceToHave?.map(s=><Chip key={s} text={s} color="#d97706" bg="#fffbeb"/>)}</div>
                    <div><div style={{fontSize:10,color:"#9ca3af",fontWeight:600,marginBottom:5,letterSpacing:1}}>KEYWORDS</div>{result.jdAnalysis?.keywords?.map(k=><Chip key={k} text={k} color="#7c3aed" bg="#f5f3ff"/>)}</div>
                  </div>
                  {result.jdAnalysis?.hiringIntent&&<div style={{marginTop:10,padding:10,background:"#f0fdfa",borderRadius:7,borderLeft:"3px solid #0d9488"}}><div style={{fontSize:10,fontWeight:700,color:"#0d9488",marginBottom:3}}>HIRING INTENT</div><div style={{fontSize:12,color:"#374151",lineHeight:1.6}}>{result.jdAnalysis.hiringIntent}</div></div>}
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
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14}}>
                    {[["✓ Strengths","strengths","#16a34a"],["✗ Gaps","gaps","#dc2626"],["⇄ Transferable","transferable","#d97706"]].map(([label,key,color])=>(
                      <div key={key}><div style={{fontSize:12,fontWeight:700,color,marginBottom:8}}>{label}</div>{result.gapAnalysis?.[key]?.map((s,i)=><div key={i} style={{fontSize:13,color:"#6b7280",padding:"5px 0",borderBottom:"1px solid #f9fafb",lineHeight:1.5}}>• {s}</div>)}</div>
                    ))}
                  </div>
                </Card>

                <Card>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
                    <SLabel style={{margin:0}}>✦ Your Tailored Resume</SLabel>
                    {originalCv&&(
                      <div style={{display:"flex",background:"#f1f5f9",borderRadius:8,padding:2,gap:2}}>
                        <button onClick={()=>setShowBefore(false)} style={{padding:"5px 14px",borderRadius:6,border:"none",fontSize:11,fontWeight:600,cursor:"pointer",background:!showBefore?"#0d9488":"transparent",color:!showBefore?"#fff":"#6b7280",transition:"all 0.15s"}}>After ✦</button>
                        <button onClick={()=>setShowBefore(true)} style={{padding:"5px 14px",borderRadius:6,border:"none",fontSize:11,fontWeight:600,cursor:"pointer",background:showBefore?"#7c3aed":"transparent",color:showBefore?"#fff":"#6b7280",transition:"all 0.15s"}}>Before</button>
                      </div>
                    )}
                  </div>
                  {showBefore ? (
                    <div style={{background:"#fafbfc",border:"1px solid #e8ecf0",borderRadius:8,padding:16,maxHeight:400,overflowY:"auto"}}>
                      <div style={{fontSize:11,fontWeight:700,color:"#7c3aed",letterSpacing:1,marginBottom:8,textTransform:"uppercase"}}>Your Original CV</div>
                      <pre style={{fontSize:12,color:"#374151",lineHeight:1.7,whiteSpace:"pre-wrap",fontFamily:"inherit",margin:0}}>{originalCv}</pre>
                    </div>
                  ) : (
                    <FormatPicker resume={result.resume} selected={fmt} onSelect={setFmt} onDownload={f=>downloadResume(result.resume,f)}/>
                  )}
                </Card>

                <Card>
                  <SLabel>💡 Strategic Improvements</SLabel>
                  {result.improvements?.map((tip,i)=>(
                    <div key={i} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:i<result.improvements.length-1?"1px solid #f9fafb":"none"}}>
                      <div style={{width:22,height:22,borderRadius:"50%",background:"#f0fdfa",border:"1px solid #99f6e4",color:"#0d9488",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{i+1}</div>
                      <div style={{fontSize:13,color:"#6b7280",lineHeight:1.7}}>{tip}</div>
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
            {!jobLoading&&jobs.length===0&&<div style={{textAlign:"center",padding:48,color:"#9ca3af"}}><div style={{fontSize:36,marginBottom:10}}>🔍</div><div style={{fontSize:15,fontWeight:600,color:"#374151",marginBottom:4}}>Search for jobs above</div></div>}
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
                      <span style={{fontSize:13,color:"#6b7280"}}>🏢 {job.company}</span>
                      <span style={{fontSize:13,color:"#9ca3af"}}>📍 {job.location}</span>
                      {job.salary&&job.salary!=="Competitive"&&<span style={{fontSize:13,color:"#9ca3af"}}>💰 {job.salary}</span>}
                    </div>
                    {job.description&&<p style={{fontSize:12,color:"#9ca3af",lineHeight:1.6,marginBottom:10}}>{job.description}</p>}
                    <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                      <button onClick={e=>applyJob(job,e)} disabled={applying===job.id} style={btn({fontSize:11,padding:"7px 14px",background:applied===job.id?"#16a34a":"#0d9488"})}>
                        {applying===job.id?"...":applied===job.id?"✓ Applied":"Apply →"}
                      </button>
                      <button onClick={e=>{e.stopPropagation();setJd((job.description||job.title)+"\n\nRole: "+job.title+"\nCompany: "+job.company);setTab("builder");}} style={ghost({fontSize:11,padding:"7px 12px",color:"#0d9488",borderColor:"#99f6e4"})}>✦ Tailor</button>
                      <button onClick={e=>saveJob(job,e)} style={ghost({fontSize:11,padding:"7px 12px",color:apps.find(a=>a.title===job.title&&a.company===job.company)?"#16a34a":"#6b7280"})}>
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
            {!user&&<div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:8,padding:12,marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}><span style={{fontSize:13,color:"#92400e"}}>Sign in to save applications permanently</span><button onClick={()=>{setAuthMode("signup");setShowAuth(true);}} style={btn({fontSize:12,padding:"7px 14px"})}>Sign in →</button></div>}
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

        {/* ════ CV SCORES ════ */}
        {tab==="scores"&&(
          <div style={{animation:"fadeIn 0.3s ease"}}>
            <div style={{marginBottom:20}}>
              <h2 style={{fontSize:24,fontWeight:800,color:"#111827",marginBottom:4,letterSpacing:-0.5}}>CV Score Dashboard</h2>
              <p style={{color:"#6b7280",fontSize:14}}>Track your resume performance and improvement over time.</p>
            </div>

            {!result&&resumeHistory.length===0&&(
              <div style={{textAlign:"center",padding:60,background:"#fff",borderRadius:16,border:"1px solid #e8ecf0"}}>
                <div style={{fontSize:48,marginBottom:14}}>📊</div>
                <div style={{fontSize:16,fontWeight:700,color:"#111827",marginBottom:6}}>No scores yet</div>
                <div style={{fontSize:13,color:"#6b7280",marginBottom:20}}>Generate a resume in the Builder tab to see your scores here.</div>
                <button onClick={()=>setTab("builder")} style={btn({padding:"11px 24px"})}>Go to Builder →</button>
              </div>
            )}

            {result&&result.matchScore>0&&(
              <>
                <div style={{background:"linear-gradient(135deg,#f0fdfa,#ecfdf5)",border:"1px solid #99f6e4",borderRadius:14,padding:20,marginBottom:16}}>
                  <div style={{fontSize:12,fontWeight:700,color:"#0d9488",letterSpacing:1,textTransform:"uppercase",marginBottom:12}}>Current Resume</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:12}}>
                    {[
                      {label:"ATS Score",score:result.matchScore,color:result.matchScore>=80?"#16a34a":result.matchScore>=65?"#d97706":"#dc2626"},
                      {label:"Human Appeal",score:result.hiringManagerScore,color:"#7c3aed"},
                      {label:"Rejection Risk",score:result.rejectionRisk?.score,color:result.rejectionRisk?.score>60?"#dc2626":result.rejectionRisk?.score>35?"#d97706":"#16a34a",invert:true},
                    ].map(m=>(
                      <div key={m.label} style={{background:"#fff",borderRadius:10,padding:14,textAlign:"center",border:"1px solid #e8ecf0"}}>
                        <ScoreRing score={m.score} size={64} color={m.color}/>
                        <div style={{fontSize:11,fontWeight:600,color:"#6b7280",marginTop:6}}>{m.label}</div>
                        {m.invert&&<div style={{fontSize:10,color:"#9ca3af"}}>(lower = better)</div>}
                      </div>
                    ))}
                    {result.salaryIntelligence?.recommendedAsk&&(
                      <div style={{background:"#fff",borderRadius:10,padding:14,textAlign:"center",border:"1px solid #e8ecf0"}}>
                        <div style={{fontSize:26,fontWeight:900,color:"#059669",marginBottom:4}}>{result.salaryIntelligence.recommendedAsk}</div>
                        <div style={{fontSize:11,fontWeight:600,color:"#6b7280"}}>Recommended Ask</div>
                        <div style={{fontSize:10,color:"#9ca3af"}}>{result.salaryIntelligence.marketMin}–{result.salaryIntelligence.marketMax}</div>
                      </div>
                    )}
                  </div>
                </div>

                {result.rejectionRisk&&(
                  <Card>
                    <SLabel color="#dc2626">Top Rejection Risks to Fix</SLabel>
                    {result.rejectionRisk.topReasons?.map((r,i)=>(
                      <div key={i} style={{display:"flex",gap:10,padding:"8px 0",borderBottom:"1px solid #f9fafb",alignItems:"flex-start"}}>
                        <span style={{background:"#fef2f2",color:"#dc2626",borderRadius:"50%",width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,flexShrink:0}}>{i+1}</span>
                        <div style={{fontSize:13,color:"#374151",lineHeight:1.6}}>{r}</div>
                      </div>
                    ))}
                    <div style={{marginTop:12,padding:12,background:"#f0fdf4",borderRadius:8}}>
                      <div style={{fontSize:11,fontWeight:700,color:"#16a34a",marginBottom:8}}>HOW TO FIX IT</div>
                      {result.rejectionRisk.howToFix?.map((f,i)=>(
                        <div key={i} style={{display:"flex",gap:8,fontSize:13,color:"#374151",padding:"4px 0"}}>
                          <span style={{color:"#16a34a",fontWeight:700}}>✓</span>{f}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </>
            )}

            {resumeHistory.length>0&&(
              <Card>
                <SLabel>Resume History — Score Trends</SLabel>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                    <thead>
                      <tr style={{borderBottom:"2px solid #f1f5f9"}}>
                        {["Role","Company","Date","ATS Score"].map(h=>(
                          <th key={h} style={{textAlign:"left",padding:"8px 10px",fontSize:11,fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:0.5}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {resumeHistory.map((r,i)=>(
                        <tr key={r.id} style={{borderBottom:"1px solid #f9fafb",background:i%2===0?"#fff":"#fafbfc"}}>
                          <td style={{padding:"10px 10px",fontWeight:600,color:"#111827"}}>{r.job_title||"—"}</td>
                          <td style={{padding:"10px 10px",color:"#6b7280"}}>{r.company||"—"}</td>
                          <td style={{padding:"10px 10px",color:"#9ca3af"}}>{new Date(r.created_at).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</td>
                          <td style={{padding:"10px 10px"}}>
                            <span style={{background:r.ats_score>=80?"#f0fdf4":r.ats_score>=65?"#fffbeb":"#fef2f2",color:r.ats_score>=80?"#16a34a":r.ats_score>=65?"#d97706":"#dc2626",padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:700}}>
                              {r.ats_score>0?`${r.ats_score}%`:"—"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ════ RESUME HISTORY ════ */}
        {tab==="history"&&(
          <div style={{animation:"fadeIn 0.3s ease"}}>
            <div style={{marginBottom:16}}><h2 style={{fontSize:24,fontWeight:800,color:"#111827",marginBottom:4,letterSpacing:-0.5}}>Resume History</h2><p style={{color:"#6b7280",fontSize:14}}>Every resume saved automatically with the job it was tailored for.</p></div>
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

        {/* ════ INTERVIEW SIMULATOR ════ */}
        {tab==="simulator"&&(
          <div style={{animation:"fadeIn 0.3s ease"}}>
            <div style={{marginBottom:16}}>
              <h2 style={{fontSize:24,fontWeight:800,color:"#111827",marginBottom:4,letterSpacing:-0.5}}>
                Interview Simulator 🎭
                <ViralBadge text="🔥 UNIQUE"/>
              </h2>
              <p style={{color:"#6b7280",fontSize:14}}>Real-time AI mock interview. Answer questions, get scored, improve before the real thing.</p>
            </div>

            {(!jd||!cv)&&<div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:8,padding:12,marginBottom:14,color:"#92400e",fontSize:13}}>⚡ Add your JD and CV in Resume Builder first.</div>}

            {!simState&&(
              <div style={{background:"#fff",border:"1px solid #e8ecf0",borderRadius:14,padding:28,textAlign:"center"}}>
                <div style={{fontSize:48,marginBottom:14}}>🎭</div>
                <div style={{fontSize:18,fontWeight:800,color:"#111827",marginBottom:8}}>AI Mock Interview</div>
                <div style={{fontSize:13,color:"#6b7280",maxWidth:400,margin:"0 auto 20px",lineHeight:1.7}}>
                  Our AI plays the role of a tough interviewer for your specific job. Answer 4 questions, get scored on each answer, and receive an overall readiness score.
                </div>
                <div style={{display:"flex",gap:12,justifyContent:"center",marginBottom:24,flexWrap:"wrap"}}>
                  {["4 tailored questions","Scored answers","STAR coaching","Overall readiness score"].map(f=>(
                    <div key={f} style={{padding:"5px 12px",background:"#f0fdfa",border:"1px solid #99f6e4",borderRadius:20,fontSize:12,color:"#0d9488",fontWeight:500}}>{f}</div>
                  ))}
                </div>
                <button onClick={startSimulator} disabled={simLoading||!jd||!cv}
                  style={{...btn({padding:"14px 32px",fontSize:15,background:"linear-gradient(135deg,#0d9488,#0891b2)",borderRadius:10}),opacity:simLoading||!jd||!cv?0.5:1}}>
                  {simLoading?"Starting...":"🎭 Start Mock Interview"}
                </button>
              </div>
            )}

            {simState&&(
              <div>
                {/* Progress bar */}
                <div style={{background:"#fff",border:"1px solid #e8ecf0",borderRadius:10,padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:12}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:12,fontWeight:600,color:"#374151"}}>Interview Progress</span>
                      <span style={{fontSize:12,color:"#6b7280"}}>{simState.questionCount}/4 questions</span>
                    </div>
                    <div style={{height:6,background:"#f1f5f9",borderRadius:3}}>
                      <div style={{height:6,background:"linear-gradient(90deg,#0d9488,#0891b2)",borderRadius:3,width:`${(simState.questionCount/4)*100}%`,transition:"width 0.5s"}}/>
                    </div>
                  </div>
                  {simState.scores.length>0&&<div style={{fontSize:13,fontWeight:700,color:"#0d9488"}}>Avg: {Math.round(simState.scores.reduce((a,b)=>a+b,0)/simState.scores.length)}%</div>}
                </div>

                {/* Chat messages */}
                <div style={{background:"#fff",border:"1px solid #e8ecf0",borderRadius:12,padding:16,marginBottom:14,maxHeight:500,overflowY:"auto"}}>
                  {simState.messages.map((msg,i)=>(
                    <div key={i} style={{marginBottom:14,animation:"slideIn 0.3s ease"}}>
                      {msg.role==="interviewer"&&(
                        <div>
                          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                            <div style={{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#0d9488,#0891b2)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,fontWeight:700,flexShrink:0}}>AI</div>
                            <div style={{fontSize:11,fontWeight:600,color:"#0d9488"}}>Interviewer</div>
                            {msg.difficulty&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:8,background:msg.difficulty==="HARD"?"#fef2f2":msg.difficulty==="MEDIUM"?"#fffbeb":"#f0fdf4",color:msg.difficulty==="HARD"?"#dc2626":msg.difficulty==="MEDIUM"?"#d97706":"#16a34a",fontWeight:700}}>{msg.difficulty}</span>}
                          </div>
                          <div style={{background:"#f0fdfa",border:"1px solid #99f6e4",borderRadius:"0 12px 12px 12px",padding:"12px 14px",marginLeft:36}}>
                            <div style={{fontSize:14,fontWeight:600,color:"#111827",marginBottom:6}}>{msg.content}</div>
                            {msg.context&&<div style={{fontSize:11,color:"#6b7280",fontStyle:"italic",marginBottom:4}}>Testing: {msg.context}</div>}
                            {msg.tips&&<div style={{fontSize:11,color:"#0d9488",borderTop:"1px solid #ccfbf1",paddingTop:6,marginTop:6}}>💡 {msg.tips}</div>}
                          </div>
                        </div>
                      )}
                      {msg.role==="candidate"&&(
                        <div style={{display:"flex",justifyContent:"flex-end"}}>
                          <div style={{background:"linear-gradient(135deg,#0d9488,#0891b2)",borderRadius:"12px 0 12px 12px",padding:"12px 14px",maxWidth:"75%"}}>
                            <div style={{fontSize:13,color:"#fff",lineHeight:1.6}}>{msg.content}</div>
                          </div>
                        </div>
                      )}
                      {msg.role==="feedback"&&(
                        <div style={{background:msg.score>=75?"#f0fdf4":msg.score>=55?"#fffbeb":"#fef2f2",border:`1px solid ${msg.score>=75?"#bbf7d0":msg.score>=55?"#fde68a":"#fecaca"}`,borderRadius:8,padding:12,marginLeft:36}}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                            <div style={{fontSize:11,fontWeight:700,color:msg.score>=75?"#16a34a":msg.score>=55?"#d97706":"#dc2626"}}>Answer Score</div>
                            <div style={{fontSize:16,fontWeight:800,color:msg.score>=75?"#16a34a":msg.score>=55?"#d97706":"#dc2626"}}>{msg.score}%</div>
                          </div>
                          <div style={{fontSize:12,color:"#374151",marginBottom:6,lineHeight:1.6}}>{msg.content}</div>
                          {msg.whatWasMissing&&<div style={{fontSize:11,color:"#6b7280",borderTop:"1px solid rgba(0,0,0,0.08)",paddingTop:6,marginTop:6}}>Missing: {msg.whatWasMissing}</div>}
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={simEndRef}/>
                </div>

                {/* Final results */}
                {simState.finished&&(
                  <Card style={{background:"linear-gradient(135deg,#f0fdfa,#ecfdf5)",border:"2px solid #0d9488"}}>
                    <div style={{textAlign:"center",marginBottom:16}}>
                      <div style={{fontSize:32,marginBottom:8}}>🎯</div>
                      <div style={{fontSize:20,fontWeight:800,color:"#111827",marginBottom:4}}>Interview Complete!</div>
                      <div style={{fontSize:40,fontWeight:900,color:simState.overallScore>=75?"#16a34a":simState.overallScore>=55?"#d97706":"#dc2626"}}>{simState.overallScore}%</div>
                      <div style={{fontSize:13,color:"#6b7280"}}>Overall Interview Score</div>
                    </div>
                    {simState.overallFeedback&&<div style={{background:"#fff",borderRadius:8,padding:14,marginBottom:12,fontSize:13,color:"#374151",lineHeight:1.7}}>{simState.overallFeedback}</div>}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                      {simState.topStrength&&<div style={{padding:12,background:"#f0fdf4",borderRadius:8,border:"1px solid #bbf7d0"}}><div style={{fontSize:10,fontWeight:700,color:"#16a34a",marginBottom:4}}>TOP STRENGTH</div><div style={{fontSize:12,color:"#374151"}}>{simState.topStrength}</div></div>}
                      {simState.topImprovement&&<div style={{padding:12,background:"#fef2f2",borderRadius:8,border:"1px solid #fecaca"}}><div style={{fontSize:10,fontWeight:700,color:"#dc2626",marginBottom:4}}>TOP IMPROVEMENT</div><div style={{fontSize:12,color:"#374151"}}>{simState.topImprovement}</div></div>}
                    </div>
                    <button onClick={()=>setSimState(null)} style={{...btn({width:"100%",justifyContent:"center",padding:"12px"})}}>🎭 Start New Interview</button>
                  </Card>
                )}

                {/* Answer input */}
                {!simState.finished&&(
                  <div style={{display:"flex",gap:10}}>
                    <textarea
                      style={{...inp,flex:1,height:80,resize:"none"}}
                      placeholder="Type your answer here... (Press Ctrl+Enter to submit)"
                      value={simInput}
                      onChange={e=>setSimInput(e.target.value)}
                      onKeyDown={e=>{if(e.key==="Enter"&&e.ctrlKey){e.preventDefault();submitSimAnswer();}}}
                    />
                    <button onClick={submitSimAnswer} disabled={simLoading||!simInput.trim()}
                      style={{...btn({flexShrink:0,padding:"0 20px",background:simLoading?"#6b7280":"linear-gradient(135deg,#0d9488,#0891b2)"}),opacity:simLoading||!simInput.trim()?0.5:1}}>
                      {simLoading?"...":"Submit"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ════ AGENT PAGE ════ */}
        {tab==="agent"&&(
          <div style={{animation:"fadeIn 0.3s ease",maxWidth:900,margin:"0 auto"}}>

            {/* Hero */}
            <div style={{background:"linear-gradient(135deg,#1e1b4b 0%,#4c1d95 55%,#7c2d12 100%)",borderRadius:20,padding:"48px 32px",marginBottom:24,textAlign:"center",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:-60,left:-60,width:240,height:240,background:"rgba(139,92,246,0.15)",borderRadius:"50%"}}/>
              <div style={{position:"absolute",bottom:-40,right:-40,width:200,height:200,background:"rgba(220,38,38,0.12)",borderRadius:"50%"}}/>
              <div style={{position:"relative"}}>
                <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:20,padding:"5px 16px",marginBottom:20}}>
                  <span style={{fontSize:14}}>🤖</span>
                  <span style={{fontSize:11,fontWeight:700,color:"rgba(196,181,253,0.9)",letterSpacing:1.5,textTransform:"uppercase"}}>CareerOS Agent · Autonomous Job Hunter</span>
                </div>
                <h1 style={{fontSize:"clamp(30px,6vw,54px)",fontWeight:900,color:"#fff",lineHeight:1.1,marginBottom:14,letterSpacing:-1}}>
                  Your AI recruiter.<br/><span style={{background:"linear-gradient(90deg,#a78bfa,#f87171)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Working while you sleep.</span>
                </h1>
                <p style={{fontSize:16,color:"rgba(196,181,253,0.85)",maxWidth:560,margin:"0 auto 28px",lineHeight:1.7}}>
                  Stop manually searching 50 job boards. The CareerOS Agent runs 24/7 on your computer — scanning, scoring, tailoring CVs, and delivering your perfect shortlist every morning at 8am.
                </p>
                <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
                  <button onClick={()=>{const a=document.createElement("a");a.href="/downloads/careeros-agent.zip";a.download="careeros-agent.zip";document.body.appendChild(a);a.click();document.body.removeChild(a);}}
                    style={{background:"linear-gradient(135deg,#7c3aed,#dc2626)",color:"#fff",border:"none",borderRadius:12,padding:"14px 32px",fontSize:15,fontWeight:800,cursor:"pointer",boxShadow:"0 4px 20px rgba(124,58,237,0.4)"}}>
                    ⬇ Download Agent (Beta) →
                  </button>
                  <div style={{display:"flex",alignItems:"center",gap:6,color:"rgba(196,181,253,0.7)",fontSize:12}}>
                    <span style={{color:"#4ade80"}}>✓</span> Lifetime licence &nbsp;
                    <span style={{color:"#4ade80"}}>✓</span> 30-day guarantee &nbsp;
                    <span style={{color:"#4ade80"}}>✓</span> No subscription
                  </div>
                </div>
              </div>
            </div>

            {/* What it does — step by step */}
            <div style={{background:"#fff",borderRadius:16,border:"1px solid #e8ecf0",padding:"28px 24px",marginBottom:20}}>
              <div style={{fontSize:11,fontWeight:700,color:"#7c3aed",letterSpacing:1.5,textTransform:"uppercase",marginBottom:20}}>How It Works — 24/7 Cycle</div>
              <div style={{display:"flex",flexDirection:"column",gap:0}}>
                {[
                  {step:"01",icon:"🔍",title:"Scans 50+ job boards every 4 hours",body:"The Agent monitors Reed, Adzuna, TotalJobs, Indeed, LinkedIn, Glassdoor, and 40+ niche boards simultaneously. It never misses a new posting, even at 3am.",color:"#7c3aed"},
                  {step:"02",icon:"🧠",title:"AI evaluates every job for you",body:"Each listing is scored against your CV and preferences — ATS match %, rejection risk, salary fit, and role quality. You only see jobs worth your time.",color:"#0891b2"},
                  {step:"03",icon:"📄",title:"Auto-tailors your CV per job",body:"For every strong match, the Agent generates a unique, ATS-optimised resume tailored specifically to that job description. One-click apply ready.",color:"#0d9488"},
                  {step:"04",icon:"⏰",title:"Delivers your shortlist at 8am daily",body:"Wake up to a curated digest of the best matches overnight — each with its tailored CV, match score, and apply link. Review in 5 minutes.",color:"#d97706"},
                  {step:"05",icon:"🚀",title:"Autopilot mode after 7 days",body:"Once the Agent learns your preferences from your review feedback, it activates autopilot — prioritising jobs you'd swipe right on automatically.",color:"#dc2626"},
                  {step:"06",icon:"📊",title:"Local dashboard at localhost:3939",body:"All activity, matched jobs, generated CVs, and analytics live in a clean local dashboard. Your data stays on your machine — no cloud required.",color:"#7c3aed"},
                ].map((s,i,arr)=>(
                  <div key={s.step} style={{display:"flex",gap:16,paddingBottom:i<arr.length-1?24:0,position:"relative"}}>
                    {i<arr.length-1&&<div style={{position:"absolute",left:19,top:44,width:2,height:"calc(100% - 20px)",background:"linear-gradient(180deg,"+s.color+"40,transparent)"}}/>}
                    <div style={{width:40,height:40,borderRadius:12,background:s.color+"15",border:`2px solid ${s.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{s.icon}</div>
                    <div style={{flex:1,paddingTop:4}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                        <span style={{fontSize:10,fontWeight:800,color:s.color,letterSpacing:1}}>STEP {s.step}</span>
                      </div>
                      <div style={{fontSize:15,fontWeight:700,color:"#111827",marginBottom:5}}>{s.title}</div>
                      <div style={{fontSize:13,color:"#6b7280",lineHeight:1.7}}>{s.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats bar */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:20}}>
              {[
                {num:"50+",label:"Job boards monitored",color:"#7c3aed"},
                {num:"4hrs",label:"Scan frequency",color:"#0d9488"},
                {num:"8am",label:"Daily digest time",color:"#d97706"},
                {num:"24/7",label:"Always running",color:"#dc2626"},
              ].map(s=>(
                <div key={s.num} style={{background:"#fff",border:"1px solid #e8ecf0",borderRadius:12,padding:"16px 14px",textAlign:"center"}}>
                  <div style={{fontSize:28,fontWeight:900,color:s.color,marginBottom:4}}>{s.num}</div>
                  <div style={{fontSize:11,color:"#6b7280",fontWeight:500}}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Who it's for + What you get */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16,marginBottom:20}}>
              <div style={{background:"#fff",border:"1px solid #e8ecf0",borderRadius:16,padding:"22px 20px"}}>
                <div style={{fontSize:11,fontWeight:700,color:"#7c3aed",letterSpacing:1.5,textTransform:"uppercase",marginBottom:14}}>Who It's For</div>
                {[
                  "Actively job hunting but short on time",
                  "Applying to 10+ roles per week",
                  "Tired of missing good roles before they close",
                  "Want AI to do the boring part of job search",
                  "Serious about landing your next role fast",
                ].map(t=>(
                  <div key={t} style={{display:"flex",gap:8,padding:"7px 0",borderBottom:"1px solid #f9fafb",fontSize:13,color:"#374151"}}>
                    <span style={{color:"#7c3aed",flexShrink:0}}>✓</span>{t}
                  </div>
                ))}
              </div>
              <div style={{background:"#fff",border:"1px solid #e8ecf0",borderRadius:16,padding:"22px 20px"}}>
                <div style={{fontSize:11,fontWeight:700,color:"#dc2626",letterSpacing:1.5,textTransform:"uppercase",marginBottom:14}}>What You Get</div>
                {[
                  "Downloadable desktop agent (Windows/Mac/Linux)",
                  "Full source code — customise anything",
                  "Local dashboard at localhost:3939",
                  "Auto-generated tailored CVs saved locally",
                  "One-time payment, lifetime updates",
                  "Setup guide + 30-day email support",
                  "30-day money-back guarantee",
                ].map(t=>(
                  <div key={t} style={{display:"flex",gap:8,padding:"7px 0",borderBottom:"1px solid #f9fafb",fontSize:13,color:"#374151"}}>
                    <span style={{color:"#dc2626",flexShrink:0}}>★</span>{t}
                  </div>
                ))}
              </div>
            </div>

            {/* vs Manual search */}
            <div style={{background:"#fff",border:"1px solid #e8ecf0",borderRadius:16,padding:"24px 20px",marginBottom:20}}>
              <div style={{fontSize:11,fontWeight:700,color:"#374151",letterSpacing:1.5,textTransform:"uppercase",marginBottom:16}}>Agent vs Manual Job Search</div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                  <thead>
                    <tr>
                      <th style={{textAlign:"left",padding:"8px 12px",color:"#9ca3af",fontWeight:600,fontSize:11,borderBottom:"1px solid #f1f5f9"}}></th>
                      <th style={{textAlign:"center",padding:"8px 12px",color:"#6b7280",fontWeight:700,fontSize:12,borderBottom:"1px solid #f1f5f9"}}>Manual</th>
                      <th style={{textAlign:"center",padding:"8px 12px",color:"#7c3aed",fontWeight:700,fontSize:12,borderBottom:"1px solid #f1f5f9",background:"#faf5ff",borderRadius:"8px 8px 0 0"}}>🤖 Agent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Time per day checking boards","1–3 hours","0 minutes"],
                      ["Jobs boards monitored","2–3","50+"],
                      ["CV tailored per application","Rarely","Always"],
                      ["Miss overnight postings","Often","Never"],
                      ["ATS score before applying","No","Yes"],
                      ["Daily shortlist delivered","No","Yes, 8am"],
                      ["Learns your preferences","No","Yes, autopilot"],
                    ].map(([label,manual,agent])=>(
                      <tr key={label}>
                        <td style={{padding:"10px 12px",color:"#374151",fontSize:12,borderBottom:"1px solid #f9fafb"}}>{label}</td>
                        <td style={{padding:"10px 12px",textAlign:"center",color:"#9ca3af",fontSize:12,borderBottom:"1px solid #f9fafb"}}>✗ {manual}</td>
                        <td style={{padding:"10px 12px",textAlign:"center",color:"#7c3aed",fontSize:12,fontWeight:600,borderBottom:"1px solid #f9fafb",background:"#faf5ff"}}>✓ {agent}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CTA */}
            <div style={{background:"linear-gradient(135deg,#1e1b4b,#4c1d95,#7c2d12)",borderRadius:16,padding:"32px 24px",textAlign:"center"}}>
              <div style={{fontSize:11,fontWeight:700,color:"rgba(196,181,253,0.8)",letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>Beta · Free for now · Feedback welcome</div>
              <div style={{fontSize:28,fontWeight:900,color:"#fff",marginBottom:6}}>Download CareerOS Agent</div>
              <div style={{fontSize:15,color:"rgba(196,181,253,0.8)",marginBottom:24}}>Free beta · Windows · Mac · Linux · Setup in 10 minutes</div>
              <button onClick={()=>{const a=document.createElement("a");a.href="/downloads/careeros-agent.zip";a.download="careeros-agent.zip";document.body.appendChild(a);a.click();document.body.removeChild(a);}}
                style={{background:"linear-gradient(135deg,#7c3aed,#dc2626)",color:"#fff",border:"none",borderRadius:12,padding:"15px 40px",fontSize:16,fontWeight:800,cursor:"pointer",boxShadow:"0 6px 24px rgba(124,58,237,0.5)",marginBottom:14}}>
                ⬇ Download Now — Free Beta
              </button>
              <div style={{display:"flex",gap:16,justifyContent:"center",flexWrap:"wrap"}}>
                {["Lifetime updates","30-day money-back","Runs locally — your data stays private","Full source code included"].map(t=>(
                  <span key={t} style={{fontSize:11,color:"rgba(196,181,253,0.7)",display:"flex",alignItems:"center",gap:4}}><span style={{color:"#4ade80"}}>✓</span>{t}</span>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ════ PRICING ════ */}
        {tab==="pricing"&&(
          <div style={{animation:"fadeIn 0.3s ease"}}>
            <div style={{textAlign:"center",marginBottom:28}}>
              <h2 style={{fontSize:"clamp(24px,5vw,34px)",fontWeight:900,color:"#0f172a",marginBottom:8,letterSpacing:-0.8}}>Simple, transparent pricing</h2>
              <p style={{color:"#6b7280",fontSize:16}}>Start free. Upgrade when ready.</p>
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:10}}>
                <span style={{color:"#f59e0b",fontSize:16}}>★★★★★</span>
                <span style={{fontSize:13,color:"#6b7280"}}>4.9/5 · 12,000+ users</span>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:16,marginBottom:32,alignItems:"stretch",paddingTop:20}}>
              {TIERS.map(t=>(
                <div key={t.name} style={{background:"#fff",border:`2px solid ${t.highlight?"#0d9488":"#e8ecf0"}`,borderRadius:14,padding:26,paddingTop:t.badge?32:26,position:"relative",boxShadow:t.highlight?"0 8px 32px rgba(13,148,136,0.12)":"0 1px 4px rgba(0,0,0,0.04)",display:"flex",flexDirection:"column"}}>
                  {t.badge&&<div style={{position:"absolute",top:-14,left:"50%",transform:"translateX(-50%)",background:t.highlight?"linear-gradient(135deg,#0d9488,#0891b2)":"#111827",color:"#fff",fontSize:10,fontWeight:700,padding:"4px 16px",borderRadius:20,letterSpacing:1,textTransform:"uppercase",whiteSpace:"nowrap",zIndex:1}}>{t.badge}</div>}
                  <div style={{fontSize:12,fontWeight:700,color:"#9ca3af",marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>{t.name}</div>
                  <div style={{marginBottom:4}}><span style={{fontSize:36,fontWeight:900,color:"#0f172a",letterSpacing:-1}}>{t.price}</span><span style={{fontSize:13,color:"#6b7280",marginLeft:4}}>{t.period}</span></div>
                  <div style={{fontSize:12,color:"#9ca3af",marginBottom:20}}>{t.isAgent?"One-time · Lifetime license":"Cancel anytime"}</div>
                  <div style={{flex:1,marginBottom:24}}>{t.features.map(f=><div key={f} style={{display:"flex",gap:8,padding:"7px 0",borderBottom:"1px solid #f3f4f6",fontSize:13,color:"#374151",lineHeight:1.4,alignItems:"flex-start"}}><span style={{color:"#0d9488",flexShrink:0,marginTop:1,fontWeight:700}}>✓</span><span>{f}</span></div>)}</div>
                  <button onClick={()=>{
                    if(!t.gumroad){if(!user){setAuthMode("signup");setShowAuth(true);}}
                    else if(t.isAgent){const a=document.createElement("a");a.href="/downloads/careeros-agent.zip";a.download="careeros-agent.zip";document.body.appendChild(a);a.click();document.body.removeChild(a);}
                    else{if(!user){setAuthMode("signup");setShowAuth(true);}else window.open(t.gumroad,"_blank");}
                  }}
                    style={{width:"100%",padding:13,background:t.isAgent?"linear-gradient(135deg,#7c3aed,#dc2626)":t.highlight?"linear-gradient(135deg,#0d9488,#0891b2)":"#fff",border:t.isAgent||t.highlight?"none":"2px solid #e2e8f0",color:t.isAgent||t.highlight?"#fff":"#111827",borderRadius:9,fontSize:14,fontWeight:600,cursor:"pointer",marginTop:"auto"}}>
                    {t.cta}
                  </button>
                </div>
              ))}
            </div>

            {/* Viral features showcase */}
            <Card>
              <SLabel>🔥 Features Nobody Else Has</SLabel>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12}}>
                {[
                  {i:"⚡",t:"One-URL Apply",d:"Paste any job URL — we extract the JD instantly. No more copy-pasting.",badge:"NEW"},
                  {i:"💀",t:"Rejection Risk Score",d:"Brutally honest analysis of why you'll get rejected — and exactly how to fix it.",badge:"VIRAL"},
                  {i:"💰",t:"Salary Negotiation Script",d:"Word-for-word script to negotiate your salary. Never leave money on the table.",badge:"VIRAL"},
                  {i:"🎭",t:"Interview Simulator",d:"AI mock interviews with scoring. Practice until you're ready for the real thing.",badge:"UNIQUE"},
                  {i:"🎯",t:"Dual Scoring",d:"ATS score AND Hiring Manager psychology — only platform that does both.",badge:""},
                  {i:"🌍",t:"Global Jobs",d:"Real jobs from Adzuna, JSearch, Reed across UK, US and India.",badge:""},
                ].map(item=>(
                  <div key={item.t} style={{padding:14,background:"#f8fafc",borderRadius:10,border:"1px solid #e8ecf0"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                      <span style={{fontSize:20}}>{item.i}</span>
                      {item.badge&&<ViralBadge text={item.badge==="NEW"?"🆕 NEW":item.badge==="UNIQUE"?"⭐ UNIQUE":"🔥 VIRAL"}/>}
                    </div>
                    <div style={{fontSize:13,fontWeight:700,color:"#111827",marginBottom:4}}>{item.t}</div>
                    <div style={{fontSize:12,color:"#6b7280",lineHeight:1.5}}>{item.d}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>

      <div style={{borderTop:"1px solid #e8ecf0",padding:"14px 20px",textAlign:"center",background:"#fff"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:6}}>
          <LogoIcon size={18}/>
          <span style={{fontWeight:800,fontSize:13,color:"#111827"}}>CareerOS</span>
          <span style={{color:"#d1d5db",fontSize:11}}>· AI Career Platform</span>
        </div>
        <div style={{fontSize:11,color:"#d1d5db"}}>
          Resume · Jobs · Cover Letter · Interview Prep · Simulator ·{" "}
          <button onClick={()=>setShowPrivacy(true)} style={{background:"none",border:"none",color:"#9ca3af",fontSize:11,cursor:"pointer",textDecoration:"underline",padding:0}}>Privacy Policy</button>
        </div>
      </div>
    </div>
  );
}
