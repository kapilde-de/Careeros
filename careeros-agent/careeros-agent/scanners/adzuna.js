// careeros-agent/scanners/adzuna.js
export class AdzunaScanner {
  constructor(appId, appKey) {
    this.name = "Adzuna";
    this.appId = appId;
    this.appKey = appKey;
  }
  async scan(criteria) {
    const country = criteria.country || "gb";
    const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${this.appId}&app_key=${this.appKey}&results_per_page=20&what=${encodeURIComponent(criteria.keywords?.join(" ") || "engineer")}&sort_by=date`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      return (data.results || []).map(j => ({
        id: `adzuna_${j.id}`,
        platform: "adzuna",
        title: j.title,
        company: j.company?.display_name || "Unknown",
        location: j.location?.display_name || "",
        salary: j.salary_min ? `£${j.salary_min}-£${j.salary_max}` : "Competitive",
        description: j.description || "",
        url: j.redirect_url,
        posted: j.created,
      }));
    } catch (err) { return []; }
  }
}
