// careeros-agent/cv-generator.js
import Anthropic from "@anthropic-ai/sdk";

export class CVGenerator {
  constructor(config) {
    this.client = new Anthropic({ apiKey: config.anthropicKey });
    this.model = config.model || "claude-sonnet-4-5";
  }

  async generate(job, cv) {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2500,
      system: "You are an expert resume writer. Return only valid JSON.",
      messages: [{
        role: "user",
        content: `Tailor this CV for the job. Return ONLY JSON:
{"name":"NAME","contact":"email • phone • location","summary":"2-3 sentences hook","skills":["s1","s2","s3","s4","s5","s6","s7","s8"],"experience":[{"title":"Title","company":"Co","period":"dates","bullets":["verb+metric","verb+metric","verb+metric"]}],"education":"Degree | certs"}
JOB: ${job.title} at ${job.company}
JD: ${(job.description || "").slice(0, 1500)}
CV: ${cv.slice(0, 2000)}`
      }]
    });
    const text = response.content.map(b => b.text || "").join("");
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  }

  async generateCover(job, cv) {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 800,
      system: "Cover letter expert. Return only valid JSON.",
      messages: [{
        role: "user",
        content: `Write cover letter. Return ONLY JSON:
{"subject":"Application for [Role]","letter":"3 paragraphs. Hook. Achievement. Close. 200 words max."}
JOB: ${job.title} at ${job.company}
CV: ${cv.slice(0, 1200)}`
      }]
    });
    const text = response.content.map(b => b.text || "").join("");
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  }
}
