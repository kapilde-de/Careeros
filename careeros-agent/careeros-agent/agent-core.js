// ════════════════════════════════════════════════════════════════════════
// CareerOS Agent — Main Orchestrator
// Runs the autonomous job hunting loop
// ════════════════════════════════════════════════════════════════════════

import { JobScanner } from "./scanners/index.js";
import { JobEvaluator } from "./evaluator.js";
import { CVGenerator } from "./cv-generator.js";
import { ReviewQueue } from "./review-queue.js";
import { ApplicationBot } from "./application-bot.js";
import { Notifier } from "./notifier.js";
import { Storage } from "./storage.js";
import { Dashboard } from "./dashboard.js";

class CareerOSAgent {
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
  }

  // ── Main loop — runs every 4 hours by default ──
  async run() {
    console.log("\n🤖 CareerOS Agent — Cycle starting at", new Date().toISOString());

    try {
      // Phase 1: Scan all configured job boards
      const newJobs = await this.scanner.scanAll({
        keywords: this.config.keywords,
        location: this.config.location,
        minSalary: this.config.minSalary,
        excludeCompanies: this.config.excludeCompanies,
      });
      console.log(`📥 Found ${newJobs.length} new jobs`);

      // Phase 2: De-duplicate against past jobs
      const seen = await this.storage.getSeenJobIds();
      const fresh = newJobs.filter(j => !seen.has(j.id));
      console.log(`🆕 ${fresh.length} are new`);

      if (fresh.length === 0) {
        console.log("✓ No new jobs this cycle. Sleeping.");
        return;
      }

      // Phase 3: AI evaluation — score each job
      const evaluated = [];
      for (const job of fresh) {
        try {
          const score = await this.evaluator.evaluate(job, this.config.cv);

          // Only continue if it passes the bar
          if (score.matchScore >= this.config.minMatchScore) {
            evaluated.push({ ...job, ...score });
          } else {
            await this.storage.markRejected(job.id, score);
          }
        } catch (err) {
          console.error(`⚠ Evaluation failed for ${job.title}:`, err.message);
        }
      }
      console.log(`🎯 ${evaluated.length} passed the ${this.config.minMatchScore}% match bar`);

      // Phase 4: Generate tailored CVs for each match
      for (const match of evaluated) {
        try {
          match.tailoredCV = await this.cvGen.generate(match, this.config.cv);
          match.coverLetter = await this.cvGen.generateCover(match, this.config.cv);
        } catch (err) {
          console.error(`⚠ CV gen failed for ${match.title}:`, err.message);
        }
      }

      // Phase 5: Decide review queue vs autopilot
      for (const match of evaluated) {
        const action = this.decideAction(match);

        if (action === "AUTO_APPLY" && this.config.autopilot) {
          // Apply automatically
          await this.bot.apply(match);
          await this.storage.recordApplication(match, "auto");
          console.log(`🚀 Auto-applied to ${match.title} at ${match.company}`);
        } else {
          // Add to review queue
          await this.queue.add(match);
          console.log(`📋 Queued for review: ${match.title} at ${match.company}`);
        }
      }

      // Phase 6: Send daily digest
      if (this.shouldSendDigest()) {
        await this.notifier.sendDigest({
          newMatches: evaluated.length,
          autoApplied: evaluated.filter(m => this.decideAction(m) === "AUTO_APPLY" && this.config.autopilot).length,
          queueSize: await this.queue.size(),
          topMatch: evaluated[0],
        });
      }

      this.runCount++;
      console.log(`✅ Cycle complete. Total runs: ${this.runCount}\n`);

    } catch (err) {
      console.error("❌ Cycle failed:", err);
      await this.notifier.sendError(err);
    }
  }

  // Decide if we auto-apply or add to review queue
  decideAction(match) {
    // Autopilot only kicks in after 7 days of training
    const daysActive = this.storage.daysSinceFirstRun();
    const trainingComplete = daysActive >= 7 && this.storage.acceptedCount() >= 5;

    if (!trainingComplete) return "REVIEW";
    if (!this.config.autopilot) return "REVIEW";
    if (match.matchScore < 85) return "REVIEW"; // High bar for autopilot
    if (match.rejectionRisk?.score > 30) return "REVIEW";
    if (this.config.requireApproval) return "REVIEW";

    return "AUTO_APPLY";
  }

  shouldSendDigest() {
    const lastDigest = this.storage.getLastDigestTime();
    const hoursSince = (Date.now() - lastDigest) / (1000 * 60 * 60);
    return hoursSince >= 24;
  }

  // Run continuously
  async start() {
    console.log("🤖 CareerOS Agent starting...");
    await this.dashboard.start(); // Start localhost dashboard

    // Run immediately
    await this.run();

    // Then every interval
    const interval = this.config.intervalHours * 60 * 60 * 1000;
    setInterval(() => this.run(), interval);

    console.log(`⏰ Agent running every ${this.config.intervalHours}h`);
    console.log(`🌐 Dashboard: http://localhost:${this.config.dashboardPort}\n`);
  }

  async stop() {
    console.log("🛑 Stopping agent...");
    await this.dashboard.stop();
    await this.scanner.close();
  }
}

export default CareerOSAgent;
