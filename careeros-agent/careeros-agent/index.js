// ════════════════════════════════════════════════════════════════════════
// CareerOS Agent — Main Entry Point
// Run: node index.js
// ════════════════════════════════════════════════════════════════════════

import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import yaml from "yaml";
import chalk from "chalk";
import CareerOSAgent from "./agent-core.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Banner ──
console.log(chalk.cyan(`
╔════════════════════════════════════════╗
║  🤖  CareerOS Agent v1.0              ║
║  Your 24/7 AI Job Hunter              ║
╚════════════════════════════════════════╝
`));

// ── Load config ──
const configPath = path.join(__dirname, "config", "config.yml");
const cvPath = path.join(__dirname, "data", "cv.md");

if (!fs.existsSync(configPath)) {
  console.error(chalk.red("❌ Missing config.yml — run setup first:"));
  console.error(chalk.yellow("   node setup.js"));
  process.exit(1);
}

if (!fs.existsSync(cvPath)) {
  console.error(chalk.red("❌ Missing cv.md — please add your CV to data/cv.md"));
  process.exit(1);
}

const userConfig = yaml.parse(fs.readFileSync(configPath, "utf8"));
const cv = fs.readFileSync(cvPath, "utf8");

// ── Validate license ──
if (!process.env.CAREEROS_LICENSE_KEY) {
  console.error(chalk.red("❌ Missing CAREEROS_LICENSE_KEY in .env"));
  console.error(chalk.yellow("   Buy a license at gumroad.com/l/careeros-agent"));
  process.exit(1);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error(chalk.red("❌ Missing ANTHROPIC_API_KEY in .env"));
  console.error(chalk.yellow("   Get one at console.anthropic.com"));
  process.exit(1);
}

// ── Build full config ──
const config = {
  // User profile
  cv,
  firstName: userConfig.profile.firstName,
  lastName: userConfig.profile.lastName,
  email: userConfig.profile.email,
  phone: userConfig.profile.phone,
  location: userConfig.profile.location,
  linkedinURL: userConfig.profile.linkedin,
  portfolioURL: userConfig.profile.portfolio,
  cvFile: path.join(__dirname, "data", userConfig.profile.cvPDF || "cv.pdf"),

  // Search criteria
  keywords: userConfig.search.keywords || ["engineer"],
  minSalary: userConfig.search.minSalary,
  excludeCompanies: userConfig.search.excludeCompanies || [],
  remoteOnly: userConfig.search.remoteOnly,

  // Behavior
  intervalHours: userConfig.behavior.intervalHours || 4,
  minMatchScore: userConfig.behavior.minMatchScore || 70,
  autopilot: userConfig.behavior.autopilot || false,
  actuallySubmit: userConfig.behavior.actuallySubmit || false, // SAFETY: default to dry-run
  requireApproval: userConfig.behavior.requireApproval !== false, // default true
  showBrowser: userConfig.behavior.showBrowser || false,

  // API keys
  anthropicKey: process.env.ANTHROPIC_API_KEY,
  adzunaAppId: process.env.ADZUNA_APP_ID,
  adzunaAppKey: process.env.ADZUNA_APP_KEY,
  reedKey: process.env.REED_API_KEY,
  jsearchKey: process.env.JSEARCH_API_KEY,

  // Notifications
  emailEnabled: userConfig.notifications?.email?.enabled,
  emailTo: userConfig.notifications?.email?.to || userConfig.profile.email,
  gmailUser: process.env.GMAIL_USER,
  gmailAppPassword: process.env.GMAIL_APP_PASSWORD,
  whatsappEnabled: userConfig.notifications?.whatsapp?.enabled,
  whatsappNumber: userConfig.notifications?.whatsapp?.number,

  // Storage
  dataDir: path.join(__dirname, "data"),
  dashboardPort: 3939,
};

// ── Validate license with CareerOS server ──
async function validateLicense() {
  try {
    const response = await fetch("https://careeros-rose.vercel.app/api/validate-license", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: process.env.CAREEROS_LICENSE_KEY }),
    });
    const data = await response.json();
    if (!data.valid) throw new Error(data.message || "Invalid license");
    console.log(chalk.green(`✓ License valid · ${data.tier} tier`));
    return data;
  } catch (err) {
    console.error(chalk.red(`❌ License validation failed: ${err.message}`));
    if (process.env.SKIP_LICENSE_CHECK === "true") {
      console.log(chalk.yellow("⚠ Running in dev mode — license check skipped"));
      return { valid: true, tier: "dev" };
    }
    process.exit(1);
  }
}

// ── Start ──
(async () => {
  await validateLicense();

  const agent = new CareerOSAgent(config);
  await agent.start();

  // Graceful shutdown
  process.on("SIGINT", async () => {
    conso