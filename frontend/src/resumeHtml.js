export const RESUME_FORMATS = [
  { id:"apex",       name:"Apex",        desc:"Dark commanding header",       icon:"🏔️", accent:"#1e3a5f" },
  { id:"horizon",    name:"Horizon",     desc:"Two-column sidebar",            icon:"🌅", accent:"#0d4f4a" },
  { id:"pinnacle",   name:"Pinnacle",    desc:"Elegant serif & ornaments",     icon:"✦",  accent:"#1e3a8a" },
  { id:"slate",      name:"Slate",       desc:"Bold monochrome impact",        icon:"⬛", accent:"#111827" },
  { id:"prism",      name:"Prism",       desc:"Vibrant gradient modern",       icon:"💎", accent:"#7c3aed" },
  { id:"foundation", name:"Foundation",  desc:"ATS-safe max readability",      icon:"🤖", accent:"#374151" },
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

  // Foundation (ATS)
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
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
}
