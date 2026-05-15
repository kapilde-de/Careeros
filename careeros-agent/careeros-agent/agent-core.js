// ════════════════════════════════════════════════════════════════════════
// CareerOS Agent — Full Auto-Apply Orchestrator
// ════════════════════════════════════════════════════════════════════════

import { JobScanner } from "./scanners/index.js";
import { JobEvaluator } from "./evaluator.js";
import { CVGenerator } from "./cv-generator.js";
import { ReviewQueue } from "./review-queue.js";
import { ApplicationBot } from "./application-bot.js";
import { Notifier } from "./notifier.js";
import { Storage } from "./storage.js";
import { Dashboard } from "./dashboard.js";
import cron from "node-cron";

export default class CareerOSAgent {
  constructor(config) {
    this.config = config;
    this.storage = new Storage(config.dataDir);
    this.scanner = new JobScanner(config);
    this.evaluator = new JobEvaluator(config);
    this.cvGen = new CVGenerator(config);
    this.queue = new ReviewQueue(this.storage);
    this.bot = new ApplicationBot(config);
    this.notifier = new Notifier(config);
    this.dashboard = new Dashboard(this.storage);
    this.runCount = 0;
    this.sessionApplications = []; // Track all applications this session
  }

  async run() {
    const startTime = Date.now();
    console.log(`\n${"═".repeat(60)}`);
    console.log(`🤖 CareerOS Agent — Cycle ${this.runCount + 1}`);
    console.log(`⏰ ${new Date().toLocaleString("en-GB")}`);
    console.log(`${"═".repeat(60)}`);

    const cycleApplications = [];

    try {
      // ── Phase 1: Scan ──────────────────────────────────────────
      console.log("\n📡 Phase 1: Scanning job boards...");
      const allJobs = await this.scanner.scanAll({
        keywords: this.config.keywords,
        location: this.config.location,
        minSalary: this.config.minSalary,
        excludeCompanies: this.config.excludeCompanies,
        remoteOnly: this.config.remoteOnly,
      });
      console.log(`   Found ${allJobs.length} total jobs`);

      // ── Phase 2: Deduplicate ───────────────────────────────────
      const seen = await this.storage.getSeenJobIds();
      const fresh = allJobs.filter(j => !seen.has(j.id));
      console.log(`   ${fresh.length} are new (${allJobs.length - fresh.length} already seen)`);

      if (fresh.length === 0) {
        console.log("\n✓ No new jobs this cycle.\n");
        return;
      }

      // Mark all as seen immediately
      for (const job of fresh) await this.storage.markSeen(job.id);

      // ── Phase 3: AI Evaluation (batch, 3 at a time) ────────────
      console.log(`\n🧠 Phase 2: Evaluating ${fresh.length} jobs with AI...`);
      const matches = [];
      const BATCH = 3;

      for (let i = 0; i < fresh.length; i += BATCH) {
        const batch = fresh.slice(i, i + BATCH);
        const results = await Promise.allSettled(
          batch.map(job => this.evaluator.evaluate(job, this.config.cv))
        );

        for (let j = 0; j < batch.length; j++) {
          const job = batch[j];
          const result = results[j];

          if (result.status === "rejected") {
            console.log(`   ⚠ Eval failed for "${job.title}": ${result.reason?.message}`);
            continue;
          }

          const score = result.value;
          const match = { ...job, ...score };

          if (score.matchScore >= this.config.minMatchScore && score.recommendApply !== false) {
            console.log(`   ✅ ${score.matchScore}% — ${job.title} at ${job.company}`);
            matches.push(match);
          } else {
            await this.storage.markRejected(job.id, score);
          }
        }
        // Small delay between batches to avoid rate limiting
        if (i + BATCH < fresh.length) await new Promise(r => setTimeout(r, 500));
      }

      console.log(`\n   🎯 ${matches.length}/${fresh.length} passed the ${this.config.minMatchScore}% bar`);

      if (matches.length === 0) {
        console.log("   No matches this cycle — adjusting threshold or try broader keywords.\n");
        return;
      }

      // ── Phase 4: Generate tailored CV + cover letter ───────────
      console.log("\n✍️  Phase 3: Generating tailored CVs...");
      for (const match of matches) {
        try {
          console.log(`   Writing CV for: ${match.title} at ${match.company}...`);
          match.tailoredCV = await this.cvGen.generate(match, this.config.cv);
          match.coverLetter = await this.cvGen.generateCover(match, this.config.cv);
          // Generate real PDF for form uploads
          match.cvPath = await this.cvGen.generatePDF(match.tailoredCV, match);
        } catch (err) {
          console.error(`   ⚠ CV gen failed for ${match.title}: ${err.message}`);
          match.cvPath = this.config.cvFile; // Fallback to base CV
        }
      }

      // ── Phase 5: Apply ─────────────────────────────────────────
      console.log("\n🚀 Phase 4: Applying to matched jobs...");
      for (const match of matches) {
        try {
          const result = await this.bot.apply(match);
          cycleApplications.push(result);
          this.sessionApplications.push(result);
          await this.storage.recordApplication(result);

          if (result.status === "submitted") {
            console.log(`   ✅ APPLIED: ${match.title} at ${match.company}`);
          } else if (result.status === "filled_pending_review") {
            console.log(`   📋 QUEUED: ${match.title} at ${match.company}`);
            await this.queue.add({ ...match, applicationResult: result });
          } else if (result.status === "manual_required") {
            console.log(`   👋 MANUAL: ${match.title} at ${match.company} — open localhost:3939`);
            await this.queue.add({ ...match, applicationResult: result });
          }
        } catch (err) {
          console.error(`   ❌ Apply failed for ${match.title}: ${err.message}`);
          cycleApplications.push({ status: "failed", title: match.title, company: match.company, url: match.url, error: err.message });
        }

        // Small delay between applications
        await new Promise(r => setTimeout(r, 2000));
      }

      // ── Phase 6: Report ────────────────────────────────────────
      const submitted = cycleApplications.filter(a => a.status === "submitted");
      const pending = cycleApplications.filter(a => a.status === "filled_pending_review" || a.status === "manual_required");
      const failed = cycleApplications.filter(a => a.status === "failed");

      console.log(`\n${"─".repeat(50)}`);
      console.log(`📊 Cycle Summary:`);
      console.log(`   ✅ Submitted:    ${submitted.length}`);
      console.log(`   📋 Needs review: ${pending.length}`);
      console.log(`   ❌ Failed:       ${failed.length}`);
      console.log(`   ⏱  Time:         ${((Date.now() - startTime) / 1000 / 60).toFixed(1)} mins`);
      console.log(`${"─".repeat(50)}`);

      // Send email report if there's anything to report
      if (cycleApplications.length > 0) {
        await this.notifier.sendApplicationReport(cycleApplications);
      } else if (this.shouldSendDigest()) {
        await this.notifier.sendDigest({
          newMatches: matches.length,
          autoApplied: submitted.length,
          queueSize: await this.queue.size(),
          intervalHours: this.config.intervalHours,
        });
      }

      this.runCount++;

    } catch (err) {
      console.error("\n❌ Cycle failed:", err.message);
      await this.notifier.sendError(err);
    }
  }

