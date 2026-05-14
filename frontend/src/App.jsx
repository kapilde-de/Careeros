import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Search, Briefcase, BarChart3, MessageSquare, CreditCard, Bot, Wand2, Download, Share2, Copy, Zap, TrendingUp, AlertTriangle, DollarSign, Upload, X, Menu, LogOut, Star, CheckCircle, Clock, Target, RefreshCw, ArrowRight, User, LayoutDashboard, Sparkles, Shield, MoreHorizontal } from "lucide-react";
import { supabase, signUp, signIn, signInWithGoogle, signOut, getUserProfile, saveResume, getUserResumes, getMonthlyUsage, saveApplication, getUserApplications, updateApplicationStatus, saveAgentConfig, getAgentConfig, getAgentJobs, dismissAgentJob, markAgentJobApplied, saveAgentTailoredCV } from "./supabase";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import mammoth from "mammoth";
import { RESUME_FORMATS, generateResumeHTML } from "./resumeHtml.js";
// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const TABS = [
  { id:"builder",   label:"Builder",   icon: FileText },
  { id:"templates", label:"Templates", icon: LayoutDashboard },
  { id:"jobs",      label:"Jobs",      icon: Search },
  { id:"interview", label:"Interview", icon: MessageSquare },
  { id:"dashboard", label:"Dashboard", icon: BarChart3 },
  { id:"plans",     label:"Plans",     icon: CreditCard },
  { id:"agent",     label:"🤖 Agent",  icon: Bot, agent:true },
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
  { id:"remoteok", name:"RemoteOK", color:"#059669", bg:"#ecfdf5", border:"#6ee7b7" },
  { id:"arbeitnow", name:"Arbeitnow", color:"#d97706", bg:"#fffbeb", border:"#fde68a" },
  { id:"jobicy", name:"Jobicy", color:"#7c3aed", bg:"#f5f3ff", border:"#ddd6fe" },
];

const TIERS = [
  { name:"Free", price:"£0", period:"forever", features:["2 resumes/month","Interview Probability Score","Basic ATS score","5 job searches/day","1 cover letter","Classic format only"], cta:"Get Started Free", highlight:false, color:"#6b7280", gumroad:null, tab:null },
  { name:"Pro", price:"£9", period:"/month", badge:"Most Popular", features:["Unlimited resumes","ATS + Rejection Risk score","Salary intelligence + negotiation script","One-URL Apply","26 premium templates + preview","Unlimited searches","Interview prep AI","Interview Simulator","Resume history","Persistent tracker"], cta:"Explore Pro →", highlight:true, color:"#0d9488", gumroad:null, tab:"pro" },
  { name:"Enterprise", price:"£29", period:"/month", features:["Everything in Pro","Team workspace","Bulk optimization","API access","Recruiter dashboard","White-label"], cta:"Explore Enterprise →", highlight:false, color:"#4f46e5", gumroad:null, tab:"enterprise" },
  { name:"Agent", price:"Beta", period:"free for now", badge:"🤖 ULTRA", features:["Everything in Pro","🤖 24/7 autonomous job hunter","Scans 160+ company job pages","AI evaluates every job for you","Auto-tailored CV per match","Daily review queue at 8am","Autopilot mode after 7 days","Local dashboard at localhost:3939","Windows · Mac · Linux","Feedback welcome!"], cta:"⬇ Download Agent (Beta)", highlight:false, color:"#dc2626", gumroad:"/downloads/careeros-agent.zip", isAgent:true, tab:null },
];

const STATUS_COLORS = {
  "Saved":{ bg:"#f8fafc", text:"#64748b", border:"#e2e8f0", dot:"#94a3b8" },
  "Applied":{ bg:"#eff6ff", text:"#2563eb", border:"#bfdbfe", dot:"#3b82f6" },
  "Interview":{ bg:"#f0fdfa", text:"#0d9488", border:"#99f6e4", dot:"#14b8a6" },
  "Offer":{ bg:"#f0fdf4", text:"#16a34a", border:"#bbf7d0", dot:"#22c55e" },
  "Rejected":{ bg:"#fef2f2", text:"#dc2626", border:"#fecaca", dot:"#ef4444" },
};

const LOADING_PHASES = [
  { icon:"🔍", text:"Reading every line of the JD..." },
  { icon:"🧠", text:"Extracting must-have requirements & ATS keywords..." },
  { icon:"🎯", text:"Mapping your experience to each JD requirement..." },
  { icon:"✍️", text:"Rewriting bullets to mirror JD language..." },
  { icon:"📊", text:"Calculating match score, salary & rejection risk..." },
  { icon:"✨", text:"Finalising tailored CV — almost done..." },
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


async function downloadResume(resume, format = 'apex') {

  try {

    const res = await fetch(
      '/api/downloadResume',
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({
          resume,
          format
        })
      }
    );

    const blob =
      await res.blob();

    const url =
      window.URL.createObjectURL(blob);

    const a =
      document.createElement('a');

    a.href = url;

    a.download =
      'CareerOS_Resume.docx';

    document.body.appendChild(a);

    a.click();

    a.remove();

  } catch (err) {

    console.error(err);

    alert(
      'Failed to download Word document'
    );
  }
}
// ─── API ──────────────────────────────────────────────────────────────────────
async function scrapeJobURL(url) {
  try {
    const res = await fetch("/api/scrapeUrl", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("scrapeJobURL error:", err);
    return { error: "fetch_failed", message: "Could not fetch this URL. Please paste the job description manually." };
  }
}

async function callClaude(prompt, maxTokens = 2500, model = "claude-haiku-4-5-20251001") {

  try {

    const res = await fetch(
      "/api/claude",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          model,
          max_tokens: maxTokens,

          system:
            "You are an expert resume writer and career coach. Return only valid JSON. No markdown. No backticks.",

          messages: [
            {
              role: "user",
              content: prompt
            }
          ]
        })
      }
    );

    if (!res.ok) {
      let errBody = {};
      try { errBody = await res.json(); } catch {}
      console.error("Claude backend error body:", errBody);
      throw new Error(
        errBody.details || errBody.error || errBody.raw || `HTTP ${res.status}`
      );
    }

    const data = await res.json();

    return data;

  } catch (err) {

    console.error(
      "Claude API Error:",
      err
    );

    throw err;
  }
}

// ─── ANIMATION VARIANTS ───────────────────────────────────────────────────────
const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22 } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.15 } },
};
const stagger = { animate: { transition: { staggerChildren: 0.06 } } };
const cardReveal = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } };

