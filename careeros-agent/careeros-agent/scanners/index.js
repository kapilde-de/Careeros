// ════════════════════════════════════════════════════════════════════════
// Job Scanner — orchestrates multi-platform job discovery
// ════════════════════════════════════════════════════════════════════════

import { chromium } from "playwright";
import { ReedScanner } from "./reed.js";
import { AdzunaScanner } from "./adzuna.js";
import { JSearchScanner } from "./jsearch.js";
import { GreenhouseScanner } from "./greenhouse.js";
import { AshbyScanner } from "./ashby.js";
import { LeverScanner } from "./lever.js";
import { RemotiveScanner } from "./remotive.js";
import { JobicyScanner } from "./jobicy.js";
// New ATS scanners
import { WorkdayScanner } from "./workday.js";
import { SmartRecruitersScanner } from "./smartrecruiters.js";
import { RecruiteeScanner } from "./recruitee.js";
import { ICIMSScanner } from "./icims.js";
import { BambooHRScanner } from "./bamboohr.js";
import { TaleoScanner } from "./taleo.js";

export class JobScanner {
  constructor(config) {
    this.config = config;
    this.scanners = [];

    // API-based scanners (always work)
    if (config.adzunaAppId && config.adzunaAppKey) {
      this.scanners.push(new AdzunaScanner(config.adzunaAppId, config.adzunaAppKey));
    }
    if (config.jsearchKey) {
      this.scanners.push(new JSearchScanner(config.jsearchKey));
    }
    if (config.reedKey) {
      this.scanners.push(new ReedScanner(config.reedKey));
    }

    // Free no-key scanners
    this.scanners.push(new RemotiveScanner());
    this.scanners.push(new JobicyScanner());

    // Direct ATS API scanners (no auth, public job boards)
    this.scanners.push(new WorkdayScanner());
    this.scanners.push(new SmartRecruitersScanner());
    this.scanners.push(new RecruiteeScanner());
    this.scanners.push(new ICIMSScanner());
    this.scanners.push(new BambooHRScanner());
    this.scanners.push(new TaleoScanner());

    // Browser-based scanners (Playwright) for ATS pages
    this.scanners.push(new GreenhouseScanner());
    this.scanners.push(new AshbyScanner());
    this.scanners.push(new LeverScanner());

    this.browser = null;
  }

  async init() {
    this.browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }

  async scanAll(criteria) {
    if (!this.browser) await this.init();

    const allJobs = [];

    for (const scanner of this.scanners) {
      try {
        const jobs = await scanner.scan(criteria, this.browser);
        console.log(`   ${scanner.name}: ${jobs.length} jobs`);
        allJobs.push(...jobs);
      } catch (err) {
        console.error(`   ⚠ ${scanner.name} failed:`, err.message);
      }
    }

    // Deduplicate by URL or title+company
    const seen = new Set();
    const unique = allJobs.filter(j => {
      const key = j.url || `${j.title}__${j.company}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return unique;
  }

  async close() {
    if (this.browser) await this.browser.close();
  }
}
