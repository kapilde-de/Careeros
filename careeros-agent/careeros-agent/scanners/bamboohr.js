// ════════════════════════════════════════════════════════════════════════
// BambooHR Scanner — covers SMEs and tech companies
// Public API: https://api.bamboohr.com/api/gateway.php/{company}/v1/applicant_tracking/jobs
// Also: https://{company}.bamboohr.com/jobs/embed2.php (public job board)
// ════════════════════════════════════════════════════════════════════════

export class BambooHRScanner {
  constructor() {
    this.name = "BambooHR";
    // Company subdomains on BambooHR
    this.companies = [
      // Tech & SaaS
      { name: "Zapier",             sub: "zapier" },
      { name: "Calendly",           sub: "calendly" },
      { name: "Loom",               sub: "loom" },
      { name: "Figma",              sub: "figma" },
      { name: "Notion",             sub: "notion" },
      { name: "Airtable",           sub: "airtable" },
      { name: "Front",              sub: "front" },
      { name: "Intercom",           sub: "intercom" },
      { name: "Drift",              sub: "drift" },
      { name: "Pendo",              sub: "pendo" },
      { name: "Amplitude",          sub: "amplitude" },
      { name: "Heap",               sub: "heap" },
      { name: "Miro",               sub: "miro" },
      { name: "Monday.com",         sub: "mondaycom" },
      // UK companies
      { name: "Bulb Energy",        sub: "bulbenergy" },
      { name: "Unmind",             sub: "unmind" },
      { name: "Multiverse",         sub: "multiverse" },
      { name: "Tractable",          sub: "tractable" },
      { name: "Featurespace",       sub: "featurespace" },
      { name: "Paysign",            sub: "paysign" },
    ];
  }

  async scan(criteria) {
    const allJobs = [];
    const keywords = criteria.keywords || [];

    for (const co of this.companies) {
      try {
        // BambooHR public jobs JSON API
        const url = `https://api.bamboohr.com/api/gateway.php/${co.sub}/v1/applicant_tracking/jobs?status=Open`;

        const res = await fetch(url, {
          headers: {
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0",
          },
          signal: AbortSignal.timeout(10000),
        });

        if (!res.ok) continue;

        let jobs = [];
        try {
          const data = await res.json();
          jobs = Array.isArray(data) ? data : (data.result || data.jobs || []);
        } catch {
          continue;
        }

        // Filter by keyword
        const filtered = keywords.length > 0
          ? jobs.filter(j => keywords.some(k =>
              (j.title?.label || j.jobOpeningName || j.name || "").toLowerCase().includes(k.toLowerCase()) ||
              (j.department?.label || "").toLowerCase().includes(k.toLowerCase())
            ))
          : jobs;

        // Filter by location
        const locFiltered = criteria.location
          ? filtered.filter(j =>
              !j.location?.label ||
              j.location.label.toLowerCase().includes(criteria.location.toLowerCase()) ||
              j.isRemote === true
            )
          : filtered;

        for (const job of locFiltered.slice(0, 5)) {
          const jobId = job.id || job.jobOpeningId || "";
          allJobs.push({
            id: `bamboo_${co.sub}_${jobId}`,
            platform: "bamboohr",
            title: job.title?.label || job.jobOpeningName || job.name || "Role",
            company: co.name,
            location: job.location?.label
              ? job.location.label
              : (job.isRemote ? "Remote" : criteria.location || "Not specified"),
            salary: null,
            description: job.department?.label || "",
            url: `https://${co.sub}.bamboohr.com/jobs/view.php?id=${jobId}`,
            posted: job.createdAt || job.datePosted,
          });
        }
      } catch (err) {
        // Company may have private BambooHR setup
      }
    }

    return allJobs;
  }
}
