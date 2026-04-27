// careeros-agent/scanners/jobicy.js
export class JobicyScanner {
  constructor() { this.name = "Jobicy"; }
  async scan(criteria) {
    try {
      const res = await fetch(`https://jobicy.com/api/v2/remote-jobs?count=30&tag=${encodeURIComponent(criteria.keywords?.[0] || "engineer")}`);
      const data = await res.json();
      return (data.jobs || []).map(j => ({
        id: `jobicy_${j.id}`, platform: "jobicy",
        title: j.jobTitle, company: j.companyName,
        location: j.jobGeo || "Remote",
        salary: j.annualSalaryMin ? `${j.annualSalaryMin}-${j.annualSalaryMax}` : "Competitive",
        description: (j.jobDescription || "").replace(/<[^>]+>/g, " ").slice(0, 2000),
        url: j.url,
      }));
    } catch { return []; }
  }
}
