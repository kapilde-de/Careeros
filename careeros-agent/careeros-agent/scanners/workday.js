// ════════════════════════════════════════════════════════════════════════
// Workday Scanner — covers Fortune 500 & large enterprises
// Workday career pages follow pattern: {company}.wd{n}.myworkdayjobs.com
// Each company exposes a public JSON API for job listings
// ════════════════════════════════════════════════════════════════════════

export class WorkdayScanner {
  constructor() {
    this.name = "Workday";
    // Format: [subdomain, workday-instance, site-path]
    // Find more at: myworkdayjobs.com
    this.companies = [
      // UK & Europe
      { name: "NHS England",      sub: "nhsengland",    wd: "wd3",  path: "NHS_England" },
      { name: "HSBC",             sub: "hsbc",          wd: "wd3",  path: "ExternalCareers" },
      { name: "Barclays",         sub: "barclays",      wd: "wd3",  path: "External" },
      { name: "Lloyds Banking",   sub: "lloydsbankinggroup", wd: "wd3", path: "LloydsBankingGroup" },
      { name: "PwC UK",           sub: "pwc",           wd: "wd3",  path: "Global_Experienced_Careers" },
      { name: "Deloitte UK",      sub: "deloitte",      wd: "wd3",  path: "CRT" },
      { name: "KPMG UK",          sub: "kpmg",          wd: "wd3",  path: "UK_Alumni" },
      { name: "EY",               sub: "ey",            wd: "wd5",  path: "careers" },
      { name: "Rolls Royce",      sub: "rollsroyce",    wd: "wd3",  path: "External" },
      { name: "BP",               sub: "bp",            wd: "wd3",  path: "External_Careers" },
      { name: "Shell",            sub: "shell",         wd: "wd5",  path: "Shell_External_Career_Site" },
      { name: "Vodafone",         sub: "vodafone",      wd: "wd3",  path: "External" },
      { name: "BT Group",         sub: "bt",            wd: "wd3",  path: "External_Vacancies" },
      { name: "Unilever",         sub: "unilever",      wd: "wd3",  path: "External" },
      { name: "AstraZeneca",      sub: "astrazeneca",   wd: "wd3",  path: "External" },
      { name: "GSK",              sub: "gsk",           wd: "wd3",  path: "External" },
      // US Tech & Finance
      { name: "Google",           sub: "google",        wd: "wd5",  path: "Google_External_Career_Site" },
      { name: "Microsoft",        sub: "microsoft",     wd: "wd5",  path: "External" },
      { name: "Amazon",           sub: "amazon",        wd: "wd3",  path: "External_careers" },
      { name: "Salesforce",       sub: "salesforce",    wd: "wd3",  path: "External_Career_Site" },
      { name: "Adobe",            sub: "adobe",         wd: "wd3",  path: "External" },
      { name: "Workday",          sub: "workday",       wd: "wd5",  path: "Workday" },
      { name: "Goldman Sachs",    sub: "goldmansachs",  wd: "wd3",  path: "External_Career_Site" },
      { name: "Morgan Stanley",   sub: "morganstanley", wd: "wd5",  path: "External" },
      { name: "JPMorgan",         sub: "jpmc",          wd: "wd5",  path: "Americas" },
    ];
  }

  async scan(criteria) {
    const allJobs = [];
    const keywords = criteria.keywords || [];

    for (const co of this.companies) {
      try {
        // Workday public API endpoint
        const apiUrl = `https://${co.sub}.${co.wd}.myworkdayjobs.com/wday/cxs/${co.sub}/${co.path}/jobs`;

        const res = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({
            limit: 20,
            offset: 0,
            searchText: keywords.join(" ") || "",
            locations: criteria.location ? [{ id: criteria.location }] : [],
          }),
          signal: AbortSignal.timeout(10000),
        });

        if (!res.ok) continue;

        const data = await res.json();
        const jobs = data.jobPostings || [];

        // Filter by keyword if API didn't filter
        const filtered = keywords.length > 0
          ? jobs.filter(j => keywords.some(k =>
              (j.title || "").toLowerCase().includes(k.toLowerCase())
            ))
          : jobs;

        for (const job of filtered.slice(0, 5)) {
          const jobUrl = `https://${co.sub}.${co.wd}.myworkdayjobs.com/${co.path}/job/${job.externalPath || ""}`;
          allJobs.push({
            id: `workday_${co.sub}_${job.bulletFields?.[0] || job.title}`.replace(/\s+/g, "_"),
            platform: "workday",
            title: job.title || "Role",
            company: co.name,
            location: job.locationsText || criteria.location || "Not specified",
            salary: job.jobReqId ? "See listing" : null,
            description: job.jobPostingId || "",
            url: jobUrl,
            posted: job.postedOn,
          });
        }
      } catch (err) {
        // Workday instances vary — silently skip failures
      }
    }

    return allJobs;
  }
}
