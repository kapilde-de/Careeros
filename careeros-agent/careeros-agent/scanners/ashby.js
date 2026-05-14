// careeros-agent/scanners/ashby.js
export class AshbyScanner {
  constructor() { this.name = "Ashby"; this.companies = ["openai","anthropic","ramp","linear","watershed","clipboardhealth"]; }
  async scan(criteria) {
    const all = [];
    for (const co of this.companies) {
      try {
        const res = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${co}`, { signal: AbortSignal.timeout(6000) });
        if (!res.ok) continue;
        const data = await res.json();
        for (const j of (data.jobs || []).slice(0, 5)) {
          all.push({
            id: `ashby_${co}_${j.id}`, platform: "ashby",
            title: j.title, company: co, location: j.location || "",
            description: j.descriptionPlain || "", url: j.jobUrl,
          });
        }
      } catch {}
    }
    return all;
  }
}
