export const RESUME_FORMATS = [
  // Original 6
  { id:"apex",       name:"Apex",        desc:"Dark commanding header",       icon:"🏔️", accent:"#1e3a5f" },
  { id:"horizon",    name:"Horizon",     desc:"Two-column sidebar",           icon:"🌅", accent:"#0d4f4a" },
  { id:"pinnacle",   name:"Pinnacle",    desc:"Elegant serif & ornaments",    icon:"✦",  accent:"#1e3a8a" },
  { id:"slate",      name:"Slate",       desc:"Bold monochrome impact",       icon:"⬛", accent:"#111827" },
  { id:"prism",      name:"Prism",       desc:"Vibrant gradient modern",      icon:"💎", accent:"#7c3aed" },
  { id:"foundation", name:"Foundation",  desc:"ATS-safe max readability",     icon:"🤖", accent:"#374151" },
  // New 20
  { id:"obsidian",   name:"Obsidian",    desc:"Jet black luxury executive",   icon:"🖤", accent:"#0a0a0a" },
  { id:"crimson",    name:"Crimson",     desc:"Bold red stripe, commanding",  icon:"🔴", accent:"#b91c1c" },
  { id:"aurora",     name:"Aurora",      desc:"Soft pink-to-blue gradient",   icon:"🌸", accent:"#db2777" },
  { id:"midnight",   name:"Midnight",    desc:"Deep navy with gold accents",  icon:"🌙", accent:"#1e1b4b" },
  { id:"verdant",    name:"Verdant",     desc:"Forest green, clean & fresh",  icon:"🌿", accent:"#166534" },
  { id:"titanium",   name:"Titanium",    desc:"Silver metallic, ultra-pro",   icon:"⚙️", accent:"#374151" },
  { id:"nova",       name:"Nova",        desc:"Cyan tech-forward modern",     icon:"⚡", accent:"#0891b2" },
  { id:"velvet",     name:"Velvet",      desc:"Burgundy luxury, editorial",   icon:"🍷", accent:"#881337" },
  { id:"zenith",     name:"Zenith",      desc:"White space, thin gold lines", icon:"☀️", accent:"#92400e" },
  { id:"eclipse",    name:"Eclipse",     desc:"Dark mode professional",       icon:"🌑", accent:"#6366f1" },
  { id:"cobalt",     name:"Cobalt",      desc:"Electric blue, SaaS-ready",    icon:"💙", accent:"#1d4ed8" },
  { id:"ember",      name:"Ember",       desc:"Warm amber, bold headlines",   icon:"🔥", accent:"#b45309" },
  { id:"mercury",    name:"Mercury",     desc:"Minimal lines, tech-clean",    icon:"🪐", accent:"#6b7280" },
  { id:"glacier",    name:"Glacier",     desc:"Icy blues, crisp two-column",  icon:"🧊", accent:"#0369a1" },
  { id:"onyx",       name:"Onyx",        desc:"Sharp geometric monochrome",   icon:"◼", accent:"#18181b" },
  { id:"ivory",      name:"Ivory",       desc:"Cream & gold, timeless class", icon:"🏛️", accent:"#78350f" },
  { id:"cascade",    name:"Cascade",     desc:"Flowing accents, editorial",   icon:"🌊", accent:"#0c4a6e" },
  { id:"phantom",    name:"Phantom",     desc:"Ghost grey, ultra-subtle",     icon:"👻", accent:"#475569" },
  { id:"solar",      name:"Solar",       desc:"Golden warmth, energetic",     icon:"🌞", accent:"#d97706" },
  { id:"citadel",    name:"Citadel",     desc:"Strong borders, authoritative",icon:"🏰", accent:"#1c1917" },
];

