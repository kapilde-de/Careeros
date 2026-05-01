// ════════════════════════════════════════════════════════════════════════
// Notifier — real email reports via Gmail SMTP
// Setup: Gmail → Settings → Security → App Passwords → Generate
// ════════════════════════════════════════════════════════════════════════

import nodemailer from "nodemailer";

export class Notifier {
  constructor(config) {
    this.config = config;
    this.transporter = null;

    if (config.gmailUser && config.gmailAppPassword) {
      this.transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: config.gmailUser,
          pass: config.gmailAppPassword, // App password — not your regular Gmail password
        },
      });
    }
  }

  async sendApplicationReport(applications) {
    const total = applications.length;
    const submitted = applications.filter(a => a.status === "submitted");
    const filled = applications.filter(a => a.status === "filled_pending_review");
    const failed = applications.filter(a => a.status === "failed");

    const subject = `🤖 CareerOS Agent — ${submitted.length} applications submitted today`;

    const html = `
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: -apple-system, Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; color: #1a1a1a; background: #f8fafc; }
  .header { background: linear-gradient(135deg, #0d4f8b, #0891b2); color: white; padding: 28px 32px; border-radius: 12px; margin-bottom: 24px; }
  h1 { margin: 0; font-size: 22px; }
  .subtitle { margin: 6px 0 0; opacity: 0.85; font-size: 14px; }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .stat { background: white; border-radius: 10px; padding: 16px; text-align: center; border: 1px solid #e2e8f0; }
  .stat-num { font-size: 28px; font-weight: 800; margin-bottom: 4px; }
  .stat-label { font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .section { background: white; border-radius: 10px; padding: 20px; margin-bottom: 16px; border: 1px solid #e2e8f0; }
  .section h2 { font-size: 14px; font-weight: 700; margin: 0 0 14px; padding-bottom: 8px; border-bottom: 2px solid #f1f5f9; }
  .job-card { padding: 12px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid; }
  .job-card.submitted { background: #f0fdf4; border-color: #16a34a; }
  .job-card.pending { background: #fefce8; border-color: #d97706; }
  .job-card.failed { background: #fef2f2; border-color: #dc2626; }
  .job-title { font-size: 14px; font-weight: 700; margin-bottom: 3px; }
  .job-company { font-size: 12px; color: #6b7280; margin-bottom: 6px; }
  .job-meta { display: flex; gap: 12px; font-size: 11px; flex-wrap: wrap; }
  .badge { padding: 2px 8px; border-radius: 10px; font-weight: 600; }
  .badge.green { background: #dcfce7; color: #16a34a; }
  .badge.yellow { background: #fef9c3; color: #a16207; }
  .badge.red { background: #fee2e2; color: #dc2626; }
  .job-link { font-size: 11px; color: #0891b2; text-decoration: none; margin-top: 4px; display: block; }
  .footer { text-align: center; color: #9ca3af; font-size: 11px; margin-top: 24px; }
</style>
</head>
<body>
  <div class="header">
    <h1>🤖 CareerOS Agent Report</h1>
    <div class="subtitle">${new Date().toLocaleDateString("en-GB", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}</div>
  </div>

  <div class="stats">
    <div class="stat"><div class="stat-num" style="color:#0891b2">${total}</div><div class="stat-label">Jobs Found</div></div>
    <div class="stat"><div class="stat-num" style="color:#16a34a">${submitted.length}</div><div class="stat-label">Submitted</div></div>
    <div class="stat"><div class="stat-num" style="color:#d97706">${filled.length}</div><div class="stat-label">Needs Review</div></div>
    <div class="stat"><div class="stat-num" style="color:#dc2626">${failed.length}</div><div class="stat-label">Failed</div></div>
  </div>

  ${submitted.length > 0 ? `
  <div class="section">
    <h2>✅ Successfully Submitted (${submitted.length})</h2>
    ${submitted.map(a => `
    <div class="job-card submitted">
      <div class="job-title">${a.title}</div>
      <div class="job-company">${a.company} · ${a.location || "Not specified"}</div>
      <div class="job-meta">
        <span class="badge green">Match: ${a.matchScore || "—"}%</span>
        <span class="badge green">✅ Applied</span>
        ${a.salary ? `<span>💰 ${a.salary}</span>` : ""}
      </div>
      ${a.url ? `<a href="${a.url}" class="job-link">View job posting →</a>` : ""}
    </div>`).join("")}
  </div>` : ""}

  ${filled.length > 0 ? `
  <div class="section">
    <h2>⏳ Filled — Awaiting Your Review (${filled.length})</h2>
    <p style="font-size:12px;color:#6b7280;margin-bottom:12px">These forms were filled but not submitted. Open localhost:3939 to review and approve.</p>
    ${filled.map(a => `
    <div class="job-card pending">
      <div class="job-title">${a.title}</div>
      <div class="job-company">${a.company} · ${a.location || "Not specified"}</div>
      <div class="job-meta">
        <span class="badge yellow">Match: ${a.matchScore || "—"}%</span>
        <span class="badge yellow">⏳ Pending review</span>
      </div>
      ${a.url ? `<a href="${a.url}" class="job-link">View job posting →</a>` : ""}
    </div>`).join("")}
  </div>` : ""}

  ${failed.length > 0 ? `
  <div class="section">
    <h2>❌ Could Not Apply (${failed.length})</h2>
    <p style="font-size:12px;color:#6b7280;margin-bottom:12px">These required manual application or had bot protection.</p>
    ${failed.map(a => `
    <div class="job-card failed">
      <div class="job-title">${a.title}</div>
      <div class="job-company">${a.company}</div>
      <div class="job-meta"><span class="badge red">Manual required</span></div>
      ${a.url ? `<a href="${a.url}" class="job-link">Apply manually →</a>` : ""}
    </div>`).join("")}
  </div>` : ""}

  <div class="footer">
    CareerOS Agent · <a href="http://localhost:3939">View Dashboard</a> · careeros-rose.vercel.app
  </div>
</body>
</html>`;

    await this.send(subject, html);
    console.log(`📧 Application report sent to ${this.config.emailTo}`);
  }

  async sendDigest(stats) {
    const subject = `🤖 CareerOS — ${stats.newMatches} new job matches today`;
    const html = `
<html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <div style="background:linear-gradient(135deg,#0d4f8b,#0891b2);color:white;padding:24px;border-radius:10px;margin-bottom:20px">
    <h2 style="margin:0">🤖 CareerOS Daily Digest</h2>
    <p style="margin:6px 0 0;opacity:0.85">${new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"})}</p>
  </div>
  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-bottom:16px">
    <div style="font-size:32px;font-weight:800;color:#16a34a">${stats.newMatches}</div>
    <div style="color:#6b7280;font-size:13px">new matches above your threshold</div>
  </div>
  <p style="color:#374151;font-size:14px">Open <a href="http://localhost:3939" style="color:#0891b2">localhost:3939</a> to review your queue and approve applications.</p>
  <p style="color:#9ca3af;font-size:11px;margin-top:20px">CareerOS Agent · running every ${stats.intervalHours || 4}h</p>
</body></html>`;

    await this.send(subject, html);
    console.log(`📧 Digest sent to ${this.config.emailTo}`);
  }

  async send(subject, html) {
    if (!this.transporter) {
      console.log(`📊 [No email configured] ${subject}`);
      return;
    }
    try {
      await this.transporter.sendMail({
        from: `"CareerOS Agent" <${this.config.gmailUser}>`,
        to: this.config.emailTo,
        subject,
        html,
      });
    } catch (err) {
      console.error("❌ Email failed:", err.message);
      console.log("   → Check your Gmail App Password in .env (GMAIL_USER + GMAIL_APP_PASSWORD)");
    }
  }

  async sendError(err) {
    console.error("⚠️ Agent error:", err.message);
    if (this.transporter) {
      await this.send("❌ CareerOS Agent Error", `<p>Agent error: ${err.message}</p><p>Check terminal for details.</p>`).catch(() => {});
    }
  }
}
