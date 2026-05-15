// ════════════════════════════════════════════════════════════════════════
// SmartRecruiters Scanner — covers mid-market & enterprise
// Public API: https://api.smartrecruiters.com/v1/companies/{company}/postings
// No auth required for public job postings
// ════════════════════════════════════════════════════════════════════════

export class SmartRecruitersScanner {
  constructor() {
    this.name = "SmartRecruiters";
    // Company identifiers used in SmartRecruiters URLs
    this.companies = [
      // UK & Europe
      { name: "Lidl",              id: "Lidl" },
      { name: "Bosch",             id: "BoschGroup" },
      { name: "Siemens",           id: "Siemens" },
      { name: "Aldi",              id: "ALDIRecruitingUK" },
      { name: "Societe Generale",  id: "SocieteGenerale" },
      { name: "BNP Paribas",       id: "BNPParibas" },
      { name: "Capgemini",         id: "Capgemini" },
      { name: "Atos",              id: "Atos" },
      { name: "Adecco",            id: "TheAdeccoGroup" },
      { name: "Randstad",          id: "Randstad" },
      // US
      { name: "LinkedIn",          id: "LinkedIn" },
      { name: "Visa",              id: "Visa" },
      { name: "Comcast",           id: "Comcast" },
      { name: "FedEx",             id: "FedEx" },
      { name: "Lyft",              id: "Lyft" },
      { name: "Twilio",            id: "Twilio" },
      { name: "Zendesk",           id: "Zendesk" },
      { name: "HubSpot",           id: "HubSpotInc" },
      { name: "Okta",              id: "Okta" },
      { name: "Splunk",            id: "Splunk" },
      { name: "DocuSign",          id: "DocuSign" },
      { name: "Cloudflare",        id: "Cloudflare" },
    ];
  }

  async scan(criteria) {
    const allJobs = [];
    const keywords = criteria.keywords || [];

    for (const co of this.companies) {
      try {
        const params = new URLSearchParams({
          limit: 20,
          offset: 0,
        });
        if (keywords.length > 0) params.set("q", keywords.join(" "));
        if (criteria.location) params.set("country", criteria.location);

        const url = `https://api.smartrecruiters.com/v1/companies/${co.id}/postings?${params}`;

        const res = await fetch(url, {
          headers: { "Accept": "application/json" },
          signal: AbortSignal.timeout(10000),
        });

        if (!res.ok) continue;

        const data = await res.json();
        const jobs = data.content || [];

        // Filter by keyword client-side if needed
        const filtered = keywords.length > 0
          ? jobs.filter(j => keywords.some(k =>
              (j.name || "").toLowerCase().includes(k.toLowerCase()) ||
              (j.department?.label || "").toLowerCase().includes(k.toLowerCase())
            ))
          : jobs;

        for (const job of filtered.slice(0, 5)) {
          allJobs.push({
            id: `sr_${co.id}_${job.id}`,
            platform: "smartrecruiters",
            title: job.name || "Role",
            company: co.name,
            location: job.location
              ? [job.location.city, job.location.country].filter(Boolean).join(", ")
              : criteria.location || "Not specified",
            salary: null,
            description: job.department?.label || "",
            url: `https://jobs.smartrecruiters.com/${co.id}/${job.id}`,
            posted: job.releasedDate,
          });
        }
      } catch (err) {
        // Silently skip — company may have private listings
      }
    }

    return allJobs;
  }
}
