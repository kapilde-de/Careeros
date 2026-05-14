// frontend/careeros-agent/storage.js
import fs from "fs";
import path from "path";

export class Storage {
  constructor(dataDir) {
    this.dataDir = dataDir;
    this.queueFile = path.join(dataDir, "queue.json");
    this.appliedFile = path.join(dataDir, "applied.json");
    this.rejectedFile = path.join(dataDir, "rejected.json");
    this.metaFile = path.join(dataDir, "meta.json");

    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    [this.queueFile, this.appliedFile, this.rejectedFile].forEach(f => {
      if (!fs.existsSync(f)) fs.writeFileSync(f, "[]");
    });
    if (!fs.existsSync(this.metaFile)) {
      fs.writeFileSync(this.metaFile, JSON.stringify({
        firstRun: new Date().toISOString(),
        lastDigest: 0,
        autopilotEnabled: false,
      }));
    }
  }

  read(file) { return JSON.parse(fs.readFileSync(file, "utf8")); }
  write(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

  async getQueue() { return this.read(this.queueFile); }
  async queueSize() { return (await this.getQueue()).length; }
  async getApplied() { return this.read(this.appliedFile); }
  async appliedCount() { return (await this.getApplied()).length; }
  async rejectedCount() { return this.read(this.rejectedFile).length; }

  async getSeenJobIds() {
    const queue = await this.getQueue();
    const applied = await this.getApplied();
    const rejected = this.read(this.rejectedFile);
    return new Set([...queue, ...applied, ...rejected].map(j => j.id));
  }

  async addToQueue(job) {
    const q = await this.getQueue();
    q.push({ ...job, queuedAt: new Date().toISOString() });
    this.write(this.queueFile, q);
  }

  async approveJob(jobId) {
    const q = await this.getQueue();
    const job = q.find(j => j.id === jobId);
    if (!job) return;
    const applied = await this.getApplied();
    applied.push({ ...job, approvedAt: new Date().toISOString(), status: "approved" });
    this.write(this.appliedFile, applied);
    this.write(this.queueFile, q.filter(j => j.id !== jobId));
  }

  async rejectFromQueue(jobId, reason) {
    const q = await this.getQueue();
    const job = q.find(j => j.id === jobId);
    if (!job) return;
    const rejected = this.read(this.rejectedFile);
    rejected.push({ ...job, rejectedAt: new Date().toISOString(), reason });
    this.write(this.rejectedFile, rejected);
    this.write(this.queueFile, q.filter(j => j.id !== jobId));
  }

  async markRejected(jobId, score) {
    const rejected = this.read(this.rejectedFile);
    rejected.push({ id: jobId, ...score, rejectedAt: new Date().toISOString(), reason: "low_score" });
    this.write(this.rejectedFile, rejected);
  }

  async recordApplication(job, mode) {
    const applied = await this.getApplied();
    applied.push({ ...job, appliedAt: new Date().toISOString(), mode });
    this.write(this.appliedFile, applied);
  }

  async averageMatchScore() {
    const all = [...(await this.getQueue()), ...(await this.getApplied())];
    if (all.length === 0) return 0;
    const sum = all.reduce((a, j) => a + (j.matchScore || 0), 0);
    return Math.round(sum / all.length);
  }

  daysSinceFirstRun() {
    const meta = this.read(this.metaFile);
    const days = (Date.now() - new Date(meta.firstRun).getTime()) / (1000 * 60 * 60 * 24);
    return Math.floor(days);
  }

  acceptedCount() { return this.read(this.appliedFile).length; }
  getLastDigestTime() { return this.read(this.metaFile).lastDigest; }
  setLastDigestTime() { const m = this.read(this.metaFile); m.lastDigest = Date.now(); this.write(this.metaFile, m); }
  async setAutopilot(enabled) { const m = this.read(this.metaFile); m.autopilotEnabled = enabled; this.write(this.metaFile, m); }
  async getConfig() { return this.read(this.metaFile); }
  async updateConfig(updates) { const m = this.read(this.metaFile); this.write(this.metaFile, { ...m, ...updates }); }
}
