// ════════════════════════════════════════════════════════════════════════
// Taleo Scanner — covers large enterprises & Fortune 500
// Oracle Taleo exposes a RESTful API: 
// https://{company}.taleo.net/careersection/rest/jobboard/vacancy/list
// Also supports XML feed at /careersection/{section}/jobsearch.ftl
// ════════════════════════════════════════════════════════════════════════

export class TaleoScanner {
  constructor() {
    this.name = "Taleo";
    // Format: [name, taleo subdomain, career section ID]
    this.companies = [
      // UK & Europe
      { name: "Accenture UK",    sub: "accenture",    section: "CareersSection" },
      { name: "KPMG",            sub: "kpmg",          section: "External" },
      { name: "BAE Systems",     sub: "baesystems",    section: "External" },
      { name: "Hewlett Packard", sub: "hpe",           section: "CareersSection" },
      { name: "SAP",             sub: "sap",           section: "External" },
      { name: "Oracle",          sub: "oracle",        section: "External" },
      { name: "Philips",         sub: "philips",       section: "External" },
      { name: "Ericsson",        sub: "ericsson",      section: "External" },
      { name: "ABB",             sub: "abb",           section: "External" },
      { name: "Schneider",       sub: "schneider-electric", section: "CareersSection" },
      // US
      { name: "AT&T",            sub: "att",           section: "CareersSection" },
      { name: "Verizon",         sub: "verizon",       section: "External" },
      { name: "General Electric",sub: "ge",            section: "CareersSection" },
      { name: "3M",              sub: "3m",            section: "CareersSection" },
      { name: "Honeywell",       sub: "honeywell",     section: "CareersSection" },
      { name: "Caterpillar",     sub: "cat",           section: "CareersSection" },
      { name: "Deere & Company", sub: "deere",         section: "CareersSection" },
      { name: "Pfizer",          sub: "pfizer",        section: "External" },
      { name: "Merck",           sub: "merck",         section: "CareersSection" },
      { name: "Abbott",          sub: "abbott",        section: "CareersSection" },
    ];
  }

  async scan(criteria) {
    const allJobs = [];
    const keywords = criteria.keywords || [];

    for (const co of this.companies) {
      try {
        // Taleo REST API for job listing
        const params = new URLSearchParams({
          multiline: true,
          lang: "en",
        });
        if (keywords.length > 0) params.set("keyword", keywords.join(" "));
        if (criteria.location) params.set("locationId", criteria.location);

        const url = `https://${co.sub}.taleo.net/careersection/rest/jobboard/vacancy/list?${params}`;

        const res = await fetch(url, {
          headers: {
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0",
          },
          signal: AbortSignal.timeout(12000),
        });

        if (!res.ok) continue;

        let data;
        try {
          data = await res.json();
        } catch {
          continue;
        }

        const jobs = data.requisitionList || data.jobs || data.vacancies || [];

        const filtered = keywords.length > 0
          ? jobs.filter(j => keywords.some(k =>
              (j.title || j.jobTitle || "").toLowerCase().includes(k.toLowerCase())
            ))
          : jobs;

        for (const job of filtered.slice(0, 5)) {
          const jobId = job.contestNo || job.jobId || job.id || "";
          allJobs.push({
            id: `taleo_${co.sub}_${jobId}`,
            platform: "taleo",
            title: job.title || job.jobTitle || "Role",
            company: co.name,
            location: job.locationCityCountry || job.location || criteria.location || "Not specified",
            salary: null,
            description: job.jobFamily || job.category || "",
            url: `https://${co.sub}.taleo.net/careersection/${co.section}/jobdetail.ftl?job=${jobId}`,
            posted: job.postingDate || job.openDate,
          });
        }
      } catch (err) {
        // Taleo instances vary by company — silently skip
      }
    }

    return allJobs;
  }
}
