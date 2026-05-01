// ════════════════════════════════════════════════════════════════════════
// CV Generator — tailors CV per job + generates real PDF for upload
// ════════════════════════════════════════════════════════════════════════

import Anthropic from "@anthropic-ai/sdk";
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

export class CVGenerator {
  constructor(config) {
    this.client = new Anthropic({ apiKey: config.anthropicKey });
    this.model = config.model || "claude-sonnet-4-5";
    this.dataDir = config.dataDir;
  }

  async generate(job, cv) {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2500,
      system: "You are an elite resume writer specialising in project management roles. Return only valid JSON.",
      messages: [{
        role: "user",
        content: `Tailor this CV specifically for the job below. Mirror keywords from the JD. Quantify every bullet. Lead with strong action verbs. Make the summary role-specific.

Return ONLY JSON:
{
  "name": "Full Name",
  "contact": "email • phone • location • linkedin",
  "summary": "2-3 sentence hook tailored to THIS specific role and company",
  "skills": ["skill1","skill2","skill3","skill4","skill5","skill6","skill7","skill8","skill9","skill10"],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company",
      "period": "Month Year – Month Year",
      "bullets": [
        "Strong verb + specific initiative + quantified result",
        "Strong verb + specific initiative + quantified result",
        "Strong verb + specific initiative + quantified result"
      ]
    }
  ],
  "education": "Degree | Institution | Year | Certifications (PMP, PRINCE2, etc.)",
  "keyAchievements": ["Top achievement 1 with metric", "Top achievement 2 with metric"]
}

JOB TITLE: ${job.title}
COMPANY: ${job.company}
JOB DESCRIPTION: ${(job.description || "").slice(0, 2000)}

CANDIDATE CV:
${cv.slice(0, 2500)}

Rules: Every bullet must have a verb + action + metric. Mirror the exact keywords from the JD. No clichés. Be specific and quantified.`
      }]
    });

    const text = response.content.map(b => b.text || "").join("");
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  }

  async generateCover(job, cv) {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 800,
      system: "Expert cover letter writer for project management roles. Return only valid JSON.",
      messages: [{
        role: "user",
        content: `Write a compelling, specific cover letter for this application.

Return ONLY JSON:
{
  "subject": "Application for ${job.title} — [Candidate Name]",
  "letter": "3 short paragraphs: (1) Hook — why THIS company and role specifically. (2) Best relevant achievement with metric. (3) Confident close with availability. Max 200 words. British English. No clichés."
}

JOB: ${job.title} at ${job.company}
DESCRIPTION: ${(job.description || "").slice(0, 800)}
CV: ${cv.slice(0, 1200)}`
      }]
    });

    const text = response.content.map(b => b.text || "").join("");
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  }

  // Generate real PDF from tailored CV — returns file path
  async generatePDF(tailoredCV, job) {
    const html = this.buildHTML(tailoredCV);

    let browser;
    try {
      browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle" });

      const fileName = `CV_${(tailoredCV.name || "Resume").replace(/\s+/g, "_")}_${(job.company || "").replace(/\s+/g, "_")}.pdf`;
      const filePath = path.join(this.dataDir, fileName);

      await page.pdf({
        path: filePath,
        format: "A4",
        margin: { top: "20mm", bottom: "20mm", left: "18mm", right: "18mm" },
        printBackground: true,
      });

      console.log(`   📄 PDF generated: ${fileName}`);
      return filePath;

    } finally {
      if (browser) await browser.close();
    }
  }

  buildHTML(cv) {
    const exp = (cv.experience || []).map(e => `
      <div class="exp">
        <div class="exp-header">
          <strong>${e.title}</strong> — ${e.company}
          <span class="period">${e.period}</span>
        </div>
        <ul>${(e.bullets || []).map(b => `<li>${b}</li>`).join("")}</ul>
      </div>`).join("");

    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #1a1a1a; line-height: 1.5; }
      h1 { font-size: 22px; font-weight: 700; color: #0d4f8b; margin-bottom: 2px; }
      .contact { font-size: 10px; color: #555; margin-bottom: 14px; border-bottom: 2px solid #0d4f8b; padding-bottom: 8px; }
      .section { margin-bottom: 12px; }
      .section-title { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #0d4f8b; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; margin-bottom: 7px; }
      .summary { font-size: 11.5px; color: #374151; line-height: 1.7; font-style: italic; }
      .skills { display: flex; flex-wrap: wrap; gap: 4px; }
      .skill { background: #f0f7ff; border: 1px solid #bfdbfe; border-radius: 3px; padding: 2px 8px; font-size: 10px; color: #1e40af; }
      .exp { margin-bottom: 10px; }
      .exp-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 3px; }
      .exp-header strong { font-size: 12px; color: #111827; }
      .period { font-size: 9.5px; color: #6b7280; }
      ul { padding-left: 14px; }
      ul li { font-size: 10.5px; color: #374151; margin-bottom: 2px; line-height: 1.6; }
      .achievements { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
      .ach { background: #f0fdf4; border-left: 3px solid #16a34a; padding: 5px 8px; font-size: 10px; color: #374151; }
      .footer { margin-top: 16px; padding-top: 6px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #9ca3af; text-align: center; }
    </style>
    </head><body>
      <h1>${cv.name || "Candidate"}</h1>
      <div class="contact">${cv.contact || ""}</div>

      ${cv.summary ? `<div class="section"><div class="section-title">Professional Summary</div><div class="summary">${cv.summary}</div></div>` : ""}

      ${(cv.keyAchievements?.length) ? `<div class="section"><div class="section-title">Key Achievements</div><div class="achievements">${cv.keyAchievements.map(a => `<div class="ach">⭐ ${a}</div>`).join("")}</div></div>` : ""}

      <div class="section"><div class="section-title">Core Skills</div><div class="skills">${(cv.skills || []).map(s => `<span class="skill">${s}</span>`).join("")}</div></div>

      <div class="section"><div class="section-title">Experience</div>${exp}</div>

      ${cv.education ? `<div class="section"><div class="section-title">Education & Certifications</div><div style="font-size:11px;color:#374151">${cv.education}</div></div>` : ""}

      <div class="footer">Generated by CareerOS Agent — careeros-rose.vercel.app</div>
    </body></html>`;
  }
}
