// ════════════════════════════════════════════════════════════════════════
// Dashboard — Local web UI to review the agent's queue
// Runs at http://localhost:3939
// ════════════════════════════════════════════════════════════════════════

import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Dashboard {
  constructor(storage, port = 3939) {
    this.storage = storage;
    this.port = port;
    this.app = express();
    this.server = null;
    this.setupRoutes();
  }

  setupRoutes() {
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, "dashboard-ui")));

    // ── API Endpoints ──
    this.app.get("/api/queue", async (req, res) => {
      res.json(await this.storage.getQueue());
    });

    this.app.get("/api/applied", async (req, res) => {
      res.json(await this.storage.getApplied());
    });

    this.app.get("/api/stats", async (req, res) => {
      res.json({
        queueSize: await this.storage.queueSize(),
        appliedTotal: await this.storage.appliedCount(),
        rejectedTotal: await this.storage.rejectedCount(),
        averageMatchScore: await this.storage.averageMatchScore(),
        daysActive: this.storage.daysSinceFirstRun(),
        autopilotEligible:
          this.storage.daysSinceFirstRun() >= 7 &&
          (await this.storage.acceptedCount()) >= 5,
        autopilotEnabled: await this.storage.isAutopilotEnabled?.() || false
      });
    });

    this.app.post("/api/approve/:jobId", async (req, res) => {
      await this.storage.approveJob(req.params.jobId);
      res.json({ success: true });
    });

    this.app.post("/api/reject/:jobId", async (req, res) => {
      await this.storage.rejectFromQueue(req.params.jobId, req.body.reason);
      res.json({ success: true });
    });

    this.app.post("/api/config", async (req, res) => {
      await this.storage.updateConfig(req.body);
      res.json({ success: true });
    });

    this.app.get("/api/config", async (req, res) => {
      res.json(await this.storage.getConfig());
    });

    this.app.post("/api/autopilot", async (req, res) => {
      const { enabled } = req.body;
      await this.storage.setAutopilot(enabled);
      res.json({ enabled });
    });

    // UI
    this.app.get("/", (req, res) => {
      res.send(getDashboardHTML());
    });
  }

  async start() {
    return new Promise((resolve, reject) => {
      const tryListen = (port) => {
        const server = this.app.listen(port, () => {
          this.server = server;
          this.port = port;
          console.log(`🌐 Dashboard running at http://localhost:${port}`);
          resolve();
        });

        server.on("error", (err) => {
          if (err.code === "EADDRINUSE") {
            console.log(`⚠ Port ${port} in use, trying ${port + 1}`);
            tryListen(port + 1);
          } else {
            reject(err);
          }
        });
      };

      tryListen(this.port);
    });
  }

  async stop() {
    if (this.server) {
      return new Promise(resolve => this.server.close(resolve));
    }
  }
}

// ── Embedded Dashboard HTML ──
function getDashboardHTML() {
  return `<!DOCTYPE html>
<html>
<head><title>CareerOS</title></head>
<body>
<h1>CareerOS Agent Running ✅</h1>
<p>Open full UI coming soon</p>
</body>
</html>`;
}