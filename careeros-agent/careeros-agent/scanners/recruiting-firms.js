// ════════════════════════════════════════════════════════════════════════
// Recruiting Firms Scanner — major UK PM/IT recruiting agencies
// Uses their public Greenhouse/Lever/Ashby boards where available,
// plus direct JSON feeds
// ════════════════════════════════════════════════════════════════════════

export class RecruitingFirmsScanner {
  constructor() {
    this.name = "Recruiting Firms";
    // Major UK recruiting firms that post PM roles on public ATS
    this.firms = [
      // Greenhouse-hosted
      { name: "Hays", platform: "greenhouse", slug: "hays" },
      { name: "Harvey Nash", platform: "greenhouse", slug: "harveynash" },
      { name: "Eames Consulting", platform: "greenhouse", slug: "eames" },
      { name: "Tenth Revolution", platform: "greenhouse", slug: "tenthrevolution" },
      // Lever-hosted
      { name: "Glocomms", platform: "lever", slug: "glocomms" },
      { name: "Burns Sheehan", platform: "lever", slug: "burnssheehan" },
      { name: "Talent International", platform: "lever", slug: "talentinternational" },
      // Ashby-hosted
      { name: "Noa", platform: "ashby", slug: "noa" },
      { name: "Talentful", platform: "ashby", slug: "talentful" },
    ];
  }

  async fetchGreenhouse(slug, keywords) {
    const res = await fetch(
      `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.jobs || [])
      .filter(j => keywords.some(k => j.title.toLowerCase().includes(k.toLowerCase())))
      .slice(0, 10)
      .map(j => ({
        id: `rf_gh_${slug}_${j.id}`,
        platform: "recruiting_firm",
        title: j.title,
        company: j.company_name || slug,
        location: j.location?.name || "UK",
        description: (j.content || "").replace(/<[^>]+>/g, " ").slice(0, 2000),
        url: j.absolute_url,
        posted: j.updated_at,
        salary: "See listing",
      }));
  }

  async fetchLever(slug, keywords) {
    const res = await fetch(
      `https://api.lever.co/v0/postings/${slug}?mode=json`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return [];
    const jobs = await res.json();
    return (Array.isArray(jobs) ? jobs : [])
      .filter(j => keywords.some(k => j.text.toLowerCase().includes(k.toLowerCase())))
      .slice(0, 10)
      .map(j => ({
        id: `rf_lv_${slug}_${j.id}`,
        platform: "recruiting_firm",
        title: j.text,
        company: j.company || slug,
        location: j.categories?.location || "UK",
        description: (j.descriptionPlain || j.description || "").slice(0, 2000),
        url: j.hostedUrl,
        salary: "See listing",
      }));
  }

  async fetchAshby(slug, keywords) {
    const res = await fetch(
      `https://api.ashbyhq.com/posting-api/job-board/${slug}`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.jobs || [])
      .filter(j => keywords.some(k => j.title.toLowerCase().includes(k.toLowerCase())))
      .slice(0, 10)
      .map(j => ({
        id: `rf_as_${slug}_${j.id}`,
        platform: "recruiting_firm",
        title: j.title,
        company: j.company || slug,
        location: j.location || "UK",
        description: (j.descriptionPlain || "").slice(0, 2000),
        url: j.jobUrl,
        salary: "See listing",
      }));
  }

  async scan(criteria) {
    const keywords = criteria.keywords || ["Programme Manager"];
    const allJobs = [];

    for (const firm of this.firms) {
      try {
        let jobs = [];
        if (firm.platform === "greenhouse") jobs = await this.fetchGreenhouse(firm.slug, keywords);
        else if (firm.platform === "lever") jobs = await this.fetchLever(firm.slug, keywords);
        else if (firm.platform === "ashby") jobs = await this.fetchAshby(firm.slug, keywords);
        allJobs.push(...jobs);
      } catch {}
    }

    return allJobs;
  }
}
