// ════════════════════════════════════════════════════════════════════════
// Lever Scanner — companies that hire Programme/Project Managers
// ════════════════════════════════════════════════════════════════════════

export class LeverScanner {
  constructor() {
    this.name = "Lever";
    this.companies = [
      "metro-bank", "sky", "bt", "capita",
      "serco", "fujitsu-uk", "cgi", "ntt-data",
      "wipro", "infosys-bpo", "hcl", "dxc",
      "mott-macdonald", "aecom", "arup",
      "accenture", "kpmg", "pwc-uk",
    ];
  }

  async scan(criteria) {
    const all = [];
    for (const co of this.companies) {
      try {
        const res = await fetch(
          `https://api.lever.co/v0/postings/${co}?mode=json`,
          { signal: AbortSignal.timeout(6000) }
        );
        if (!res.ok) continue;
        const jobs = await res.json();

        // Filter by keywords
        const filtered = criteria.keywords?.length > 0
          ? jobs.filter(j => criteria.keywords.some(k =>
              j.text.toLowerCase().includes(k.toLowerCase())
            ))
          : jobs;

        for (const j of filtered.slice(0, 5)) {
          all.push({
            id: `lever_${co}_${j.id}`,
            platform: "lever",
            title: j.text,
            company: co.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
            location: j.categories?.location || "Not specified",
            description: j.descriptionPlain || j.description || "",
            url: j.hostedUrl,
          });
        }
      } catch {}
    }
    return all;
  }
}
