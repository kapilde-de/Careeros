// careeros-agent/scanners/lever.js
export class LeverScanner {
  constructor() { this.name = "Lever"; this.companies = ["netflix","spotify","figma","github","palantir","mistral"]; }
  async scan(criteria) {
    const all = [];
    for (const co of this.companies) {
      try {
        const res = await fetch(`https://api.lever.co/v0/postings/${co}?mode=json`, { signal: AbortSignal.timeout(6000) });
        if (!res.ok) continue;
        const jobs = await res.json();
        for (const j of jobs.slice(0, 5)) {
          all.push({
            id: `lever_${co}_${j.id}`, platform: "lever",
            title: j.text, company: co,
            location: j.categories?.location || "",
            description: j.descriptionPlain || j.description || "",
            url: j.hostedUrl,
          });
        }
      } catch {}
    }
    return all;
  }
}
