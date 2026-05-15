// ════════════════════════════════════════════════════════════════════════
// Ashby Scanner — companies that hire Programme/Project Managers
// ════════════════════════════════════════════════════════════════════════

export class AshbyScanner {
  constructor() {
    this.name = "Ashby";
    this.companies = [
      "deliveroo", "monzo", "revolut", "starlingbank",
      "checkout", "onfido", "cleo", "tide",
      "zopa", "oaknorth", "curve", "modulr",
      "paddle", "phorest", "beamery", "mimecast",
      "cognitect", "brightpearl", "eigen", "tractable",
    ];
  }

  async scan(criteria) {
    const all = [];
    for (const co of this.companies) {
      try {
        const res = await fetch(
          `https://api.ashbyhq.com/posting-api/job-board/${co}`,
          { signal: AbortSignal.timeout(6000) }
        );
        if (!res.ok) continue;
        const data = await res.json();
        const jobs = data.jobs || [];

        // Filter by keywords
        const filtered = criteria.keywords?.length > 0
          ? jobs.filter(j => criteria.keywords.some(k =>
              j.title.toLowerCase().includes(k.toLowerCase())
            ))
          : jobs;

        for (const j of filtered.slice(0, 5)) {
          all.push({
            id: `ashby_${co}_${j.id}`,
            platform: "ashby",
            title: j.title,
            company: co.charAt(0).toUpperCase() + co.slice(1),
            location: j.location || "Not specified",
            description: j.descriptionPlain || "",
            url: j.jobUrl,
          });
        }
      } catch {}
    }
    return all;
  }
}
