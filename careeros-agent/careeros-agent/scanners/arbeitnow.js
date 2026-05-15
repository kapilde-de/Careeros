// ════════════════════════════════════════════════════════════════════════
// Arbeitnow Scanner — free job board API, no key needed
// Covers global + European PM roles
// ════════════════════════════════════════════════════════════════════════

export class ArbeitnowScanner {
  constructor() {
    this.name = "Arbeitnow";
  }

  async scan(criteria) {
    const keywords = criteria.keywords || ["Programme Manager"];
    const allJobs = [];
    const seen = new Set();

    for (const keyword of keywords.slice(0, 4)) {
      try {
        const q = encodeURIComponent(keyword);
        const url = `https://arbeitnow.com/api/job-board-api?search=${q}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) continue;

        const data = await res.json();
        const jobs = data.data || [];

        for (const j of jobs) {
          if (seen.has(j.slug)) continue;
          seen.add(j.slug);

          allJobs.push({
            id: `arb_${j.slug}`,
            platform: "arbeitnow",
            title: j.title,
            company: j.company_name,
            location: j.location || "Remote",
            description: j.description?.replace(/<[^>]+>/g, " ").slice(0, 2000) || "",
            url: j.url,
            posted: j.created_at,
            salary: j.salary || "See listing",
            tags: j.tags || [],
          });
        }
      } catch {}
    }

    return allJobs;
  }
}
