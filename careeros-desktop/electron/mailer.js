const nodemailer = require('nodemailer')

async function sendNotification({ to, smtpUser, smtpPass, subject, job, profile }) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: smtpUser, pass: smtpPass },
  })

  const html = `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <div style="background:#0d9488;color:#fff;padding:16px 24px;border-radius:10px 10px 0 0">
        <h2 style="margin:0;font-size:18px">CareerOS — Job Application Update</h2>
      </div>
      <div style="background:#f7f8fa;padding:24px;border:1px solid #e8eaed;border-top:none;border-radius:0 0 10px 10px">
        <p style="margin:0 0 16px;color:#0f1117">Hi ${profile?.firstName || 'there'},</p>
        <p style="margin:0 0 20px;color:#374151">
          CareerOS has ${subject.startsWith('Applied') ? 'applied on your behalf' : 'an update'} for the following position:
        </p>
        <div style="background:#fff;border:1px solid #e8eaed;border-radius:8px;padding:16px;margin-bottom:20px">
          <div style="font-size:17px;font-weight:600;color:#0f1117;margin-bottom:4px">${job.title}</div>
          <div style="color:#6b7280;margin-bottom:8px">${job.company} · ${job.location || 'Remote'}</div>
          ${job.salary ? `<div style="color:#0d9488;font-weight:500">${job.salary}</div>` : ''}
        </div>
        ${job.url ? `<a href="${job.url}" style="display:inline-block;background:#0d9488;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:500">View Job Posting →</a>` : ''}
        <p style="margin:20px 0 0;color:#9ca3af;font-size:12px">Sent by CareerOS Desktop · Manage your applications in the app</p>
      </div>
    </div>
  `

  await transporter.sendMail({
    from: `"CareerOS" <${smtpUser}>`,
    to,
    subject,
    html,
  })
}

module.exports = { sendNotification }
