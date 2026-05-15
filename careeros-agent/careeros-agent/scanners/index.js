// ════════════════════════════════════════════════════════════════════════
// Job Scanner — orchestrates multi-platform job discovery
// 15+ sources: RSS boards, APIs, ATS platforms, recruiting firms
// ════════════════════════════════════════════════════════════════════════

import { ReedScanner } from "./reed.js";
import { AdzunaScanner } from "./adzuna.js";
import { JSearchScanner } from "./jsearch.js";
import { GreenhouseScanner } from "./greenhouse.js";
import { AshbyScanner } from "./ashby.js";
import { LeverScanner } from "./lever.js";
import { RemotiveScanner } from "./remotive.js";
import { JobicyScanner } from "./jobicy.js";
// ATS platform scanners
import { WorkdayScanner } from "./workday.js";
import { SmartRecruitersScanner } from "./smartrecruiters.js";
import { RecruiteeScanner } from "./recruitee.js";
import { ICIMSScanner } from "./icims.js";
import { BambooHRScanner } from "./bamboohr.js";
import { TaleoScanner } from "./taleo.js";
// New broad coverage scanners
import { RSSScanner } from "./rss-scanner.js";
import { ArbeitnowScanner } from "./arbeitnow.js";
import { MuseScanner } from "./muse.js";
import { HimalayasScanner } from "./himalayas.js";
import { RecruitingFirmsScanner } from "./recruiting-firms.js";

export class JobScanner {
  constructor(config) {
    this.config = config;
    this.scanners = [];

    // ── Tier 1: Key-based APIs (highest quality, location-aware) ──
    if (config.adzunaAppId && config.adzunaAppKey) {
      this.scanners.push(new AdzunaScanner(config.adzunaAppId, config.adzunaAppKey));
    }
    if (config.reedKey) {
      this.scanners.push(new ReedScanner(config.reedKey));
    }
    if (config.jsearchKey) {
      this.scanners.push(new JSearchScanner(config.jsearchKey));
    }

    // ── Tier 2: UK RSS boards (Indeed, Totaljobs, CWJobs, Jobsite) ──
    this.scanners.push(new RSSScanner());

    // ── Tier 3: Free global APIs (no key needed) ──
    this.scanners.push(new ArbeitnowScanner());
    this.scanners.push(new HimalayasScanner());
    this.scanners.push(new MuseScanner());
    this.scanners.push(new RemotiveScanner());
    this.scanners.push(new JobicyScanner());

    // ── Tier 4: ATS company boards (direct APIs, no auth) ──
    this.scanners.push(new WorkdayScanner());
    this.scanners.push(new SmartRecruitersScanner());
    this.scanners.push(new RecruiteeScanner());
    this.scanners.push(new ICIMSScanner());
    this.scanners.push(new BambooHRScanner());
    this.scanners.push(new TaleoScanner());
    this.scanners.push(new GreenhouseScanner());
    this.scanners.push(new AshbyScanner());
    this.scanners.push(new LeverScanner());

    // ── Tier 5: UK Recruiting firms ──
    this.scanners.push(new RecruitingFirmsScanner());
  }

  async scanAll(criteria) {
    const allJobs = [];

    // Run all scanners in parallel for speed
    const results = await Promise.allSettled(
      this.scanners.map(scanner =>
        scanner.scan(criteria).then(jobs => ({ name: scanner.name, jobs }))
      )
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        const { name, jobs } = result.value;
        console.log(`   ${name}: ${jobs.length} jobs`);
        allJobs.push(...jobs);
      } else {
        // Silent fail per scanner
      }
    }

    // Deduplicate by URL or title+company
    const seen = new Set();
    const unique = allJobs.filter(j => {
      const key = (j.url || `${j.title}__${j.company}`).toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return unique;
  }
}
