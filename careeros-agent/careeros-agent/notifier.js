// careeros-agent/notifier.js
export class Notifier {
  constructor(config) { this.config = config; }

  async sendDigest(stats) {
    if (!this.config.emailEnabled) {
      console.log(`📊 Digest: ${stats.newMatches} matches, ${stats.autoApplied} auto-applied, ${stats.queueSize} in queue`);
      return;
    }
    // Email sending (configure SMTP in production)
    console.log(`📧 Email digest sent to ${this.config.emailTo}`);
  }

  async sendError(err) {
    console.error("⚠️ Error notification:", err.message);
  }
}
