// ════════════════════════════════════════════════════════════════════════
// The Muse Scanner — free API, no key needed
// Project Management category
// ════════════════════════════════════════════════════════════════════════

export class MuseScanner {
  constructor() {
    this.name = "The Muse";
  }

  async scan(criteria) {
    const allJobs = [];
    const categories = ["Project Management", "Operations", "Business Operations"];

    for (const category of categories) {
      try {
        const c = encodeURIComponent(category);
        const url = `https://www.themuse.com/api/public/jobs?category=${c}&level=Senior+Level&level=Mid+Level&page=0&descending=true`;
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) continue;

        const data = await res.json();
        const jobs = data.results || [];

        for (const j of jobs) {
          // Filter by keyword
          const titleMatch = criteria.keywords?.some(k =>
            j.name.toLowerCase().includes(k.toLowerCase())
          );
          if (!titleMatch) continue;

          const location = j.locations?.[0]?.name || "Not specified";
          allJobs.push({
            id: `muse_${j.id}`,
            platform: "muse",
            title: j.name,
            company: j.company?.name || "Unknown",
            location,
            description: j.contents?.replace(/<[^>]+>/g, " ").slice(0, 2000) || "",
            url: j.refs?.landing_page || `https://www.themuse.com/jobs/${j.id}`,
            posted: j.publication_date,
            salary: "See listing",
            tags: j.categories?.map(c => c.name) || [],
          });
        }
      } catch {}
    }

    return allJobs;
  }
}
