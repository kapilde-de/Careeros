// ════════════════════════════════════════════════════════════════════════
// Job Evaluator — uses Claude to score each job against user's profile
// ════════════════════════════════════════════════════════════════════════

import Anthropic from "@anthropic-ai/sdk";

export class JobEvaluator {
  constructor(config) {
    this.client = new Anthropic({ apiKey: config.anthropicKey });
    this.model = config.model || "claude-sonnet-4-5";
  }

  async evaluate(job, cv) {
    const prompt = `You are an expert career coach evaluating a job match.

JOB:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location || "Not specified"}
Salary: ${job.salary || "Not specified"}
Description: ${(job.description || "").slice(0, 2500)}

CANDIDATE CV:
${cv.slice(0, 2000)}

Evaluate this match. Return ONLY JSON (no markdown):
{
  "matchScore": 78,
  "summary": "1 sentence why this is or isn't a good match",
  "strengths": ["alignment 1", "alignment 2", "alignment 3"],
  "gaps": ["missing skill 1", "missing skill 2"],
  "rejectionRisk": {
    "score": 25,
    "topReason": "main reason recruiter might reject"
  },
  "salaryFit": "BELOW_MARKET / AT_MARKET / ABOVE_MARKET / NOT_DISCLOSED",
  "redFlags": ["concern 1 if any"],
  "recommendApply": true,
  "tailoringHints": ["specific hint for CV", "specific hint 2", "specific hint 3"]
}

Rules:
- matchScore: 0-100 (90+ = excellent, 75-89 = good, 60-74 = decent, <60 = skip)
- rejectionRisk.score: 0-100 (lower is better)
- recommendApply: true if matchScore >= 70 AND rejectionRisk.score <= 40
- Be honest — don't inflate scores`;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1500,
      system: "You are a brutally honest career coach. Return only valid JSON.",
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content.map(b => b.text || "").join("");
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  }

  async batchEvaluate(jobs, cv, concurrency = 3) {
    const results = [];
    for (let i = 0; i < jobs.length; i += concurrency) {
      const batch = jobs.slice(i, i + concurrency);
      const evaluated = await Promise.all(
        batch.map(job => this.evaluate(job, cv).catch(err => ({ error: err.message, job })))
      );
      results.push(...evaluated.map((e, idx) => ({ ...batch[idx], ...e })));
    }
    return results;
  }
}
