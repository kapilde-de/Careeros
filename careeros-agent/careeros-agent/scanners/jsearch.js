// careeros-agent/scanners/jsearch.js
export class JSearchScanner {
  constructor(apiKey) { this.name = "JSearch"; this.apiKey = apiKey; }
  async scan(criteria) {
    try {
      const res = await fetch(`https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(criteria.keywords?.join(" ") || "engineer")}&page=1&num_pages=1`, {
        headers: { "X-RapidAPI-Key": this.apiKey, "X-RapidAPI-Host": "jsearch.p.rapidapi.com" }
      });
      const data = await res.json();
      return (data.data || []).map(j => ({
        id: `jsearch_${j.job_id}`,
        platform: "jsearch",
        title: j.job_title,
        company: j.employer_name,
        location: `${j.job_city || ""}, ${j.job_country || ""}`.trim(),
        salary: j.job_min_salary ? `${j.job_min_salary}-${j.job_max_salary}` : "Competitive",
        description: j.job_description || "",
        url: j.job_apply_link,
      }));
    } catch { return []; }
  }
}