// ─── COMPONENTS ──────────────────────────────────────────────────────────────
function ScoreRing({ score, size=72, color, label }) {
  const r = (size-8)/2, circ = 2*Math.PI*r, s = Math.max(0, Math.min(100, score||0));
  const c = color || (s>=80 ? "#059669" : s>=65 ? "#d97706" : s>0 ? "#dc2626" : "#94a3b8");
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)",flexShrink:0}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={5}/>
        <motion.circle
          cx={size/2} cy={size/2} r={r} fill="none" stroke={c} strokeWidth={5}
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${(s/100)*circ} ${circ}` }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
        />
        <text x={size/2} y={size/2+size*0.1} textAnchor="middle" fill={c}
          fontSize={size*0.2} fontWeight="700"
          style={{transform:`rotate(90deg)`,transformOrigin:`${size/2}px ${size/2}px`}}>
          {s>0 ? `${s}%` : "—"}
        </text>
      </svg>
      {label && <div style={{fontSize:10,fontWeight:600,color:c,textAlign:"center"}}>{label}</div>}
    </div>
  );
}

function Chip({ text, color="#64748b", bg="#f1f5f9" }) {
  return <span style={{display:"inline-block",padding:"4px 11px",borderRadius:5,background:bg,color,fontSize:12,fontWeight:500,margin:"3px 4px 3px 0",lineHeight:1.4,whiteSpace:"normal",wordBreak:"break-word",border:"1px solid #e2e8f0"}}>{text}</span>;
}

const JOB_PLATFORMS_DARK = {
  linkedin:  { name:"LinkedIn",  color:"#2563eb" },
  indeed:    { name:"Indeed",    color:"#6d28d9" },
  reed:      { name:"Reed",      color:"#dc2626" },
  adzuna:    { name:"Adzuna",    color:"#0891b2" },
  jsearch:   { name:"JSearch",   color:"#7c3aed" },
  remoteok:  { name:"RemoteOK",  color:"#059669" },
  arbeitnow: { name:"Arbeitnow", color:"#b45309" },
  jobicy:    { name:"Jobicy",    color:"#5b21b6" },
};

function PBadge({ platform }) {
  const p = JOB_PLATFORMS_DARK[platform] || { name: platform||"Job Board", color:"#94a3b8" };
  return <span style={{display:"inline-flex",alignItems:"center",padding:"2px 8px",borderRadius:4,background:"#f8fafc",border:"1px solid #e2e8f0",color:p.color,fontSize:11,fontWeight:600}}>{p.name}</span>;
}

const STATUS_DARK = {
  "Saved":    { bg:"#f1f5f9",                 text:"#64748b", border:"#e2e8f0",               dot:"#94a3b8" },
  "Applied":  { bg:"rgba(59,130,246,0.08)",   text:"#2563eb", border:"rgba(59,130,246,0.2)",  dot:"#3b82f6" },
  "Interview":{ bg:"rgba(13,148,136,0.08)",   text:"#0d9488", border:"rgba(13,148,136,0.2)",  dot:"#0d9488" },
  "Offer":    { bg:"rgba(16,185,129,0.08)",   text:"#059669", border:"rgba(16,185,129,0.2)",  dot:"#10b981" },
  "Rejected": { bg:"rgba(239,68,68,0.08)",    text:"#dc2626", border:"rgba(239,68,68,0.2)",   dot:"#ef4444" },
};

function SBadge({ status }) {
  const s = STATUS_DARK[status] || STATUS_DARK["Saved"];
  return <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:5,background:s.bg,border:`1px solid ${s.border}`,color:s.text,fontSize:11,fontWeight:600}}>
    <span style={{width:6,height:6,borderRadius:"50%",background:s.dot,flexShrink:0}}/>{status}
  </span>;
}

function Card({ children, style={}, hover=false }) {
  return <div className={hover?"hov-card":""} style={{background:"#ffffff",border:"1px solid #e2e8f0",borderRadius:16,padding:20,marginBottom:12,boxShadow:"0 1px 2px rgba(0,0,0,0.04),0 4px 16px rgba(0,0,0,0.05),0 0 0 1px rgba(255,255,255,0.8) inset",...style}}>{children}</div>;
}

function SLabel({ children, color="#0d9488" }) {
  return <div style={{fontSize:10,fontWeight:600,letterSpacing:1.2,color,textTransform:"uppercase",marginBottom:12}}>{children}</div>;
}

function ProBadge() {
  return <span style={{background:"rgba(13,148,136,0.1)",color:"#0d9488",fontSize:9,fontWeight:700,padding:"1px 5px",borderRadius:4,letterSpacing:0.3,textTransform:"uppercase",marginLeft:4,border:"1px solid rgba(13,148,136,0.2)"}}>PRO</span>;
}

function ViralBadge({ text="🔥 VIRAL" }) {
  return <span style={{background:"linear-gradient(135deg,#ef4444,#f97316)",color:"#fff",fontSize:8,fontWeight:700,padding:"2px 7px",borderRadius:8,letterSpacing:0.5,marginLeft:5}}>{text}</span>;
}

function FormatPicker({ resume, selected, onSelect, onDownload }) {
  return (
    <div>
      <div style={{fontSize:11,fontWeight:600,color:"#64748b",marginBottom:8}}>Choose format:</div>
      <div style={{display:"flex",gap:7,marginBottom:12,overflowX:"auto",paddingBottom:4}}>
        {RESUME_FORMATS.map(f=>(
          <div key={f.id} onClick={()=>onSelect(f.id)}
            style={{border:`2px solid ${selected===f.id?f.accent:"#e2e8f0"}`,borderRadius:8,padding:"8px 10px",cursor:"pointer",background:selected===f.id?f.accent+"15":"#f8fafc",transition:"all 0.15s",textAlign:"center",flexShrink:0,minWidth:80}}>
            <div style={{fontSize:18,marginBottom:3}}>{f.icon}</div>
            <div style={{fontSize:10,fontWeight:700,color:selected===f.id?f.accent:"#64748b"}}>{f.name}</div>
          </div>
        ))}
      </div>
      <div style={{border:"1px solid #e2e8f0",borderRadius:8,overflow:"hidden",marginBottom:10}}>
        <div style={{background:"#f8fafc",borderBottom:"1px solid #e2e8f0",padding:"7px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:11,color:"#64748b"}}>Preview — {RESUME_FORMATS.find(f=>f.id===selected)?.name}</span>
          <button onClick={()=>onDownload(selected)} style={{background:"#0d9488",color:"#fff",border:"none",borderRadius:5,padding:"4px 12px",fontSize:11,fontWeight:600,cursor:"pointer"}}>⬇ Download</button>
        </div>
        <div style={{height:380,overflow:"hidden",position:"relative",background:"#f8fafc"}}>
          <iframe srcDoc={generateResumeHTML(resume,selected)} style={{position:"absolute",top:0,left:0,width:"760px",height:"860px",border:"none",background:"#fff",transform:"scale(0.5)",transformOrigin:"top left",pointerEvents:"none"}} title="Preview"/>
        </div>
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {RESUME_FORMATS.map(f=>(
          <button key={f.id} onClick={()=>onDownload(f.id)}
            style={{background:selected===f.id?"#0d9488":"#f8fafc",border:`1px solid ${selected===f.id?"#0d9488":"#e2e8f0"}`,color:selected===f.id?"#fff":"#64748b",borderRadius:5,padding:"5px 10px",fontSize:11,cursor:"pointer"}}>
            {f.icon} {f.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function LogoIcon({ size=36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{flexShrink:0}}>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0d9488"/><stop offset="100%" stopColor="#0891b2"/>
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="22" fill="url(#lg)"/>
      <text x="46" y="74" fontSize="64" fontWeight="700" textAnchor="middle" fill="white" fontFamily="'Plus Jakarta Sans',sans-serif">C</text>
      <g transform="translate(73,19) rotate(42)">
        <ellipse cx="0" cy="0" rx="5" ry="9" fill="white"/>
        <polygon points="-4,7 4,7 0,14" fill="#fcd34d"/>
        <ellipse cx="-5" cy="4" rx="3" ry="2" fill="rgba(255,255,255,0.35)"/>
        <ellipse cx="5" cy="4" rx="3" ry="2" fill="rgba(255,255,255,0.35)"/>
      </g>
    </svg>
  );
}

// ─── PERSIST HOOK ────────────────────────────────────────────────────────────
function useLS(key, init) {
  const [val, setVal] = useState(() => {
    try {
      const s = localStorage.getItem(key);
      return s !== null ? JSON.parse(s) : (typeof init === "function" ? init() : init);
    } catch { return typeof init === "function" ? init() : init; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }, [key, val]);
  return [val, setVal];
}

// ─── VALIDATORS ──────────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
function validateEmail(v){ return EMAIL_RE.test(v.trim()) ? "" : "Enter a valid email address"; }
function validatePassword(v,mode){ if(!v) return "Password is required"; if(mode==="signup"&&v.length<8) return "Password must be at least 8 characters"; return ""; }
function validateName(v){ return v.trim().length>=2 ? "" : "Name must be at least 2 characters"; }
function validateJD(v){ if(!v?.trim()) return "Paste a job description first"; if(v.trim().length<80) return "Job description seems too short — paste the full text"; return ""; }
function validateCV(v){ if(!v?.trim()) return "Add your CV or background"; if(v.trim().length<50) return "CV seems too short — add more detail"; return ""; }

// ─── TOAST ───────────────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div style={{position:"fixed",bottom:24,right:16,zIndex:2000,display:"flex",flexDirection:"column",gap:8,maxWidth:340}}>
      {toasts.map(t=>(
        <motion.div key={t.id}
          initial={{opacity:0,x:40}} animate={{opacity:1,x:0}} exit={{opacity:0,x:40}}
          style={{
            background:t.type==="error"?"#dc2626":t.type==="warning"?"#d97706":t.type==="success"?"#059669":"#1e293b",
            color:"#fff",borderRadius:12,padding:"12px 16px",fontSize:13,fontWeight:500,
            boxShadow:"0 8px 32px rgba(0,0,0,0.4)",backdropFilter:"blur(12px)",
            border:"1px solid rgba(255,255,255,0.15)",
            display:"flex",alignItems:"flex-start",gap:8,lineHeight:1.5
          }}>
          <span style={{flexShrink:0,fontSize:15}}>{t.type==="error"?"⚠":t.type==="warning"?"⚡":t.type==="success"?"✓":"ℹ"}</span>
          <span>{t.message}</span>
        </motion.div>
      ))}
    </div>
  );
}

// ─── AUTH MODAL ───────────────────────────────────────────────────────────────
function AuthModal({ onClose, onSuccess, initialMode="login" }) {
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

  const fieldInp = (err) => ({width:"100%",boxSizing:"border-box",background:"#ffffff",border:`1.5px solid ${err?"rgba(239,68,68,0.5)":"#e2e8f0"}`,borderRadius:8,padding:"11px 14px",color:"#0f172a",fontSize:13,fontFamily:"inherit",outline:"none",marginBottom:2,display:"block"});
  function touch(field){ setTouched(p=>({...p,[field]:true})); }

  async function handleSubmit() {
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
  const pwColors=["#e2e8f0","#ef4444","#f97316","#d97706","#10b981"];
  const pwLabels=["","Weak","Fair","Good","Strong"];

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",backdropFilter:"blur(8px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <motion.div initial={{opacity:0,scale:0.95,y:10}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}}
        style={{background:"#ffffff",border:"1px solid #e2e8f0",borderRadius:20,padding:28,width:"100%",maxWidth:400,boxShadow:"0 8px 40px rgba(0,0,0,0.12)"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:30,height:30,borderRadius:8,background:"linear-gradient(135deg,#0d9488,#0891b2)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:15,color:"#fff"}}>C</div>
            <div>
              <div style={{fontSize:15,fontWeight:700,color:"#0f172a"}}>{mode==="login"?"Welcome back":"Join CareerOS"}</div>
              <div style={{fontSize:11,color:"#64748b"}}>{mode==="login"?"Sign in to your account":"Free forever · No credit card"}</div>
            </div>
          </div>
          <button onClick={onClose} style={{background:"#f1f5f9",border:"none",borderRadius:"50%",width:28,height:28,cursor:"pointer",fontSize:14,color:"#64748b"}}>✕</button>
        </div>
        <button onClick={async()=>{setLoading(true);await signInWithGoogle();setLoading(false);}}
          style={{width:"100%",padding:"10px",background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:14,fontWeight:500,color:"#374151"}}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <div style={{flex:1,height:1,background:"#e2e8f0"}}/><span style={{fontSize:11,color:"#94a3b8"}}>or</span><div style={{flex:1,height:1,background:"#e2e8f0"}}/>
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
          <button onClick={()=>setPwVisible(v=>!v)} type="button" style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:13,color:"#475569",padding:0}}>{pwVisible?"🙈":"👁"}</button>
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
        {error&&<div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:7,padding:"9px 12px",color:"#dc2626",fontSize:12,marginBottom:12}}>⚠ {error}</div>}
        {success&&<div style={{background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.3)",borderRadius:7,padding:"9px 12px",color:"#059669",fontSize:12,marginBottom:12}}>✓ {success}</div>}
        <button onClick={handleSubmit} disabled={loading}
          style={{width:"100%",padding:"12px",background:"linear-gradient(135deg,#0d9488,#0891b2)",color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:700,cursor:loading?"not-allowed":"pointer",opacity:loading?0.7:1,marginBottom:14,marginTop:8}}>
          {loading?"Please wait...":(mode==="login"?"Sign In →":"Create Free Account →")}
        </button>
        <div style={{textAlign:"center",fontSize:12,color:"#475569"}}>
          {mode==="login"
            ?<span>No account? <button onClick={()=>{setMode("signup");setError("");setTouched({});}} style={{background:"none",border:"none",color:"#0d9488",fontWeight:600,cursor:"pointer",fontSize:12}}>Sign up free</button></span>
            :<span>Have account? <button onClick={()=>{setMode("login");setError("");setTouched({});}} style={{background:"none",border:"none",color:"#0d9488",fontWeight:600,cursor:"pointer",fontSize:12}}>Sign in</button></span>}
        </div>
      </motion.div>
    </div>
  );
}

function UpgradeModal({ onClose, feature, onGoToPro }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",backdropFilter:"blur(8px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <motion.div initial={{opacity:0,scale:0.95,y:10}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}}
        style={{background:"#ffffff",border:"1px solid #e2e8f0",borderRadius:20,padding:28,width:"100%",maxWidth:420,boxShadow:"0 8px 40px rgba(0,0,0,0.12)"}} onClick={e=>e.stopPropagation()}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:36,marginBottom:10}}>⚡</div>
          <div style={{fontSize:20,fontWeight:700,color:"#0f172a",marginBottom:6}}>Upgrade to Pro</div>
          <div style={{fontSize:13,color:"#64748b"}}><strong style={{color:"#374151"}}>{feature}</strong> is a Pro feature.</div>
        </div>
        <div style={{background:"rgba(13,148,136,0.08)",border:"1px solid rgba(13,148,136,0.2)",borderRadius:10,padding:14,marginBottom:18}}>
          {["One-URL Apply — paste any job URL","Rejection Risk Score — why you'll get rejected","Salary Negotiation Script — word-for-word","Interview Simulator — AI mock interviews","26 premium resume templates","Unlimited everything"].map(f=>(
            <div key={f} style={{display:"flex",gap:8,padding:"5px 0",fontSize:13,color:"#374151"}}><span style={{color:"#0d9488"}}>✓</span>{f}</div>
          ))}
        </div>
        <button onClick={()=>{onClose();onGoToPro();}}
          style={{width:"100%",padding:12,background:"linear-gradient(135deg,#0d9488,#0891b2)",color:"#fff",border:"none",borderRadius:9,fontSize:15,fontWeight:700,cursor:"pointer",marginBottom:8}}>
          See Pro Features →
        </button>
        <button onClick={onClose} style={{width:"100%",padding:9,background:"transparent",border:"none",color:"#475569",fontSize:13,cursor:"pointer"}}>Maybe later</button>
      </motion.div>
    </div>
  );
}

function PrivacyModal({ onClose }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",backdropFilter:"blur(8px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16,overflowY:"auto"}} onClick={onClose}>
      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:10}}
        style={{background:"#ffffff",border:"1px solid #e2e8f0",borderRadius:20,padding:32,width:"100%",maxWidth:620,boxShadow:"0 8px 40px rgba(0,0,0,0.12)",maxHeight:"85vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{fontSize:18,fontWeight:700,color:"#0f172a"}}>Privacy Policy</div>
          <button onClick={onClose} style={{background:"#f1f5f9",border:"none",borderRadius:"50%",width:30,height:30,cursor:"pointer",fontSize:14,color:"#64748b"}}>✕</button>
        </div>
        <div style={{fontSize:12,color:"#475569",marginBottom:20}}>Last updated: {new Date().toLocaleDateString("en-GB",{month:"long",year:"numeric"})}</div>
        {[
          {h:"1. What We Collect",b:"We collect your email address and name when you sign up, the CVs and job descriptions you paste or import, resumes we generate for you, and your application tracking data."},
          {h:"2. How We Use Your Data",b:"Your data is used solely to provide the CareerOS service. We never sell your data to third parties or use it for advertising."},
          {h:"3. AI Processing",b:"Content you submit is processed by our AI engine. We do not use your content to train AI models, and your data is never shared with third parties."},
          {h:"4. Data Storage",b:"Your account data is stored securely in Supabase (EU region). Resumes and applications are linked to your account and deleted upon account deletion."},
          {h:"5. Cookies",b:"We use only essential cookies for authentication."},
          {h:"6. Your Rights",b:"You can request deletion of your account and all associated data at any time by emailing us."},
          {h:"7. Contact",b:"For privacy questions, contact: kapil.de@gmail.com"},
        ].map(s=>(
          <div key={s.h} style={{marginBottom:18}}>
            <div style={{fontSize:14,fontWeight:700,color:"#374151",marginBottom:6}}>{s.h}</div>
            <div style={{fontSize:13,color:"#64748b",lineHeight:1.7}}>{s.b}</div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── COOKIE CONSENT ──────────────────────────────────────────────────────────
const COOKIE_KEY = "careeros_cookie_consent"; // "accepted" | "essential"

function loadGA(id) {
  if (!id || window.__gaLoaded) return;
  window.__gaLoaded = true;
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  function gtag(){ window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", id, { anonymize_ip: true });
}

function CookieBanner({ onAccept, onEssential }) {
  return (
    <motion.div
      initial={{ y: 120, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 120, opacity: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      style={{
        position:"fixed", bottom:16, left:"50%", transform:"translateX(-50%)",
        width:"calc(100% - 24px)", maxWidth:700, zIndex:2000,
        background:"#ffffff", border:"1px solid #e2e8f0",
        borderRadius:16, boxShadow:"0 8px 40px rgba(0,0,0,0.14)",
        padding:"16px 18px",
      }}>
      {/* Top row: icon + text */}
      <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:14}}>
        <span style={{fontSize:20,lineHeight:1,flexShrink:0,marginTop:1}}>🍪</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:700,color:"#0f172a",marginBottom:2}}>We use cookies</div>
          <div style={{fontSize:12,color:"#64748b",lineHeight:1.6}}>
            Essential cookies keep you logged in. Analytics cookies (optional) help us improve CareerOS — no data is sold or used for ads.{" "}
            <button onClick={onEssential} style={{background:"none",border:"none",color:"#0d9488",fontSize:12,cursor:"pointer",padding:0,textDecoration:"underline",fontFamily:"inherit"}}>
              Privacy Policy
            </button>
          </div>
        </div>
      </div>
      {/* Bottom row: buttons — always full width on mobile, inline on larger */}
      <div style={{display:"flex",gap:8,flexDirection:"row",flexWrap:"wrap"}}>
        <button onClick={onEssential}
          style={{flex:"1 1 120px",padding:"10px 16px",borderRadius:9,border:"1.5px solid #e2e8f0",background:"#f8fafc",color:"#475569",fontSize:12,fontWeight:600,cursor:"pointer",transition:"border-color 0.15s",minWidth:0}}
          onMouseEnter={e=>e.currentTarget.style.borderColor="#0d9488"}
          onMouseLeave={e=>e.currentTarget.style.borderColor="#e2e8f0"}>
          Essential only
        </button>
        <button onClick={onAccept}
          style={{flex:"2 1 160px",padding:"10px 20px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#0d9488,#0891b2)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",boxShadow:"0 2px 8px rgba(13,148,136,0.3)",minWidth:0}}>
          ✓ Accept all cookies
        </button>
      </div>
    </motion.div>
  );
}

// ─── TERMS MODAL ─────────────────────────────────────────────────────────────
function TermsModal({ onClose }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",backdropFilter:"blur(8px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:12}}
        style={{background:"#ffffff",border:"1px solid #e2e8f0",borderRadius:20,padding:32,width:"100%",maxWidth:660,boxShadow:"0 8px 40px rgba(0,0,0,0.12)",maxHeight:"88vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,#1e3a8a,#3b82f6)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Shield size={16} color="#fff"/>
            </div>
            <div style={{fontSize:18,fontWeight:700,color:"#0f172a",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Terms &amp; Conditions</div>
          </div>
          <button onClick={onClose} style={{background:"#f1f5f9",border:"none",borderRadius:"50%",width:30,height:30,cursor:"pointer",fontSize:14,color:"#64748b",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        <div style={{fontSize:11,color:"#94a3b8",marginBottom:24}}>Last updated: May 2025 · Effective immediately</div>

        {[
          { h:"1. Acceptance of Terms", b:'By accessing or using CareerOS (the "Service"), you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the Service. These terms apply to all users including free, Pro and Agent plan subscribers.' },
          { h:"2. Description of Service", b:"CareerOS is an AI-powered career platform that helps users optimise CVs, generate tailored resumes, search jobs, prepare for interviews, and track job applications. Features are provided on a best-effort basis and may change without notice." },
          { h:"3. Account Registration", b:"You must provide accurate information when creating an account. You are responsible for maintaining the security of your credentials. CareerOS is not liable for losses resulting from unauthorised account access. You must be at least 16 years old to use the Service." },
          { h:"4. Acceptable Use", b:"You agree not to: upload malicious content, attempt to reverse-engineer the platform, scrape data in bulk, use the Service for unlawful purposes, or resell access without written permission. Automated abuse or API misuse may result in account termination." },
          { h:"5. AI-Generated Content", b:"Resumes, cover letters, and interview answers are generated by AI. CareerOS does not guarantee job offers, interview callbacks, or employment outcomes. You are responsible for reviewing all AI output before use and ensuring it is truthful and accurate." },
          { h:"6. Intellectual Property", b:"CareerOS and its logos, designs, and software are the intellectual property of CareerOS. You retain ownership of any CVs, job descriptions, or personal content you upload. You grant CareerOS a limited licence to process this content solely to provide the Service." },
          { h:"7. Payment & Subscriptions", b:"Pro plan subscriptions are billed monthly. All fees are in GBP and inclusive of applicable taxes where required. Cancellations take effect at the end of the billing cycle — no partial refunds. Agent (Beta) is currently free and terms may change before full launch." },
          { h:"8. Data & Privacy", b:"Your use of the Service is also governed by our Privacy Policy. We store your data securely and do not sell it to third parties. AI processing is performed via Anthropic's API; content sent is not used for model training." },
          { h:"9. Limitation of Liability", b:"To the fullest extent permitted by law, CareerOS shall not be liable for indirect, incidental, or consequential damages arising from your use of the Service, including loss of employment opportunities. Our total liability shall not exceed the amount paid by you in the 12 months preceding the claim." },
          { h:"10. Modifications", b:"We reserve the right to modify these Terms at any time. Continued use of the Service after changes constitutes acceptance. We will notify users of material changes via email or in-app notice." },
          { h:"11. Governing Law", b:"These Terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales." },
          { h:"12. Contact", b:"Questions about these Terms? Email us at: legal@careeros.app — or write to: CareerOS, London, United Kingdom." },
        ].map(s=>(
          <div key={s.h} style={{marginBottom:18,paddingBottom:18,borderBottom:"1px solid #f1f5f9"}}>
            <div style={{fontSize:13,fontWeight:700,color:"#1e3a8a",marginBottom:5}}>{s.h}</div>
            <div style={{fontSize:13,color:"#475569",lineHeight:1.75}}>{s.b}</div>
          </div>
        ))}

        <div style={{background:"#f8fafc",borderRadius:12,padding:"14px 16px",border:"1px solid #e2e8f0",marginTop:8}}>
          <div style={{fontSize:12,color:"#64748b",textAlign:"center"}}>By using CareerOS you confirm you have read and accepted these Terms. For questions: <a href="mailto:legal@careeros.app" style={{color:"#0d9488",fontWeight:600}}>legal@careeros.app</a></div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── CONTACT MODAL ────────────────────────────────────────────────────────────
function ContactModal({ onClose, showToast }) {
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [subject,setSubject]=useState("General Enquiry");
  const [message,setMessage]=useState("");
  const [sent,setSent]=useState(false);
  const [sending,setSending]=useState(false);

  async function handleSend(e) {
    e.preventDefault();
    if(!name.trim()||!email.trim()||!message.trim()) return;
    setSending(true);
    try {
      const r = await fetch("/api/contact", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await r.json();
      if(!r.ok) throw new Error(data.error||"Send failed");
      setSent(true);
      if(showToast) showToast("Message sent! We'll reply within 24–48 hrs ✓","success");
    } catch(err) {
      if(showToast) showToast("Couldn't send — please email support@careeros.app directly","warning");
    } finally {
      setSending(false);
    }
  }

  const subjects = ["General Enquiry","Bug Report","Feature Request","Billing Question","Partnership","Privacy / Data Request","Other"];

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",backdropFilter:"blur(8px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:12}}
        style={{background:"#ffffff",border:"1px solid #e2e8f0",borderRadius:20,padding:32,width:"100%",maxWidth:560,boxShadow:"0 8px 40px rgba(0,0,0,0.12)"}} onClick={e=>e.stopPropagation()}>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,#0d9488,#0891b2)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <MessageSquare size={16} color="#fff"/>
            </div>
            <div style={{fontSize:18,fontWeight:700,color:"#0f172a",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Contact Us</div>
          </div>
          <button onClick={onClose} style={{background:"#f1f5f9",border:"none",borderRadius:"50%",width:30,height:30,cursor:"pointer",fontSize:14,color:"#64748b",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>

        {/* Contact info cards */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24}}>
          {[
            { icon:"📧", label:"Support", value:"support@careeros.app", href:"mailto:support@careeros.app" },
            { icon:"⚖️", label:"Legal", value:"legal@careeros.app", href:"mailto:legal@careeros.app" },
            { icon:"📍", label:"Location", value:"London, United Kingdom", href:null },
            { icon:"⏱️", label:"Response time", value:"Within 24–48 hours", href:null },
          ].map(c=>(
            <div key={c.label} style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:12,padding:"12px 14px",display:"flex",gap:10,alignItems:"flex-start"}}>
              <span style={{fontSize:18,lineHeight:1}}>{c.icon}</span>
              <div>
                <div style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:0.6,marginBottom:2}}>{c.label}</div>
                {c.href
                  ? <a href={c.href} style={{fontSize:12,color:"#0d9488",fontWeight:600,textDecoration:"none"}}>{c.value}</a>
                  : <div style={{fontSize:12,color:"#374151",fontWeight:500}}>{c.value}</div>
                }
              </div>
            </div>
          ))}
        </div>

        {sent ? (
          <div style={{textAlign:"center",padding:"28px 0"}}>
            <div style={{fontSize:40,marginBottom:12}}>✅</div>
            <div style={{fontSize:16,fontWeight:700,color:"#0f172a",marginBottom:8}}>Message sent!</div>
            <div style={{fontSize:13,color:"#64748b",marginBottom:20}}>We've received your message and sent you a confirmation. We'll reply within 24–48 hours.</div>
            <button onClick={onClose} style={{background:"linear-gradient(135deg,#0d9488,#0891b2)",color:"#fff",border:"none",borderRadius:10,padding:"10px 28px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Close</button>
          </div>
        ) : (
          <form onSubmit={handleSend}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <div>
                <label style={{fontSize:11,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>Your Name *</label>
                <input value={name} onChange={e=>setName(e.target.value)} required placeholder="Jane Smith"
                  style={{width:"100%",padding:"9px 12px",borderRadius:9,border:"1.5px solid #e2e8f0",fontSize:13,color:"#0f172a",background:"#fafafa",outline:"none",boxSizing:"border-box"}}/>
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>Email Address *</label>
                <input value={email} onChange={e=>setEmail(e.target.value)} required type="email" placeholder="jane@email.com"
                  style={{width:"100%",padding:"9px 12px",borderRadius:9,border:"1.5px solid #e2e8f0",fontSize:13,color:"#0f172a",background:"#fafafa",outline:"none",boxSizing:"border-box"}}/>
              </div>
            </div>
            <div style={{marginBottom:12}}>
              <label style={{fontSize:11,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>Subject</label>
              <select value={subject} onChange={e=>setSubject(e.target.value)}
                style={{width:"100%",padding:"9px 12px",borderRadius:9,border:"1.5px solid #e2e8f0",fontSize:13,color:"#0f172a",background:"#fafafa",outline:"none",cursor:"pointer"}}>
                {subjects.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{marginBottom:20}}>
              <label style={{fontSize:11,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>Message *</label>
              <textarea value={message} onChange={e=>setMessage(e.target.value)} required rows={4} placeholder="Tell us how we can help..."
                style={{width:"100%",padding:"9px 12px",borderRadius:9,border:"1.5px solid #e2e8f0",fontSize:13,color:"#0f172a",background:"#fafafa",outline:"none",resize:"vertical",boxSizing:"border-box",fontFamily:"inherit"}}/>
            </div>
            <button type="submit" disabled={sending}
              style={{width:"100%",padding:"12px",background:sending?"#94a3b8":"linear-gradient(135deg,#0d9488,#0891b2)",color:"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:sending?"not-allowed":"pointer",letterSpacing:0.2,boxShadow:sending?"none":"0 4px 16px rgba(13,148,136,0.3)",transition:"all 0.2s"}}>
              {sending ? "Sending…" : "Send Message →"}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}

// ─── ABOUT MODAL ──────────────────────────────────────────────────────────────
function AboutModal({ onClose }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",backdropFilter:"blur(8px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:12}}
        style={{background:"#ffffff",border:"1px solid #e2e8f0",borderRadius:20,padding:32,width:"100%",maxWidth:620,boxShadow:"0 8px 40px rgba(0,0,0,0.12)",maxHeight:"88vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <LogoIcon size={28}/>
            <div style={{fontSize:18,fontWeight:700,color:"#0f172a",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>About CareerOS</div>
          </div>
          <button onClick={onClose} style={{background:"#f1f5f9",border:"none",borderRadius:"50%",width:30,height:30,cursor:"pointer",fontSize:14,color:"#64748b",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>

        {/* Hero banner */}
        <div style={{background:"linear-gradient(135deg,#f0fdfa,#eff6ff)",borderRadius:16,padding:"24px",marginBottom:24,border:"1px solid #e2e8f0",textAlign:"center"}}>
          <div style={{fontSize:36,marginBottom:8}}>🚀</div>
          <div style={{fontSize:20,fontWeight:700,color:"#0f172a",fontFamily:"'Plus Jakarta Sans',sans-serif",marginBottom:8}}>Your AI-Powered Career Co-pilot</div>
          <div style={{fontSize:13,color:"#475569",lineHeight:1.75,maxWidth:440,margin:"0 auto"}}>CareerOS uses the latest AI to help you land your dream job faster — from ATS-optimised resumes to autonomous job hunting on your behalf.</div>
        </div>

        {/* Stats row */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:24}}>
          {[
            { n:"6", label:"Resume templates" },
            { n:"4+", label:"Job platforms" },
            { n:"100%", label:"Privacy-first" },
          ].map(s=>(
            <div key={s.label} style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:12,padding:"16px 12px",textAlign:"center"}}>
              <div style={{fontSize:26,fontWeight:800,color:"#0d9488",fontFamily:"'Plus Jakarta Sans',sans-serif",lineHeight:1}}>{s.n}</div>
              <div style={{fontSize:11,color:"#64748b",marginTop:4,fontWeight:500}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Feature list */}
        {[
          { icon:"✍️", title:"AI Resume Builder", body:"Paste your CV and a job description — CareerOS rewrites every bullet to match the JD's language, fills keyword gaps, and calculates your ATS match score." },
          { icon:"🔍", title:"Live Job Search", body:"Search across Greenhouse, Lever, Reed, RemoteOK, Arbeitnow, and Jobicy simultaneously — covering 500+ company career pages. Results are ranked by relevance, not just keyword match." },
          { icon:"🎤", title:"Interview Preparation", body:"AI generates role-specific questions, model answers in STAR format, and a live interview simulator that scores your responses in real time." },
          { icon:"📊", title:"Application Tracker", body:"Kanban-style dashboard tracks every application from Saved → Applied → Interview → Offer or Rejected, with live stats." },
          { icon:"🤖", title:"AI Agent (Beta)", body:"Our autonomous agent hunts for jobs 24/7, evaluates each match against your CV, and queues the best ones for your daily review — completely hands-free." },
          { icon:"🔒", title:"Privacy by Design", body:"Your data is encrypted, never sold, and never used to train AI models. You can delete your account and all data at any time." },
        ].map(f=>(
          <div key={f.title} style={{display:"flex",gap:14,marginBottom:18,paddingBottom:18,borderBottom:"1px solid #f1f5f9"}}>
            <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#f0fdfa,#eff6ff)",border:"1px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:18}}>{f.icon}</div>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:"#0f172a",marginBottom:4,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{f.title}</div>
              <div style={{fontSize:13,color:"#475569",lineHeight:1.7}}>{f.body}</div>
            </div>
          </div>
        ))}

        <div style={{background:"linear-gradient(135deg,#f0fdfa,#eff6ff)",borderRadius:12,padding:"16px 20px",border:"1px solid #e2e8f0",textAlign:"center",marginTop:8}}>
          <div style={{fontSize:13,color:"#475569",marginBottom:4}}>Built with ❤️ in London, UK</div>
          <div style={{fontSize:12,color:"#94a3b8"}}>Questions or ideas? <a href="mailto:support@careeros.app" style={{color:"#0d9488",fontWeight:600}}>support@careeros.app</a></div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── ANONYMOUS USAGE ─────────────────────────────────────────────────────────
const ANON_KEY = "careeros_anon_usage";
function getAnonUsage() {
  try { const raw=localStorage.getItem(ANON_KEY); if(!raw) return {count:0,month:new Date().getMonth()}; return JSON.parse(raw); }
  catch { return {count:0,month:new Date().getMonth()}; }
}
function incrementAnonUsage() {
  const cur=getAnonUsage(), thisMonth=new Date().getMonth();
  const count=cur.month===thisMonth?cur.count+1:1;
  try { localStorage.setItem(ANON_KEY,JSON.stringify({count,month:thisMonth})); } catch {}
  return count;
}
function checkAnonLimit() { return 0; }

// ─── INTERVIEW TAB COMPONENT ──────────────────────────────────────────────────
function InterviewTab({ jd, cv, intResult, intLoading, genInterview, simState, setSimState, simInput, setSimInput, simLoading, startSimulator, submitSimAnswer, simEndRef, btn, ghost }) {
  const [iTab, setITab] = useState("prep");
  return (
    <motion.div variants={fadeUp} initial="initial" animate="animate" exit="exit">
      <div style={{marginBottom:20,paddingBottom:16,borderBottom:"1px solid #f1f5f9"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
          <div style={{width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,#0d9488,#0891b2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><MessageSquare size={16} color="#fff"/></div>
          <h2 style={{fontSize:22,fontWeight:700,color:"#0f172a",margin:0,letterSpacing:"-0.01em",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Interview</h2>
        </div>
        <p style={{color:"#64748b",fontSize:13,marginLeft:42}}>Prep and practice for your interviews.</p>
      </div>
      {(!jd||!cv)&&<div style={{background:"rgba(217,119,6,0.08)",border:"1px solid rgba(217,119,6,0.25)",borderRadius:8,padding:12,marginBottom:16,color:"#92400e",fontSize:13}}>⚡ Add your JD and CV in the Builder tab first.</div>}
      <div style={{display:"flex",gap:4,marginBottom:20,background:"#ffffff",borderRadius:10,padding:4,width:"fit-content",border:"1px solid #e2e8f0"}}>
        {[{id:"prep",label:"📋 Prep"},{id:"sim",label:"🎭 Simulator"}].map(t=>(
          <button key={t.id} onClick={()=>setITab(t.id)}
            style={{padding:"7px 18px",borderRadius:7,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:iTab===t.id?"rgba(13,148,136,0.12)":"transparent",color:iTab===t.id?"#0d9488":"#64748b",transition:"all 0.15s"}}>
            {t.label}
          </button>
        ))}
      </div>

      {iTab==="prep"&&(
        <div>
          <button onClick={genInterview} disabled={intLoading||!jd||!cv} style={{...btn({marginBottom:16}),opacity:intLoading||!jd||!cv?0.5:1}}>
            {intLoading?"Preparing...":"◆ Generate Interview Prep"}
          </button>
          {intResult&&!intResult.error&&(
            <motion.div variants={stagger} initial="initial" animate="animate">
              <motion.div variants={cardReveal}><Card>
                <SLabel>Key Themes</SLabel>
                <div style={{display:"flex",flexWrap:"wrap",gap:7}}>{intResult.keyThemes?.map(t=><Chip key={t} text={t} color="#0d9488" bg="rgba(13,148,136,0.1)"/>)}</div>
              </Card></motion.div>
              <motion.div variants={cardReveal}><Card>
                <SLabel>Likely Questions</SLabel>
                {intResult.likelyQuestions?.map((q,i)=>(
                  <div key={i} style={{marginBottom:12,paddingBottom:12,borderBottom:i<intResult.likelyQuestions.length-1?"1px solid #e2e8f0":"none"}}>
                    <div style={{fontSize:13,fontWeight:600,color:"#0f172a",marginBottom:4}}>Q: {q.question}</div>
                    <div style={{fontSize:12,color:"#64748b",paddingLeft:10,borderLeft:"2px solid rgba(13,148,136,0.4)",lineHeight:1.6}}>💡 {q.tip}</div>
                  </div>
                ))}
              </Card></motion.div>
              <motion.div variants={cardReveal}><Card>
                <SLabel>STAR Stories</SLabel>
                {intResult.starStories?.map((s,i)=>(
                  <div key={i} style={{marginBottom:16,paddingBottom:16,borderBottom:i<intResult.starStories.length-1?"1px solid #e2e8f0":"none"}}>
                    <div style={{fontSize:12,fontWeight:700,color:"#b45309",marginBottom:8}}>⭐ {s.theme}</div>
                    {["situation","task","action","result"].map(k=>(
                      <div key={k} style={{display:"grid",gridTemplateColumns:"70px 1fr",gap:8,marginBottom:4}}>
                        <div style={{fontSize:10,fontWeight:700,color:"#475569",textTransform:"uppercase",letterSpacing:1}}>{k}</div>
                        <div style={{fontSize:12,color:"#475569",lineHeight:1.6}}>{s[k]}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </Card></motion.div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12}}>
                <Card>
                  <SLabel>Questions to Ask</SLabel>
                  {intResult.questionsToAsk?.map((q,i)=><div key={i} style={{fontSize:12,color:"#64748b",padding:"4px 0",borderBottom:"1px solid #e2e8f0"}}>→ {q}</div>)}
                </Card>
                <Card>
                  <SLabel color="#ef4444">Red Flags to Address</SLabel>
                  {intResult.redFlags?.map((r,i)=><div key={i} style={{fontSize:12,color:"#64748b",padding:"4px 0",borderBottom:"1px solid #e2e8f0"}}>⚠ {r}</div>)}
                </Card>
              </div>
            </motion.div>
          )}
          {intResult?.error&&<div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:8,padding:12,color:"#dc2626",fontSize:13}}>⚠ {intResult.error}</div>}
        </div>
      )}

      {iTab==="sim"&&(
        <div>
          {!simState&&(
            <Card style={{textAlign:"center",padding:40}}>
              <div style={{fontSize:44,marginBottom:12}}>🎭</div>
              <div style={{fontSize:17,fontWeight:700,color:"#0f172a",marginBottom:6}}>AI Mock Interview</div>
              <div style={{fontSize:13,color:"#64748b",maxWidth:380,margin:"0 auto 20px",lineHeight:1.7}}>Our AI plays a tough interviewer for your specific job. Answer 4 questions, get scored on each, receive an overall readiness score.</div>
              <div style={{display:"flex",gap:10,justifyContent:"center",marginBottom:20,flexWrap:"wrap"}}>
                {["4 tailored questions","Scored answers","STAR coaching","Readiness score"].map(f=>(
                  <span key={f} style={{padding:"4px 12px",background:"rgba(13,148,136,0.1)",border:"1px solid rgba(13,148,136,0.2)",borderRadius:20,fontSize:11,color:"#0d9488"}}>{f}</span>
                ))}
              </div>
              <button onClick={startSimulator} disabled={simLoading||!jd||!cv}
                style={{...btn({padding:"12px 28px",fontSize:14,background:"linear-gradient(135deg,#0d9488,#0891b2)",borderRadius:10}),opacity:simLoading||!jd||!cv?0.5:1}}>
                {simLoading?"Starting...":"🎭 Start Mock Interview"}
              </button>
            </Card>
          )}
          {simState&&(
            <div>
              <Card style={{marginBottom:14,padding:"12px 16px"}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:12,fontWeight:600,color:"#64748b"}}>Progress</span>
                      <span style={{fontSize:12,color:"#64748b"}}>{simState.questionCount}/4</span>
                    </div>
                    <div style={{height:5,background:"#f1f5f9",borderRadius:3}}>
                      <motion.div
                        style={{height:5,background:"linear-gradient(90deg,#0d9488,#0891b2)",borderRadius:3}}
                        initial={{width:0}} animate={{width:`${(simState.questionCount/4)*100}%`}} transition={{duration:0.5}}/>
                    </div>
                  </div>
                  {simState.scores.length>0&&<div style={{fontSize:13,fontWeight:700,color:"#0d9488"}}>Avg: {Math.round(simState.scores.reduce((a,b)=>a+b,0)/simState.scores.length)}%</div>}
                </div>
              </Card>
              <Card style={{maxHeight:460,overflowY:"auto",marginBottom:14}}>
                {simState.messages.map((msg,i)=>(
                  <div key={i} style={{marginBottom:14}}>
                    {msg.role==="interviewer"&&(
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                          <div style={{width:26,height:26,borderRadius:"50%",background:"linear-gradient(135deg,#0d9488,#0891b2)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:10,fontWeight:700,flexShrink:0}}>AI</div>
                          <div style={{fontSize:11,fontWeight:600,color:"#0d9488"}}>Interviewer</div>
                          {msg.difficulty&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:8,background:msg.difficulty==="HARD"?"rgba(239,68,68,0.12)":msg.difficulty==="MEDIUM"?"rgba(245,158,11,0.12)":"rgba(16,185,129,0.12)",color:msg.difficulty==="HARD"?"#dc2626":msg.difficulty==="MEDIUM"?"#b45309":"#059669",fontWeight:700}}>{msg.difficulty}</span>}
                        </div>
                        <div style={{background:"rgba(13,148,136,0.08)",border:"1px solid rgba(13,148,136,0.2)",borderRadius:"0 12px 12px 12px",padding:"10px 14px",marginLeft:34}}>
                          <div style={{fontSize:13,fontWeight:600,color:"#0f172a",marginBottom:4}}>{msg.content}</div>
                          {msg.tips&&<div style={{fontSize:11,color:"#0d9488",borderTop:"1px solid rgba(13,148,136,0.2)",paddingTop:5,marginTop:5}}>💡 {msg.tips}</div>}
                        </div>
                      </div>
                    )}
                    {msg.role==="candidate"&&(
                      <div style={{display:"flex",justifyContent:"flex-end"}}>
                        <div style={{background:"linear-gradient(135deg,#0d9488,#0891b2)",borderRadius:"12px 0 12px 12px",padding:"10px 14px",maxWidth:"75%"}}>
                          <div style={{fontSize:13,color:"#fff",lineHeight:1.6}}>{msg.content}</div>
                        </div>
                      </div>
                    )}
                    {msg.role==="feedback"&&(
                      <div style={{background:msg.score>=75?"rgba(16,185,129,0.08)":msg.score>=55?"rgba(245,158,11,0.08)":"rgba(239,68,68,0.08)",border:`1px solid ${msg.score>=75?"rgba(16,185,129,0.2)":msg.score>=55?"rgba(245,158,11,0.2)":"rgba(239,68,68,0.2)"}`,borderRadius:8,padding:10,marginLeft:34}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                          <div style={{fontSize:11,fontWeight:700,color:msg.score>=75?"#059669":msg.score>=55?"#b45309":"#dc2626"}}>Score</div>
                          <div style={{fontSize:15,fontWeight:700,color:msg.score>=75?"#059669":msg.score>=55?"#b45309":"#dc2626"}}>{msg.score}%</div>
                        </div>
                        <div style={{fontSize:12,color:"#475569",lineHeight:1.6}}>{msg.content}</div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={simEndRef}/>
              </Card>
              {simState.finished&&(
                <Card style={{textAlign:"center"}}>
                  <div style={{fontSize:36,marginBottom:8}}>🎯</div>
                  <div style={{fontSize:18,fontWeight:700,color:"#0f172a",marginBottom:4}}>Interview Complete!</div>
                  <div style={{fontSize:38,fontWeight:700,color:simState.overallScore>=75?"#059669":simState.overallScore>=55?"#b45309":"#dc2626"}}>{simState.overallScore}%</div>
                  <div style={{fontSize:12,color:"#64748b",marginBottom:12}}>Overall Score</div>
                  {simState.overallFeedback&&<div style={{background:"#f8fafc",borderRadius:8,padding:12,marginBottom:12,fontSize:12,color:"#475569",lineHeight:1.7,textAlign:"left",border:"1px solid #e2e8f0"}}>{simState.overallFeedback}</div>}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
                    {simState.topStrength&&<div style={{padding:10,background:"rgba(16,185,129,0.08)",borderRadius:8,border:"1px solid rgba(16,185,129,0.2)"}}><div style={{fontSize:9,fontWeight:700,color:"#059669",marginBottom:3}}>STRENGTH</div><div style={{fontSize:11,color:"#374151"}}>{simState.topStrength}</div></div>}
                    {simState.topImprovement&&<div style={{padding:10,background:"rgba(239,68,68,0.08)",borderRadius:8,border:"1px solid rgba(239,68,68,0.2)"}}><div style={{fontSize:9,fontWeight:700,color:"#dc2626",marginBottom:3}}>IMPROVE</div><div style={{fontSize:11,color:"#374151"}}>{simState.topImprovement}</div></div>}
                  </div>
                  <button onClick={()=>setSimState(null)} style={btn({width:"100%",justifyContent:"center",padding:"10px"})}>🎭 New Interview</button>
                </Card>
              )}
              {!simState.finished&&(
                <div style={{display:"flex",gap:10}}>
                  <textarea style={{flex:1,height:72,resize:"none",background:"#ffffff",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"11px 14px",color:"#0f172a",fontSize:14,fontFamily:"inherit",outline:"none",lineHeight:1.6}} placeholder="Type your answer… (Ctrl+Enter to submit)" value={simInput} onChange={e=>setSimInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&e.ctrlKey){e.preventDefault();submitSimAnswer();}}}/>
                  <button onClick={submitSimAnswer} disabled={simLoading||!simInput.trim()} style={{...btn({flexShrink:0,padding:"0 18px",background:"linear-gradient(135deg,#0d9488,#0891b2)"}),opacity:simLoading||!simInput.trim()?0.5:1}}>{simLoading?"...":"Send"}</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ─── AGENT TAB COMPONENT ─────────────────────────────────────────────────────
const DEMO_JOBS = [
  {id:"aj1",title:"Senior Product Manager",company:"Monzo",location:"London (Hybrid)",salary:"£85,000–£105,000",match:91,platform:"linkedin",tailored:false,new:true},
  {id:"aj2",title:"Data Product Manager",company:"Syngenta",location:"UK Remote",salary:"£75,000–£95,000",match:84,platform:"reed",tailored:true,new:true},
  {id:"aj3",title:"Technical Product Manager",company:"Revolut",location:"London",salary:"£80,000–£100,000",match:78,platform:"indeed",tailored:false,new:false},
  {id:"aj4",title:"Product Owner — Platforms",company:"HSBC",location:"Canary Wharf, Hybrid",salary:"£70,000–£90,000",match:76,platform:"linkedin",tailored:true,new:false},
];

const LOG_LINES = [
  {icon:"🔍",msg:"Scanning Reed.co.uk — 1,240 new listings found",t:"08:04:12"},
  {icon:"🧠",msg:"AI scoring 1,240 jobs against your profile…",t:"08:04:18"},
  {icon:"✅",msg:"91% match — Senior Product Manager at Monzo",t:"08:04:31"},
  {icon:"✅",msg:"84% match — Data Product Manager at Syngenta",t:"08:04:44"},
  {icon:"📄",msg:"Auto-tailoring CV for Syngenta role…",t:"08:04:52"},
  {icon:"✅",msg:"78% match — Technical Product Manager at Revolut",t:"08:05:03"},
  {icon:"🔍",msg:"Scanning Adzuna — 980 new listings found",t:"08:05:14"},
  {icon:"🧠",msg:"AI scoring 980 jobs against your profile…",t:"08:05:29"},
  {icon:"✅",msg:"76% match — Product Owner at HSBC",t:"08:05:41"},
  {icon:"📄",msg:"Auto-tailoring CV for HSBC role…",t:"08:05:49"},
  {icon:"🔍",msg:"Scanning LinkedIn (via API) — 2,100 listings",t:"08:06:02"},
  {icon:"⏭",msg:"1,847 listings scored below 65% — skipped",t:"08:06:31"},
  {icon:"📬",msg:"Digest ready — 4 strong matches queued for review",t:"08:06:38"},
];

const AGENT_TITLE_SUGGESTIONS = [
  "Product Manager","Senior Product Manager","Principal Product Manager","Group Product Manager",
  "Software Engineer","Senior Software Engineer","Staff Software Engineer","Principal Engineer",
  "Data Scientist","Senior Data Scientist","Lead Data Scientist","ML Engineer",
  "Product Designer","Senior Product Designer","UX Designer","UI/UX Designer",
  "Engineering Manager","Director of Engineering","VP Engineering","CTO",
  "Project Manager","Senior Project Manager","Programme Manager","IT Project Manager",
  "Business Analyst","Senior Business Analyst","Data Analyst","Senior Data Analyst",
  "Marketing Manager","Digital Marketing Manager","Growth Manager","Head of Marketing",
  "Sales Manager","Account Executive","Business Development Manager","Head of Sales",
  "DevOps Engineer","Platform Engineer","Site Reliability Engineer","Cloud Engineer",
  "Frontend Engineer","Backend Engineer","Full Stack Engineer","Mobile Engineer",
  "Head of Product","Director of Product","VP Product","Chief Product Officer",
  "Scrum Master","Agile Coach","Delivery Manager","Technical Project Manager",
];

const AGENT_LOCATION_SUGGESTIONS = [
  "London","Remote","London (Hybrid)","Manchester","Birmingham","Leeds","Edinburgh",
  "Bristol","Cambridge","Oxford","Glasgow","Liverpool","Sheffield","Nottingham",
  "UK Wide","UK Remote","London / Remote","New York","San Francisco","Austin","Toronto",
];

function SmartInput({ value, onChange, placeholder, suggestions, prefix }) {
  const [open, setOpen]     = useState(false);
  const [hits, setHits]     = useState([]);
  const ref                 = useRef(null);

  function handleChange(val) {
    onChange(val);
    const lastToken = val.split(",").pop().trim().toLowerCase();
    if (lastToken.length < 1) { setHits(suggestions.slice(0,8)); setOpen(true); return; }
    const matched = suggestions.filter(s => s.toLowerCase().includes(lastToken)).slice(0,7);
    setHits(matched);
    setOpen(matched.length > 0);
  }

  function pick(s) {
    const parts = value.split(",").map(p=>p.trim()).filter(Boolean);
    if (parts.length === 0) { onChange(s); }
    else {
      parts[parts.length - 1] = s;
      onChange(parts.join(", "));
    }
    setOpen(false);
  }

  return (
    <div ref={ref} style={{position:"relative"}}>
      <div style={{position:"relative",display:"flex",alignItems:"center"}}>
        {prefix&&<span style={{position:"absolute",left:12,fontSize:13,fontWeight:700,color:"#64748b",pointerEvents:"none",zIndex:2}}>{prefix}</span>}
        <input
          style={{width:"100%",boxSizing:"border-box",background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:8,padding:`10px 12px 10px ${prefix?"28px":"12px"}`,fontSize:13,color:"#0f172a",fontFamily:"inherit",outline:"none"}}
          placeholder={placeholder}
          value={value}
          onChange={e=>handleChange(e.target.value)}
          onFocus={()=>{ setHits(value?hits:suggestions.slice(0,8)); setOpen(true); }}
          onBlur={()=>setTimeout(()=>setOpen(false),150)}
          onKeyDown={e=>{ if(e.key==="Escape") setOpen(false); if(e.key==="Enter"&&hits.length>0){pick(hits[0]);e.preventDefault();} }}
        />
      </div>
      {open&&hits.length>0&&(
        <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,0.1)",zIndex:200,overflow:"hidden",maxHeight:220,overflowY:"auto"}}>
          {hits.map(s=>(
            <div key={s} onMouseDown={()=>pick(s)}
              style={{padding:"8px 14px",fontSize:12,color:"#374151",cursor:"pointer",borderBottom:"1px solid #f8fafc",transition:"background 0.1s"}}
              onMouseEnter={e=>e.currentTarget.style.background="#f0fdfa"}
              onMouseLeave={e=>e.currentTarget.style.background=""}>
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const AGENT_SECTORS = [
  {v:"",l:"Any industry"},
  {v:"technology software",l:"🖥 Tech & Software"},
  {v:"finance banking fintech",l:"💳 Finance & Banking"},
  {v:"consulting strategy",l:"📊 Consulting"},
  {v:"marketing digital",l:"📣 Marketing"},
  {v:"product management SaaS",l:"📦 Product / SaaS"},
  {v:"data analytics AI",l:"🤖 Data & AI"},
  {v:"engineering infrastructure",l:"⚙️ Engineering"},
  {v:"legal compliance",l:"⚖️ Legal"},
  {v:"healthcare NHS",l:"🏥 Healthcare"},
];

function timeAgo(iso) {
  if (!iso) return null;
  const mins = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function AgentTab({ cv, btn, ghost, showToast, user, setApps }) {
  // ── State ────────────────────────────────────────────────────────────────────
  const [agentStatus, setAgentStatus]   = useState("idle"); // idle | running | done
  const [agentActive, setAgentActive]   = useState(false);  // server-side scheduled
  const [lastScanned, setLastScanned]   = useState(null);
  const [agentTab, setAgentTab]         = useState("setup");
  const [config, setConfig]             = useLS("cos_agent_cfg", { titles:"Product Manager, Senior PM", location:"London, Remote", salaryMin:"65000", exclude:"junior, graduate, intern", sector:"" });
  const [logLines, setLogLines]         = useState([]);
  const [agentJobs, setAgentJobs]       = useState([]);     // merged: Supabase + in-browser
  const [tailoring, setTailoring]       = useState(null);
  const [tailoredCVs, setTailoredCVs]   = useState({});
  const [applyModal, setApplyModal]     = useState(null);
  const [activating, setActivating]     = useState(false);
  const [queueLoading, setQueueLoading] = useState(false);
  const [briefSeen, setBriefSeen]       = useLS("cos_agent_brief_seen", false);
  const logRef  = useRef(null);
  const abortRef = useRef(false);

  // ── Load persisted queue + config from Supabase on mount ─────────────────
  useEffect(() => {
    if (!user) return;
    (async () => {
      setQueueLoading(true);
      const [cfg, jobs] = await Promise.all([getAgentConfig(user.id), getAgentJobs(user.id)]);
      if (cfg) {
        setAgentActive(cfg.active);
        setLastScanned(cfg.last_scanned_at);
        // Sync local config with saved config
        setConfig({ titles: cfg.titles, location: cfg.location, salaryMin: String(cfg.salary_min||""), exclude: cfg.exclude_keywords, sector: cfg.sector||"" });
      }
      if (jobs.length > 0) {
        // Map DB fields → component fields
        const mapped = jobs.map(j => ({
          id: j.id, job_id: j.job_id,
          title: j.title, company: j.company, location: j.location,
          salary: j.salary, description: j.description, url: j.url,
          platform: j.platform, match: j.match_score,
          tailored: !!j.tailored_cv, tailoredData: j.tailored_cv,
          tailoredMatch: j.tailored_match,
          scannedAt: j.scanned_at, applied: j.applied, new: !j.seen,
        }));
        setAgentJobs(mapped);
        if (mapped.length > 0) setAgentTab("queue");
      }
      setQueueLoading(false);
    })();
  }, [user]);

  const addLog = useCallback((icon, msg) => {
    const t = new Date().toLocaleTimeString("en-GB", { hour12: false });
    setLogLines(prev => [...prev, { icon, msg, t }]);
    setTimeout(() => logRef.current?.scrollTo({ top: 9999, behavior: "smooth" }), 60);
  }, []);

  // ── Activate: save config to Supabase, enable scheduled scans ────────────
  async function activateAgent() {
    if (!user) { showToast("Sign in to activate the scheduled agent", "warning"); return; }
    if (!config.titles.trim()) { showToast("Add at least one job title", "warning"); return; }
    setActivating(true);
    const ok = await saveAgentConfig(user.id, {
      email: user.email, fullName: user.user_metadata?.full_name || "",
      titles: config.titles, sector: config.sector, location: config.location,
      salaryMin: config.salaryMin, exclude: config.exclude, active: true,
    });
    if (ok) {
      setAgentActive(true);
      showToast("Agent activated! It will scan at 8am daily and email your matches.", "success");
    } else {
      showToast("Failed to activate — please try again", "error");
    }
    setActivating(false);
  }

  async function deactivateAgent() {
    if (!user) return;
    await saveAgentConfig(user.id, { ...config, active: false });
    setAgentActive(false);
    showToast("Agent paused. Your job queue is still here.", "success");
  }

  // ── Manual scan (runs in browser, also saves results to Supabase) ────────
  const runScan = useCallback(async () => {
    if (!config.titles.trim()) { showToast("Add at least one job title", "warning"); return; }
    abortRef.current = false;
    setAgentStatus("running");
    setAgentTab("live");
    setLogLines([]);

    const titles = config.titles.split(",").map(t => t.trim()).filter(Boolean);
    const excl   = config.exclude.toLowerCase().split(",").map(w => w.trim()).filter(Boolean);
    const allJobs = [];

    for (const title of titles) {
      if (abortRef.current) break;
      const query = config.sector ? `${title} ${config.sector}` : title;
      addLog("🔍", `Scanning for "${title}"${config.sector ? ` · ${config.sector}` : ""}…`);
      try {
        const params = new URLSearchParams({ query, country:"gb", type:"all", location: config.location.split(",")[0]?.trim()||"", salaryMin: config.salaryMin||"" });
        const res  = await fetch(`/api/jobs?${params}`);
        const data = await res.json();
        const jobs = data.jobs || [];
        addLog("🧠", `Scoring ${jobs.length} results for "${title}"…`);

        // Location filter tokens
        const locTokens = config.location.toLowerCase().split(",").map(l=>l.trim()).filter(Boolean);
        const anyRemote = locTokens.some(l=>l.includes("remote"));
        // Salary filter
        const salMin = parseInt(config.salaryMin) || 0;

        const scored = jobs.map(j => {
          const tl   = (j.title || "").toLowerCase();
          const qw   = title.toLowerCase().split(/\s+/).filter(w => w.length > 2);
          const hits = qw.filter(w => tl.includes(w)).length;
          return { ...j, match: Math.min(94, 52 + hits * 14 + (["greenhouse","lever"].includes(j.platform) ? 6 : 0)) };
        }).filter(j => {
          if (j.match < 58) return false;
          if (excl.some(w => (j.title||"").toLowerCase().includes(w))) return false;
          // Location filter: pass if location matches or job is remote or no location set
          if (locTokens.length > 0) {
            const jl = (j.location||"").toLowerCase();
            const locationOk = anyRemote && (jl.includes("remote") || jl.includes("home")) ||
              locTokens.some(l => jl.includes(l)) ||
              jl === "" || jl.includes("uk") || jl.includes("united kingdom");
            if (!locationOk) return false;
          }
          // Salary filter: only if we have a number from the listing
          if (salMin > 0 && j.salary && j.salary !== "See listing") {
            const nums = j.salary.match(/\d[\d,]*/g);
            if (nums && nums.length > 0) {
              const listed = parseInt(nums[nums.length-1].replace(/,/g,""));
              if (listed > 0 && listed < salMin) return false;
            }
          }
          return true;
        })
          .sort((a, b) => b.match - a.match).slice(0, 12);

        let added = 0;
        for (const job of scored) {
          if (!allJobs.find(j => j.title === job.title && j.company === job.company)) {
            allJobs.push({ ...job, new: true, tailored: false });
            added++;
            if (job.match >= 72) addLog("✅", `${job.match}% — ${job.title} at ${job.company}`);
          }
        }
        const s = data.sources || {};
        addLog("📊", `+${added} matches (gh:${s.greenhouse||0} lv:${s.lever||0} az:${s.adzuna||0})`);
      } catch(err) { addLog("⚠️", `Error: ${err.message}`); }
    }

    if (!abortRef.current) {
      const top = [...allJobs].sort((a,b) => b.match - a.match).slice(0, 20);
      // Merge with existing queue (don't duplicate)
      setAgentJobs(prev => {
        const existingIds = new Set(prev.map(j => j.job_id || j.id));
        const newOnly = top.filter(j => !existingIds.has(j.id));
        return [...newOnly, ...prev].slice(0, 50);
      });
      addLog("📬", `Done — ${top.length} matches queued`);
      setAgentStatus("done");
      setLastScanned(new Date().toISOString());

      // Persist to Supabase if logged in
      if (user && top.length > 0) {
        const { data: existing } = await import("./supabase").then(m =>
          m.supabase.from("agent_jobs").select("job_id").eq("user_id", user.id)
        ).catch(() => ({ data: [] }));
        const existingIds = new Set((existing || []).map(j => j.job_id));
        const newJobs = top.filter(j => !existingIds.has(j.id));
        if (newJobs.length > 0) {
          import("./supabase").then(({ supabase: sb }) =>
            sb.from("agent_jobs").upsert(
              newJobs.map(j => ({ user_id: user.id, job_id: j.id, title: j.title, company: j.company, location: j.location, salary: j.salary, description: j.description, url: j.url, platform: j.platform, match_score: j.match, scanned_at: new Date().toISOString() })),
              { onConflict: "user_id,job_id", ignoreDuplicates: true }
            )
          ).catch(() => {});
        }
      }
    }
  }, [config, showToast, addLog, user]);

  // ── Tailor CV for a job ───────────────────────────────────────────────────
  async function tailorForJob(job) {
    if (!cv) { showToast("Add your CV in the Builder tab first", "warning"); return; }
    setTailoring(job.id);
    try {
      const jdText = job.description?.trim() || `${job.title} at ${job.company}. ${job.location}. ${job.salary}.`;
      const tailored = await callClaude(`You are a Director-level CV writer. Tailor this CV for the job. Mirror JD language exactly.