export function generateResumeHTML(resume, format) {
  if (!resume) return `<html><body style="font-family:sans-serif;padding:40px;color:#9ca3af;text-align:center"><p style="margin-top:80px">Generate a resume first</p></body></html>`;
  const r = {
    name: resume.name||"Your Name",
    contact: resume.contact||"email • phone • location",
    summary: resume.summary||"",
    skills: resume.skills||[],
    experience: resume.experience||[],
    education: Array.isArray(resume.education) ? resume.education : (resume.education ? [resume.education] : []),
    certifications: Array.isArray(resume.certifications) ? resume.certifications : (resume.certifications ? resume.certifications.split(/,|\n/).map(s=>s.trim()).filter(Boolean) : []),
  };

  const expHTML = (accent, dot="•", titleColor="#111", coColor="#555") =>
    r.experience.map(e=>`
      <div style="margin-bottom:18px">
        <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:4px;margin-bottom:2px">
          <strong style="font-size:13px;color:${titleColor}">${e.title||""}</strong>
          <span style="font-size:11px;color:#888;font-style:italic">${e.period||""}</span>
        </div>
        <div style="font-size:12px;color:${coColor};margin-bottom:6px;font-weight:500">${e.company||""}</div>
        ${(e.bullets||[]).map(b=>`<div style="font-size:12px;color:#374151;padding-left:16px;position:relative;margin-bottom:4px;line-height:1.5"><span style="position:absolute;left:0;color:${accent};font-weight:700">${dot}</span>${b}</div>`).join("")}
      </div>`).join("");

  const eduHTML = (color="#374151") => r.education.map(e=>`<div style="font-size:12px;color:${color};margin-bottom:4px;line-height:1.5">${e}</div>`).join("");
  const certHTML = (color="#374151", dot="▸") => r.certifications.length
    ? `<div style="margin-top:6px">${r.certifications.map(c=>`<div style="font-size:12px;color:${color};margin-bottom:4px"><span style="color:#888">${dot}</span> ${c}</div>`).join("")}</div>` : "";
  const skillTags = (bg, color, border="none") => r.skills.map(s=>`<span style="display:inline-block;background:${bg};color:${color};border:${border};border-radius:4px;padding:3px 9px;font-size:11px;margin:2px 3px 2px 0">${s}</span>`).join("");

  // ─── APEX ─────────────────────────────────────────────────────────────────
  if (format==="apex") return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Calibri',Arial,sans-serif;background:#fff;color:#1a1a2e;font-size:13px}
    .sec{font-size:9.5px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;color:#1e3a5f;margin:18px 0 7px;padding-bottom:5px;border-bottom:2px solid #1e3a5f;display:flex;align-items:center;gap:8px}
    .sec::after{content:'';flex:1;height:2px;background:linear-gradient(90deg,#1e3a5f22,transparent)}
    .exp-title{font-size:13.5px;font-weight:700;color:#1e3a5f}.exp-meta{font-size:11.5px;color:#64748b;font-style:italic;margin-bottom:5px}
    .bullet{font-size:12px;color:#374151;padding-left:16px;position:relative;margin-bottom:5px;line-height:1.55}
    .bullet::before{content:'▸';position:absolute;left:0;color:#1e3a5f;font-weight:700}
    .tag{display:inline-block;background:#eef2ff;color:#1e3a5f;border:1px solid #c7d2fe;border-radius:4px;padding:3px 10px;font-size:11px;margin:2px 3px 2px 0}
  </style></head><body>
    <div style="background:linear-gradient(135deg,#1e3a5f 0%,#1e4d7b 100%);padding:30px 38px 24px">
      <div style="font-size:30px;font-weight:800;color:#fff;letter-spacing:-0.5px;margin-bottom:6px;line-height:1">${r.name}</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.72)">${r.contact}</div>
    </div>
    <div style="padding:20px 38px 32px">
      <div class="sec">Professional Summary</div><p style="font-size:12.5px;line-height:1.75;color:#374151">${r.summary}</p>
      <div class="sec">Core Skills</div><div>${skillTags("#eef2ff","#1e3a5f","1px solid #c7d2fe")}</div>
      <div class="sec">Experience</div>
      ${r.experience.map(e=>`<div style="margin-bottom:20px"><div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:4px;margin-bottom:3px"><span class="exp-title">${e.title||""}</span><span style="font-size:11px;color:#94a3b8;font-style:italic">${e.period||""}</span></div><div class="exp-meta">${e.company||""}</div>${(e.bullets||[]).map(b=>`<div class="bullet">${b}</div>`).join("")}</div>`).join("")}
      <div class="sec">Education</div>${r.education.map(e=>`<div style="font-size:12px;color:#374151;margin-bottom:5px;padding-left:4px;border-left:3px solid #c7d2fe">${e}</div>`).join("")}
      ${r.certifications.length?`<div class="sec">Certifications</div><div style="display:flex;flex-wrap:wrap;gap:6px">${r.certifications.map(c=>`<span style="background:#f0f9ff;border:1px solid #bae6fd;color:#0369a1;border-radius:20px;padding:4px 12px;font-size:11px;font-weight:600">${c}</span>`).join("")}</div>`:""}
    </div></body></html>`;

  // ─── HORIZON ──────────────────────────────────────────────────────────────
  if (format==="horizon") return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Calibri',sans-serif;display:flex;min-height:100vh;background:#fff}
    .sb{width:32%;background:#0d4f4a;color:#fff;padding:28px 20px;flex-shrink:0}.main{flex:1;padding:28px}
    .sh{font-size:9px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.6);margin:18px 0 6px;padding-bottom:5px;border-bottom:1px solid rgba(255,255,255,0.2)}
    .mh{font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#0d9488;margin:18px 0 6px;padding-bottom:5px;border-bottom:2px solid #e5f9f7}
  </style></head><body>
    <div class="sb">
      <div style="font-size:22px;font-weight:800;margin-bottom:6px;color:#fff">${r.name}</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.65);line-height:1.7">${r.contact.replace(/•/g,"<br>")}</div>
      <div class="sh">Skills</div>${r.skills.map(s=>`<div style="font-size:11px;color:rgba(255,255,255,0.85);padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.1)">${s}</div>`).join("")}
      ${r.certifications.length?`<div class="sh">Certifications</div>${r.certifications.map(c=>`<div style="font-size:11px;color:rgba(255,255,255,0.8);padding:3px 0">${c}</div>`).join("")}`:""}
    </div>
    <div class="main">
      <div class="mh">Profile</div><p style="font-size:12.5px;line-height:1.75;color:#374151">${r.summary}</p>
      <div class="mh">Experience</div>${expHTML("#0d9488","●","#111827","#6b7280")}
      <div class="mh">Education</div>${eduHTML()}
    </div></body></html>`;

  // ─── PINNACLE ─────────────────────────────────────────────────────────────
  if (format==="pinnacle") return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Georgia',serif;background:#fff;color:#1a1a2e;max-width:760px;margin:0 auto;padding:36px 44px}
    .div{display:flex;align-items:center;gap:10px;margin:18px 0 10px}.div::before,.div::after{content:'';flex:1;height:1px;background:#1e3a8a30}
    .dh{font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#1e3a8a;white-space:nowrap}
  </style></head><body>
    <div style="text-align:center;margin-bottom:6px">
      <div style="font-size:30px;font-weight:700;color:#1e3a8a">${r.name}</div>
      <div style="font-size:12px;color:#64748b;margin-top:5px">${r.contact}</div>
      <div style="display:flex;justify-content:center;gap:6px;margin-top:8px;align-items:center">
        <div style="height:1px;width:60px;background:#1e3a8a"></div><div style="width:6px;height:6px;background:#1e3a8a;transform:rotate(45deg)"></div><div style="height:1px;width:60px;background:#1e3a8a"></div>
      </div>
    </div>
    <div class="div"><span class="dh">Professional Summary</span></div><p style="font-size:12.5px;line-height:1.8;color:#374151;font-style:italic">${r.summary}</p>
    <div class="div"><span class="dh">Core Skills</span></div><div>${skillTags("transparent","#1e3a8a","1px solid #1e3a8a50")}</div>
    <div class="div"><span class="dh">Experience</span></div>${expHTML("#1e3a8a","◆","#1e3a8a","#64748b")}
    <div class="div"><span class="dh">Education</span></div>${eduHTML()}
    ${r.certifications.length?`<div class="div"><span class="dh">Certifications</span></div>${certHTML("#374151","◆")}`:""}
  </body></html>`;

  // ─── SLATE ────────────────────────────────────────────────────────────────
  if (format==="slate") return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Arial',sans-serif;background:#fff;color:#111;max-width:760px;margin:0 auto;padding:36px 44px}
    .bar{background:#111;color:#fff;font-size:9px;font-weight:800;letter-spacing:3px;text-transform:uppercase;padding:5px 12px;display:inline-block;margin:20px 0 10px}
  </style></head><body>
    <div style="border-left:6px solid #111;padding-left:16px;margin-bottom:20px">
      <div style="font-size:32px;font-weight:900;color:#111;letter-spacing:-1px;text-transform:uppercase">${r.name}</div>
      <div style="font-size:12px;color:#555;margin-top:6px">${r.contact}</div>
    </div>
    <div class="bar">Summary</div><p style="font-size:12.5px;line-height:1.75;color:#222">${r.summary}</p>
    <div class="bar">Skills</div><div>${skillTags("#f3f4f6","#111","1px solid #d1d5db")}</div>
    <div class="bar">Experience</div>${expHTML("#111","■","#111","#444")}
    <div class="bar">Education</div>${eduHTML("#222")}
    ${r.certifications.length?`<div class="bar">Certifications</div>${certHTML("#222","■")}`:""}
  </body></html>`;

  // ─── PRISM ────────────────────────────────────────────────────────────────
  if (format==="prism") return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Helvetica Neue',Helvetica,sans-serif;background:#fff;color:#111}
    .ph{font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#7c3aed;margin:18px 0 8px;display:flex;align-items:center;gap:8px}
    .ph::after{content:'';flex:1;height:2px;background:linear-gradient(90deg,#7c3aed22,transparent)}
  </style></head><body>
    <div style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 50%,#a855f7 100%);padding:30px 36px 24px">
      <div style="font-size:28px;font-weight:800;color:#fff;letter-spacing:-0.5px;margin-bottom:4px">${r.name}</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.78)">${r.contact}</div>
    </div>
    <div style="padding:20px 36px">
      <div class="ph">Profile</div><p style="font-size:12.5px;line-height:1.75;color:#374151">${r.summary}</p>
      <div class="ph">Skills</div><div>${skillTags("#f5f3ff","#6d28d9","1px solid #ddd6fe")}</div>
      <div class="ph">Experience</div>${expHTML("#7c3aed","◉","#1e1b4b","#6b7280")}
      <div class="ph">Education</div>${eduHTML()}
      ${r.certifications.length?`<div class="ph">Certifications</div>${certHTML("#374151","◉")}`:""}
    </div></body></html>`;

  // ─── FOUNDATION ───────────────────────────────────────────────────────────
  if (format==="foundation") return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Arial',sans-serif;background:#fff;color:#111;max-width:760px;margin:0 auto;padding:36px 44px;font-size:12px;line-height:1.6}
    hr{border:none;border-top:1px solid #333;margin:10px 0}h2{font-size:12px;font-weight:700;text-transform:uppercase;margin:14px 0 4px;letter-spacing:0.5px}
  </style></head><body>
    <div style="font-size:22px;font-weight:700;margin-bottom:3px">${r.name}</div>
    <div style="color:#444;margin-bottom:6px">${r.contact}</div><hr>
    <h2>Summary</h2><p>${r.summary}</p>
    <h2>Skills</h2><p>${r.skills.join(" | ")}</p>
    <h2>Experience</h2>${r.experience.map(e=>`<div style="margin-bottom:12px"><div style="font-weight:700">${e.title} — ${e.company} (${e.period})</div>${(e.bullets||[]).map(b=>`<div style="padding-left:14px">• ${b}</div>`).join("")}</div>`).join("")}
    <h2>Education</h2>${r.education.map(e=>`<div>${e}</div>`).join("")}
    ${r.certifications.length?`<h2>Certifications</h2>${r.certifications.map(c=>`<div>${c}</div>`).join("")}`:""}
  </body></html>`;

  // ─── OBSIDIAN ─────────────────────────────────────────────────────────────
  if (format==="obsidian") return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Helvetica Neue',sans-serif;background:#0a0a0a;color:#e5e5e5}
    .sec{font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#f59e0b;margin:20px 0 8px;display:flex;align-items:center;gap:10px}
    .sec::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,#f59e0b44,transparent)}
    .bullet{font-size:12px;color:#d1d5db;padding-left:14px;position:relative;margin-bottom:5px;line-height:1.6}
    .bullet::before{content:'›';position:absolute;left:0;color:#f59e0b;font-size:14px}
  </style></head><body>
    <div style="padding:32px 40px 24px;border-bottom:1px solid #1f1f1f">
      <div style="font-size:32px;font-weight:900;color:#fff;letter-spacing:-1px;margin-bottom:6px">${r.name}</div>
      <div style="font-size:12px;color:#9ca3af;letter-spacing:0.5px">${r.contact}</div>
    </div>
    <div style="padding:20px 40px 36px">
      <div class="sec">Profile</div><p style="font-size:12.5px;line-height:1.8;color:#d1d5db">${r.summary}</p>
      <div class="sec">Skills</div><div>${r.skills.map(s=>`<span style="display:inline-block;background:#1a1a1a;color:#f59e0b;border:1px solid #292929;border-radius:3px;padding:3px 10px;font-size:11px;margin:2px 3px 2px 0">${s}</span>`).join("")}</div>
      <div class="sec">Experience</div>
      ${r.experience.map(e=>`<div style="margin-bottom:20px"><div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;margin-bottom:3px"><strong style="color:#fff;font-size:13px">${e.title||""}</strong><span style="font-size:11px;color:#6b7280;font-style:italic">${e.period||""}</span></div><div style="font-size:12px;color:#f59e0b;margin-bottom:7px;font-weight:600">${e.company||""}</div>${(e.bullets||[]).map(b=>`<div class="bullet">${b}</div>`).join("")}</div>`).join("")}
      <div class="sec">Education</div>${r.education.map(e=>`<div style="font-size:12px;color:#d1d5db;margin-bottom:4px">${e}</div>`).join("")}
      ${r.certifications.length?`<div class="sec">Certifications</div>${r.certifications.map(c=>`<span style="display:inline-block;border:1px solid #f59e0b44;color:#f59e0b;border-radius:20px;padding:3px 12px;font-size:11px;margin:2px 4px 2px 0">${c}</span>`).join("")}`:""}
    </div></body></html>`;

  // ─── CRIMSON ──────────────────────────────────────────────────────────────
  if (format==="crimson") return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Calibri',sans-serif;background:#fff;display:flex;min-height:100vh}
    .stripe{width:8px;background:linear-gradient(180deg,#b91c1c,#7f1d1d);flex-shrink:0}
    .inner{flex:1;padding:32px 40px}
    .sec{font-size:9.5px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;color:#b91c1c;margin:18px 0 8px;padding-bottom:4px;border-bottom:2px solid #fecaca}
    .tag{display:inline-block;background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;border-radius:3px;padding:3px 10px;font-size:11px;margin:2px 3px 2px 0}
  </style></head><body>
    <div class="stripe"></div>
    <div class="inner">
      <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #f3f4f6">
        <div><div style="font-size:30px;font-weight:800;color:#111;letter-spacing:-0.5px">${r.name}</div></div>
        <div style="text-align:right;font-size:11.5px;color:#6b7280;line-height:1.8">${r.contact.split("•").map(c=>`<div>${c.trim()}</div>`).join("")}</div>
      </div>
      <div class="sec">Profile</div><p style="font-size:12.5px;line-height:1.75;color:#374151">${r.summary}</p>
      <div class="sec">Skills</div><div>${r.skills.map(s=>`<span class="tag">${s}</span>`).join("")}</div>
      <div class="sec">Experience</div>${expHTML("#b91c1c","▸","#111","#4b5563")}
      <div class="sec">Education</div>${eduHTML()}
      ${r.certifications.length?`<div class="sec">Certifications</div>${certHTML("#374151","▸")}`:""}
    </div></body></html>`;

  // ─── AURORA ───────────────────────────────────────────────────────────────
  if (format==="aurora") return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Helvetica Neue',sans-serif;background:#fff;color:#1f2937}
    .sec{font-size:9px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;background:linear-gradient(90deg,#db2777,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:18px 0 8px}
    .line{height:2px;background:linear-gradient(90deg,#db2777,#8b5cf6,transparent);margin-bottom:10px;border-radius:2px}
  </style></head><body>
    <div style="background:linear-gradient(135deg,#fdf2f8 0%,#faf5ff 50%,#eff6ff 100%);padding:30px 38px 24px;border-bottom:3px solid transparent;border-image:linear-gradient(90deg,#db2777,#8b5cf6,#3b82f6) 1">
      <div style="font-size:30px;font-weight:800;letter-spacing:-0.5px;background:linear-gradient(135deg,#db2777,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent">${r.name}</div>
      <div style="font-size:12px;color:#9ca3af;margin-top:6px">${r.contact}</div>
    </div>
    <div style="padding:20px 38px 32px">
      <div class="sec">Profile</div><div class="line"></div><p style="font-size:12.5px;line-height:1.75;color:#374151">${r.summary}</p>
      <div class="sec">Skills</div><div class="line"></div><div>${r.skills.map(s=>`<span style="display:inline-block;background:linear-gradient(135deg,#fdf2f8,#faf5ff);color:#7c3aed;border:1px solid #e9d5ff;border-radius:20px;padding:3px 12px;font-size:11px;margin:2px 4px 2px 0">${s}</span>`).join("")}</div>
      <div class="sec">Experience</div><div class="line"></div>${expHTML("#db2777","◈","#1f2937","#6b7280")}
      <div class="sec">Education</div><div class="line"></div>${eduHTML()}
      ${r.certifications.length?`<div class="sec">Certifications</div><div class="line"></div>${certHTML("#374151","◈")}`:""}
    </div></body></html>`;

  // ─── MIDNIGHT ─────────────────────────────────────────────────────────────
  if (format==="midnight") return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Georgia',serif;background:#fff;color:#1e1b4b}
    .sec{font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#92400e;margin:18px 0 8px;display:flex;align-items:center;gap:8px}
    .sec::before{content:'';width:20px;height:1px;background:#d97706}
    .sec::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,#d9770644,transparent)}
  </style></head><body>
    <div style="background:linear-gradient(135deg,#1e1b4b 0%,#312e81 100%);padding:32px 40px 26px">
      <div style="font-size:29px;font-weight:700;color:#fff;letter-spacing:1px;margin-bottom:8px">${r.name}</div>
      <div style="font-size:11.5px;color:#a5b4fc;letter-spacing:0.5px">${r.contact}</div>
      <div style="margin-top:12px;display:flex;gap:6px">${r.skills.slice(0,5).map(s=>`<span style="background:rgba(255,255,255,0.1);color:#e0e7ff;border-radius:20px;padding:3px 12px;font-size:10.5px">${s}</span>`).join("")}</div>
    </div>
    <div style="padding:20px 40px 32px">
      <div class="sec">Profile</div><p style="font-size:12.5px;line-height:1.8;color:#374151">${r.summary}</p>
      <div class="sec">Skills</div><div>${skillTags("#eef2ff","#3730a3","1px solid #c7d2fe")}</div>
      <div class="sec">Experience</div>${expHTML("#d97706","◆","#1e1b4b","#6b7280")}
      <div class="sec">Education</div>${eduHTML("#374151")}
      ${r.certifications.length?`<div class="sec">Certifications</div>${certHTML("#374151","◆")}`:""}
    </div></body></html>`;

  // ─── VERDANT ──────────────────────────────────────────────────────────────
  if (format==="verdant") return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Calibri',sans-serif;background:#fff;display:flex;min-height:100vh}
    .sb{width:30%;background:#14532d;color:#fff;padding:28px 18px;flex-shrink:0}
    .main{flex:1;padding:28px 32px}
    .sh{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#86efac;margin:16px 0 6px;padding-bottom:4px;border-bottom:1px solid rgba(255,255,255,0.15)}
    .mh{font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#166534;margin:18px 0 8px;padding-bottom:5px;border-bottom:2px solid #bbf7d0}
  </style></head><body>
    <div class="sb">
      <div style="font-size:20px;font-weight:800;color:#fff;margin-bottom:4px;line-height:1.2">${r.name}</div>
      <div style="font-size:10.5px;color:#86efac;line-height:1.8;margin-top:8px">${r.contact.replace(/•/g,"<br>")}</div>
      <div class="sh">Core Skills</div>${r.skills.map(s=>`<div style="font-size:11px;color:rgba(255,255,255,0.85);padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;gap:6px"><span style="color:#4ade80;font-size:8px">●</span>${s}</div>`).join("")}
      ${r.certifications.length?`<div class="sh">Certifications</div>${r.certifications.map(c=>`<div style="font-size:11px;color:rgba(255,255,255,0.8);padding:3px 0">${c}</div>`).join("")}`:""}
    </div>
    <div class="main">
      <div class="mh">Profile</div><p style="font-size:12.5px;line-height:1.75;color:#374151">${r.summary}</p>
      <div class="mh">Experience</div>${expHTML("#166534","●","#14532d","#6b7280")}
      <div class="mh">Education</div>${eduHTML()}
    </div></body></html>`;

  // ─── TITANIUM ─────────────────────────────────────────────────────────────
  if (format==="titanium") return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Helvetica Neue',sans-serif;background:#f8fafc;color:#1e293b}
    .wrap{max-width:760px;margin:0 auto;background:#fff;box-shadow:0 0 0 1px #e2e8f0}
    .sec{font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#64748b;margin:18px 0 8px;display:flex;align-items:center;gap:10px}
    .sec::after{content:'';flex:1;height:1px;background:#e2e8f0}
  </style></head><body><div class="wrap">
    <div style="background:linear-gradient(135deg,#1e293b 0%,#334155 100%);padding:28px 36px 22px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-size:26px;font-weight:700;color:#fff;letter-spacing:0.5px">${r.name}</div>
        <div style="font-size:11px;color:#94a3b8;margin-top:5px">${r.contact}</div>
      </div>
      <div style="text-align:right">${r.skills.slice(0,3).map(s=>`<div style="font-size:10px;color:#cbd5e1;background:rgba(255,255,255,0.07);border-radius:3px;padding:2px 8px;margin-bottom:3px">${s}</div>`).join("")}</div>
    </div>
    <div style="padding:22px 36px 32px">
      <div class="sec">Summary</div><p style="font-size:12.5px;line-height:1.75;color:#475569">${r.summary}</p>
      <div class="sec">Skills</div><div>${skillTags("#f1f5f9","#334155","1px solid #e2e8f0")}</div>
      <div class="sec">Experience</div>${expHTML("#475569","–","#1e293b","#64748b")}
      <div class="sec">Education</div>${eduHTML("#475569")}
      ${r.certifications.length?`<div class="sec">Certifications</div>${certHTML("#475569","–")}`:""}
    </div></div></body></html>`;

  // ─── NOVA ─────────────────────────────────────────────────────────────────
  if (format==="nova") return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Helvetica Neue',sans-serif;background:#fff;color:#0f172a}
    .sec{font-size:9px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:#0891b2;margin:18px 0 8px;padding-left:10px;border-left:3px solid #0891b2}
  </style></head><body>
    <div style="background:#0f172a;padding:28px 38px 22px;display:flex;justify-content:space-between;align-items:flex-end">
      <div>
        <div style="font-size:28px;font-weight:800;color:#fff;letter-spacing:-0.5px">${r.name}</div>
        <div style="font-size:11.5px;color:#38bdf8;margin-top:6px">${r.contact}</div>
      </div>
      <div style="display:flex;gap:4px;flex-wrap:wrap;max-width:280px;justify-content:flex-end">${r.skills.slice(0,6).map(s=>`<span style="background:#0c4a6e;color:#7dd3fc;border-radius:2px;padding:2px 8px;font-size:10px">${s}</span>`).join("")}</div>
    </div>
    <div style="padding:20px 38px 32px">
      <div class="sec">About</div><p style="font-size:12.5px;line-height:1.75;color:#475569">${r.summary}</p>
      <div class="sec">All Skills</div><div>${skillTags("#ecfeff","#0e7490","1px solid #a5f3fc")}</div>
      <div class="sec">Experience</div>${expHTML("#0891b2","▸","#0f172a","#64748b")}
      <div class="sec">Education</div>${eduHTML("#475569")}
      ${r.certifications.length?`<div class="sec">Certifications</div>${certHTML("#475569","▸")}`:""}
    </div></body></html>`;

  // ─── VELVET ───────────────────────────────────────────────────────────────
  if (format==="velvet") return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Georgia',serif;background:#fff;color:#1c1917}
    .sec{font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#881337;margin:18px 0 8px;display:flex;align-items:center;gap:8px}
    .sec::before{content:'';width:24px;height:2px;background:#881337}
    .sec::after{content:'';flex:1;height:1px;background:#fecdd3}
  </style></head><body>
    <div style="background:linear-gradient(135deg,#4c0519 0%,#881337 100%);padding:32px 40px 26px">
      <div style="font-size:28px;font-weight:700;color:#fff;letter-spacing:1px;font-style:italic">${r.name}</div>
      <div style="font-size:11.5px;color:#fda4af;margin-top:8px;letter-spacing:0.5px">${r.contact}</div>
    </div>
    <div style="background:#fff9f9;padding:6px 40px;border-bottom:1px solid #fecdd3"><div style="display:flex;flex-wrap:wrap;gap:4px;padding:8px 0">${r.skills.slice(0,8).map(s=>`<span style="background:#fff;color:#881337;border:1px solid #fecdd3;border-radius:20px;padding:3px 12px;font-size:10.5px">${s}</span>`).join("")}</div></div>
    <div style="padding:20px 40px 32px">
      <div class="sec">Profile</div><p style="font-size:12.5px;line-height:1.8;color:#44403c;font-style:italic">${r.summary}</p>
      <div class="sec">All Skills</div><div>${skillTags("#fff1f2","#9f1239","1px solid #fecdd3")}</div>
      <div class="sec">Experience</div>${expHTML("#881337","◆","#1c1917","#78716c")}
      <div class="sec">Education</div>${eduHTML("#44403c")}
      ${r.certifications.length?`<div class="sec">Certifications</div>${certHTML("#44403c","◆")}`:""}
    </div></body></html>`;

  // ─── ZENITH ───────────────────────────────────────────────────────────────
  if (format==="zenith") return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Helvetica Neue',sans-serif;background:#fffbf5;color:#1c1917;max-width:760px;margin:0 auto;padding:44px 52px}
    .sec{font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#92400e;margin:22px 0 10px;text-align:center;position:relative}
    .sec::before,.sec::after{content:'';position:absolute;top:50%;width:calc(50% - 70px);height:1px;background:linear-gradient(90deg,transparent,#d9770644)}
    .sec::before{left:0}.sec::after{right:0}
  </style></head><body>
    <div style="text-align:center;padding-bottom:22px;margin-bottom:4px;border-bottom:2px solid #fef3c7">
      <div style="font-size:32px;font-weight:300;color:#1c1917;letter-spacing:3px;text-transform:uppercase">${r.name}</div>
      <div style="width:40px;height:1px;background:#d97706;margin:12px auto 10px"></div>
      <div style="font-size:11.5px;color:#78716c;letter-spacing:1px">${r.contact}</div>
    </div>
    <div class="sec">Profile</div><p style="font-size:12.5px;line-height:1.8;color:#44403c;text-align:center">${r.summary}</p>
    <div class="sec">Skills</div><div style="text-align:center">${r.skills.map(s=>`<span style="display:inline-block;color:#92400e;border-bottom:1px solid #d97706;padding:2px 8px;font-size:11px;margin:2px 5px">${s}</span>`).join("")}</div>
    <div class="sec">Experience</div>${expHTML("#d97706","◆","#1c1917","#78716c")}
    <div class="sec">Education</div>${eduHTML("#44403c")}
    ${r.certifications.length?`<div class="sec">Certifications</div>${certHTML("#44403c","◆")}`:""}
  </body></html>`;

  // ─── ECLIPSE ──────────────────────────────────────────────────────────────
  if (format==="eclipse") return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Helvetica Neue',sans-serif;background:#18181b;color:#e4e4e7}
    .sec{font-size:9px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:#818cf8;margin:18px 0 8px;padding-bottom:6px;border-bottom:1px solid #3f3f46}
    .bullet{font-size:12px;color:#d4d4d8;padding-left:14px;position:relative;margin-bottom:5px;line-height:1.6}
    .bullet::before{content:'▸';position:absolute;left:0;color:#6366f1}
  </style></head><body>
    <div style="padding:28px 38px 22px;background:#09090b;border-bottom:1px solid #27272a">
      <div style="font-size:28px;font-weight:800;color:#fff;letter-spacing:-0.5px">${r.name}</div>
      <div style="font-size:11.5px;color:#71717a;margin-top:6px">${r.contact}</div>
    </div>
    <div style="padding:20px 38px 32px">
      <div class="sec">About</div><p style="font-size:12.5px;line-height:1.75;color:#a1a1aa">${r.summary}</p>
      <div class="sec">Skills</div><div>${r.skills.map(s=>`<span style="display:inline-block;background:#27272a;color:#a5b4fc;border:1px solid #3f3f46;border-radius:4px;padding:3px 10px;font-size:11px;margin:2px 3px 2px 0">${s}</span>`).join("")}</div>
      <div class="sec">Experience</div>
      ${r.experience.map(e=>`<div style="margin-bottom:20px"><div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;margin-bottom:3px"><strong style="color:#e4e4e7;font-size:13px">${e.title||""}</strong><span style="font-size:11px;color:#52525b;font-style:italic">${e.period||""}</span></div><div style="font-size:12px;color:#818cf8;margin-bottom:7px;font-weight:600">${e.company||""}</div>${(e.bullets||[]).map(b=>`<div class="bullet">${b}</div>`).join("")}</div>`).join("")}
      <div class="sec">Education</div>${r.education.map(e=>`<div style="font-size:12px;color:#a1a1aa;margin-bottom:4px">${e}</div>`).join("")}
      ${r.certifications.length?`<div class="sec">Certifications</div>${r.certifications.map(c=>`<span style="display:inline-block;border:1px solid #6366f144;color:#818cf8;border-radius:20px;padding:3px 12px;font-size:11px;margin:2px 4px 2px 0">${c}</span>`).join("")}`:""}
    </div></body></html>`;

  // ─── COBALT ───────────────────────────────────────────────────────────────
  if (format==="cobalt") return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Helvetica Neue',sans-serif;background:#fff;color:#1e3a8a}
    .sec{font-size:9.5px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#1d4ed8;margin:18px 0 8px;display:flex;align-items:center;gap:8px}
    .sec::after{content:'';flex:1;height:2px;background:linear-gradient(90deg,#bfdbfe,transparent)}
  </style></head><body>
    <div style="background:linear-gradient(135deg,#1e3a8a,#1d4ed8,#2563eb);padding:28px 38px 22px">
      <div style="font-size:28px;font-weight:800;color:#fff;letter-spacing:-0.5px;margin-bottom:6px">${r.name}</div>
      <div style="font-size:11.5px;color:#bfdbfe">${r.contact}</div>
    </div>
    <div style="background:#eff6ff;padding:10px 38px;border-bottom:1px solid #dbeafe"><div style="display:flex;flex-wrap:wrap;gap:4px;padding:4px 0">${r.skills.slice(0,8).map(s=>`<span style="background:#fff;color:#1d4ed8;border:1px solid #bfdbfe;border-radius:3px;padding:3px 10px;font-size:10.5px;font-weight:600">${s}</span>`).join("")}</div></div>
    <div style="padding:20px 38px 32px">
      <div class="sec">Profile</div><p style="font-size:12.5px;line-height:1.75;color:#374151">${r.summary}</p>
      <div class="sec">All Skills</div><div>${skillTags("#eff6ff","#1e40af","1px solid #bfdbfe")}</div>
      <div class="sec">Experience</div>${expHTML("#1d4ed8","▸","#1e3a8a","#6b7280")}
      <div class="sec">Education</div>${eduHTML("#374151")}
      ${r.certifications.length?`<div class="sec">Certifications</div>${certHTML("#374151","▸")}`:""}
    </div></body></html>`;

  // ─── EMBER ────────────────────────────────────────────────────────────────
  if (format==="ember") return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Calibri',sans-serif;background:#fffbeb;color:#1c1917}
    .wrap{max-width:760px;margin:0 auto;background:#fff}
    .sec{font-size:9.5px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;color:#b45309;margin:18px 0 8px;padding-bottom:5px;border-bottom:2px solid #fde68a}
  </style></head><body><div class="wrap">
    <div style="background:linear-gradient(135deg,#92400e,#b45309,#d97706);padding:30px 38px 24px">
      <div style="font-size:30px;font-weight:800;color:#fff;letter-spacing:-0.5px;margin-bottom:6px">${r.name}</div>
      <div style="font-size:12px;color:#fde68a">${r.contact}</div>
    </div>
    <div style="background:#fffbeb;padding:10px 38px;border-bottom:1px solid #fef3c7"><div style="display:flex;flex-wrap:wrap;gap:4px;padding:4px 0">${r.skills.slice(0,6).map(s=>`<span style="background:#fff;color:#b45309;border:1px solid #fde68a;border-radius:20px;padding:3px 12px;font-size:10.5px">${s}</span>`).join("")}</div></div>
    <div style="padding:20px 38px 32px">
      <div class="sec">Profile</div><p style="font-size:12.5px;line-height:1.75;color:#374151">${r.summary}</p>
      <div class="sec">Skills</div><div>${skillTags("#fffbeb","#92400e","1px solid #fde68a")}</div>
      <div class="sec">Experience</div>${expHTML("#b45309","◈","#1c1917","#78716c")}
      <div class="sec">Education</div>${eduHTML()}
      ${r.certifications.length?`<div class="sec">Certifications</div>${certHTML("#374151","◈")}`:""}
    </div></div></body></html>`;

  // ─── MERCURY ──────────────────────────────────────────────────────────────
  if (format==="mercury") return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Helvetica Neue',sans-serif;background:#fff;color:#111827;max-width:760px;margin:0 auto;padding:0}
    .sec{font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#9ca3af;margin:18px 0 8px}
    .rule{height:1px;background:#f3f4f6;margin-bottom:10px}
  </style></head><body>
    <div style="border-top:4px solid #111827;padding:32px 44px 24px">
      <div style="font-size:28px;font-weight:300;color:#111827;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px">${r.name}</div>
      <div style="font-size:11px;color:#9ca3af;letter-spacing:1px">${r.contact}</div>
    </div>
    <div style="background:#f9fafb;padding:12px 44px;border-top:1px solid #f3f4f6;border-bottom:1px solid #f3f4f6"><div style="display:flex;flex-wrap:wrap;gap:6px">${r.skills.map(s=>`<span style="font-size:11px;color:#6b7280;padding:2px 0;border-bottom:1px solid #e5e7eb;margin-right:12px">${s}</span>`).join("")}</div></div>
    <div style="padding:20px 44px 36px">
      <div class="sec">Profile</div><div class="rule"></div><p style="font-size:12.5px;line-height:1.75;color:#6b7280">${r.summary}</p>
      <div class="sec">Experience</div><div class="rule"></div>${expHTML("#9ca3af","—","#111827","#6b7280")}
      <div class="sec">Education</div><div class="rule"></div>${eduHTML("#6b7280")}
      ${r.certifications.length?`<div class="sec">Certifications</div><div class="rule"></div>${certHTML("#6b7280","—")}`:""}
    </div></body></html>`;

  // ─── GLACIER ──────────────────────────────────────────────────────────────
  if (format==="glacier") return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Calibri',sans-serif;background:#fff;display:flex;min-height:100vh}
    .sb{width:31%;background:linear-gradient(180deg,#0c4a6e,#0369a1);color:#fff;padding:28px 18px;flex-shrink:0}
    .main{flex:1;padding:28px 32px;background:#f0f9ff}
    .sh{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#7dd3fc;margin:16px 0 6px;padding-bottom:4px;border-bottom:1px solid rgba(255,255,255,0.15)}
    .mh{font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#0369a1;margin:18px 0 8px;padding-bottom:5px;border-bottom:2px solid #bae6fd}
  </style></head><body>
    <div class="sb">
      <div style="font-size:21px;font-weight:800;color:#fff;margin-bottom:4px">${r.name}</div>
      <div style="font-size:10.5px;color:#7dd3fc;line-height:1.8;margin-top:8px">${r.contact.replace(/•/g,"<br>")}</div>
      <div class="sh">Skills</div>${r.skills.map(s=>`<div style="font-size:11px;color:rgba(255,255,255,0.85);padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.08)">${s}</div>`).join("")}
      ${r.certifications.length?`<div class="sh">Certifications</div>${r.certifications.map(c=>`<div style="font-size:11px;color:rgba(255,255,255,0.75);padding:3px 0">${c}</div>`).join("")}`:""}
    </div>
    <div class="main">
      <div class="mh">Profile</div><p style="font-size:12.5px;line-height:1.75;color:#374151">${r.summary}</p>
      <div class="mh">Experience</div>${expHTML("#0369a1","●","#0c4a6e","#6b7280")}
      <div class="mh">Education</div>${eduHTML()}
    </div></body></html>`;

  // ─── ONYX ─────────────────────────────────────────────────────────────────
  if (format==="onyx") return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Arial',sans-serif;background:#fff;color:#18181b;max-width:760px;margin:0 auto}
    .sec{font-size:9px;font-weight:900;letter-spacing:4px;text-transform:uppercase;color:#18181b;margin:20px 0 2px}
    .rule{height:3px;background:#18181b;margin-bottom:10px;width:100%}
    .half{height:1px;background:#e4e4e7;margin-bottom:10px}
  </style></head><body>
    <div style="display:grid;grid-template-columns:1fr 1fr;border-bottom:4px solid #18181b">
      <div style="background:#18181b;padding:28px 24px">
        <div style="font-size:26px;font-weight:900;color:#fff;text-transform:uppercase;letter-spacing:0px;line-height:1">${r.name.split(" ")[0]||""}</div>
        <div style="font-size:26px;font-weight:200;color:#a1a1aa;text-transform:uppercase;letter-spacing:2px;line-height:1">${r.name.split(" ").slice(1).join(" ")||""}</div>
      </div>
      <div style="background:#f4f4f5;padding:28px 24px;display:flex;flex-direction:column;justify-content:center">
        <div style="font-size:11px;color:#71717a;line-height:2">${r.contact.split("•").map(c=>`<div>${c.trim()}</div>`).join("")}</div>
      </div>
    </div>
    <div style="padding:24px 32px">
      <div class="sec">Summary</div><div class="rule"></div><p style="font-size:12.5px;line-height:1.75;color:#3f3f46">${r.summary}</p>
      <div class="sec">Skills</div><div class="rule"></div><div>${skillTags("#f4f4f5","#18181b","1px solid #e4e4e7")}</div>
      <div class="sec">Experience</div><div class="rule"></div>${expHTML("#18181b","▪","#18181b","#71717a")}
      <div class="sec">Education</div><div class="half"></div>${eduHTML("#3f3f46")}
      ${r.certifications.length?`<div class="sec">Certifications</div><div class="half"></div>${certHTML("#3f3f46","▪")}`:""}
    </div></body></html>`;

  // ─── IVORY ────────────────────────────────────────────────────────────────
  if (format==="ivory") return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Georgia',serif;background:#fefce8;color:#1c1917;max-width:760px;margin:0 auto;padding:40px 52px}
    .sec{font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#78350f;margin:20px 0 10px;text-align:center;display:flex;align-items:center;gap:8px}
    .sec::before,.sec::after{content:'';flex:1;height:1px;background:#d97706}
  </style></head><body>
    <div style="text-align:center;margin-bottom:24px;padding-bottom:20px;border-bottom:2px double #d97706">
      <div style="font-size:30px;font-weight:700;color:#1c1917;letter-spacing:2px;text-transform:uppercase">${r.name}</div>
      <div style="width:60px;height:1px;background:#d97706;margin:12px auto 10px"></div>
      <div style="font-size:11.5px;color:#92400e;letter-spacing:1.5px">${r.contact}</div>
    </div>
    <div class="sec">Profile</div><p style="font-size:12.5px;line-height:1.8;color:#44403c;text-align:justify">${r.summary}</p>
    <div class="sec">Skills</div><div style="text-align:center">${r.skills.map(s=>`<span style="display:inline-block;color:#78350f;background:#fef3c7;border:1px solid #fde68a;border-radius:2px;padding:3px 10px;font-size:11px;margin:2px 4px">${s}</span>`).join("")}</div>
    <div class="sec">Experience</div>${expHTML("#d97706","◆","#1c1917","#78716c")}
    <div class="sec">Education</div>${eduHTML("#44403c")}
    ${r.certifications.length?`<div class="sec">Certifications</div>${certHTML("#44403c","◆")}`:""}
  </body></html>`;

  // ─── CASCADE ──────────────────────────────────────────────────────────────
  if (format==="cascade") return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Helvetica Neue',sans-serif;background:#fff;color:#0c4a6e}
    .sec{font-size:9px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;color:#0369a1;margin:18px 0 8px;display:flex;align-items:center;gap:8px}
    .sec::before{content:'';width:4px;height:14px;background:linear-gradient(180deg,#0369a1,#7dd3fc);border-radius:2px}
    .sec::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,#bae6fd,transparent)}
  </style></head><body>
    <div style="background:linear-gradient(135deg,#0c4a6e 0%,#0369a1 60%,#38bdf8 100%);padding:28px 38px 20px;position:relative;overflow:hidden">
      <div style="position:absolute;right:-20px;top:-20px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,0.05)"></div>
      <div style="position:absolute;right:40px;bottom:-40px;width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,0.04)"></div>
      <div style="font-size:28px;font-weight:800;color:#fff;letter-spacing:-0.5px;margin-bottom:6px;position:relative">${r.name}</div>
      <div style="font-size:11.5px;color:#bae6fd;position:relative">${r.contact}</div>
    </div>
    <div style="padding:20px 38px 32px">
      <div class="sec">About</div><p style="font-size:12.5px;line-height:1.75;color:#374151">${r.summary}</p>
      <div class="sec">Skills</div><div>${skillTags("#f0f9ff","#0369a1","1px solid #bae6fd")}</div>
      <div class="sec">Experience</div>${expHTML("#0369a1","▸","#0c4a6e","#6b7280")}
      <div class="sec">Education</div>${eduHTML("#374151")}
      ${r.certifications.length?`<div class="sec">Certifications</div>${certHTML("#374151","▸")}`:""}
    </div></body></html>`;

  // ─── PHANTOM ──────────────────────────────────────────────────────────────
  if (format==="phantom") return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Helvetica Neue',sans-serif;background:#f8fafc;color:#334155;max-width:760px;margin:0 auto}
    .wrap{background:#fff;margin:0;padding:36px 44px;border-left:3px solid #e2e8f0}
    .sec{font-size:9px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:#94a3b8;margin:18px 0 8px}
    .rule{height:1px;background:linear-gradient(90deg,#e2e8f0,transparent);margin-bottom:10px}
  </style></head><body><div class="wrap">
    <div style="margin-bottom:24px">
      <div style="font-size:26px;font-weight:300;color:#1e293b;letter-spacing:1px">${r.name}</div>
      <div style="font-size:11px;color:#94a3b8;margin-top:6px;letter-spacing:0.5px">${r.contact}</div>
      <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:4px">${r.skills.slice(0,5).map(s=>`<span style="font-size:10.5px;color:#64748b;background:#f8fafc;border:1px solid #e2e8f0;border-radius:3px;padding:2px 8px">${s}</span>`).join("")}</div>
    </div>
    <div class="sec">Profile</div><div class="rule"></div><p style="font-size:12.5px;line-height:1.75;color:#475569">${r.summary}</p>
    <div class="sec">Skills</div><div class="rule"></div><div>${skillTags("#f8fafc","#475569","1px solid #e2e8f0")}</div>
    <div class="sec">Experience</div><div class="rule"></div>${expHTML("#94a3b8","–","#1e293b","#64748b")}
    <div class="sec">Education</div><div class="rule"></div>${eduHTML("#475569")}
    ${r.certifications.length?`<div class="sec">Certifications</div><div class="rule"></div>${certHTML("#475569","–")}`:""}
  </div></body></html>`;

  // ─── SOLAR ────────────────────────────────────────────────────────────────
  if (format==="solar") return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Calibri',sans-serif;background:#fff;color:#1c1917}
    .sec{font-size:9.5px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#d97706;margin:18px 0 8px;padding-bottom:4px;border-bottom:3px solid #fef3c7}
  </style></head><body>
    <div style="background:linear-gradient(135deg,#fef3c7 0%,#fde68a 50%,#fbbf24 100%);padding:28px 38px 22px;border-bottom:4px solid #d97706">
      <div style="font-size:30px;font-weight:800;color:#1c1917;letter-spacing:-0.5px;margin-bottom:6px">${r.name}</div>
      <div style="font-size:12px;color:#92400e">${r.contact}</div>
    </div>
    <div style="padding:10px 38px;background:#fffbeb;border-bottom:1px solid #fef3c7"><div style="display:flex;flex-wrap:wrap;gap:4px;padding:6px 0">${r.skills.slice(0,8).map(s=>`<span style="background:#fff;color:#b45309;border:1px solid #fde68a;border-radius:20px;padding:3px 12px;font-size:10.5px;font-weight:600">${s}</span>`).join("")}</div></div>
    <div style="padding:20px 38px 32px">
      <div class="sec">Profile</div><p style="font-size:12.5px;line-height:1.75;color:#374151">${r.summary}</p>
      <div class="sec">Skills</div><div>${skillTags("#fffbeb","#92400e","1px solid #fde68a")}</div>
      <div class="sec">Experience</div>${expHTML("#d97706","◈","#1c1917","#78716c")}
      <div class="sec">Education</div>${eduHTML()}
      ${r.certifications.length?`<div class="sec">Certifications</div>${certHTML("#374151","◈")}`:""}
    </div></body></html>`;

  // ─── CITADEL ──────────────────────────────────────────────────────────────
  if (format==="citadel") return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Arial',sans-serif;background:#fff;color:#1c1917;max-width:760px;margin:0 auto;padding:36px 44px}
    .sec{font-size:9px;font-weight:900;letter-spacing:3px;text-transform:uppercase;color:#fff;background:#1c1917;padding:4px 12px;display:inline-block;margin:20px 0 10px}
  </style></head><body>
    <div style="border:3px solid #1c1917;padding:20px 24px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-size:28px;font-weight:900;color:#1c1917;letter-spacing:-0.5px;text-transform:uppercase">${r.name}</div>
      </div>
      <div style="text-align:right;font-size:11px;color:#57534e;line-height:1.9;border-left:2px solid #1c1917;padding-left:16px">${r.contact.split("•").map(c=>`<div>${c.trim()}</div>`).join("")}</div>
    </div>
    <div class="sec">Summary</div><p style="font-size:12.5px;line-height:1.75;color:#374151;margin-bottom:4px">${r.summary}</p>
    <div class="sec">Skills</div><div>${skillTags("#f5f5f4","#1c1917","2px solid #1c1917")}</div>
    <div class="sec">Experience</div>${expHTML("#1c1917","▪","#1c1917","#57534e")}
    <div class="sec">Education</div>${eduHTML("#374151")}
    ${r.certifications.length?`<div class="sec">Certifications</div>${certHTML("#374151","▪")}`:""}
  </body></html>`;

  // fallback
  return `<html><body style="padding:40px;font-family:sans-serif;color:#999;text-align:center"><p>Template "${format}" not found</p></body></html>`;
}