  shouldSendDigest() {
    const last = this.storage.getLastDigestTime?.() || 0;
    return (Date.now() - last) >= 24 * 60 * 60 * 1000;
  }

  async start() {
    console.log("\n🤖 CareerOS Agent starting...");
    console.log(`🎯 Keywords: ${this.config.keywords.join(", ")}`);
    console.log(`📍 Location: ${this.config.location || "Any"}`);
    console.log(`💰 Min salary: ${this.config.minSalary ? `£${this.config.minSalary.toLocaleString()}` : "Any"}`);
    console.log(`⚡ Auto-submit: ${this.config.actuallySubmit ? "ENABLED" : "disabled (fill only)"}`);
    console.log(`🔄 Scan interval: every ${this.config.intervalHours}h`);

    // Start the web dashboard
    await this.dashboard.start(this.config.dashboardPort || 3939);

    // Run immediately on start
    await this.run();

    // Then run on schedule
    const cronExpr = `0 */${this.config.intervalHours} * * *`;
    cron.schedule(cronExpr, () => this.run());
    console.log(`\n⏰ Agent running every ${this.config.intervalHours}h · Dashboard: http://localhost:${this.config.dashboardPort || 3939}\n`);
  }

  async stop() {
    console.log("\n📊 Session summary:");
    console.log(`   Total applications: ${this.sessionApplications.length}`);
    console.log(`   Submitted: ${this.sessionApplications.filter(a=>a.status==="submitted").length}`);
  }
}