JOB: ${job.title} at ${job.company}
DESCRIPTION: ${jdText.slice(0,1500)}
RULES: Preserve all roles/dates/companies. Rewrite bullets to reflect JD themes. No invented metrics.
Return ONLY JSON: {"name":"","contact":"","summary":"","skills":["s1"],"experience":[{"title":"","company":"","period":"","bullets":["b1"]}],"education":[""],"certifications":[""]}
CV: ${cv.slice(0,4000)}`, 3000);

      const scores = await callClaude(`Score CV vs job. Return ONLY JSON: {"matchScore":75}
Job: ${job.title} at ${job.company}. ${jdText.slice(0,300)}
CV: ${cv.slice(0,500)}`, 300);

      const matchScore = scores.matchScore || job.match;
      setTailoredCVs(prev => ({ ...prev, [job.id]: { resume: tailored, matchScore } }));
      setAgentJobs(prev => prev.map(j => j.id === job.id ? { ...j, tailored: true, tailoredData: tailored, tailoredMatch: matchScore, match: matchScore } : j));
      setApplyModal({ job, tailored, matchScore });
      showToast(`CV tailored for ${job.company}!`, "success");
      // Persist tailored CV
      if (user && job.id && !job.id.startsWith("gh_") && !job.id.startsWith("lv_")) {
        saveAgentTailoredCV(job.id, tailored, matchScore).catch(() => {});
      }
    } catch(e) {
      showToast("Tailoring failed — please try again", "error");
    } finally { setTailoring(null); }
  }

  function applyNow(job) {
    const url = job.url?.startsWith("http") ? job.url : `https://www.google.com/search?q=${encodeURIComponent(job.title+" "+job.company+" apply")}`;
    window.open(url, "_blank");
    const newApp = { id: Date.now().toString(), title: job.title, company: job.company, platform: job.platform, status: "Applied", appliedDate: "Today", match: job.match||0 };
    setApps(prev => prev.find(a => a.title===job.title && a.company===job.company) ? prev : [...prev, newApp]);
    if (user) {
      saveApplication(user.id, { title: job.title, company: job.company, platform: job.platform, status: "Applied", applied_date: "Today", match_score: job.match||0, job_url: job.url||"" });
      if (job.id && !job.id.startsWith("gh_") && !job.id.startsWith("lv_")) markAgentJobApplied(job.id).catch(()=>{});
    }
    showToast(`Applied to ${job.company}! Saved to tracker.`, "success");
    setApplyModal(null);
  }

  function dismissJob(job) {
    setAgentJobs(prev => prev.filter(j => j.id !== job.id));
    if (user && job.id && !job.id.startsWith("gh_") && !job.id.startsWith("lv_")) dismissAgentJob(job.id).catch(()=>{});
  }

  const statusColor = agentStatus==="running" ? "#059669" : agentStatus==="done" ? "#7c3aed" : "#94a3b8";
  const statusLabel = agentStatus==="running" ? "Scanning…" : agentStatus==="done" ? "Complete" : "Idle";
  const visibleJobs = agentJobs.filter(j => !j.applied);

  return (
    <motion.div key="agent" variants={fadeUp} initial="initial" animate="animate" exit="exit" style={{maxWidth:920,margin:"0 auto"}}>
      <style>{`
        @keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:0.3}}
        .agent-pulse{animation:pulse-dot 1.4s ease-in-out infinite}
        .log-line{animation:fadeSlideUp 0.3s ease both}
      `}</style>

      {/* ── Header ── */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#7c3aed,#dc2626)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🤖</div>
          <div>
            <h2 style={{fontSize:20,fontWeight:700,color:"#0f172a",margin:0,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>CareerOS Agent</h2>
            <div style={{display:"flex",alignItems:"center",gap:6,marginTop:2,flexWrap:"wrap"}}>
              <span className={agentStatus==="running"?"agent-pulse":""} style={{width:7,height:7,borderRadius:"50%",background:agentActive?"#059669":statusColor,display:"inline-block"}}/>
              {agentActive
                ? <span style={{fontSize:11,color:"#059669",fontWeight:700}}>Active · scans daily at 8am UTC</span>
                : <span style={{fontSize:11,color:"#94a3b8",fontWeight:600}}>Inactive</span>}
              {lastScanned&&<span style={{fontSize:10,color:"#94a3b8"}}>· last scan {timeAgo(lastScanned)}</span>}
              {agentStatus==="running"&&<span style={{fontSize:11,color:"#7c3aed",fontWeight:600}}>· {statusLabel}</span>}
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {agentStatus==="running"&&<button onClick={()=>{abortRef.current=true;setAgentStatus("idle");}} style={ghost({fontSize:12,padding:"8px 14px",color:"#dc2626",borderColor:"rgba(220,38,38,0.25)"})}> Stop</button>}
        </div>
      </div>

      {/* ── Briefing card (first visit) ── */}
      <AnimatePresence>
      {!briefSeen&&(
        <motion.div
          initial={{opacity:0,y:-8,scale:0.99}}
          animate={{opacity:1,y:0,scale:1}}
          exit={{opacity:0,y:-8,scale:0.99}}
          transition={{duration:0.3}}
          style={{background:"linear-gradient(135deg,#0f172a 0%,#1e1b4b 60%,#1e0a3c 100%)",borderRadius:18,padding:"28px 28px 24px",marginBottom:20,border:"1px solid rgba(124,58,237,0.35)",boxShadow:"0 8px 40px rgba(124,58,237,0.18)",position:"relative",overflow:"hidden"}}>
          {/* Decorative glow */}
          <div style={{position:"absolute",top:-40,right:-40,width:180,height:180,background:"radial-gradient(circle,rgba(124,58,237,0.25) 0%,transparent 70%)",pointerEvents:"none"}}/>
          <div style={{position:"absolute",bottom:-30,left:60,width:120,height:120,background:"radial-gradient(circle,rgba(14,165,233,0.15) 0%,transparent 70%)",pointerEvents:"none"}}/>

          {/* Header */}
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
            <div style={{width:46,height:46,borderRadius:14,background:"linear-gradient(135deg,#7c3aed,#dc2626)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 4px 16px rgba(124,58,237,0.4)"}}>🤖</div>
            <div>
              <div style={{fontSize:18,fontWeight:800,color:"#f8fafc",fontFamily:"'Plus Jakarta Sans',sans-serif",lineHeight:1.2}}>Meet your CareerOS Agent</div>
              <div style={{fontSize:12,color:"rgba(148,163,184,0.9)",marginTop:2}}>Your autonomous job hunter — here's exactly what happens:</div>
            </div>
          </div>

          {/* Bullet points */}
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:22}}>
            {[
              { n:"1", icon:"⚙️", title:"You configure once",        body:"Set your job titles, sector, salary floor and keywords to exclude. Takes 30 seconds." },
              { n:"2", icon:"😴", title:"Close your laptop",         body:"Our servers scan 160+ company career pages (Greenhouse, Lever, Adzuna) every morning at 8am — without any input from you." },
              { n:"3", icon:"📩", title:"Wake up to an email",       body:"A digest lands in your inbox with your top matches, each with a match score and a direct apply link." },
              { n:"4", icon:"📬", title:"Queue fills up automatically", body:"Every match is waiting in your queue when you open the app — across any device, any time." },
              { n:"5", icon:"✦",  title:"One-click tailor & apply",  body:"Click any job → Claude rewrites your CV to mirror the job description → apply link opens instantly. Job saved to your tracker." },
            ].map(({n,icon,title,body})=>(
              <div key={n} style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                <div style={{width:28,height:28,borderRadius:8,background:"rgba(124,58,237,0.2)",border:"1px solid rgba(124,58,237,0.35)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>{icon}</div>
                <div style={{flex:1}}>
                  <span style={{fontSize:13,fontWeight:700,color:"#e2e8f0"}}>{title} </span>
                  <span style={{fontSize:12,color:"rgba(148,163,184,0.85)",lineHeight:1.5}}>{body}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Sign-in nudge */}
          {!user&&(
            <div style={{marginBottom:16,padding:"9px 13px",background:"rgba(245,158,11,0.1)",borderRadius:10,border:"1px solid rgba(245,158,11,0.25)",fontSize:12,color:"#fbbf24",display:"flex",alignItems:"center",gap:7}}>
              <span>⚡</span>
              <span><strong>Sign in</strong> to unlock the daily scheduled scan + email digest. Manual scan works without an account.</span>
            </div>
          )}

          {/* CTA */}
          <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <button
              onClick={()=>setBriefSeen(true)}
              style={{background:"linear-gradient(135deg,#7c3aed,#6d28d9)",color:"#fff",border:"none",borderRadius:10,padding:"11px 24px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 16px rgba(124,58,237,0.4)",display:"flex",alignItems:"center",gap:8}}>
              Got it, start setup <span style={{fontSize:15}}>→</span>
            </button>
            <span style={{fontSize:11,color:"rgba(148,163,184,0.6)"}}>This guide won't show again</span>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* ── Sub-tabs ── */}
      <div style={{display:"flex",gap:4,marginBottom:20,background:"#ffffff",borderRadius:10,padding:4,width:"fit-content",border:"1px solid #e2e8f0"}}>
        {[{id:"setup",label:"⚙ Config"},{id:"live",label:"📡 Live Feed"},{id:"queue",label:`📬 Queue${visibleJobs.length>0?" ("+visibleJobs.length+")":""}`}].map(t=>(
          <button key={t.id} onClick={()=>setAgentTab(t.id)}
            style={{padding:"7px 18px",borderRadius:7,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,
              background:agentTab===t.id?"rgba(124,58,237,0.12)":"transparent",
              color:agentTab===t.id?"#7c3aed":"#64748b",transition:"all 0.15s"}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══ CONFIG PANEL ══ */}
      {agentTab==="setup"&&(
        <motion.div variants={stagger} initial="initial" animate="animate">
          <motion.div variants={cardReveal}>
          <Card style={{marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,color:"#7c3aed",letterSpacing:1.2,textTransform:"uppercase",marginBottom:16}}>Search Preferences</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:14}}>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:"#374151",display:"block",marginBottom:6}}>🎯 Job Titles <span style={{fontWeight:400,color:"#94a3b8"}}>(comma-separated)</span></label>
                <SmartInput value={config.titles} onChange={v=>setConfig(c=>({...c,titles:v}))} placeholder="e.g. Product Manager, Senior PM" suggestions={AGENT_TITLE_SUGGESTIONS}/>
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:"#374151",display:"block",marginBottom:6}}>📍 Preferred Locations <span style={{fontWeight:400,color:"#94a3b8"}}>(comma-separated)</span></label>
                <SmartInput value={config.location} onChange={v=>setConfig(c=>({...c,location:v}))} placeholder="e.g. London, Remote" suggestions={AGENT_LOCATION_SUGGESTIONS}/>
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:"#374151",display:"block",marginBottom:6}}>💰 Minimum Salary</label>
                <SmartInput value={config.salaryMin} onChange={v=>setConfig(c=>({...c,salaryMin:v.replace(/[^0-9]/g,"")}))} placeholder="e.g. 65000" prefix="£" suggestions={["40000","50000","55000","60000","65000","70000","75000","80000","90000","100000","120000"]}/>
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:"#374151",display:"block",marginBottom:6}}>🚫 Exclude Keywords <span style={{fontWeight:400,color:"#94a3b8"}}>(comma-separated)</span></label>
                <SmartInput value={config.exclude} onChange={v=>setConfig(c=>({...c,exclude:v}))} placeholder="e.g. junior, graduate, intern" suggestions={["junior","graduate","intern","entry level","unpaid","contract","volunteer","part-time"]}/>
              </div>
            </div>
            <div style={{marginTop:14}}>
              <label style={{fontSize:11,fontWeight:700,color:"#374151",display:"block",marginBottom:8}}>🏭 Industry / Sector</label>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {AGENT_SECTORS.map(({v,l})=>(
                  <button key={v} onClick={()=>setConfig(c=>({...c,sector:v}))}
                    style={{padding:"5px 13px",borderRadius:20,fontSize:11,fontWeight:500,cursor:"pointer",transition:"all 0.15s",
                      background:config.sector===v?"rgba(124,58,237,0.12)":"#f8fafc",
                      color:config.sector===v?"#7c3aed":"#64748b",
                      border:`1.5px solid ${config.sector===v?"rgba(124,58,237,0.4)":"#e2e8f0"}`}}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            {cv
              ? <div style={{marginTop:12,padding:"8px 12px",background:"rgba(5,150,105,0.07)",borderRadius:8,border:"1px solid rgba(5,150,105,0.15)",fontSize:12,color:"#059669",display:"flex",alignItems:"center",gap:6}}><span>✓</span> CV loaded — will be auto-tailored for each strong match</div>
              : <div style={{marginTop:12,padding:"8px 12px",background:"rgba(245,158,11,0.07)",borderRadius:8,border:"1px solid rgba(245,158,11,0.2)",fontSize:12,color:"#92400e",display:"flex",alignItems:"center",gap:6}}><span>⚡</span> Add your CV in Builder tab first for best results</div>}
          </Card>
          </motion.div>

          <motion.div variants={cardReveal}>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            {/* Activate scheduled agent */}
            {user&&!agentActive&&(
              <button onClick={activateAgent} disabled={activating}
                style={{flex:"1 1 260px",padding:"15px",background:"linear-gradient(135deg,#059669,#0d9488)",color:"#fff",border:"none",borderRadius:13,fontSize:15,fontWeight:700,cursor:"pointer",
                  boxShadow:"0 4px 20px rgba(5,150,105,0.3)",display:"flex",alignItems:"center",justifyContent:"center",gap:10,opacity:activating?0.7:1}}>
                <span style={{fontSize:20}}>🗓</span>
                {activating ? "Activating…" : "Activate Daily Agent — Scan while you sleep"}
              </button>
            )}
            {/* Manual scan */}
            <button onClick={runScan} disabled={agentStatus==="running"}
              style={{flex:"1 1 200px",padding:"15px",background:"linear-gradient(135deg,#7c3aed,#6d28d9)",color:"#fff",border:"none",borderRadius:13,fontSize:15,fontWeight:700,cursor:"pointer",
                boxShadow:"0 4px 20px rgba(124,58,237,0.3)",display:"flex",alignItems:"center",justifyContent:"center",gap:10,opacity:agentStatus==="running"?0.7:1}}>
              <span style={{fontSize:20}}>⚡</span>
              {agentStatus==="running" ? "Scanning…" : "Scan Now"}
            </button>
          </div>
          <div style={{display:"flex",gap:20,justifyContent:"center",marginTop:10,flexWrap:"wrap"}}>
            {(user&&agentActive
              ? ["Runs at 8am daily","Works while laptop is off","Email digest with top 5","New jobs only — no repeats"]
              : ["Scan runs instantly","No download needed","AI-powered matching","Works without login"]
            ).map(t=>(
              <span key={t} style={{fontSize:11,color:"#64748b",display:"flex",alignItems:"center",gap:4}}>
                <span style={{color:"#7c3aed"}}>✓</span>{t}
              </span>
            ))}
          </div>
          </motion.div>
        </motion.div>
      )}

      {/* ══ LIVE FEED ══ */}
      {agentTab==="live"&&(
        <Card style={{marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span className={agentStatus==="running"?"agent-pulse":""} style={{width:8,height:8,borderRadius:"50%",background:statusColor,display:"inline-block"}}/>
              <span style={{fontSize:12,fontWeight:700,color:statusColor}}>{statusLabel}</span>
            </div>
            <div style={{display:"flex",gap:10}}>
              <div style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:700,color:"#7c3aed"}}>{logLines.length}</div><div style={{fontSize:9,color:"#94a3b8",textTransform:"uppercase",letterSpacing:0.8}}>Steps</div></div>
              <div style={{textAlign:"center",paddingLeft:10,borderLeft:"1px solid #e2e8f0"}}><div style={{fontSize:18,fontWeight:700,color:"#059669"}}>{logLines.filter(l=>l.icon==="✅").length}</div><div style={{fontSize:9,color:"#94a3b8",textTransform:"uppercase",letterSpacing:0.8}}>Matches</div></div>
            </div>
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
            {config.titles.split(",").filter(Boolean).map(t=>(
              <span key={t} style={{padding:"3px 10px",borderRadius:20,background:"rgba(124,58,237,0.08)",border:"1px solid rgba(124,58,237,0.2)",color:"#7c3aed",fontSize:11,fontWeight:600}}>{t.trim()}</span>
            ))}
            {config.sector&&<span style={{padding:"3px 10px",borderRadius:20,background:"rgba(13,148,136,0.08)",border:"1px solid rgba(13,148,136,0.2)",color:"#0d9488",fontSize:11}}>🏭 {config.sector}</span>}
          </div>
          <div ref={logRef} style={{background:"#0f172a",borderRadius:10,padding:"14px 16px",height:300,overflowY:"auto",fontFamily:"'Fira Code',monospace",fontSize:11,scrollbarWidth:"thin",scrollbarColor:"#334155 transparent"}}>
            {logLines.length===0&&<div style={{color:"#475569"}}><span style={{color:"#7c3aed"}}>$</span> Starting scan…</div>}
            {logLines.map((line,i)=>(
              <div key={i} className="log-line" style={{display:"flex",gap:10,marginBottom:5,alignItems:"flex-start"}}>
                <span style={{color:"#334155",flexShrink:0,fontSize:10,minWidth:56}}>{line.t}</span>
                <span style={{flexShrink:0}}>{line.icon}</span>
                <span style={{color:line.icon==="✅"?"#4ade80":line.icon==="📊"?"#60a5fa":line.icon==="📬"?"#f59e0b":line.icon==="⚠️"?"#f87171":"#94a3b8",lineHeight:1.5}}>{line.msg}</span>
              </div>
            ))}
            {agentStatus==="running"&&<div style={{display:"flex",gap:6,alignItems:"center",marginTop:4}}><span style={{color:"#7c3aed"}}>$</span><span style={{color:"#475569",animation:"pulse-dot 1s infinite"}}>▌</span></div>}
            {agentStatus==="done"&&<div style={{color:"#4ade80",marginTop:8,fontWeight:700}}>✅ Scan complete — {visibleJobs.length} jobs in queue</div>}
          </div>
          {agentStatus==="done"&&visibleJobs.length>0&&(
            <div style={{textAlign:"center",marginTop:12}}>
              <button onClick={()=>setAgentTab("queue")} style={{...btn({background:"linear-gradient(135deg,#7c3aed,#6d28d9)",padding:"11px 28px",fontSize:13}),boxShadow:"0 4px 16px rgba(124,58,237,0.3)"}}>
                📬 View {visibleJobs.length} Matched Jobs →
              </button>
            </div>
          )}
        </Card>
      )}

      {/* ══ JOB QUEUE ══ */}
      {agentTab==="queue"&&(
        <div>
          {queueLoading ? (
            <div style={{textAlign:"center",padding:48}}><div style={{width:24,height:24,border:"3px solid rgba(124,58,237,0.2)",borderTopColor:"#7c3aed",borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 10px"}}/><div style={{color:"#475569",fontSize:13}}>Loading your queue…</div></div>
          ) : visibleJobs.length===0 ? (
            <Card style={{textAlign:"center",padding:48}}>
              <div style={{fontSize:40,marginBottom:10}}>📭</div>
              <div style={{fontSize:15,fontWeight:600,color:"#64748b",marginBottom:4}}>Queue is empty</div>
              <div style={{fontSize:13,color:"#94a3b8",marginBottom:16}}>
                {agentActive ? "Next scheduled scan at 8am UTC · or click Scan Now above" : "Click Scan Now or activate the daily agent"}
              </div>
              <button onClick={()=>setAgentTab("setup")} style={btn({fontSize:12,padding:"9px 20px"})}>Go to Config →</button>
            </Card>
          ) : (
            <>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
                <div style={{fontSize:13,fontWeight:600,color:"#0f172a"}}>
                  {visibleJobs.length} matched jobs
                  {lastScanned&&<span style={{fontWeight:400,color:"#94a3b8",fontSize:11}}> · last scan {timeAgo(lastScanned)}</span>}
                </div>
                <span style={{fontSize:11,color:"#94a3b8"}}>✦ Tailor &amp; Apply = targeted CV + apply in one step</span>
              </div>
              {visibleJobs.map((job,idx)=>(
                <motion.div key={job.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:idx*0.05}}
                  style={{background:"#fff",border:`1.5px solid ${(job.tailoredMatch||job.match)>=85?"rgba(124,58,237,0.25)":(job.tailoredMatch||job.match)>=75?"rgba(13,148,136,0.2)":"#e2e8f0"}`,borderRadius:14,padding:"16px 18px",marginBottom:10,
                    boxShadow:job.new?"0 2px 12px rgba(124,58,237,0.08)":"0 1px 3px rgba(0,0,0,0.04)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:5,flexWrap:"wrap"}}>
                        {job.new&&!job.scannedAt&&<span style={{background:"linear-gradient(135deg,#7c3aed,#6d28d9)",color:"#fff",fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:8,letterSpacing:0.5}}>NEW</span>}
                        {job.scannedAt&&<span style={{fontSize:10,color:"#94a3b8"}}>📅 {timeAgo(job.scannedAt)}</span>}
                        <span style={{fontSize:14,fontWeight:700,color:"#0f172a"}}>{job.title}</span>
                        <PBadge platform={job.platform}/>
                      </div>
                      <div style={{display:"flex",gap:10,marginBottom:6,flexWrap:"wrap"}}>
                        <span style={{fontSize:12,color:"#475569"}}>🏢 {job.company}</span>
                        <span style={{fontSize:12,color:"#475569"}}>📍 {job.location}</span>
                        {job.salary&&job.salary!=="See listing"&&<span style={{fontSize:12,color:"#059669",fontWeight:600}}>💰 {job.salary}</span>}
                      </div>
                      {job.description&&<p style={{fontSize:12,color:"#64748b",lineHeight:1.6,marginBottom:8,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{job.description}</p>}
                      {job.tailored&&<div style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",background:"rgba(13,148,136,0.08)",border:"1px solid rgba(13,148,136,0.2)",borderRadius:6,marginBottom:8,fontSize:11,color:"#0d9488",fontWeight:600}}><span>✦</span> CV tailored — ready to apply</div>}
                      <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                        {!job.tailored
                          ? <button onClick={()=>tailorForJob(job)} disabled={!!tailoring}
                              style={{...btn({fontSize:11,padding:"8px 16px"}),background:"linear-gradient(135deg,#7c3aed,#6d28d9)",boxShadow:"0 2px 8px rgba(124,58,237,0.25)",opacity:tailoring?0.7:1}}>
                              {tailoring===job.id?"✦ Tailoring…":"✦ Tailor & Apply"}
                            </button>
                          : <>
                              <button onClick={()=>setApplyModal({ job, tailored: job.tailoredData||tailoredCVs[job.id]?.resume, matchScore: job.tailoredMatch||tailoredCVs[job.id]?.matchScore||job.match })}
                                style={{...btn({fontSize:11,padding:"8px 16px"}),background:"linear-gradient(135deg,#7c3aed,#6d28d9)",boxShadow:"0 2px 8px rgba(124,58,237,0.25)"}}>
                                🚀 Apply Now →
                              </button>
                              <button onClick={()=>tailorForJob(job)} disabled={!!tailoring} style={ghost({fontSize:11,padding:"7px 12px",color:"#0d9488",borderColor:"rgba(13,148,136,0.3)"})}>↺ Re-tailor</button>
                            </>}
                        {!job.tailored&&<button onClick={()=>applyNow(job)} style={ghost({fontSize:11,padding:"7px 12px",color:"#64748b",borderColor:"#e2e8f0"})}>Quick Apply</button>}
                        <button onClick={()=>dismissJob(job)} style={ghost({fontSize:11,padding:"7px 10px",color:"#dc2626",borderColor:"rgba(220,38,38,0.2)"})}>✕</button>
                      </div>
                    </div>
                    <div style={{flexShrink:0,textAlign:"center"}}>
                      <ScoreRing score={job.tailoredMatch||job.match} size={54} color={(job.tailoredMatch||job.match)>=85?"#7c3aed":(job.tailoredMatch||job.match)>=75?"#0d9488":"#b45309"}/>
                      <div style={{fontSize:9,color:"#94a3b8",marginTop:4,fontWeight:600}}>{job.tailored?"TAILORED":"AI MATCH"}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </>
          )}
        </div>
      )}

      {/* ══ TAILOR + APPLY MODAL ══ */}
      <AnimatePresence>
        {applyModal&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.7)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(4px)"}}
            onClick={e=>{ if(e.target===e.currentTarget) setApplyModal(null); }}>
            <motion.div initial={{scale:0.93,opacity:0,y:16}} animate={{scale:1,opacity:1,y:0}} exit={{scale:0.95,opacity:0}}
              style={{background:"#fff",borderRadius:20,padding:"28px",width:"100%",maxWidth:680,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 80px rgba(0,0,0,0.25)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <span style={{background:"linear-gradient(135deg,#7c3aed,#6d28d9)",color:"#fff",fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:8}}>CV TAILORED</span>
                    <ScoreRing score={applyModal.matchScore||0} size={36} color="#7c3aed"/>
                    <span style={{fontSize:11,color:"#7c3aed",fontWeight:700}}>{applyModal.matchScore||0}% match</span>
                  </div>
                  <div style={{fontSize:16,fontWeight:700,color:"#0f172a"}}>{applyModal.job.title}</div>
                  <div style={{fontSize:13,color:"#64748b"}}>🏢 {applyModal.job.company} · 📍 {applyModal.job.location}</div>
                </div>
                <button onClick={()=>setApplyModal(null)} style={{background:"none",border:"none",cursor:"pointer",fontSize:22,color:"#94a3b8",lineHeight:1,padding:4}}>✕</button>
              </div>
              {applyModal.tailored&&(
                <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:12,padding:"16px 20px",marginBottom:20,fontSize:12,color:"#334155",lineHeight:1.8,maxHeight:300,overflowY:"auto"}}>
                  <div style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Tailored CV Preview</div>
                  {applyModal.tailored.summary&&<><div style={{fontWeight:700,color:"#0f172a",marginBottom:3}}>Summary</div><p style={{marginBottom:12}}>{applyModal.tailored.summary}</p></>}
                  {applyModal.tailored.skills?.length>0&&<><div style={{fontWeight:700,color:"#0f172a",marginBottom:3}}>Key Skills</div><p style={{marginBottom:12}}>{applyModal.tailored.skills.join(" · ")}</p></>}
                  {applyModal.tailored.experience?.slice(0,2).map((exp,i)=>(
                    <div key={i} style={{marginBottom:12}}>
                      <div style={{fontWeight:700,color:"#0f172a"}}>{exp.title} — {exp.company}</div>
                      <div style={{color:"#64748b",fontSize:11,marginBottom:4}}>{exp.period}</div>
                      {exp.bullets?.slice(0,3).map((b,j)=><div key={j} style={{paddingLeft:12,borderLeft:"2px solid #7c3aed",marginBottom:3}}>• {b}</div>)}
                    </div>
                  ))}
                </div>
              )}
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                <button onClick={()=>applyNow(applyModal.job)}
                  style={{flex:"1 1 200px",padding:"13px 20px",background:"linear-gradient(135deg,#7c3aed,#6d28d9)",color:"#fff",border:"none",borderRadius:12,fontSize:14,fontWeight:700,cursor:"pointer",
                    boxShadow:"0 4px 16px rgba(124,58,237,0.35)",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  <span>🚀</span> Apply Now — Open Job Page →
                </button>
                <button onClick={()=>setApplyModal(null)} style={ghost({fontSize:13,padding:"13px 20px"})}>Close</button>
              </div>
              <div style={{marginTop:10,fontSize:11,color:"#94a3b8",textAlign:"center"}}>Opens job page in new tab · auto-saved to your Application Tracker</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── ANONYMOUS USAGE ALREADY DEFINED ABOVE ───────────────────────────────────

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
  const [showTerms,setShowTerms]=useState(false);
  const [showContact,setShowContact]=useState(false);
  const [showAbout,setShowAbout]=useState(false);
  const [menuOpen,setMenuOpen]=useState(false);
  const [cookieConsent,setCookieConsent]=useState(()=>{ try{ return localStorage.getItem(COOKIE_KEY)||null; }catch{ return null; } });

  // Load GA if previously accepted
  useEffect(()=>{
    const GA_ID = import.meta.env.VITE_GA_ID;
    if(cookieConsent==="accepted" && GA_ID) loadGA(GA_ID);
  },[cookieConsent]);

  function acceptCookies() {
    try{ localStorage.setItem(COOKIE_KEY,"accepted"); }catch{}
    setCookieConsent("accepted");
    const GA_ID = import.meta.env.VITE_GA_ID;
    if(GA_ID) loadGA(GA_ID);
  }
  function essentialOnly() {
    try{ localStorage.setItem(COOKIE_KEY,"essential"); }catch{}
    setCookieConsent("essential");
  }
  const [toasts,setToasts]=useState([]);

  function showToast(message, type="info", duration=4000) {
    const id = Date.now();
    setToasts(prev=>[...prev, {id, message, type}]);
    setTimeout(()=>setToasts(prev=>prev.filter(t=>t.id!==id)), duration);
  }

  // ── Persisted state (survives refresh) ────────────────────────────────────
  const [tab,setTab]=useLS("cos_tab","builder");
  const [jd,setJd]=useLS("cos_jd","");
  const [cv,setCv]=useLS("cos_cv","");
  const [result,setResult]=useLS("cos_result",null);
  const [fmt,setFmt]=useLS("cos_fmt","apex");
  const [coverResult,setCoverResult]=useLS("cos_cover",null);
  const [intResult,setIntResult]=useLS("cos_int",null);
  const [jobQ,setJobQ]=useLS("cos_jobq","");
  const [country,setCountry]=useLS("cos_country","uk");
  const [jobFilters,setJobFilters]=useLS("cos_filters",{type:"all",source:"all",sort:"recent",location:"",salaryMin:"",sector:""});
  const [apps,setApps]=useLS("cos_apps",[]);
  // ── Transient state (reset on refresh — intentional) ──────────────────────
  const [jobUrl,setJobUrl]=useState("");
  const [urlLoading,setUrlLoading]=useState(false);
  const [urlError,setUrlError]=useState("");
  const [loading,setLoading]=useState(false);
  const [phase,setPhase]=useState(0);
  const [originalCv,setOriginalCv]=useState("");
  const [showBefore,setShowBefore]=useState(false);
  const [fileUploading,setFileUploading]=useState(false);
  const [optimising,setOptimising]=useState(false); // kept for legacy state compatibility
  const [showShareCard,setShowShareCard]=useState(false);
  const [shareCopied,setShareCopied]=useState(false);
  const [coverLoading,setCoverLoading]=useState(false);
  const [intLoading,setIntLoading]=useState(false);
  const [simState,setSimState]=useState(null);
  const [simInput,setSimInput]=useState("");
  const [simLoading,setSimLoading]=useState(false);
  const [jobs,setJobs]=useState([]);
  const [jobLoading,setJobLoading]=useState(false);
  const [showFilters,setShowFilters]=useState(false);
  const [applying,setApplying]=useState(null);
  const [applied,setApplied]=useState(null);
  const [copied,setCopied]=useState(false);
  const [jobFmt,setJobFmt]=useState(null);
  const [jobFmtSel,setJobFmtSel]=useState("apex");
  const [resumeHistory,setResumeHistory]=useState([]);
  const [historyLoading,setHistoryLoading]=useState(false);
  const ref=useRef(null);
  const simEndRef=useRef(null);

  const isPro = true;

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

  // ── Show restore toast once on load if session had data ──────────────────
  useEffect(()=>{
    try {
      const hasSaved = localStorage.getItem("cos_cv")||localStorage.getItem("cos_jd")||localStorage.getItem("cos_result");
      // session silently restored — no toast
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  function clearSession(){
    ["cos_tab","cos_jd","cos_cv","cos_result","cos_fmt","cos_cover","cos_int","cos_jobq","cos_country","cos_filters","cos_apps","cos_agent_cfg","cos_agent_dismissed"].forEach(k=>{try{localStorage.removeItem(k);}catch{}});
    setTab("builder");setJd("");setCv("");setResult(null);setFmt("apex");setCoverResult(null);setIntResult(null);setApps([]);
    showToast("Session cleared — fresh start!","info");
  }

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

  function requireAuth(feature){return true;}
  function requirePro(feature){if(!requireAuth(feature))return false;if(!isPro){setUpgradeFeature(feature);setShowUpgrade(true);return false;}return true;}

  function startPhase(){
    setPhase(0);
    const iv=setInterval(()=>setPhase(p=>{if(p>=LOADING_PHASES.length-1){clearInterval(iv);return p;}return p+1;}),3500);
    return iv;
  }

  async function handleUrlImport() {
    if(!jobUrl.trim()) return;
    setUrlLoading(true);setUrlError("");
    try {
      const data = await scrapeJobURL(jobUrl.trim());
      if(data.error==="linkedin_blocked"){setUrlError("LinkedIn requires login — can't auto-import. Copy the job description and paste it below.");return;}
      if(data.error==="glassdoor_blocked"){setUrlError("Glassdoor blocks auto-import. Please copy and paste the job description manually.");return;}
      if(data.error||!data.content){setUrlError(data.message||"Could not extract job description. Please paste it manually.");return;}
      setJd(data.content);setUrlError("");setJobUrl("");
      setTimeout(()=>document.getElementById("generate-btn")?.scrollIntoView({behavior:"smooth"}),200);
    } catch(e) {
      console.error("URL import error:",e);
      setUrlError("Could not fetch this URL. Please paste the job description manually.");
    } finally {setUrlLoading(false);}
  }

  async function generate() {
    const jdErr=validateJD(jd), cvErr=validateCV(cv);
    if(jdErr||cvErr){ showToast(jdErr||cvErr,"warning"); return; }
    setLoading(true); setResult(null);
    setOriginalCv(cv); setShowBefore(false);
    const iv = startPhase();
    try {
      // Multi-model pipeline: GPT (JD parse + ATS) → Pinecone (embedding) → Claude (gap + rewrite)
      const res = await fetch('/api/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd, cv }),
      });
      const rawText = await res.text();
      let merged;
      try { merged = JSON.parse(rawText); }
      catch { throw new Error(res.status === 504 ? "Timed out — try a shorter JD or CV" : `Server error (${res.status})`); }
      if (!res.ok) throw new Error(merged.error || `Orchestration failed (${res.status})`);
      if (merged.error) throw new Error(merged.error);

      clearInterval(iv); setResult(merged);
      if(user && merged.resume) saveResume(user.id, merged, merged.jdAnalysis?.role, merged.jdAnalysis?.company, merged.matchScore);
      else if(!user) incrementAnonUsage();
      showToast("Resume tailored! Each bullet maps to a JD requirement.", "success");
      setTimeout(()=>ref.current?.scrollIntoView({behavior:"smooth"}),100);
    } catch(e) {
      console.error("Generate error:", e);
      clearInterval(iv);
      const msg = e?.message || "Unknown error";
      setResult({error:`Generation failed: ${msg}`});
      showToast(`Generation failed: ${msg}`, "error");
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

  async function optimiseResume() {
    if(!result?.resume||!jd) return;
    if(!requirePro("1-Click Resume Optimiser")) return;
    setOptimising(true);
    try {
      const r = await callClaude(`Rewrite ONLY experience bullets to maximise ATS score. Keep same structure. Return ONLY JSON matching resume schema:
{"name":"${result.resume.name}","contact":"${result.resume.contact}","summary":"improved 2-sentence summary","skills":["sk1","sk2","sk3","sk4","sk5","sk6","sk7","sk8"],"experience":[{"title":"Title","company":"Co","period":"dates","bullets":["stronger bullet","stronger bullet","stronger bullet"]}],"education":"${result.resume.education}"}
Rules: Every bullet starts with strong action verb. Mirror JD keywords.
JD: ${jd.slice(0,1400)}
Current resume: ${JSON.stringify(result.resume).slice(0,1400)}`, 2000);
      setResult(prev=>({...prev, resume:r, _optimised:true}));
      showToast("Resume optimised! Bullets rewritten for maximum impact.", "success");
    } catch(e){console.error("optimise error:",e);showToast("Optimisation failed. Try again.","error");}
    finally{setOptimising(false);}
  }

  function getInterviewProb(r) {
    if(!r) return 0;
    return Math.round((r.matchScore||0)*0.35 + ((100-(r.rejectionRisk?.score||50))*0.40) + (r.hiringManagerScore||0)*0.25);
  }

  function copyShareCard() {
    if(!result) return;
    const prob = getInterviewProb(result);
    const text = `🎯 My CareerOS AI Career Report\n\n📊 Interview Probability:  ${prob}%\n✅ ATS Match Score:        ${result.matchScore||0}%\n🧠 Hiring Manager Appeal:  ${result.hiringManagerScore||0}%\n💀 Rejection Risk:         ${result.rejectionRisk?.score||0}%\n💰 Recommended Salary:     ${result.salaryIntelligence?.recommendedAsk||"—"}\n\nGenerated by CareerOS AI → careeros-rose.vercel.app\n#CareerOS #JobSearch #AI`;
    navigator.clipboard.writeText(text);
    setShareCopied(true);
    setTimeout(()=>setShareCopied(false),2000);
    showToast("Score card copied — paste anywhere to share!", "success");
  }

  async function startSimulator() {
    if(!jd||!cv){alert("Add your JD and CV in Resume Builder first.");return;}
    setSimLoading(true);
    try {
      const r=await callClaude(`You are a tough interviewer for: ${jd.slice(0,500)}
Generate the first interview question. Return ONLY JSON:
{"question":"Your first interview question","context":"What they are testing","difficulty":"EASY/MEDIUM/HARD","tips":"What a great answer looks like"}`, 500);
      setSimState({messages:[{role:"interviewer",content:r.question,context:r.context,tips:r.tips,difficulty:r.difficulty}],questionCount:1,scores:[],finished:false});
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
{"feedback":"Specific feedback","score":75,"whatWasMissing":"What ideal answer included",${isLastQuestion ? '"overallScore":72,"overallFeedback":"Overall performance summary","topStrength":"Best thing","topImprovement":"One thing to improve"' : '"nextQuestion":"Next question","context":"What this tests","difficulty":"EASY/MEDIUM/HARD","tips":"Great answer looks like"'}}`, 600);
      const feedbackMsg={role:"feedback",content:r.feedback,score:r.score,whatWasMissing:r.whatWasMissing};
      if(isLastQuestion||r.overallScore) {
        setSimState({...simState,messages:[...newMessages,feedbackMsg],scores:[...simState.scores,r.score],finished:true,overallScore:r.overallScore||Math.round((simState.scores.reduce((a,b)=>a+b,0)+r.score)/(simState.scores.length+1)),overallFeedback:r.overallFeedback,topStrength:r.topStrength,topImprovement:r.topImprovement});
      } else {
        const nextMsg={role:"interviewer",content:r.nextQuestion,context:r.context,tips:r.tips,difficulty:r.difficulty};
        setSimState({...simState,messages:[...newMessages,feedbackMsg,nextMsg],scores:[...simState.scores,r.score],questionCount:simState.questionCount+1});
      }
      setTimeout(()=>simEndRef.current?.scrollIntoView({behavior:"smooth"}),100);
    } catch{alert("Error. Try again.");}
    finally{setSimLoading(false);}
  }

  async function searchJobs() {
    setJobLoading(true);setJobs([]);
    try {
      // Append sector to query so the API scores it in
      const enhancedQ = jobFilters.sector ? `${jobQ||"software engineer"} ${jobFilters.sector}` : (jobQ||"software engineer");
      const params=new URLSearchParams({query:enhancedQ,country,source:jobFilters.source,type:jobFilters.type,location:jobFilters.location,salaryMin:jobFilters.salaryMin,sector:jobFilters.sector||""});
      const res=await fetch(`/api/jobs?${params}`);
      const data=await res.json();
      setJobs(data.jobs||[]);
    } catch(e){console.error("searchJobs error:",e);setJobs([]);showToast("Job search failed. Try again.","error");}
    setJobLoading(false);
  }

  function filteredJobs() {
    let out=[...jobs];
    if(jobFilters.source!=="all") out=out.filter(j=>j.platform===jobFilters.source);
    if(jobFilters.type==="remote") out=out.filter(j=>/remote/i.test(j.location)||j.platform==="remoteok"||j.platform==="arbeitnow"||j.platform==="jobicy");
    if(jobFilters.type==="onsite") out=out.filter(j=>!/remote/i.test(j.location));
    if(jobFilters.location) out=out.filter(j=>j.location?.toLowerCase().includes(jobFilters.location.toLowerCase())||j.title?.toLowerCase().includes(jobFilters.location.toLowerCase()));
    if(jobFilters.salaryMin) {
      const min=parseInt(jobFilters.salaryMin.replace(/\D/g,""));
      if(!isNaN(min)) out=out.filter(j=>{const m=j.salary?.match(/[\d,]+/g);return m&&parseInt(m[0].replace(/,/g,""))>=min;});
    }
    if(jobFilters.sort==="az") out.sort((a,b)=>a.title.localeCompare(b.title));
    return out;
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
    if(t.id==="dashboard"&&user){loadHistory();}
    setTab(t.id);setMenuOpen(false);
  }

  async function handleSignOut(){await signOut();setUser(null);setProfile(null);setApps([]);setResumeHistory([]);}

  async function extractTextFromFile(file) {
    const name = file.name.toLowerCase();
    if(name.endsWith(".txt")||name.endsWith(".md")) return await file.text();
    if(name.endsWith(".docx")||name.endsWith(".doc")) {
      const buf = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: buf });
      return result.value;
    }
    if(name.endsWith(".pdf")) {
      if(window.pdfjsLib) {
        const buf = await file.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument({data:buf}).promise;
        let fullText = "";
        for(let i=1;i<=pdf.numPages;i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          fullText += content.items.map(s=>s.str).join(" ") + "\n";
        }
        return fullText.trim();
      }
      throw new Error("PDF support loading — please try again in a moment.");
    }
    throw new Error("Supported formats: PDF, DOC, DOCX, TXT, MD");
  }

  async function handleCvFile(file) {
    if(!file) return;
    setFileUploading(true);
    try {
      const text = await extractTextFromFile(file);
      if(text?.trim()) { setCv(text.trim()); showToast(`${file.name} loaded`, "success"); }
      else showToast("File appears empty — paste your CV manually.", "warning");
    } catch(e) { console.error("File upload error:", e); showToast(e.message || "Could not read file. Please paste your CV manually.", "error"); }
    setFileUploading(false);
  }

  async function handleJdFile(file) {
    if(!file) return;
    setFileUploading(true);
    try {
      const text = await extractTextFromFile(file);
      if(text?.trim()) { setJd(text.trim()); showToast(`${file.name} loaded as job description`, "success"); }
      else showToast("File appears empty — paste the job description manually.", "warning");
    } catch(e) { console.error("JD file upload error:", e); showToast(e.message || "Could not read file. Please paste the job description manually.", "error"); }
    setFileUploading(false);
  }

  const inp={width:"100%",boxSizing:"border-box",background:"#ffffff",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"11px 14px",color:"#0f172a",fontSize:14,fontFamily:"inherit",outline:"none",lineHeight:1.6};
  const btn=(x={})=>({background:"linear-gradient(135deg,#0d9488,#0891b2)",color:"#fff",border:"none",borderRadius:10,padding:"10px 18px",fontSize:13,fontWeight:600,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6,...x});
  const ghost=(x={})=>({background:"#f8fafc",border:"1.5px solid #e2e8f0",color:"#475569",borderRadius:10,padding:"9px 16px",fontSize:13,cursor:"pointer",...x});

  if(authLoading) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f8fafc"}}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <div style={{textAlign:"center"}}>
        <div style={{width:36,height:36,border:"3px solid rgba(13,148,136,0.2)",borderTopColor:"#0d9488",borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 14px"}}/>
        <div style={{color:"#94a3b8",fontSize:13,letterSpacing:"0.02em"}}>Loading CareerOS…</div>
      </div>
    </div>
  );

  // ── AUTH GATE — block app unless signed in ────────────────────────────────
  if(!user) {
    const FEATURES=[
      {icon:"🎯",title:"Beats the ATS",body:"AI rewrites your CV to match every keyword the ATS scans for."},
      {icon:"⚠️",title:"Rejection Risk Score",body:"Know exactly why you'll get rejected — and how to fix it before you apply."},
      {icon:"💰",title:"Salary Negotiation",body:"Word-for-word script tailored to your role and market rate."},
      {icon:"🤖",title:"26 Premium Templates",body:"Stunning ATS-safe designs used by candidates landing roles at top companies."},
      {icon:"📊",title:"Interview Probability",body:"See your real odds of making it past the screen before you click send."},
      {icon:"🔍",title:"Job Agent",body:"Autonomous agent scans 160+ sites nightly and queues your best matches."},
    ];
    return (
      <div style={{minHeight:"100vh",background:"#f8fafc",color:"#0f172a",fontFamily:"'DM Sans',sans-serif",overflowX:"hidden",backgroundImage:"radial-gradient(circle at 20% 10%,rgba(13,148,136,0.06) 0%,transparent 50%),radial-gradient(circle at 80% 90%,rgba(99,102,241,0.05) 0%,transparent 50%)"}}>
        <style>{`
          @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
          @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
          @keyframes glow{0%,100%{opacity:0.6}50%{opacity:1}}
          .gate-card:hover{border-color:rgba(13,148,136,0.3)!important;transform:translateY(-3px);box-shadow:0 12px 40px rgba(13,148,136,0.1)!important}
          .gate-card{transition:all 0.2s ease}
        `}</style>

        {/* ── Top bar ── */}
        <div style={{position:"relative",zIndex:10,padding:"18px 32px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid #e2e8f0",background:"rgba(255,255,255,0.8)",backdropFilter:"blur(12px)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,#0d9488,#6366f1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🎯</div>
            <span style={{fontSize:18,fontWeight:800,letterSpacing:"-0.02em",color:"#0f172a"}}>CareerOS</span>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>{setAuthMode("login");setShowAuth(true);}}
              style={{background:"transparent",border:"1.5px solid #e2e8f0",color:"#475569",borderRadius:8,padding:"8px 18px",fontSize:13,fontWeight:600,cursor:"pointer"}}>
              Sign in
            </button>
            <button onClick={()=>{setAuthMode("signup");setShowAuth(true);}}
              style={{background:"linear-gradient(135deg,#0d9488,#0891b2)",border:"none",color:"#fff",borderRadius:8,padding:"8px 18px",fontSize:13,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 14px rgba(13,148,136,0.25)"}}>
              Get started free
            </button>
          </div>
        </div>

        {/* ── Hero ── */}
        <div style={{textAlign:"center",padding:"80px 20px 60px",animation:"fadeUp 0.7s ease both"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(13,148,136,0.08)",border:"1px solid rgba(13,148,136,0.2)",borderRadius:20,padding:"6px 14px",marginBottom:28}}>
            <span style={{width:7,height:7,borderRadius:"50%",background:"#0d9488",display:"inline-block",animation:"glow 2s ease infinite"}}/>
            <span style={{fontSize:12,fontWeight:600,color:"#0d9488",letterSpacing:"0.04em"}}>AI-POWERED CAREER PLATFORM</span>
          </div>
          <h1 style={{fontSize:"clamp(36px,6vw,68px)",fontWeight:900,lineHeight:1.08,letterSpacing:"-0.03em",margin:"0 auto 20px",maxWidth:820,color:"#0f172a"}}>
            Get the interview.<br/>
            <span style={{background:"linear-gradient(90deg,#0d9488,#6366f1)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Not the rejection.</span>
          </h1>
          <p style={{fontSize:"clamp(15px,2vw,18px)",color:"#64748b",maxWidth:520,margin:"0 auto 40px",lineHeight:1.7}}>
            CareerOS tailors your CV to every job description, scores your ATS odds, and arms you with a salary negotiation script — in under 30 seconds.
          </p>
          <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
            <button onClick={()=>{setAuthMode("signup");setShowAuth(true);}}
              style={{background:"linear-gradient(135deg,#0d9488,#0891b2)",border:"none",color:"#fff",borderRadius:12,padding:"14px 32px",fontSize:16,fontWeight:800,cursor:"pointer",boxShadow:"0 8px 30px rgba(13,148,136,0.3)",letterSpacing:"-0.01em",display:"flex",alignItems:"center",gap:10}}>
              Start for free — no card needed <span style={{fontSize:18}}>→</span>
            </button>
            <button onClick={()=>{setAuthMode("login");setShowAuth(true);}}
              style={{background:"#fff",border:"1.5px solid #e2e8f0",color:"#374151",borderRadius:12,padding:"14px 28px",fontSize:15,fontWeight:600,cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
              I have an account
            </button>
          </div>
          <div style={{marginTop:18,fontSize:12,color:"#94a3b8",display:"flex",gap:20,justifyContent:"center",flexWrap:"wrap"}}>
            {["✓ Free forever plan","✓ No credit card","✓ 30-second setup"].map(t=><span key={t}>{t}</span>)}
          </div>
        </div>

        {/* ── Stats bar ── */}
        <div style={{display:"flex",justifyContent:"center",gap:"clamp(20px,4vw,60px)",flexWrap:"wrap",padding:"28px 20px",borderTop:"1px solid #e2e8f0",borderBottom:"1px solid #e2e8f0",marginBottom:60,background:"#fff"}}>
          {[["3×","more interview callbacks"],["< 2 min","to tailor your CV"],["26","premium templates"],["160+","job sites scanned"]].map(([n,l])=>(
            <div key={l} style={{textAlign:"center"}}>
              <div style={{fontSize:"clamp(24px,4vw,36px)",fontWeight:900,background:"linear-gradient(135deg,#0d9488,#6366f1)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1.1}}>{n}</div>
              <div style={{fontSize:12,color:"#94a3b8",marginTop:3,textTransform:"uppercase",letterSpacing:"0.06em"}}>{l}</div>
            </div>
          ))}
        </div>

        {/* ── Feature cards ── */}
        <div style={{maxWidth:960,margin:"0 auto",padding:"0 20px 80px"}}>
          <div style={{textAlign:"center",marginBottom:40}}>
            <h2 style={{fontSize:"clamp(22px,3vw,32px)",fontWeight:800,letterSpacing:"-0.02em",margin:"0 0 10px",color:"#0f172a"}}>Everything you need to land the job</h2>
            <p style={{fontSize:14,color:"#64748b"}}>Sign up free and get instant access to every feature.</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:16}}>
            {FEATURES.map((f,i)=>(
              <div key={f.title} className="gate-card"
                style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,padding:"24px 20px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)",animation:`fadeUp 0.5s ease ${i*0.07}s both`}}>
                <div style={{fontSize:28,marginBottom:12}}>{f.icon}</div>
                <div style={{fontSize:14,fontWeight:700,color:"#0f172a",marginBottom:6}}>{f.title}</div>
                <div style={{fontSize:13,color:"#64748b",lineHeight:1.6}}>{f.body}</div>
              </div>
            ))}
          </div>

          {/* ── Bottom CTA ── */}
          <div style={{textAlign:"center",marginTop:60,padding:"44px 20px",background:"linear-gradient(135deg,#f0fdfa,#eff6ff)",border:"1px solid #e2e8f0",borderRadius:20,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
            <div style={{fontSize:24,fontWeight:800,marginBottom:10,letterSpacing:"-0.02em",color:"#0f172a"}}>Ready to stop getting rejected?</div>
            <div style={{fontSize:14,color:"#64748b",marginBottom:24}}>Join thousands of candidates who landed their next role with CareerOS.</div>
            <button onClick={()=>{setAuthMode("signup");setShowAuth(true);}}
              style={{background:"linear-gradient(135deg,#0d9488,#0891b2)",border:"none",color:"#fff",borderRadius:12,padding:"14px 36px",fontSize:16,fontWeight:800,cursor:"pointer",boxShadow:"0 8px 30px rgba(13,148,136,0.25)"}}>
              Create your free account →
            </button>
          </div>
        </div>

        {/* ── Auth modal ── */}
        <AnimatePresence>{showAuth&&<AuthModal initialMode={authMode} onClose={()=>setShowAuth(false)} onSuccess={u=>loadUser(u)}/>}</AnimatePresence>
      </div>
    );
  }

  return (
    <div style={{minHeight:"100vh",background:"#f8fafc",color:"#0f172a",fontFamily:"'DM Sans',sans-serif",fontSize:"15px",backgroundImage:"radial-gradient(circle at 20% 10%,rgba(13,148,136,0.04) 0%,transparent 50%),radial-gradient(circle at 80% 80%,rgba(56,189,248,0.04) 0%,transparent 50%)"}}>
      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:0.7}50%{opacity:1}}
        @keyframes fadeSlideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes scaleIn{from{opacity:0;transform:scale(0.94)}to{opacity:1;transform:scale(1)}}
        @keyframes countUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        input:focus,textarea:focus{border-color:rgba(13,148,136,0.6)!important;box-shadow:0 0 0 3px rgba(13,148,136,0.1)!important;outline:none}
        .jcard:hover{border-color:rgba(13,148,136,0.3)!important;background:#f0fdfa!important}
        .hov-card{transition:transform 0.18s ease,box-shadow 0.18s ease,border-color 0.18s ease}
        .hov-card:hover{transform:translateY(-3px);box-shadow:0 8px 28px rgba(0,0,0,0.09)!important}
        .hov-lift{transition:transform 0.15s ease}
        .hov-lift:hover{transform:translateY(-2px)}
        .stat-tile{animation:countUp 0.4s ease both}
        .hero-tile{animation:fadeSlideUp 0.5s ease both}
        nav button{transition:color 0.15s ease,border-color 0.15s ease,background 0.15s ease!important}
        nav button:hover{background:rgba(13,148,136,0.05)!important}
        .plan-card{transition:transform 0.2s ease,box-shadow 0.2s ease}
        .plan-card:hover{transform:translateY(-4px)}
        .fmt-scroll::-webkit-scrollbar{height:4px}.fmt-scroll::-webkit-scrollbar-track{background:transparent}.fmt-scroll::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:2px}
        @media(max-width:768px){
          .desktop-nav{display:none!important}.mob-btn{display:flex!important}
          .hero-pad{padding:24px 14px 20px!important}
          .main-pad{padding:14px 10px 70px!important}
          .score-grid{grid-template-columns:repeat(2,1fr)!important}
          .input-grid{grid-template-columns:1fr!important}
          .action-btns{flex-direction:column!important}
          .action-btns button{width:100%!important;justify-content:center!important}
        }
        @media(min-width:769px){.mob-btn{display:none!important}.mobile-menu{display:none!important}}
        @media(max-width:700px){.pricing-grid{grid-template-columns:1fr!important;max-width:100%!important}}
        @media(max-width:900px) and (min-width:701px){.pricing-grid{grid-template-columns:repeat(2,1fr)!important}}
      `}</style>

      <AnimatePresence>{showAuth&&<AuthModal onClose={()=>setShowAuth(false)} onSuccess={u=>loadUser(u)} initialMode={authMode}/>}</AnimatePresence>
      <AnimatePresence>{showUpgrade&&<UpgradeModal onClose={()=>setShowUpgrade(false)} feature={upgradeFeature} onGoToPro={()=>setTab("plans")}/>}</AnimatePresence>
      <AnimatePresence>{showPrivacy&&<PrivacyModal onClose={()=>setShowPrivacy(false)}/>}</AnimatePresence>
      <AnimatePresence>{showTerms&&<TermsModal onClose={()=>setShowTerms(false)}/>}</AnimatePresence>
      <AnimatePresence>{showContact&&<ContactModal onClose={()=>setShowContact(false)} showToast={showToast}/>}</AnimatePresence>
      <AnimatePresence>{showAbout&&<AboutModal onClose={()=>setShowAbout(false)}/>}</AnimatePresence>
      <AnimatePresence>{!cookieConsent&&<CookieBanner onAccept={acceptCookies} onEssential={()=>{essentialOnly();setShowPrivacy(true);}}/>}</AnimatePresence>
      <AnimatePresence><Toast toasts={toasts}/></AnimatePresence>

      {/* ── AGENT ANNOUNCEMENT BAR ── */}
      <div style={{background:"linear-gradient(90deg,#4c1d95,#7c3aed,#dc2626)",padding:"6px 16px",textAlign:"center",cursor:"pointer"}} onClick={()=>setTab("agent")}>
        <div style={{display:"inline-flex",alignItems:"center",gap:8,flexWrap:"wrap",justifyContent:"center"}}>
          <span style={{fontSize:13}}>🤖</span>
          <span style={{fontSize:12,fontWeight:700,color:"#fff",letterSpacing:0.2}}>CareerOS Agent — 24/7 autonomous job hunter. Scans 50+ boards, tailors your CV daily.</span>
          <span style={{background:"rgba(255,255,255,0.15)",color:"#fff",fontSize:10,fontWeight:700,padding:"2px 10px",borderRadius:10,border:"1px solid rgba(255,255,255,0.3)",whiteSpace:"nowrap"}}>See how it works →</span>
        </div>
      </div>

      {/* ── HEADER ── */}
      <div style={{background:"rgba(255,255,255,0.92)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderBottom:"1px solid #e2e8f0",position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:1280,margin:"0 auto",padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",height:56}}>
          <div style={{display:"flex",alignItems:"center",gap:9,cursor:"pointer",flexShrink:0}} onClick={()=>setTab("builder")}>
            <LogoIcon size={32}/>
            <div>
              <div style={{fontSize:15,fontWeight:700,color:"#0f172a",letterSpacing:"-0.01em",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>CareerOS</div>
              <div style={{fontSize:8,color:"#94a3b8",letterSpacing:1.5,textTransform:"uppercase"}}>AI Career Platform</div>
            </div>
          </div>

          <nav className="desktop-nav" style={{display:"flex",flex:1,minWidth:0,overflowX:"auto",overflowY:"visible",alignItems:"stretch",scrollbarWidth:"thin",scrollbarColor:"#e2e8f0 transparent",position:"relative"}}>
            {TABS.map(t=>{
              const Icon = t.icon;
              const isActive = tab===t.id;
              return (
                <button key={t.id} onClick={()=>handleTabChange(t)}
                  style={{background:"transparent",border:"none",borderBottom:`2px solid ${t.agent?(isActive?"#7c3aed":"transparent"):(isActive?"#0d9488":"transparent")}`,borderTop:"2px solid transparent",color:t.agent?(isActive?"#7c3aed":"#9333ea"):(isActive?"#0d9488":"#64748b"),padding:"0 11px",height:56,fontSize:12,cursor:"pointer",fontWeight:isActive?700:500,transition:"all 0.15s",whiteSpace:"nowrap",display:"inline-flex",alignItems:"center",gap:5,flexShrink:0,letterSpacing:0.1}}>
                  {Icon&&<Icon size={13}/>}
                  {t.label}
                </button>
              );
            })}
          </nav>

          <div className="desktop-nav" style={{display:"flex",gap:8,alignItems:"center",flexShrink:0,marginLeft:8}}>
            {user?(
              <div style={{display:"flex",alignItems:"center",gap:7,padding:"5px 10px",background:"#f8fafc",borderRadius:8,border:"1px solid #e2e8f0",cursor:"pointer"}} onClick={handleSignOut}>
                <div style={{width:26,height:26,borderRadius:"50%",background:"linear-gradient(135deg,#0d9488,#0891b2)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:12}}>
                  {(user.user_metadata?.full_name||user.email||"U")[0].toUpperCase()}
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:600,color:"#0f172a",lineHeight:1.2}}>{user.user_metadata?.full_name||user.email?.split("@")[0]}</div>
                  <div style={{fontSize:9,color:isPro?"#0d9488":"#64748b",fontWeight:600,textTransform:"uppercase",letterSpacing:0.5}}>{isPro?"Pro":"Free"} · Sign out</div>
                </div>
              </div>
            ):(
              <>
                <button onClick={()=>{setAuthMode("login");setShowAuth(true);}} style={ghost({fontSize:12,padding:"7px 14px"})}>Sign in</button>
                <button onClick={()=>{setAuthMode("signup");setShowAuth(true);}} style={btn({fontSize:12,padding:"7px 14px"})}>Get Started Free →</button>
              </>
            )}
          </div>

          <button className="mob-btn" onClick={()=>setMenuOpen(!menuOpen)}
            style={{background:menuOpen?"rgba(13,148,136,0.1)":"#f8fafc",border:`1px solid ${menuOpen?"rgba(13,148,136,0.3)":"#e2e8f0"}`,borderRadius:10,padding:"10px 12px",cursor:"pointer",display:"none",flexDirection:"column",gap:5,transition:"all 0.2s"}}>
            <span style={{width:20,height:2,background:menuOpen?"#0d9488":"#64748b",borderRadius:1,display:"block"}}/>
            <span style={{width:20,height:2,background:menuOpen?"#0d9488":"#64748b",borderRadius:1,display:"block"}}/>
            <span style={{width:20,height:2,background:menuOpen?"#0d9488":"#64748b",borderRadius:1,display:"block"}}/>
          </button>
        </div>

        {menuOpen&&(
          <div className="mobile-menu" style={{background:"#ffffff",backdropFilter:"blur(20px)",borderTop:"1px solid #e2e8f0"}}>
            {user&&(
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 20px",background:"rgba(13,148,136,0.05)",borderBottom:"1px solid #e2e8f0"}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#0d9488,#0891b2)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:14,flexShrink:0}}>
                  {(user.user_metadata?.full_name||user.email||"U")[0].toUpperCase()}
                </div>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:"#0f172a"}}>{user.user_metadata?.full_name||user.email}</div>
                  <div style={{fontSize:11,color:isPro?"#0d9488":"#64748b",fontWeight:600,textTransform:"uppercase",letterSpacing:0.5}}>{isPro?"Pro Plan":"Free Plan"}</div>
                </div>
              </div>
            )}
            <div style={{padding:"8px 0"}}>
              {TABS.map(t=>{
                const Icon = t.icon;
                return (
                  <button key={t.id} onClick={()=>handleTabChange(t)}
                    style={{width:"100%",background:tab===t.id?"rgba(13,148,136,0.1)":"transparent",border:"none",borderLeft:`3px solid ${tab===t.id?"#0d9488":"transparent"}`,color:t.agent?"#7c3aed":(tab===t.id?"#0d9488":"#64748b"),padding:"14px 20px",fontSize:14,cursor:"pointer",fontWeight:tab===t.id?700:400,textAlign:"left",display:"flex",alignItems:"center",gap:10,boxSizing:"border-box"}}>
                    {Icon&&<Icon size={16}/>}{t.label}
                  </button>
                );
              })}
            </div>
            <div style={{padding:"14px 20px",borderTop:"1px solid #e2e8f0",display:"flex",flexDirection:"column",gap:10}}>
              {user?(
                <>
                  {!isPro&&<button onClick={()=>{setTab("plans");setMenuOpen(false);}} style={btn({fontSize:14,justifyContent:"center",padding:"13px"})}>⚡ Upgrade to Pro</button>}
                  <button onClick={()=>{clearSession();setMenuOpen(false);}} style={ghost({fontSize:13,textAlign:"center",padding:"10px",color:"#64748b"})}>🗑 Clear session</button>
                  <button onClick={()=>{handleSignOut();setMenuOpen(false);}} style={ghost({fontSize:14,textAlign:"center",padding:"12px"})}>Sign out</button>
                </>
              ):(
                <>
                  <button onClick={()=>{setAuthMode("signup");setShowAuth(true);setMenuOpen(false);}} style={btn({fontSize:14,justifyContent:"center",padding:"13px"})}>Get Started Free →</button>
                  <button onClick={()=>{setAuthMode("login");setShowAuth(true);setMenuOpen(false);}} style={ghost({fontSize:14,textAlign:"center",padding:"12px"})}>Sign in</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="main-pad" style={{maxWidth:1280,margin:"0 auto",padding:"20px 16px 80px",position:"relative"}}>
        <AnimatePresence mode="wait">

        {/* ════ RESUME BUILDER ════ */}
        {tab==="builder"&&(
          <motion.div key="builder" variants={fadeUp} initial="initial" animate="animate" exit="exit">

            {/* ── HERO ── */}
            <div className="hero-pad" style={{textAlign:"center",padding:"56px 20px 44px",background:"linear-gradient(160deg,#f0fdfa 0%,#f8fafc 45%,#eff6ff 100%)",borderRadius:24,marginBottom:16,border:"1px solid rgba(13,148,136,0.12)",position:"relative",overflow:"hidden",boxShadow:"0 1px 0 rgba(255,255,255,0.8) inset,0 4px 32px rgba(13,148,136,0.06)"}}>
              {/* Decorative blobs */}
              <div style={{position:"absolute",top:-60,right:-40,width:280,height:280,borderRadius:"50%",background:"radial-gradient(circle,rgba(13,148,136,0.08) 0%,transparent 70%)",pointerEvents:"none"}}/>
              <div style={{position:"absolute",bottom:-80,left:-60,width:320,height:320,borderRadius:"50%",background:"radial-gradient(circle,rgba(56,189,248,0.07) 0%,transparent 70%)",pointerEvents:"none"}}/>
              <div style={{position:"relative",zIndex:1}}>
                <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 16px",borderRadius:20,background:"rgba(13,148,136,0.08)",border:"1px solid rgba(13,148,136,0.18)",color:"#0d9488",fontSize:11,fontWeight:700,letterSpacing:0.8,textTransform:"uppercase",marginBottom:20}}>
                  ✦ AI Resume Builder
                </div>
                <h1 style={{fontSize:"clamp(30px,5vw,52px)",fontWeight:700,color:"#0f172a",lineHeight:1.15,marginBottom:14,letterSpacing:"-0.015em",fontFamily:"'Plus Jakarta Sans',sans-serif",maxWidth:640,margin:"0 auto 14px"}}>
                  Get the interview.<br/><span style={{background:"linear-gradient(135deg,#0d9488,#0891b2)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>Not the rejection.</span>
                </h1>
                <p style={{color:"#64748b",fontSize:15,maxWidth:500,margin:"0 auto 24px",lineHeight:1.75,fontWeight:400}}>
                  Paste a job description, upload your CV — get a tailored resume, ATS score, rejection risk, salary intel and interview coaching in 60 seconds.
                </p>
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,flexWrap:"wrap",marginBottom:user?0:28}}>
                  {[["⚡","Beats the ATS filter"],["💀","Flags your rejection risk"],["💰","Negotiate your best salary"],["🎯","Tailored to every job description"]].map(([icon,label],i)=>(
                    <div key={label} className="hero-tile" style={{animationDelay:`${i*0.08}s`,display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#475569",fontWeight:500,padding:"6px 14px",background:"rgba(255,255,255,0.8)",border:"1px solid #e2e8f0",borderRadius:20,backdropFilter:"blur(8px)"}}>
                      <span style={{fontSize:13}}>{icon}</span>{label}
                    </div>
                  ))}
                </div>
                {!user&&<button onClick={()=>{setAuthMode("signup");setShowAuth(true);}} style={{...btn({padding:"14px 36px",fontSize:15,borderRadius:12,boxShadow:"0 4px 20px rgba(13,148,136,0.25),0 1px 0 rgba(255,255,255,0.3) inset",letterSpacing:"-0.01em"})}}>Start Free — No Card Needed →</button>}
              </div>
            </div>

            {/* ── AGENT CALLOUT ── */}
            <div onClick={()=>setTab("agent")} style={{cursor:"pointer",background:"linear-gradient(135deg,#faf5ff,#eff6ff)",borderRadius:14,padding:"12px 18px",marginBottom:14,display:"flex",alignItems:"center",gap:14,border:"1px solid #e9d5ff"}}>
              <div style={{width:38,height:38,background:"linear-gradient(135deg,#7c3aed,#dc2626)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>🤖</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:700,color:"#0f172a",marginBottom:1}}>CareerOS Agent — 24/7 autonomous job hunting</div>
                <div style={{fontSize:11,color:"#7c3aed"}}>Scans 160+ companies, tailors your CV, builds your daily shortlist. Free beta — download now.</div>
              </div>
              <div style={{fontSize:11,fontWeight:700,color:"#7c3aed",whiteSpace:"nowrap",flexShrink:0}}>Learn more →</div>
            </div>

            {/* ── EMAIL GATE for non-authenticated users ── */}
            {!user&&(
              <div style={{background:"linear-gradient(135deg,#f0fdfa,#eff6ff)",borderRadius:14,padding:"20px 24px",marginBottom:14,border:"1px solid rgba(13,148,136,0.15)",textAlign:"center"}}>
                <div style={{fontSize:15,fontWeight:700,color:"#0f172a",marginBottom:6,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Create your free account to get started</div>
                <div style={{fontSize:13,color:"#64748b",marginBottom:16,lineHeight:1.6}}>Takes 30 seconds. No credit card. Instant access to your tailored resume.</div>
                <div style={{display:"flex",gap:8,maxWidth:420,margin:"0 auto",flexWrap:"wrap",justifyContent:"center"}}>
                  <button onClick={()=>{setAuthMode("signup");setShowAuth(true);}} style={{...btn({padding:"11px 28px",fontSize:13,borderRadius:10}),flex:"1 1 auto",minWidth:160}}>
                    Create Free Account →
                  </button>
                  <button onClick={()=>{setAuthMode("login");setShowAuth(true);}} style={{...ghost({padding:"11px 20px",fontSize:13,color:"#64748b"}),flex:"0 0 auto"}}>
                    Sign in
                  </button>
                </div>
              </div>
            )}

            {/* ── INPUTS ── */}
            <Card style={{marginBottom:14,opacity:user?1:0.45,pointerEvents:user?"auto":"none",filter:user?"none":"blur(2px)",transition:"all 0.3s",position:"relative"}}>
            {!user&&<div style={{position:"absolute",inset:0,zIndex:10,cursor:"pointer",borderRadius:14}} onClick={()=>{setAuthMode("signup");setShowAuth(true);}}/>}
              <div className="input-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:24}}>

                {/* Job Description */}
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <label style={{fontSize:12,fontWeight:700,color:"#374151",letterSpacing:0.1}}>Job Description</label>
                    {jd.length>0&&<span style={{fontSize:10,fontWeight:600,color:jd.length<80?"#ea580c":"#059669"}}>{jd.length<80?"Need more text ✗":"Ready ✓"}</span>}
                  </div>
                  <div
                    onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)handleJdFile(f);}}
                    onDragOver={e=>e.preventDefault()}
                    onClick={()=>document.getElementById("jd-file-input").click()}
                    style={{border:"1.5px solid #e2e8f0",borderRadius:8,padding:"10px 14px",background:"#f8fafc",display:"flex",alignItems:"center",gap:10,cursor:"pointer",transition:"all 0.15s"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(13,148,136,0.4)";e.currentTarget.style.background="rgba(13,148,136,0.05)";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.background="#f8fafc";}}>
                    <span style={{fontSize:15,color:"#94a3b8",flexShrink:0}}>{fileUploading?"⏳":"↑"}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:600,color:"#94a3b8"}}>{fileUploading?"Reading…":"Upload or drag file"}</div>
                      <div style={{fontSize:10,color:"#94a3b8"}}>DOC · DOCX · PDF · TXT</div>
                    </div>
                    <div style={{display:"flex",gap:4,flexShrink:0}} onClick={e=>e.stopPropagation()}>
                      <input
                        style={{width:130,background:"#ffffff",border:"1.5px solid #e2e8f0",borderRadius:6,padding:"5px 8px",color:"#0f172a",fontSize:11,fontFamily:"inherit",outline:"none"}}
                        placeholder="Paste job URL…"
                        value={jobUrl} onChange={e=>{setJobUrl(e.target.value);setUrlError("");}}
                        onKeyDown={e=>e.key==="Enter"&&handleUrlImport()}
                      />
                      <button onClick={handleUrlImport}
                        style={{background:urlLoading||!jobUrl?"#f1f5f9":"#0d9488",color:urlLoading||!jobUrl?"#94a3b8":"#fff",border:"none",borderRadius:6,padding:"5px 10px",fontSize:11,fontWeight:600,cursor:urlLoading||!jobUrl?"not-allowed":"pointer",whiteSpace:"nowrap",transition:"all 0.15s"}}>
                        {urlLoading?"…":"Import"}
                      </button>
                    </div>
                    <input id="jd-file-input" type="file" accept=".pdf,.doc,.docx,.txt,.md" style={{display:"none"}}
                      onChange={e=>{const f=e.target.files[0];if(f){handleJdFile(f);e.target.value="";}}}/>
                  </div>
                  {urlError&&(
                    <div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:7,padding:"8px 12px",fontSize:11,color:"#dc2626",lineHeight:1.5}}>
                      {urlError}
                      {(urlError.includes("LinkedIn")||urlError.includes("login"))&&(
                        <button onClick={async()=>{try{const t=await navigator.clipboard.readText();if(t&&t.length>100){setJd(t);setUrlError("");}else setUrlError("Clipboard empty — paste manually.");}catch{setUrlError("Could not read clipboard — paste manually.");}}}
                          style={{display:"block",marginTop:5,background:"#dc2626",color:"#fff",border:"none",borderRadius:5,padding:"4px 10px",fontSize:10,fontWeight:600,cursor:"pointer"}}>📋 Paste from clipboard</button>
                      )}
                    </div>
                  )}
                  {!urlError&&jd&&!urlLoading&&jobUrl===""&&<div style={{fontSize:10,color:"#059669",fontWeight:600}}>✓ Imported successfully</div>}
                  <textarea
                    style={{...inp,flex:1,minHeight:200,resize:"vertical",borderColor:jd.length>0&&jd.length<80?"rgba(249,115,22,0.4)":undefined}}
                    placeholder="Or paste the full job description here…"
                    value={jd} onChange={e=>setJd(e.target.value)}/>
                </div>

                {/* CV */}
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <label style={{fontSize:12,fontWeight:700,color:"#374151",letterSpacing:0.1}}>Your CV / Background</label>
                    {cv.length>0&&<span style={{fontSize:10,fontWeight:600,color:cv.length<50?"#ea580c":"#059669"}}>{cv.length<50?"Need more text ✗":"Ready ✓"}</span>}
                  </div>
                  <div
                    onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)handleCvFile(f);}}
                    onDragOver={e=>e.preventDefault()}
                    onClick={()=>document.getElementById("cv-file-input").click()}
                    style={{border:"1.5px solid #e2e8f0",borderRadius:8,padding:"10px 14px",background:"#f8fafc",display:"flex",alignItems:"center",gap:10,cursor:"pointer",transition:"all 0.15s"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(13,148,136,0.4)";e.currentTarget.style.background="rgba(13,148,136,0.05)";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.background="#f8fafc";}}>
                    <span style={{fontSize:15,color:"#94a3b8",flexShrink:0}}>{fileUploading?"⏳":"↑"}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:600,color:"#94a3b8"}}>{fileUploading?"Reading…":"Upload or drag file"}</div>
                      <div style={{fontSize:10,color:"#94a3b8"}}>DOC · DOCX · PDF · TXT</div>
                    </div>
                    <button onClick={e=>{e.stopPropagation();setCv(SAMPLE_CV);}}
                      style={{background:"#f8fafc",border:"1.5px solid #e2e8f0",color:"#64748b",borderRadius:6,padding:"5px 10px",fontSize:11,fontWeight:500,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
                      Sample CV
                    </button>
                    <input id="cv-file-input" type="file" accept=".pdf,.doc,.docx,.txt,.md" style={{display:"none"}}
                      onChange={e=>{const f=e.target.files[0];if(f){handleCvFile(f);e.target.value="";}}}/>
                  </div>
                  <textarea
                    style={{...inp,flex:1,minHeight:200,resize:"vertical"}}
                    placeholder="Or paste your CV / describe your experience here…"
                    value={cv} onChange={e=>setCv(e.target.value)}/>
                </div>
              </div>

              {/* Format picker */}
              <div style={{borderTop:"1px solid #e2e8f0",marginTop:16,paddingTop:14}}>
                <div style={{fontSize:10,fontWeight:700,color:"#64748b",letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>Resume Format</div>
                <div className="fmt-scroll" style={{display:"flex",gap:7,overflowX:"auto",paddingBottom:2}}>
                  {RESUME_FORMATS.map(f=>(
                    <div key={f.id} onClick={()=>setFmt(f.id)}
                      style={{border:`2px solid ${fmt===f.id?f.accent:"#e2e8f0"}`,borderRadius:8,padding:"8px 12px",cursor:"pointer",background:fmt===f.id?f.accent+"15":"#f8fafc",transition:"all 0.15s",textAlign:"center",flexShrink:0,minWidth:80}}>
                      <div style={{fontSize:16,marginBottom:3}}>{f.icon}</div>
                      <div style={{fontSize:10,fontWeight:700,color:fmt===f.id?f.accent:"#64748b"}}>{f.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {loading&&(
              <div style={{background:"rgba(13,148,136,0.07)",border:"1px solid rgba(13,148,136,0.2)",borderRadius:12,padding:"14px 18px",marginBottom:14,animation:"pulse 2s infinite"}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:16,height:16,border:"2px solid rgba(13,148,136,0.3)",borderTopColor:"#0d9488",borderRadius:"50%",animation:"spin 0.8s linear infinite",flexShrink:0}}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,color:"#0d9488",marginBottom:5}}>{LOADING_PHASES[phase]?.icon} {LOADING_PHASES[phase]?.text}</div>
                    <div style={{height:4,background:"rgba(13,148,136,0.15)",borderRadius:2}}>
                      <motion.div style={{height:4,background:"linear-gradient(90deg,#0d9488,#0891b2)",borderRadius:2}}
                        animate={{width:`${((phase+1)/LOADING_PHASES.length)*100}%`}} transition={{duration:0.5}}/>
                    </div>
                  </div>
                  <div style={{fontSize:11,color:"#0d9488",fontWeight:600}}>{Math.round(((phase+1)/LOADING_PHASES.length)*100)}%</div>
                </div>
              </div>
            )}

            <div className="action-btns" style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
              <button id="generate-btn" onClick={generate} disabled={loading} style={{...btn({background:"linear-gradient(135deg,#0d9488,#0891b2)",padding:"12px 24px",fontSize:14,boxShadow:"0 4px 20px rgba(13,148,136,0.25)"}),opacity:loading||!jd||!cv?0.5:1}}>
                {loading?"Generating...":"✦ Generate Tailored Resume"}
              </button>
              {result&&!result.error&&(<>
                <button onClick={()=>{setTab("dashboard");genCover();}} style={ghost({color:"#7c3aed",borderColor:"rgba(124,58,237,0.25)"})}>✉ Cover Letter</button>
                <button onClick={()=>{setTab("interview");genInterview();}} style={ghost({color:"#0891b2",borderColor:"rgba(8,145,178,0.25)"})}>◆ Interview Prep</button>
                <button onClick={()=>setTab("interview")} style={ghost({color:"#dc2626",borderColor:"rgba(220,38,38,0.25)"})}>🎭 Sim</button>
                <button onClick={()=>{navigator.clipboard.writeText([result.resume?.name,result.resume?.contact,"",result.resume?.summary].join("\n"));setCopied(true);setTimeout(()=>setCopied(false),1500);}} style={ghost({color:copied?"#059669":"#64748b"})}>
                  {copied?"✓ Copied":"Copy"}
                </button>
              </>)}
            </div>

            {result&&!result.error&&(
              <motion.div ref={ref} variants={stagger} initial="initial" animate="animate">

                {/* Interview Probability Hero */}
                {(()=>{
                  const prob = getInterviewProb(result);
                  const probColor = prob>=70?"#34d399":prob>=50?"#fbbf24":"#f87171";
                  const probLabel = prob>=70?"Strong Candidate":prob>=50?"Competitive":"Needs Work";
                  return (
                    <motion.div variants={cardReveal}>
                    <Card style={{display:"flex",alignItems:"center",gap:24,flexWrap:"wrap",marginBottom:12,border:`1px solid ${prob>=70?"rgba(52,211,153,0.2)":prob>=50?"rgba(251,191,36,0.2)":"rgba(248,113,113,0.2)"}`}}>
                      <div style={{display:"flex",alignItems:"center",gap:18,flex:1,minWidth:220}}>
                        <ScoreRing score={prob} size={96} color={probColor}/>
                        <div>
                          <div style={{fontSize:10,fontWeight:700,color:"#475569",letterSpacing:1.5,textTransform:"uppercase",marginBottom:4}}>Interview Probability</div>
                          <div style={{fontSize:28,fontWeight:700,color:probColor,letterSpacing:"-0.01em",lineHeight:1}}>{prob}%</div>
                          <div style={{fontSize:13,fontWeight:600,color:probColor,marginTop:3}}>{probLabel}</div>
                          <div style={{fontSize:11,color:"#475569",marginTop:4}}>ATS fit · human appeal · rejection risk</div>
                        </div>
                      </div>
                      <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                        <button onClick={copyShareCard} style={ghost({fontSize:12,padding:"9px 16px",color:shareCopied?"#059669":"#64748b"})}>
                          {shareCopied?"✓ Copied!":"📤 Share Score"}
                        </button>
                      </div>
                    </Card>
                    </motion.div>
                  );
                })()}

                {/* Score Cards */}
                <div className="score-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10,marginBottom:12}}>
                  {[
                    {label:"ATS Score",score:result.matchScore,color:result.matchScore>=80?"#059669":result.matchScore>=65?"#b45309":"#dc2626",sub:result.matchScore>=80?"Strong":result.matchScore>=65?"Good":"Needs Work"},
                    {label:"Human Appeal",score:result.hiringManagerScore,color:"#7c3aed",sub:"HM View"},
                    {label:"Rejection Risk",score:result.rejectionRisk?.score,color:result.rejectionRisk?.score>60?"#dc2626":result.rejectionRisk?.score>35?"#b45309":"#059669",sub:result.rejectionRisk?.score>60?"High Risk":result.rejectionRisk?.score>35?"Medium Risk":"Low Risk"},
                  ].map(m=>(
                    <motion.div key={m.label} variants={cardReveal}>
                    <Card style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,padding:16}}>
                      <SLabel color={m.color}>{m.label}</SLabel>
                      <ScoreRing score={m.score} size={70} color={m.color}/>
                      <div style={{fontSize:10,fontWeight:600,color:m.color}}>{m.sub}</div>
                    </Card>
                    </motion.div>
                  ))}
                  <motion.div variants={cardReveal}>
                  <Card style={{padding:16}}>
                    <SLabel color="#059669">💰 Salary Intel</SLabel>
                    {result.salaryIntelligence?(<>
                      <div style={{fontSize:22,fontWeight:700,color:"#059669",marginBottom:2}}>{result.salaryIntelligence.recommendedAsk}</div>
                      <div style={{fontSize:10,color:"#475569",marginBottom:4}}>Market: {result.salaryIntelligence.marketMin}–{result.salaryIntelligence.marketMax}</div>
                      <div style={{fontSize:11,color:"#64748b",lineHeight:1.5}}>{result.salaryIntelligence.insight}</div>
                    </>):<div style={{fontSize:12,color:"#64748b"}}>Not available</div>}
                  </Card>
                  </motion.div>
                </div>

                {/* Rejection Risk */}
                {result.rejectionRisk&&(
                  <motion.div variants={cardReveal}>
                  <div style={{background:"rgba(239,68,68,0.05)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:14,padding:20,marginBottom:12}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                      <span style={{fontSize:20}}>💀</span>
                      <div>
                        <div style={{fontSize:14,fontWeight:700,color:"#dc2626",display:"flex",alignItems:"center",gap:8}}>Why You'll Get Rejected <ViralBadge text="🔥 BRUTAL HONESTY"/></div>
                        <div style={{fontSize:11,color:"#475569"}}>Real reasons hiring managers will pass</div>
                      </div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:8,marginBottom:14}}>
                      {[{label:"CV Screen Risk",value:result.rejectionRisk.cvScreenRisk},{label:"Ghosting Risk",value:result.rejectionRisk.ghostingRisk},{label:"Interview Risk",value:result.rejectionRisk.interviewRisk}].map(r=>(
                        <div key={r.label} style={{textAlign:"center",padding:10,background:"rgba(239,68,68,0.06)",borderRadius:8,border:"1px solid rgba(239,68,68,0.12)"}}>
                          <div style={{fontSize:10,color:"#475569",fontWeight:600,marginBottom:4}}>{r.label}</div>
                          <div style={{fontSize:14,fontWeight:700,color:r.value==="HIGH"?"#dc2626":r.value==="MEDIUM"?"#b45309":"#059669"}}>{r.value||"—"}</div>
                        </div>
                      ))}
                    </div>
                    {isPro&&(<>
                      <div style={{marginBottom:12}}>
                        <div style={{fontSize:10,fontWeight:700,color:"#dc2626",letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Top Rejection Reasons:</div>
                        {result.rejectionRisk.topReasons?.map((r,i)=>(
                          <div key={i} style={{display:"flex",gap:8,padding:"7px 10px",background:"rgba(239,68,68,0.05)",borderRadius:7,border:"1px solid rgba(239,68,68,0.1)",marginBottom:6}}>
                            <span style={{color:"#dc2626",fontWeight:700,flexShrink:0}}>{i+1}.</span>
                            <span style={{fontSize:12,color:"#475569",lineHeight:1.5}}>{r}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <div style={{fontSize:10,fontWeight:700,color:"#059669",letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>How To Fix It:</div>
                        {result.rejectionRisk.howToFix?.map((fix,i)=>(
                          <div key={i} style={{display:"flex",gap:8,padding:"6px 0",borderBottom:"1px solid rgba(239,68,68,0.08)"}}>
                            <span style={{color:"#059669",flexShrink:0}}>✓</span>
                            <span style={{fontSize:12,color:"#475569",lineHeight:1.5}}>{fix}</span>
                          </div>
                        ))}
                      </div>
                    </>)}
                  </div>
                  </motion.div>
                )}

                {/* Salary Script */}
                {result.salaryIntelligence?.negotiationScript&&(
                  <motion.div variants={cardReveal}>
                  <div style={{background:"rgba(16,185,129,0.05)",border:"1px solid rgba(16,185,129,0.15)",borderRadius:14,padding:20,marginBottom:12}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                      <span style={{fontSize:20}}>💰</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:14,fontWeight:700,color:"#059669",display:"flex",alignItems:"center",gap:8}}>Your Salary Negotiation Script <ViralBadge text="💬 READY TO USE"/></div>
                        <div style={{fontSize:11,color:"#475569"}}>A personalised, word-for-word script based on your market rate — say this when the offer lands</div>
                      </div>
                    </div>
                    {isPro?(<>
                      <div style={{background:"#f0fdf4",borderRadius:8,border:"1px solid rgba(16,185,129,0.2)",padding:16,fontSize:13,color:"#374151",lineHeight:1.8,fontStyle:"italic",position:"relative"}}>
                        <div style={{position:"absolute",top:-10,left:16,background:"#059669",color:"#fff",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:10}}>Script</div>
                        {result.salaryIntelligence.negotiationScript}
                      </div>
                      <div style={{marginTop:10,fontSize:11,color:"#475569"}}>💡 Pro tip: After you say this, stay quiet. Let them respond first — the next person to speak usually concedes ground.</div>
                    </>):(
                      <div style={{position:"relative",borderRadius:8,overflow:"hidden"}}>
                        <div style={{filter:"blur(5px)",pointerEvents:"none",userSelect:"none",background:"#f0fdf4",borderRadius:8,padding:16,fontSize:13,color:"#374151",lineHeight:1.8,fontStyle:"italic"}}>
                          When they make an offer say: "Thank you so much — I'm really excited about this role. Based on my research and experience, I was expecting something closer to [X]. Is there flexibility there?"
                        </div>
                        <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,background:"rgba(8,13,26,0.7)",backdropFilter:"blur(4px)"}}>
                          <div style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>🔒 Word-for-word script — Pro only</div>
                          <button onClick={()=>{setUpgradeFeature("Salary Negotiation Script");setShowUpgrade(true);}} style={btn({fontSize:11,padding:"7px 18px",background:"linear-gradient(135deg,#059669,#0d9488)"})}>Unlock with Pro →</button>
                        </div>
                      </div>
                    )}
                  </div>
                  </motion.div>
                )}

                {/* JD Analysis */}
                <motion.div variants={cardReveal}>
                <Card>
                  <SLabel>JD Analysis — {result.jdAnalysis?.role} at {result.jdAnalysis?.company}</SLabel>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:16}}>
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:9,color:"#059669",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:6,display:"flex",alignItems:"center",gap:5}}><span style={{width:6,height:6,borderRadius:"50%",background:"#059669",flexShrink:0,display:"inline-block"}}/>MUST-HAVE</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:4}}>{result.jdAnalysis?.mustHave?.map(s=><Chip key={s} text={s} color="#059669" bg="rgba(16,185,129,0.08)"/>)}</div>
                    </div>
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:9,color:"#b45309",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:6,display:"flex",alignItems:"center",gap:5}}><span style={{width:6,height:6,borderRadius:"50%",background:"#b45309",flexShrink:0,display:"inline-block"}}/>NICE TO HAVE</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:4}}>{result.jdAnalysis?.niceToHave?.map(s=><Chip key={s} text={s} color="#b45309" bg="rgba(245,158,11,0.08)"/>)}</div>
                    </div>
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:9,color:"#5b21b6",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:6,display:"flex",alignItems:"center",gap:5}}><span style={{width:6,height:6,borderRadius:"50%",background:"#5b21b6",flexShrink:0,display:"inline-block"}}/>ATS KEYWORDS</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:4}}>{result.jdAnalysis?.keywords?.map(k=><Chip key={k} text={k} color="#5b21b6" bg="rgba(139,92,246,0.08)"/>)}</div>
                    </div>
                  </div>
                  {result.jdAnalysis?.hiringIntent&&<div style={{marginTop:14,padding:"10px 14px",background:"rgba(13,148,136,0.07)",borderRadius:8,borderLeft:"3px solid rgba(13,148,136,0.4)"}}><div style={{fontSize:9,fontWeight:700,color:"#0d9488",letterSpacing:1,marginBottom:4,textTransform:"uppercase"}}>HIRING INTENT</div><div style={{fontSize:12,color:"#475569",lineHeight:1.6}}>{result.jdAnalysis.hiringIntent}</div></div>}
                </Card>
                </motion.div>

                {/* HM Psychology */}
                {result.hiringManagerInsights&&(
                  <motion.div variants={cardReveal}>
                  <Card>
                    <SLabel color="#7c3aed">🧠 Hiring Manager Psychology</SLabel>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10}}>
                      <div style={{padding:10,background:"rgba(167,139,250,0.06)",borderRadius:7,border:"1px solid rgba(167,139,250,0.12)"}}><div style={{fontSize:9,fontWeight:700,color:"#7c3aed",letterSpacing:1,marginBottom:4,textTransform:"uppercase"}}>FIRST IMPRESSION</div><div style={{fontSize:12,color:"#475569",lineHeight:1.6}}>{result.hiringManagerInsights.firstImpression}</div></div>
                      <div style={{padding:10,background:"rgba(16,185,129,0.05)",borderRadius:7,border:"1px solid rgba(16,185,129,0.12)"}}><div style={{fontSize:9,fontWeight:700,color:"#059669",letterSpacing:1,marginBottom:4,textTransform:"uppercase"}}>HUMAN APPEAL</div><div style={{fontSize:12,color:"#475569",lineHeight:1.6}}>{result.hiringManagerInsights.humanAppeal}</div></div>
                      <div><div style={{fontSize:9,fontWeight:700,color:"#dc2626",letterSpacing:1,marginBottom:4,textTransform:"uppercase"}}>RED FLAGS</div>{result.hiringManagerInsights.redFlags?.map((r,i)=><div key={i} style={{fontSize:12,color:"#475569",padding:"2px 0"}}>⚠ {r}</div>)}</div>
                      <div><div style={{fontSize:9,fontWeight:700,color:"#b45309",letterSpacing:1,marginBottom:4,textTransform:"uppercase"}}>STANDOUT</div>{result.hiringManagerInsights.standoutFactors?.map((s,i)=><div key={i} style={{fontSize:12,color:"#475569",padding:"2px 0"}}>⭐ {s}</div>)}</div>
                    </div>
                  </Card>
                  </motion.div>
                )}

                {/* Gap Analysis */}
                <motion.div variants={cardReveal}>
                <Card>
                  <SLabel>Gap Analysis</SLabel>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14}}>
                    {[["✓ Strengths","strengths","#34d399"],["✗ Gaps","gaps","#f87171"],["⇄ Transferable","transferable","#fbbf24"]].map(([label,key,color])=>(
                      <div key={key}><div style={{fontSize:12,fontWeight:700,color,marginBottom:8}}>{label}</div>
                      {result.gapAnalysis?.[key]?.map((s,i)=><div key={i} style={{fontSize:12,color:"#64748b",padding:"5px 0",borderBottom:"1px solid #f1f5f9",lineHeight:1.5}}>• {s}</div>)}</div>
                    ))}
                  </div>
                </Card>
                </motion.div>

                {/* Tailored Resume */}
                <motion.div variants={cardReveal}>
                <Card>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
                    <SLabel style={{margin:0}}>✦ Your Tailored Resume</SLabel>
                    {originalCv&&(
                      <div style={{display:"flex",background:"#ffffff",borderRadius:8,padding:2,gap:2,border:"1px solid #e2e8f0"}}>
                        <button onClick={()=>setShowBefore(false)} style={{padding:"5px 14px",borderRadius:6,border:"none",fontSize:11,fontWeight:600,cursor:"pointer",background:!showBefore?"#0d9488":"transparent",color:!showBefore?"#fff":"#64748b",transition:"all 0.15s"}}>After ✦</button>
                        <button onClick={()=>setShowBefore(true)} style={{padding:"5px 14px",borderRadius:6,border:"none",fontSize:11,fontWeight:600,cursor:"pointer",background:showBefore?"#7c3aed":"transparent",color:showBefore?"#fff":"#64748b",transition:"all 0.15s"}}>Before</button>
                      </div>
                    )}
                  </div>
                  {showBefore ? (
                    <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:8,padding:16,maxHeight:400,overflowY:"auto"}}>
                      <div style={{fontSize:10,fontWeight:700,color:"#7c3aed",letterSpacing:1.5,marginBottom:8,textTransform:"uppercase"}}>Your Original CV</div>
                      <pre style={{fontSize:12,color:"#64748b",lineHeight:1.7,whiteSpace:"pre-wrap",fontFamily:"inherit",margin:0}}>{originalCv}</pre>
                    </div>
                  ) : (
                    <FormatPicker resume={result.resume} selected={fmt} onSelect={setFmt} onDownload={f=>downloadResume(result.resume,f)}/>
                  )}
                </Card>
                </motion.div>

                {/* Improvements */}
                <motion.div variants={cardReveal}>
                <Card>
                  <SLabel>💡 Strategic Improvements</SLabel>
                  {result.improvements?.map((tip,i)=>(
                    <div key={i} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:i<result.improvements.length-1?"1px solid #f1f5f9":"none"}}>
                      <div style={{width:22,height:22,borderRadius:"50%",background:"rgba(13,148,136,0.1)",border:"1px solid rgba(13,148,136,0.2)",color:"#0d9488",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{i+1}</div>
                      <div style={{fontSize:13,color:"#64748b",lineHeight:1.7}}>{tip}</div>
                    </div>
                  ))}
                </Card>
                </motion.div>

              </motion.div>
            )}
            {result?.error&&<div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:10,padding:14,color:"#dc2626",fontSize:13}}>⚠ {result.error}</div>}
          </motion.div>
        )}

        {/* ════ JOB SEARCH ════ */}
        {tab==="jobs"&&(
          <motion.div key="jobs" variants={fadeUp} initial="initial" animate="animate" exit="exit">
            <div style={{marginBottom:20,paddingBottom:16,borderBottom:"1px solid #f1f5f9"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                <div style={{width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,#0d9488,#0891b2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Search size={16} color="#fff"/></div>
                <h2 style={{fontSize:22,fontWeight:700,color:"#0f172a",margin:0,letterSpacing:"-0.01em",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Job Search</h2>
              </div>
              <p style={{color:"#64748b",fontSize:13,marginLeft:42}}>Live jobs from Reed · Greenhouse · Lever · RemoteOK · Arbeitnow · Jobicy — 500+ company career pages</p>
            </div>
            <Card style={{marginBottom:12}}>
              {/* Search row */}
              <div style={{display:"flex",gap:8,marginBottom:12}}>
                <input style={{...inp,flex:1}} placeholder="Job title or skill — e.g. Senior Project Manager"
                  value={jobQ} onChange={e=>setJobQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&searchJobs()}/>
                <button onClick={searchJobs} disabled={jobLoading} style={btn({flexShrink:0,padding:"10px 24px",fontSize:13})}>
                  {jobLoading?"Searching…":"Search"}
                </button>
              </div>

              {/* Industry / sector chips — THE key relevance lever */}
              <div style={{marginBottom:12}}>
                <div style={{fontSize:10,fontWeight:700,color:"#94a3b8",letterSpacing:1.2,textTransform:"uppercase",marginBottom:6}}>
                  Industry / Sector <span style={{fontWeight:400,color:"#94a3b8",textTransform:"none",letterSpacing:0}}>— pick one to filter out unrelated fields</span>
                </div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {[
                    {v:"",l:"All Industries"},
                    {v:"technology software",l:"🖥 Tech & Software"},
                    {v:"finance banking fintech",l:"💳 Finance & Banking"},
                    {v:"consulting strategy",l:"📊 Consulting"},
                    {v:"marketing digital",l:"📣 Marketing"},
                    {v:"product management SaaS",l:"📦 Product / SaaS"},
                    {v:"data analytics AI",l:"🤖 Data & AI"},
                    {v:"engineering infrastructure",l:"⚙️ Engineering"},
                    {v:"legal compliance",l:"⚖️ Legal"},
                    {v:"retail ecommerce",l:"🛍 Retail"},
                    {v:"healthcare NHS",l:"🏥 Healthcare"},
                    {v:"construction real estate",l:"🏗 Construction"},
                  ].map(({v,l})=>(
                    <button key={v} onClick={()=>setJobFilters(f=>({...f,sector:v}))}
                      style={{padding:"5px 13px",borderRadius:20,fontSize:11,fontWeight:500,cursor:"pointer",transition:"all 0.15s",
                        background:jobFilters.sector===v?"linear-gradient(135deg,rgba(13,148,136,0.12),rgba(8,145,178,0.1))":"#f8fafc",
                        color:jobFilters.sector===v?"#0d9488":"#64748b",
                        border:`1.5px solid ${jobFilters.sector===v?"rgba(13,148,136,0.45)":"#e2e8f0"}`}}>
                      {l}
                    </button>
                  ))}
                </div>
                {jobFilters.sector&&(
                  <div style={{marginTop:8,fontSize:11,color:"#0d9488",display:"flex",alignItems:"center",gap:5}}>
                    <span>✓</span>
                    <span>Searching <strong>"{jobQ}"</strong> within <strong>{jobFilters.sector}</strong> — results will exclude clinical, nuclear, construction etc.</span>
                  </div>
                )}
              </div>

              {/* Country + quick filters row */}
              <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",paddingTop:10,borderTop:"1px solid #f1f5f9"}}>
                <div style={{display:"flex",gap:5}}>
                  {COUNTRIES.map(c=>(
                    <button key={c.code} onClick={()=>setCountry(c.code)}
                      style={{padding:"5px 12px",borderRadius:20,background:country===c.code?"rgba(13,148,136,0.1)":"#f8fafc",border:`1.5px solid ${country===c.code?"rgba(13,148,136,0.4)":"#e2e8f0"}`,color:country===c.code?"#0d9488":"#64748b",fontSize:11,fontWeight:500,cursor:"pointer"}}>
                      {c.label}
                    </button>
                  ))}
                </div>
                <div style={{width:1,height:20,background:"#e2e8f0",margin:"0 2px"}}/>
                {[["all","All"],["remote","Remote only"],["onsite","On-site"]].map(([v,l])=>(
                  <button key={v} onClick={()=>setJobFilters(f=>({...f,type:v}))}
                    style={{padding:"5px 12px",borderRadius:20,fontSize:11,fontWeight:500,cursor:"pointer",
                      background:jobFilters.type===v?"rgba(13,148,136,0.1)":"#f8fafc",
                      color:jobFilters.type===v?"#0d9488":"#64748b",
                      border:`1.5px solid ${jobFilters.type===v?"rgba(13,148,136,0.4)":"#e2e8f0"}`}}>
                    {l}
                  </button>
                ))}
                <div style={{width:1,height:20,background:"#e2e8f0",margin:"0 2px"}}/>
                <input style={{...inp,padding:"5px 10px",fontSize:11,width:130,flex:"none"}} placeholder="📍 City / location"
                  value={jobFilters.location} onChange={e=>setJobFilters(f=>({...f,location:e.target.value}))}/>
                <input style={{...inp,padding:"5px 10px",fontSize:11,width:110,flex:"none"}} placeholder="£ Min salary"
                  value={jobFilters.salaryMin} onChange={e=>setJobFilters(f=>({...f,salaryMin:e.target.value}))}/>
                {(jobFilters.sector||jobFilters.location||jobFilters.salaryMin||jobFilters.type!=="all")&&(
                  <button onClick={()=>setJobFilters({type:"all",source:"all",sort:"recent",location:"",salaryMin:"",sector:""})}
                    style={{padding:"5px 10px",borderRadius:20,fontSize:11,background:"#fef2f2",color:"#dc2626",border:"1.5px solid rgba(220,38,38,0.2)",cursor:"pointer",fontWeight:600}}>
                    ✕ Clear
                  </button>
                )}
              </div>
            </Card>

            {jobs.length>0&&!jobLoading&&(
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:6}}>
                <span style={{fontSize:12,color:"#475569",fontWeight:500}}>
                  {filteredJobs().length} of {jobs.length} jobs
                  {jobFilters.type!=="all"&&<span style={{color:"#0d9488"}}> · {jobFilters.type}</span>}
                  {jobFilters.source!=="all"&&<span style={{color:"#0d9488"}}> · {jobFilters.source}</span>}
                  {jobFilters.location&&<span style={{color:"#0d9488"}}> · {jobFilters.location}</span>}
                </span>
                <span style={{fontSize:11,color:"#64748b"}}>Greenhouse · Lever · Reed · RemoteOK · Arbeitnow · Jobicy</span>
              </div>
            )}

            {jobLoading&&<div style={{textAlign:"center",padding:40}}><div style={{width:24,height:24,border:"3px solid rgba(13,148,136,0.2)",borderTopColor:"#0d9488",borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 10px"}}/><div style={{color:"#475569",fontSize:13}}>Searching across all sources…</div></div>}
            {!jobLoading&&jobs.length===0&&<div style={{textAlign:"center",padding:48,color:"#475569"}}><div style={{fontSize:36,marginBottom:10}}>🔍</div><div style={{fontSize:15,fontWeight:600,color:"#64748b",marginBottom:4}}>Search for jobs above</div><div style={{fontSize:13}}>Try "product manager", "developer", "marketing"</div></div>}
            {!jobLoading&&jobs.length>0&&filteredJobs().length===0&&(
              <div style={{textAlign:"center",padding:40}}>
                <div style={{fontSize:28,marginBottom:8}}>🚫</div>
                <div style={{fontSize:14,fontWeight:600,color:"#64748b",marginBottom:4}}>No jobs match your filters</div>
                <button onClick={()=>setJobFilters({type:"all",source:"all",sort:"recent",location:"",salaryMin:""})} style={btn({fontSize:12,padding:"8px 16px",marginTop:8})}>Clear filters</button>
              </div>
            )}
            {filteredJobs().map((job,idx)=>(
              <motion.div key={job.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:idx*0.04}}
                className="jcard" style={{background:"#ffffff",border:"1px solid #e2e8f0",borderRadius:12,padding:16,marginBottom:8,transition:"all 0.15s"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:4,flexWrap:"wrap"}}>
                      <span style={{fontSize:14,fontWeight:700,color:"#0f172a"}}>{job.title}</span>
                      <PBadge platform={job.platform}/>
                      {job.visaSponsorship&&<span style={{fontSize:10,fontWeight:700,color:"#059669",background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.2)",padding:"1px 7px",borderRadius:10}}>🛂 Visa</span>}
                    </div>
                    <div style={{display:"flex",gap:10,marginBottom:5,flexWrap:"wrap"}}>
                      <span style={{fontSize:12,color:"#64748b"}}>🏢 {job.company}</span>
                      <span style={{fontSize:12,color:"#475569"}}>📍 {job.location}</span>
                      {job.salary&&job.salary!=="Competitive"&&<span style={{fontSize:12,color:"#475569"}}>💰 {job.salary}</span>}
                    </div>
                    {job.description&&<p style={{fontSize:12,color:"#64748b",lineHeight:1.6,marginBottom:10}}>{job.description}</p>}
                    <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                      <button onClick={e=>applyJob(job,e)} disabled={applying===job.id} style={btn({fontSize:11,padding:"7px 14px",background:applied===job.id?"rgba(52,211,153,0.3)":"linear-gradient(135deg,#0d9488,#0891b2)"})}>
                        {applying===job.id?"...":applied===job.id?"✓ Applied":"Apply →"}
                      </button>
                      <button onClick={e=>{e.stopPropagation();setJd((job.description||job.title)+"\n\nRole: "+job.title+"\nCompany: "+job.company);setTab("builder");}} style={ghost({fontSize:11,padding:"7px 12px",color:"#0d9488",borderColor:"rgba(13,148,136,0.3)"})}>✦ Tailor</button>
                      <button onClick={e=>saveJob(job,e)} style={ghost({fontSize:11,padding:"7px 12px",color:apps.find(a=>a.title===job.title&&a.company===job.company)?"#059669":"#64748b"})}>
                        {apps.find(a=>a.title===job.title&&a.company===job.company)?"✓":"☆"}
                      </button>
                      {result?.resume&&<button onClick={e=>{e.stopPropagation();setJobFmt(jobFmt===job.id?null:job.id);}} style={ghost({fontSize:11,padding:"7px 12px",color:"#7c3aed",borderColor:"rgba(124,58,237,0.2)"})}>📄</button>}
                    </div>
                    {jobFmt===job.id&&result?.resume&&<div style={{marginTop:12,padding:14,background:"#f8fafc",borderRadius:8,border:"1px solid #e2e8f0"}}><FormatPicker resume={result.resume} selected={jobFmtSel} onSelect={setJobFmtSel} onDownload={f=>downloadResume(result.resume,f)}/></div>}
                  </div>
                  <ScoreRing score={job.match} size={46}/>
                </div>
              </motion.div>
            ))}
            {filteredJobs().length>0&&<div style={{textAlign:"center",padding:"16px 0",fontSize:11,color:"#94a3b8"}}>— {filteredJobs().length} jobs shown —</div>}
          </motion.div>
        )}


        {/* ════ DASHBOARD ════ */}
        {tab==="dashboard"&&(
          <motion.div key="dashboard" variants={fadeUp} initial="initial" animate="animate" exit="exit">
            <div style={{marginBottom:20,paddingBottom:16,borderBottom:"1px solid #f1f5f9"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                <div style={{width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,#0d9488,#0891b2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><BarChart3 size={16} color="#fff"/></div>
                <h2 style={{fontSize:22,fontWeight:700,color:"#0f172a",margin:0,letterSpacing:"-0.01em",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Dashboard</h2>
              </div>
              <p style={{color:"#64748b",fontSize:13,marginLeft:42}}>Your career activity at a glance.</p>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:20}}>
              {[
                {label:"CVs Tailored",value:resumeHistory.length||0,icon:"📄",color:"#0d9488"},
                {label:"Jobs Applied",value:apps.filter(a=>a.status!=="Saved").length,icon:"📤",color:"#2563eb"},
                {label:"Saved Jobs",value:apps.filter(a=>a.status==="Saved").length,icon:"⭐",color:"#b45309"},
                {label:"Interviews",value:apps.filter(a=>a.status==="Interview").length,icon:"🎯",color:"#7c3aed"},
                {label:"Offers",value:apps.filter(a=>a.status==="Offer").length,icon:"🎉",color:"#059669"},
                {label:"Avg Match",value:resumeHistory.length>0?Math.round(resumeHistory.reduce((s,r)=>s+(r.ats_score||0),0)/resumeHistory.length)+"%":"—",icon:"📊",color:"#0d9488"},
              ].map((s,i)=>(
                <motion.div key={s.label} initial={{opacity:0,scale:0.92}} animate={{opacity:1,scale:1}} transition={{delay:i*0.07,type:"spring",stiffness:200,damping:20}}>
                <Card hover style={{padding:"16px",marginBottom:0}}>
                  <div style={{width:36,height:36,borderRadius:10,background:s.color+"14",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,marginBottom:10}}>{s.icon}</div>
                  <div style={{fontSize:24,fontWeight:700,color:s.color,lineHeight:1,marginBottom:4,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{s.value}</div>
                  <div style={{fontSize:11,color:"#64748b",fontWeight:500}}>{s.label}</div>
                </Card>
                </motion.div>
              ))}
            </div>

            {result&&result.matchScore>0&&(
              <Card style={{marginBottom:16}}>
                <SLabel>Current Resume Analysis</SLabel>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:12,marginBottom:14}}>
                  {[
                    {label:"ATS Match",score:result.matchScore,color:result.matchScore>=80?"#059669":result.matchScore>=65?"#b45309":"#dc2626"},
                    {label:"Human Appeal",score:result.hiringManagerScore,color:"#7c3aed"},
                    {label:"Rejection Risk",score:result.rejectionRisk?.score,color:result.rejectionRisk?.score>60?"#dc2626":result.rejectionRisk?.score>35?"#b45309":"#059669"},
                  ].map(m=>(
                    <div key={m.label} style={{textAlign:"center",padding:12,background:"#f8fafc",borderRadius:10,border:"1px solid #e2e8f0"}}>
                      <ScoreRing score={m.score} size={56} color={m.color}/>
                      <div style={{fontSize:11,fontWeight:600,color:"#64748b",marginTop:6}}>{m.label}</div>
                    </div>
                  ))}
                  {result.salaryIntelligence?.recommendedAsk&&(
                    <div style={{textAlign:"center",padding:12,background:"rgba(16,185,129,0.06)",borderRadius:10,border:"1px solid rgba(16,185,129,0.15)"}}>
                      <div style={{fontSize:24,fontWeight:700,color:"#059669",lineHeight:1,marginBottom:4}}>{result.salaryIntelligence.recommendedAsk}</div>
                      <div style={{fontSize:11,fontWeight:600,color:"#64748b"}}>Ask for</div>
                      <div style={{fontSize:10,color:"#64748b"}}>{result.salaryIntelligence.marketMin}–{result.salaryIntelligence.marketMax}</div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {(jd&&cv)&&(
              <Card style={{marginBottom:16}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:coverResult?12:0,flexWrap:"wrap",gap:10}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:"#0f172a",marginBottom:2}}>Cover Letter</div>
                    <div style={{fontSize:12,color:"#475569"}}>Auto-written from your JD & CV</div>
                  </div>
                  <button onClick={genCover} disabled={coverLoading} style={{...btn({fontSize:12,padding:"8px 16px"}),opacity:coverLoading?0.6:1}}>{coverLoading?"Writing...":"✉ Generate"}</button>
                </div>
                {coverResult&&!coverResult.error&&(
                  <div>
                    <div style={{fontSize:11,color:"#475569",marginBottom:6}}>Subject: <strong style={{color:"#0f172a"}}>{coverResult.subject}</strong></div>
                    <div style={{background:"#f8fafc",borderRadius:8,padding:14,fontSize:12,color:"#374151",lineHeight:1.8,whiteSpace:"pre-wrap",maxHeight:220,overflowY:"auto",border:"1px solid #e2e8f0"}}>{coverResult.letter}</div>
                    <div style={{display:"flex",gap:8,marginTop:10}}>
                      <button onClick={()=>navigator.clipboard.writeText(coverResult.letter)} style={ghost({fontSize:11,padding:"5px 12px"})}>Copy</button>
                      <button onClick={()=>{const b=new Blob([coverResult.letter],{type:"text/plain"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download="cover_letter.txt";a.click();}} style={ghost({fontSize:11,padding:"5px 12px",color:"#0d9488",borderColor:"rgba(13,148,136,0.3)"})}>⬇ Download</button>
                    </div>
                  </div>
                )}
              </Card>
            )}

            <Card>
              <SLabel>Tailored CVs History</SLabel>
              {historyLoading&&<div style={{textAlign:"center",padding:24}}><div style={{width:20,height:20,border:"2px solid rgba(13,148,136,0.2)",borderTopColor:"#0d9488",borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto"}}/></div>}
              {!historyLoading&&resumeHistory.length===0&&(
                <div style={{textAlign:"center",padding:32}}>
                  <div style={{fontSize:28,marginBottom:8}}>📄</div>
                  <div style={{fontSize:13,color:"#475569",marginBottom:12}}>No tailored CVs yet. Generate one in Builder.</div>
                  <button onClick={()=>setTab("builder")} style={btn({fontSize:12,padding:"8px 18px"})}>Go to Builder →</button>
                </div>
              )}
              {resumeHistory.map((r,i)=>(
                <div key={r.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:i<resumeHistory.length-1?"1px solid #e2e8f0":"none",flexWrap:"wrap",gap:8}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:"#0f172a"}}>{r.job_title||"Untitled"} <span style={{color:"#64748b",fontWeight:400}}>at {r.company||"—"}</span></div>
                    <div style={{fontSize:11,color:"#64748b"}}>{new Date(r.created_at).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    {r.ats_score>0&&<span style={{background:r.ats_score>=80?"rgba(16,185,129,0.1)":r.ats_score>=65?"rgba(245,158,11,0.1)":"rgba(239,68,68,0.1)",color:r.ats_score>=80?"#059669":r.ats_score>=65?"#b45309":"#dc2626",padding:"2px 9px",borderRadius:10,fontSize:11,fontWeight:700}}>{r.ats_score}%</span>}
                    <button onClick={()=>{setResult(r.content);setTab("builder");setTimeout(()=>ref.current?.scrollIntoView({behavior:"smooth"}),200);}} style={ghost({fontSize:11,padding:"5px 10px",color:"#0d9488",borderColor:"rgba(13,148,136,0.3)"})}>Load</button>
                    {r.content?.resume&&<button onClick={()=>downloadResume(r.content.resume,"apex")} style={ghost({fontSize:11,padding:"5px 10px"})}>⬇</button>}
                  </div>
                </div>
              ))}
            </Card>

            {/* ── APPLICATION TRACKER (merged from Tracker tab) ── */}
            <div style={{marginTop:24,marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"linear-gradient(135deg,#7c3aed,#6d28d9)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Briefcase size={14} color="#fff"/></div>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:"#0f172a",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Application Tracker</div>
                  <div style={{fontSize:11,color:"#64748b"}}>{user?"Synced to your account.":"Sign in to save permanently."}</div>
                </div>
              </div>
              {!user&&<button onClick={()=>{setAuthMode("signup");setShowAuth(true);}} style={btn({fontSize:11,padding:"6px 14px"})}>Sign in →</button>}
            </div>

            {/* Tracker stat tiles */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10,marginBottom:16}}>
              {[
                {label:"Applied",value:apps.filter(a=>a.status!=="Saved").length,color:"#0d9488",icon:"📤"},
                {label:"Saved",value:apps.filter(a=>a.status==="Saved").length,color:"#64748b",icon:"⭐"},
                {label:"Interview",value:apps.filter(a=>a.status==="Interview").length,color:"#b45309",icon:"🎯"},
                {label:"Offers",value:apps.filter(a=>a.status==="Offer").length,color:"#059669",icon:"🎉"},
                {label:"Rejected",value:apps.filter(a=>a.status==="Rejected").length,color:"#dc2626",icon:"✗"},
              ].map((s,i)=>(
                <motion.div key={s.label} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.05,type:"spring",stiffness:220,damping:22}}>
                <Card hover style={{padding:"12px 14px",marginBottom:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:6}}>
                    <span style={{fontSize:15}}>{s.icon}</span>
                    <div style={{fontSize:10,color:"#64748b",fontWeight:600,letterSpacing:0.8,textTransform:"uppercase"}}>{s.label}</div>
                  </div>
                  <div style={{fontSize:26,fontWeight:700,color:s.color,fontFamily:"'Plus Jakarta Sans',sans-serif",lineHeight:1}}>{s.value}</div>
                </Card>
                </motion.div>
              ))}
            </div>

            {/* Kanban board */}
            {apps.length===0?(
              <Card style={{textAlign:"center",padding:40}}>
                <div style={{fontSize:36,marginBottom:10}}>📋</div>
                <div style={{fontSize:15,fontWeight:600,color:"#64748b",marginBottom:4}}>No applications yet</div>
                <div style={{fontSize:13,color:"#94a3b8",marginBottom:16}}>Apply or save jobs from the Jobs tab</div>
                <button onClick={()=>setTab("jobs")} style={btn({fontSize:12,padding:"8px 18px"})}>Browse Jobs →</button>
              </Card>
            ):(
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:12}}>
                {["Saved","Applied","Interview","Offer","Rejected"].map(status=>{
                  const col=STATUS_DARK[status];
                  const colApps=apps.filter(a=>a.status===status);
                  return (
                    <div key={status}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10,padding:"6px 10px",borderRadius:8,background:col.bg,border:`1px solid ${col.border}`}}>
                        <span style={{width:7,height:7,borderRadius:"50%",background:col.dot,flexShrink:0}}/>
                        <span style={{fontSize:11,fontWeight:700,color:col.text,flex:1}}>{status}</span>
                        <span style={{fontSize:11,fontWeight:600,color:col.dot,background:"rgba(255,255,255,0.7)",borderRadius:10,padding:"1px 7px"}}>{colApps.length}</span>
                      </div>
                      {colApps.map(app=>(
                        <motion.div key={app.id} layout initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}}
                          style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:"12px",marginBottom:8,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                          <div style={{fontSize:12,fontWeight:600,color:"#0f172a",marginBottom:2,lineHeight:1.3}}>{app.title}</div>
                          <div style={{fontSize:11,color:"#475569",marginBottom:8}}>{app.company}</div>
                          <PBadge platform={app.platform}/>
                          {app.match>0&&<div style={{display:"flex",alignItems:"center",gap:4,marginTop:6}}><span style={{fontSize:10,color:"#64748b"}}>Match:</span><span style={{fontSize:11,fontWeight:700,color:app.match>=80?"#059669":app.match>=65?"#b45309":"#dc2626"}}>{app.match}%</span></div>}
                          <div style={{display:"flex",gap:4,marginTop:8,flexWrap:"wrap"}}>
                            {["Applied","Interview","Offer","Rejected"].filter(s=>s!==status).slice(0,2).map(s=>(
                              <button key={s} onClick={()=>{setApps(prev=>prev.map(a=>a.id===app.id?{...a,status:s}:a));if(user)updateApplicationStatus(app.id,s);}}
                                style={{background:"#f8fafc",border:"1px solid #e2e8f0",color:"#64748b",borderRadius:5,padding:"2px 7px",fontSize:9,fontWeight:600,cursor:"pointer",transition:"all 0.12s"}}
                                onMouseEnter={e=>e.currentTarget.style.borderColor="#0d9488"}
                                onMouseLeave={e=>e.currentTarget.style.borderColor="#e2e8f0"}>
                                →{s}
                              </button>
                            ))}
                            <button onClick={()=>setApps(prev=>prev.filter(a=>a.id!==app.id))}
                              style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",color:"#dc2626",borderRadius:5,padding:"2px 7px",fontSize:9,fontWeight:600,cursor:"pointer"}}>✕</button>
                          </div>
                        </motion.div>
                      ))}
                      {colApps.length===0&&<div style={{border:"1.5px dashed #e2e8f0",borderRadius:10,padding:"14px",textAlign:"center",fontSize:11,color:"#cbd5e1"}}>Empty</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ════ INTERVIEW ════ */}
        {tab==="interview"&&(
          <InterviewTab
            jd={jd} cv={cv}
            intResult={intResult} intLoading={intLoading} genInterview={genInterview}
            simState={simState} setSimState={setSimState}
            simInput={simInput} setSimInput={setSimInput}
            simLoading={simLoading} startSimulator={startSimulator} submitSimAnswer={submitSimAnswer}
            simEndRef={simEndRef} btn={btn} ghost={ghost}
          />
        )}

        {/* ════ AGENT ════ */}
        {tab==="agent"&&(
          <AgentTab cv={cv} btn={btn} ghost={ghost} showToast={showToast} user={user} setApps={setApps}/>
        )}

        {/* ════ PLANS ════ */}
        {tab==="plans"&&(
          <motion.div key="plans" variants={fadeUp} initial="initial" animate="animate" exit="exit">
            <div style={{marginBottom:20,paddingBottom:16,borderBottom:"1px solid #f1f5f9"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                <div style={{width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,#0d9488,#0891b2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><CreditCard size={16} color="#fff"/></div>
                <h2 style={{fontSize:22,fontWeight:700,color:"#0f172a",margin:0,letterSpacing:"-0.01em",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Plans & Pricing</h2>
              </div>
              <p style={{color:"#64748b",fontSize:13,marginLeft:42}}>Choose the plan that fits your job search.</p>
            </div>
            {/* Pricing cards — 3 col: Free | Pro | Agent */}
            <style>{`
              @media(max-width:700px){.pricing-grid{grid-template-columns:1fr!important}}
              @media(max-width:900px) and (min-width:701px){.pricing-grid{grid-template-columns:repeat(2,1fr)!important}}
            `}</style>
            <div className="pricing-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,maxWidth:900,margin:"0 auto",alignItems:"start",paddingTop:20}}>
              {[
                {
                  name:"Free",price:"£0",period:"forever",
                  accent:"#64748b",bg:"#ffffff",border:"#e2e8f0",
                  features:["2 resumes / month","ATS score","5 job searches / day","1 cover letter","Classic template only"],
                  cta:"Current Plan",active:true,delay:0,
                },
                {
                  name:"Pro",price:"£9",period:"/month",
                  accent:"#0d9488",bg:"#f0fdfa",border:"rgba(13,148,136,0.3)",badge:"Most Popular",
                  features:["Unlimited resumes","26 premium templates","Salary intelligence + script","Interview prep & simulator","Resume history","Unlimited job searches","Unlimited cover letters","Persistent tracker"],
                  cta:"Upgrade to Pro →",active:false,delay:0.08,
                },
                {
                  name:"Agent",price:"Beta",period:"free for now",
                  accent:"#7c3aed",bg:"#faf5ff",border:"rgba(124,58,237,0.25)",badge:"🤖 ULTRA",badgeGrad:"linear-gradient(135deg,#7c3aed,#dc2626)",
                  features:["Everything in Pro","24/7 autonomous job hunter","Scans 160+ company job pages","AI evaluates every job for you","Auto-tailored CV per match","Daily shortlist at 8am","Autopilot after 7 days","Runs locally — your data stays private"],
                  cta:"⬇ Download Agent (Beta)",active:false,delay:0.16,isAgent:true,
                },
              ].map(plan=>(
                <motion.div key={plan.name} className="plan-card" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:plan.delay,duration:0.3}}
                  style={{background:plan.bg,border:`1.5px solid ${plan.border}`,borderRadius:20,padding:"28px 22px",position:"relative",display:"flex",flexDirection:"column",
                    boxShadow:plan.badge
                      ? plan.isAgent
                        ? "0 0 0 1px rgba(124,58,237,0.12),0 12px 40px rgba(124,58,237,0.1)"
                        : "0 0 0 1px rgba(13,148,136,0.12),0 12px 40px rgba(13,148,136,0.1)"
                      : "0 1px 3px rgba(0,0,0,0.04),0 4px 16px rgba(0,0,0,0.04)"}}>
                  {plan.badge&&(
                    <div style={{position:"absolute",top:-13,left:"50%",transform:"translateX(-50%)",background:plan.badgeGrad||"linear-gradient(135deg,#0d9488,#0891b2)",color:"#fff",fontSize:10,fontWeight:700,padding:"4px 14px",borderRadius:20,letterSpacing:0.8,whiteSpace:"nowrap",boxShadow:plan.isAgent?"0 2px 8px rgba(124,58,237,0.35)":"0 2px 8px rgba(13,148,136,0.3)"}}>
                      {plan.badge}
                    </div>
                  )}
                  <div style={{marginBottom:18}}>
                    <div style={{fontSize:12,fontWeight:700,color:plan.accent,letterSpacing:0.8,textTransform:"uppercase",marginBottom:8}}>{plan.name}</div>
                    <div style={{display:"flex",alignItems:"baseline",gap:4,marginBottom:2}}>
                      <span style={{fontSize:34,fontWeight:700,color:"#0f172a",lineHeight:1,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{plan.price}</span>
                      <span style={{fontSize:13,color:"#64748b"}}>{plan.period}</span>
                    </div>
                  </div>
                  <div style={{flex:1,marginBottom:22}}>
                    {plan.features.map((f,i)=>(
                      <div key={f} style={{display:"flex",gap:9,fontSize:12.5,color:"#374151",padding:"6px 0",alignItems:"flex-start",borderBottom:i<plan.features.length-1?"1px solid #f1f5f9":"none",lineHeight:1.5}}>
                        <span style={{width:17,height:17,borderRadius:"50%",background:plan.accent+"18",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
                          <span style={{color:plan.accent,fontSize:9,fontWeight:700}}>✓</span>
                        </span>
                        {f}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={plan.isAgent?()=>{const a=document.createElement("a");a.href="/downloads/careeros-agent.zip";a.download="careeros-agent.zip";document.body.appendChild(a);a.click();document.body.removeChild(a);}:undefined}
                    style={{width:"100%",padding:"11px",
                      background:plan.active?"#f1f5f9":plan.isAgent?"linear-gradient(135deg,#7c3aed,#dc2626)":plan.accent==="#0d9488"?"linear-gradient(135deg,#0d9488,#0891b2)":"#f1f5f9",
                      color:plan.active?"#94a3b8":"#fff",border:"none",borderRadius:10,fontSize:13,fontWeight:700,
                      cursor:plan.active?"default":"pointer",letterSpacing:0.2,transition:"opacity 0.15s",
                      boxShadow:plan.isAgent?"0 4px 16px rgba(124,58,237,0.3)":plan.badge&&!plan.isAgent?"0 4px 16px rgba(13,148,136,0.25)":"none"}}>
                    {plan.cta}
                  </button>
                </motion.div>
              ))}
            </div>
            <div style={{marginTop:20,padding:"13px 20px",background:"#f8fafc",borderRadius:12,border:"1px solid #e2e8f0",textAlign:"center",maxWidth:900,margin:"20px auto 0"}}>
              <div style={{fontSize:13,color:"#475569"}}>All plans · No hidden fees · Cancel anytime · <span style={{color:"#0d9488",fontWeight:600,cursor:"pointer"}} onClick={()=>setTab("agent")}>Free Agent beta →</span></div>
            </div>
          </motion.div>
        )}

        {/* ════ TEMPLATES ════ */}
        {tab==="templates"&&(
          <motion.div key="templates" variants={fadeUp} initial="initial" animate="animate" exit="exit">
            <div style={{background:"linear-gradient(135deg,#f0fdfa,#eff6ff)",borderRadius:16,padding:"28px",marginBottom:24,border:"1px solid #e2e8f0",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
              <div style={{fontSize:"clamp(20px,4vw,28px)",fontWeight:700,color:"#0f172a",marginBottom:6,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Resume Templates</div>
              <p style={{fontSize:13,color:"#64748b",maxWidth:520,lineHeight:1.7}}>26 professionally designed templates. Generate your resume in Builder, then pick your style and download.</p>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:20,maxWidth:1100,margin:"0 auto"}}>
              {RESUME_FORMATS.map((f,i)=>{
                const SAMPLE={name:"Alexandra Chen",contact:"alex@email.com • +44 7700 900000 • London",summary:"Strategic programme leader with 12+ years delivering digital transformation across FTSE 100 clients. PRINCE2 Practitioner specialising in portfolio governance and cross-functional delivery teams worth £10M+.",skills:["Portfolio Management","Stakeholder Management","PRINCE2","Agile/Scrum","Risk Management","Budget Control","Change Management","Azure DevOps"],experience:[{title:"Senior Programme Manager",company:"TechCorp UK",period:"2018–Present",bullets:["Led £8M digital transformation reducing delivery time by 35%","Managed 25-person cross-functional team across 4 geographies","Established governance framework improving portfolio predictability by 40%"]},{title:"Project Manager",company:"Consulting Ltd",period:"2015–2018",bullets:["Delivered 12 concurrent projects on time and within budget","Saved £1.2M through vendor renegotiation"]}],education:["MBA — London Business School, 2015","BSc Computer Science — UCL, 2011"],certifications:["PRINCE2 Practitioner","PMP Certified","SAFe Agilist"]};
                return (
                  <motion.div key={f.id} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*0.08}}
                    style={{background:"#ffffff",border:"1px solid #e2e8f0",borderRadius:16,overflow:"hidden",transition:"all 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.05),0 4px 16px rgba(0,0,0,0.04)"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=f.accent+"80";e.currentTarget.style.boxShadow=`0 8px 32px ${f.accent}20`;e.currentTarget.style.transform="translateY(-2px)";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.boxShadow="0 1px 3px rgba(0,0,0,0.05),0 4px 16px rgba(0,0,0,0.04)";e.currentTarget.style.transform="translateY(0)";}}>
                    <div style={{height:5,background:f.accent}}/>
                    {/* Fixed-size preview — iframe is always 760px wide, scaled to 0.42 = 319px displayed */}
                    <div style={{height:252,overflow:"hidden",position:"relative",background:"#f8fafc"}}>
                      <iframe
                        srcDoc={generateResumeHTML(SAMPLE,f.id)}
                        style={{position:"absolute",top:0,left:0,width:"760px",height:"600px",border:"none",background:"#fff",transform:"scale(0.42)",transformOrigin:"top left",pointerEvents:"none"}}
                        title={f.name}
                      />
                      <div style={{position:"absolute",inset:0,cursor:"pointer",background:"linear-gradient(to bottom,transparent 70%,rgba(248,250,252,0.9) 100%)"}} onClick={()=>setTab("builder")}/>
                    </div>
                    <div style={{padding:"14px 16px",borderTop:"1px solid #f1f5f9",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
                      <div style={{minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                          <span style={{fontSize:15}}>{f.icon}</span>
                          <span style={{fontSize:13,fontWeight:700,color:"#0f172a",fontFamily:"'Plus Jakarta Sans',sans-serif",letterSpacing:"-0.01em"}}>{f.name}</span>
                        </div>
                        <div style={{fontSize:11,color:"#64748b",lineHeight:1.4}}>{f.desc}</div>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:4,flexShrink:0}}>
                        <button onClick={()=>setTab("builder")} style={{background:f.accent,color:"#fff",border:"none",borderRadius:7,padding:"6px 14px",fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",letterSpacing:"0.01em"}}>Use →</button>
                        {result?.resume&&<button onClick={()=>downloadResume(result.resume,f.id)} style={{background:"transparent",color:f.accent,border:`1.5px solid ${f.accent}50`,borderRadius:7,padding:"5px 14px",fontSize:11,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>⬇ Download</button>}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            {!result?.resume&&<div style={{marginTop:20,padding:"16px 24px",background:"rgba(13,148,136,0.06)",borderRadius:12,border:"1px solid rgba(13,148,136,0.15)",textAlign:"center"}}>
              <div style={{fontSize:14,color:"#0d9488",fontWeight:600,marginBottom:6}}>Generate your resume first</div>
              <div style={{fontSize:13,color:"#475569",marginBottom:12}}>Go to Builder, paste your CV and a job description, then come back here to download in any template.</div>
              <button onClick={()=>setTab("builder")} style={btn({fontSize:13,padding:"10px 24px"})}>Go to Builder →</button>
            </div>}
          </motion.div>
        )}

        </AnimatePresence>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{borderTop:"1px solid #e2e8f0",background:"#ffffff"}}>
        <div style={{maxWidth:1100,margin:"0 auto",padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>

          {/* Logo + name */}
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <LogoIcon size={18}/>
            <span style={{fontWeight:800,fontSize:14,color:"#0f172a",fontFamily:"'Plus Jakarta Sans',sans-serif",letterSpacing:"-0.02em"}}>CareerOS</span>
            <span style={{color:"#e2e8f0",fontSize:12,margin:"0 2px"}}>·</span>
            <span style={{fontSize:11,color:"#94a3b8"}}>© {new Date().getFullYear()} CareerOS Ltd · London, UK</span>
          </div>

          {/* Company links */}
          <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
            {[
              { label:"About", action:()=>setShowAbout(true) },
              { label:"Contact Us", action:()=>setShowContact(true) },
              { label:"Privacy Policy", action:()=>setShowPrivacy(true) },
              { label:"Terms & Conditions", action:()=>setShowTerms(true) },
            ].map((l,i,arr)=>(
              <span key={l.label} style={{display:"flex",alignItems:"center",gap:6}}>
                <button onClick={l.action}
                  style={{background:"none",border:"none",fontSize:12,color:"#64748b",cursor:"pointer",padding:0,fontWeight:500,transition:"color 0.15s",fontFamily:"inherit"}}
                  onMouseEnter={e=>e.currentTarget.style.color="#0d9488"}
                  onMouseLeave={e=>e.currentTarget.style.color="#64748b"}>
                  {l.label}
                </button>
                {i<arr.length-1&&<span style={{color:"#e2e8f0",fontSize:11}}>·</span>}
              </span>
            ))}
          </div>

          {/* Socials */}
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{display:"flex",gap:6}}>
              {[
                { label:"𝕏", href:"https://twitter.com/careeros_app", title:"X (Twitter)" },
                { label:"💼", href:"https://linkedin.com/company/careeros", title:"LinkedIn" },
              ].map(s=>(
                <a key={s.title} href={s.href} target="_blank" rel="noopener noreferrer" title={s.title}
                  style={{width:26,height:26,borderRadius:7,background:"#f8fafc",border:"1px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,textDecoration:"none",transition:"all 0.15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor="#0d9488";e.currentTarget.style.background="#f0fdfa";}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.background="#f8fafc";}}>
                  {s.label}
                </a>
              ))}
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}
