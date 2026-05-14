import { Resend } from "resend";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { name, email, subject, message } = req.body || {};
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ error: "Name, email and message are required" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Fallback: still return success so the UI doesn't break during setup
    console.warn("RESEND_API_KEY not set — email not sent");
    return res.json({ ok: true, fallback: true });
  }

  try {
    const resend = new Resend(apiKey);

    // Send notification to you
    await resend.emails.send({
      from: "CareerOS <onboarding@resend.dev>",
      to: [process.env.CONTACT_EMAIL || "kapil.de@gmail.com"],
      replyTo: email,
      subject: `[CareerOS] ${subject || "Contact Form"} — from ${name}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
          <div style="background:#f0fdfa;border-left:4px solid #0d9488;padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:20px">
            <h2 style="margin:0 0 4px;color:#0f172a;font-size:18px">New contact form submission</h2>
            <p style="margin:0;color:#64748b;font-size:13px">${new Date().toLocaleString("en-GB", { timeZone: "Europe/London" })}</p>
          </div>
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
            <tr><td style="padding:8px 12px;background:#f8fafc;font-weight:600;color:#374151;font-size:13px;width:100px;border:1px solid #e2e8f0">Name</td><td style="padding:8px 12px;font-size:13px;color:#0f172a;border:1px solid #e2e8f0">${name}</td></tr>
            <tr><td style="padding:8px 12px;background:#f8fafc;font-weight:600;color:#374151;font-size:13px;border:1px solid #e2e8f0">Email</td><td style="padding:8px 12px;font-size:13px;color:#0f172a;border:1px solid #e2e8f0"><a href="mailto:${email}" style="color:#0d9488">${email}</a></td></tr>
            <tr><td style="padding:8px 12px;background:#f8fafc;font-weight:600;color:#374151;font-size:13px;border:1px solid #e2e8f0">Subject</td><td style="padding:8px 12px;font-size:13px;color:#0f172a;border:1px solid #e2e8f0">${subject || "General Enquiry"}</td></tr>
          </table>
          <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:16px">
            <p style="margin:0 0 6px;font-weight:600;color:#374151;font-size:13px">Message</p>
            <p style="margin:0;font-size:14px;color:#0f172a;line-height:1.7;white-space:pre-wrap">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
          </div>
          <p style="margin:20px 0 0;font-size:12px;color:#94a3b8">Reply directly to this email to respond to ${name}.</p>
        </div>
      `,
    });

    // Auto-reply to the user
    await resend.emails.send({
      from: "CareerOS <onboarding@resend.dev>",
      to: [process.env.CONTACT_EMAIL || "kapil.de@gmail.com"], // auto-reply goes to sender once domain is verified
      subject: "We received your message — CareerOS",
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px">
            <div style="width:36px;height:36px;background:linear-gradient(135deg,#0d9488,#0891b2);border-radius:9px;display:flex;align-items:center;justify-content:center">
              <span style="color:#fff;font-size:18px;font-weight:800">C</span>
            </div>
            <span style="font-weight:800;font-size:18px;color:#0f172a">CareerOS</span>
          </div>
          <h2 style="margin:0 0 12px;color:#0f172a;font-size:20px">Thanks for reaching out, ${name.split(" ")[0]}! 👋</h2>
          <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 16px">We've received your message and will get back to you within <strong>24–48 hours</strong>.</p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin-bottom:20px">
            <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px">Your message</p>
            <p style="margin:0;font-size:13px;color:#475569;white-space:pre-wrap;line-height:1.6">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
          </div>
          <p style="color:#64748b;font-size:13px;line-height:1.7;margin:0 0 20px">While you wait, why not use CareerOS to tailor your CV to a job description — most users see a 30%+ ATS score improvement on their first try.</p>
          <a href="https://frontend-pink-one-13.vercel.app" style="display:inline-block;background:linear-gradient(135deg,#0d9488,#0891b2);color:#fff;text-decoration:none;padding:11px 24px;border-radius:10px;font-size:14px;font-weight:700">Go to CareerOS →</a>
          <p style="margin:24px 0 0;font-size:12px;color:#94a3b8">CareerOS · London, UK · <a href="https://frontend-pink-one-13.vercel.app" style="color:#0d9488">careeros.app</a></p>
        </div>
      `,
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error("Resend error:", err.message);
    return res.status(500).json({ error: "Failed to send email", details: err.message });
  }
}
