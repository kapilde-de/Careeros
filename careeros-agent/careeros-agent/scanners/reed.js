// careeros-agent/scanners/reed.js
export class ReedScanner {
  constructor(apiKey) { this.name = "Reed"; this.apiKey = apiKey; }
  async scan(criteria) {
    try {
      const auth = Buffer.from(`${this.apiKey}:`).toString("base64");
      const res = await fetch(`https://www.reed.co.uk/api/1.0/search?keywords=${encodeURIComponent(criteria.keywords?.join(" ") || "")}&resultsToTake=20`, {
        headers: { Authorization: `Basic ${auth}` }
      });
      const data = await res.json();
      return (data.results || []).map(j => ({
        id: `reed_${j.jobId}`,
        platform: "reed",
        title: j.jobTitle,
        company: j.employerName,
        location: j.locationName,
        salary: j.minimumSalary ? `£${j.minimumSalary}-£${j.maximumSalary}` : "Competitive",
        description: j.jobDescription || "",
        url: j.jobUrl,
      }));
    } catch { return []; }
  }
}
