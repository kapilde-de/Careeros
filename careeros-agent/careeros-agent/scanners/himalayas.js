// ════════════════════════════════════════════════════════════════════════
// Himalayas Scanner — free API, no key needed, good PM coverage
// ════════════════════════════════════════════════════════════════════════

export class HimalayasScanner {
  constructor() {
    this.name = "Himalayas";
  }

  async scan(criteria) {
    const keywords = criteria.keywords || ["Programme Manager"];
    const allJobs = [];
    const seen = new Set();

    for (const keyword of keywords.slice(0, 3)) {
      try {
        const q = encodeURIComponent(keyword);
        const url = `https://himalayas.app/jobs/api?q=${q}&limit=20`;
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) continue;

        const data = await res.json();
        const jobs = data.jobs || [];

        for (const j of jobs) {
          if (seen.has(j.id)) continue;
          seen.add(j.id);

          allJobs.push({
            id: `him_${j.id}`,
            platform: "himalayas",
            title: j.title,
            company: j.company?.name || "Unknown",
            location: j.location || j.region || "Remote",
            description: j.description?.replace(/<[^>]+>/g, " ").slice(0, 2000) || "",
            url: j.applicationLink || `https://himalayas.app/jobs/${j.id}`,
            posted: j.pubDate,
            salary: j.salaryMin ? `£${j.salaryMin.toLocaleString()} - £${j.salaryMax?.toLocaleString()}` : "See listing",
            tags: j.skills || [],
          });
        }
      } catch {}
    }

    return allJobs;
  }
}
