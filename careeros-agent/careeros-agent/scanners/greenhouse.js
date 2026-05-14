// ════════════════════════════════════════════════════════════════════════
// Greenhouse Scanner — scrapes Greenhouse ATS pages directly
// Greenhouse has a public JSON API at boards.greenhouse.io/embed/job_board?for={company}
// ════════════════════════════════════════════════════════════════════════

export class GreenhouseScanner {
  constructor() {
    this.name = "Greenhouse";
    // Pre-configured AI/Tech companies on Greenhouse
    this.companies = [
      "anthropic", "openai", "stripe", "scale", "elevenlabs",
      "huggingface", "perplexity", "pinecone", "langchain",
      "retool", "vercel", "linear", "ramp", "notion",
      "figma", "airtable", "github", "cloudflare", "discord",
    ];
  }

  async scan(criteria) {
    const allJobs = [];

    for (const company of this.companies) {
      try {
        const url = `https://boards-api.greenhouse.io/v1/boards/${company}/jobs`;
        const response = await fetch(url, {
          signal: AbortSignal.timeout(8000),
        });

        if (!response.ok) continue;

        const data = await response.json();
        const jobs = data.jobs || [];

        // Filter by keywords if provided
        const filtered = criteria.keywords?.length > 0
          ? jobs.filter(j => criteria.keywords.some(k =>
              j.title.toLowerCase().includes(k.toLowerCase())
            ))
          : jobs;

        for (const job of filtered.slice(0, 5)) {
          allJobs.push({
            id: `gh_${company}_${job.id}`,
            platform: "greenhouse",
            title: job.title,
            company: company.charAt(0).toUpperCase() + company.slice(1),
            location: job.location?.name || "Not specified",
            salary: "See listing",
            description: this.cleanHTML(job.content || ""),
            url: job.absolute_url,
            posted: job.updated_at,
            tags: job.metadata?.map(m => m.value).filter(Boolean) || [],
          });
        }
      } catch (err) {
        // Silently skip companies that fail
      }
    }

    return allJobs;
  }

  cleanHTML(html) {
    return html
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&nbsp;/g, " ")
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 2000);
  }
}
