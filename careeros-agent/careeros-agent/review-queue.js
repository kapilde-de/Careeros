// careeros-agent/review-queue.js
export class ReviewQueue {
  constructor(storage) { this.storage = storage; }
  async add(match) { await this.storage.addToQueue(match); }
  async size() { return this.storage.queueSize(); }
  async list() { return this.storage.getQueue(); }
}
