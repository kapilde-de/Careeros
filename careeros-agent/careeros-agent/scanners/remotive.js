// ════════════════════════════════════════════════════════════════════════
// Remotive Scanner — Free remote jobs API, no auth required
// ════════════════════════════════════════════════════════════════════════

export class RemotiveScanner {
  constructor() {
    this.name = "Remotive";
    this.baseURL = "https://remotive.com/api/remote-jobs";
  }

  async scan(criteria) {
    const params = new URLSearchParams({
      search: criteria.keywords?.join(" ") || "engineer",
      limit: "30",
    });

    if (criteria.category) params.append("category", criteria.category);

    const response = await fetch(`${this.baseURL}?${params}`);
    if (!response.ok) throw new Error(`Remotive API: ${response.status}`);

    const data = await response.json();
    const jobs = data.jobs || [];

    return jobs.map(j => ({
      id: `remotive_${j.id}`,
      platform: "remotive",
      title: j.title,
      company: j.company_name,
      location: j.candidate_required_location || "Remote",
      salary: j.salary || "Competitive",
      description: this.cleanHTML(j.description || ""),
      url: j.url,
      posted: j.publication_date,
      tags: j.tags || [],
    }));
  }

  cleanHTML(html) {
    return html
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 2000);
  }
}
