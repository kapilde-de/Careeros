// ════════════════════════════════════════════════════════════════════════
// RSS Scanner — UK job boards via RSS feeds (no API key needed)
// Covers: Indeed UK, Totaljobs, CWJobs, Guardian Jobs, Jobsite, CV-Library
// ════════════════════════════════════════════════════════════════════════

export class RSSScanner {
  constructor() {
    this.name = "RSS Boards";
  }

  buildFeeds(keywords, location = "London") {
    const kw = keywords.slice(0, 3); // Use top 3 keywords to avoid too many requests
    const loc = encodeURIComponent(location);
    const feeds = [];

    for (const keyword of kw) {
      const q = encodeURIComponent(keyword);
      feeds.push(
        // Indeed UK
        { name: "Indeed UK", url: `https://www.indeed.co.uk/rss?q=${q}&l=${loc}&sort=date` },
        // Totaljobs
        { name: "Totaljobs", url: `https://www.totaljobs.com/jobs/${q.replace(/%20/g, "-")}/rss.xml?LTxt=${q}&Lloc=${loc}` },
        // CWJobs (IT/tech PM roles)
        { name: "CWJobs", url: `https://www.cwjobs.co.uk/jobs/${q.replace(/%20/g, "-")}/rss.xml?LTxt=${q}&Lloc=${loc}` },
        // Jobsite
        { name: "Jobsite", url: `https://www.jobsite.co.uk/jobs/${q.replace(/%20/g, "-")}/rss.xml` },
      );
    }
    return feeds;
  }

  parseRSS(xml, source) {
    const jobs = [];
    // Extract all <item> blocks
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      const item = match[1];
      const title = this.extract(item, "title");
      const link = this.extract(item, "link") || this.extractCDATA(item, "link");
      const description = this.extractCDATA(item, "description") || this.extract(item, "description");
      const pubDate = this.extract(item, "pubDate");
      const guid = this.extract(item, "guid") || link;
      const company = this.extract(item, "source") ||
                      this.extractPattern(description, /employer[:\s]+([^<\n,]+)/i) ||
                      source;

      if (title && link) {
        jobs.push({
          id: `rss_${Buffer.from(guid || link).toString("base64").slice(0, 20)}`,
          platform: "rss",
          source,
          title: this.cleanText(title),
          company: this.cleanText(company),
          location: this.extractPattern(description, /location[:\s]+([^<\n,]+)/i) || "London",
          description: this.cleanText(description).slice(0, 2000),
          url: link.trim(),
          posted: pubDate || new Date().toISOString(),
          salary: this.extractPattern(description, /£[\d,k\s\-]+/i) || "See listing",
        });
      }
    }
    return jobs;
  }

  extract(xml, tag) {
    const m = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`, "i"));
    return m ? m[1].trim() : null;
  }

  extractCDATA(xml, tag) {
    const m = xml.match(new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tag}>`, "i"));
    return m ? m[1].trim() : null;
  }

  extractPattern(text, regex) {
    if (!text) return null;
    const m = text.match(regex);
    return m ? m[1].trim() : null;
  }

  cleanText(text) {
    if (!text) return "";
    return text
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " ").replace(/&#39;/g, "'").replace(/&quot;/g, '"')
      .replace(/\s+/g, " ").trim();
  }

  async scan(criteria) {
    const keywords = criteria.keywords || ["Programme Manager"];
    const location = criteria.location || "London";
    const feeds = this.buildFeeds(keywords, location);
    const allJobs = [];
    const seen = new Set();

    for (const feed of feeds) {
      try {
        const res = await fetch(feed.url, {
          signal: AbortSignal.timeout(8000),
          headers: { "User-Agent": "Mozilla/5.0 (compatible; JobSearchBot/1.0)" },
        });
        if (!res.ok) continue;
        const xml = await res.text();
        const jobs = this.parseRSS(xml, feed.name);

        for (const job of jobs) {
          if (!seen.has(job.id)) {
            seen.add(job.id);
            allJobs.push(job);
          }
        }
      } catch {
        // RSS feeds fail silently
      }
    }

    console.log(`   RSS Boards: ${allJobs.length} jobs (Indeed, Totaljobs, CWJobs, Jobsite)`);
    return allJobs;
  }
}
