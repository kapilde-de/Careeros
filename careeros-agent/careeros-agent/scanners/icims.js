// ════════════════════════════════════════════════════════════════════════
// iCIMS Scanner — covers large enterprises (retail, healthcare, gov)
// iCIMS exposes a JSON feed: https://careers-{co}.icims.com/jobs/search?pr=0&ss=1&in_iframe=1
// Falls back to their public jobs API endpoint
// ════════════════════════════════════════════════════════════════════════

export class ICIMSScanner {
  constructor() {
    this.name = "iCIMS";
    // Format: [display name, iCIMS subdomain prefix, portal ID]
    this.companies = [
      // UK
      { name: "Tesco",             sub: "tesco",            pid: "tesco" },
      { name: "Marks & Spencer",   sub: "marksandspencer",  pid: "marksandspencer" },
      { name: "John Lewis",        sub: "johnlewis",        pid: "johnlewis" },
      { name: "Sainsbury's",       sub: "sainsburys",       pid: "sainsburys" },
      { name: "Boots",             sub: "boots",            pid: "boots" },
      { name: "Primark",           sub: "primark",          pid: "primark" },
      // US
      { name: "Target",            sub: "target",           pid: "target" },
      { name: "Walmart",           sub: "walmart",          pid: "walmart" },
      { name: "CVS Health",        sub: "cvshealth",        pid: "cvshealth" },
      { name: "UnitedHealth",      sub: "unitedhealthgroup",pid: "unitedhealthgroup" },
      { name: "Anthem",            sub: "anthem",           pid: "anthem" },
      { name: "Cigna",             sub: "cigna",            pid: "cigna" },
      { name: "Boeing",            sub: "boeing",           pid: "boeing" },
      { name: "Lockheed Martin",   sub: "lmco",             pid: "lmco" },
      { name: "Raytheon",          sub: "raytheon",         pid: "raytheon" },
      { name: "General Dynamics",  sub: "gdms",             pid: "gdms" },
    ];
  }

  async scan(criteria) {
    const allJobs = [];
    const keywords = criteria.keywords || [];

    for (const co of this.companies) {
      try {
        // iCIMS JSON search endpoint
        const params = new URLSearchParams({
          pr: 0,
          ss: 1,
          in_iframe: 1,
          hireflow: "",
        });
        if (keywords.length > 0) params.set("searchCategory", keywords.join(" "));
        if (criteria.location) params.set("searchLocation", criteria.location);

        const url = `https://careers-${co.sub}.icims.com/jobs/search?${params}&outputtype=json`;

        const res = await fetch(url, {
          headers: {
            "Accept": "application/json, text/plain, */*",
            "User-Agent": "Mozilla/5.0",
          },
          signal: AbortSignal.timeout(12000),
        });

        if (!res.ok) continue;

        let data;
        try {
          data = await res.json();
        } catch {
          // Some iCIMS instances return HTML — skip those
          continue;
        }

        const jobs = data.searchResults || data.jobs || data.positions || [];

        const filtered = keywords.length > 0
          ? jobs.filter(j => keywords.some(k =>
              (j.jobtitle || j.title || "").toLowerCase().includes(k.toLowerCase())
            ))
          : jobs;

        for (const job of filtered.slice(0, 5)) {
          const jobId = job.jobid || job.id || "";
          allJobs.push({
            id: `icims_${co.sub}_${jobId}`,
            platform: "icims",
            title: job.jobtitle || job.title || "Role",
            company: co.name,
            location: job.joblocation || job.location || criteria.location || "Not specified",
            salary: null,
            description: job.jobdescription?.slice(0, 200) || "",
            url: `https://careers-${co.sub}.icims.com/jobs/${jobId}/job`,
            posted: job.postdate || job.dateposted,
          });
        }
      } catch (err) {
        // iCIMS instances vary widely — silently skip
      }
    }

    return allJobs;
  }
}
