// ════════════════════════════════════════════════════════════════════════
// Recruitee Scanner — covers startups & scale-ups
// Public API: https://{company}.recruitee.com/api/offers/
// No auth required — fully public JSON API
// ════════════════════════════════════════════════════════════════════════

export class RecruiteeScanner {
  constructor() {
    this.name = "Recruitee";
    // Company slugs as they appear in Recruitee URLs
    this.companies = [
      // UK & Europe
      { name: "Monzo",          slug: "monzo" },
      { name: "Revolut",        slug: "revolut" },
      { name: "Wise",           slug: "wise" },
      { name: "OakNorth Bank",  slug: "oaknorth" },
      { name: "Starling Bank",  slug: "starlingbank" },
      { name: "Checkout.com",   slug: "checkout" },
      { name: "Deliveroo",      slug: "deliveroo" },
      { name: "Cazoo",          slug: "cazoo" },
      { name: "Phoebe Health",  slug: "phoebehealth" },
      { name: "Personio",       slug: "personio" },
      { name: "Contentful",     slug: "contentful" },
      { name: "GetYourGuide",   slug: "getyourguide" },
      { name: "HelloFresh",     slug: "hellofresh" },
      { name: "Taxfix",         slug: "taxfix" },
      { name: "N26",            slug: "n26" },
      // US
      { name: "Doist",          slug: "doist" },
      { name: "Close",          slug: "close" },
      { name: "Buffer",         slug: "buffer" },
      { name: "Ghost",          slug: "ghost" },
    ];
  }

  async scan(criteria) {
    const allJobs = [];
    const keywords = criteria.keywords || [];

    for (const co of this.companies) {
      try {
        const url = `https://${co.slug}.recruitee.com/api/offers/`;

        const res = await fetch(url, {
          headers: { "Accept": "application/json" },
          signal: AbortSignal.timeout(10000),
        });

        if (!res.ok) continue;

        const data = await res.json();
        const jobs = data.offers || [];

        // Filter by keywords
        const filtered = keywords.length > 0
          ? jobs.filter(j => keywords.some(k =>
              (j.title || "").toLowerCase().includes(k.toLowerCase()) ||
              (j.department || "").toLowerCase().includes(k.toLowerCase()) ||
              (j.tags || []).some(t => t.toLowerCase().includes(k.toLowerCase()))
            ))
          : jobs;

        // Optionally filter by location
        const locFiltered = criteria.location
          ? filtered.filter(j =>
              !j.city ||
              j.city.toLowerCase().includes(criteria.location.toLowerCase()) ||
              j.country_code?.toLowerCase().includes(criteria.location.toLowerCase().slice(0, 2)) ||
              j.remote === true
            )
          : filtered;

        for (const job of locFiltered.slice(0, 5)) {
          allJobs.push({
            id: `recruitee_${co.slug}_${job.id}`,
            platform: "recruitee",
            title: job.title || "Role",
            company: co.name,
            location: job.city
              ? `${job.city}${job.country_code ? ", " + job.country_code : ""}`
              : (job.remote ? "Remote" : criteria.location || "Not specified"),
            salary: job.min_hours ? null : null,
            description: job.department || "",
            url: `https://${co.slug}.recruitee.com/o/${job.slug || job.id}`,
            posted: job.created_at,
          });
        }
      } catch (err) {
        // Company may no longer use Recruitee or have private board
      }
    }

    return allJobs;
  }
}
