// ═══// ════════════════════════════════════════════════════════════════════════
// CareerOS Agent — Interactive Setup Wizard
// Run: node setup.js
// ════════════════════════════════════════════════════════════════════════

import readline from "readline";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import yaml from "yaml";
import chalk from "chalk";
import { execSync } from "child_process"; // ✅ ADDED

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = q => new Promise(r => rl.question(q, r));

console.log(chalk.cyan(`
╔════════════════════════════════════════╗
║  🤖  CareerOS Agent — Setup Wizard    ║
╚════════════════════════════════════════╝
`));

console.log("This wizard will configure your agent in 3 minutes.\n");

const config = {
  profile: {},
  search: {},
  behavior: {},
  notifications: { email: {}, whatsapp: {} },
};

(async () => {

  // ── Install Playwright Browsers (NEW) ──
  console.log(chalk.cyan("⏳ First-time setup: downloading browser (~1 min)...\n"));

  try {
    execSync("npx playwright install chromium", { stdio: "inherit" });
    console.log(chalk.green("   ✓ Browser installed successfully\n"));
  } catch (err) {
    console.log(chalk.yellow("   ⚠ Auto-install failed."));
    console.log(chalk.yellow("   👉 Please run manually: npx playwright install\n"));
  }

  // ── Profile ──
  console.log(chalk.cyan("📋 Step 1: Your Profile\n"));
  config.profile.firstName = await ask("First name: ");
  config.profile.lastName = await ask("Last name: ");
  config.profile.email = await ask("Email: ");
  config.profile.phone = await ask("Phone: ");
  config.profile.location = await ask("Location (e.g. London, UK): ");
  config.profile.linkedin = await ask("LinkedIn URL: ");
  config.profile.portfolio = await ask("Portfolio/website URL (optional): ");

  // ── License ──
  console.log(chalk.cyan("\n🔑 Step 2: License Key\n"));
  console.log("Buy a license at gumroad.com/l/careeros-agent (£99 one-time)\n");
  const licenseKey = await ask("Enter your license key (or press Enter for trial): ");

  // ── API Keys ──
  console.log(chalk.cyan("\n🔌 Step 3: API Keys\n"));
  console.log("You need an Anthropic API key. Get one at console.anthropic.com\n");
  const anthropicKey = await ask("ANTHROPIC_API_KEY: ");

  console.log("\nOptional — Adzuna for UK/US/India jobs (free at developer.adzuna.com):");
  const adzunaAppId = await ask("ADZUNA_APP_ID (or skip): ");
  const adzunaAppKey = adzunaAppId ? await ask("ADZUNA_APP_KEY: ") : "";

  console.log("\nOptional — Reed.co.uk (free at reed.co.uk/developers):");
  const reedKey = await ask("REED_API_KEY (or skip): ");

  console.log(chalk.cyan("\n📧 Step 3b: Email Notifications (optional but recommended)\n"));
  console.log("CareerOS can email you a daily report of applications sent.");
  console.log("Requires a Gmail App Password (NOT your regular Gmail password).");
  console.log("Get one at: myaccount.google.com → Security → 2-Step Verification → App passwords\n");
  const gmailUser = await ask("Your Gmail address (or skip): ");
  const gmailAppPassword = gmailUser ? await ask("Gmail App Password (16-char, no spaces): ") : "";

  // ── Search Criteria ──
  console.log(chalk.cyan("\n🎯 Step 4: What jobs do you want?\n"));
  const keywords = await ask("Keywords (comma-separated, e.g. 'product manager, senior PM'): ");
  config.search.keywords = keywords.split(",").map(k => k.trim()).filter(Boolean);

  const minSal = await ask("Minimum salary (optional, e.g. 60000): ");
  if (minSal) config.search.minSalary = parseInt(minSal);

  const exclude = await ask("Companies to exclude (comma-separated, optional): ");
  config.search.excludeCompanies = exclude.split(",").map(c => c.trim()).filter(Boolean);

  const remoteOnly = await ask("Remote only? (y/n): ");
  config.search.remoteOnly = remoteOnly.toLowerCase().startsWith("y");

  // ── Behavior ──
  console.log(chalk.cyan("\n⚙ Step 5: Agent Behavior\n"));
  const interval = await ask("Scan how often in hours? (default: 4): ");
  config.behavior.intervalHours = parseInt(interval) || 4;

  const minScore = await ask("Minimum match score 0-100 (default: 70): ");
  config.behavior.minMatchScore = parseInt(minScore) || 70;

  console.log(chalk.yellow("\n⚠ SAFETY: By default, the agent fills forms but doesn't submit."));
  console.log(chalk.yellow("   You review and click 'Submit' yourself."));
  console.log(chalk.yellow("   Auto-submission unlocks after 7 days + 5 manual approvals.\n"));

  const showBrowser = await ask("Show browser window when filling forms? (y/n, recommended y at first): ");
  config.behavior.showBrowser = showBrowser.toLowerCase().startsWith("y");

  config.behavior.autopilot = false;
  config.behavior.actuallySubmit = false;
  config.behavior.requireApproval = true;

  // ── Notifications ──
  console.log(chalk.cyan("\n📬 Step 6: Notifications\n"));
  const emailNotif = await ask("Send email digest each morning? (y/n): ");
  if (emailNotif.toLowerCase().startsWith("y")) {
    config.notifications.email.enabled = true;
    config.notifications.email.to = config.profile.email;
  }

  // ── Write files ──
  console.log(chalk.cyan("\n💾 Saving configuration...\n"));

  const envContent = `# CareerOS Agent — Environment
CAREEROS_LICENSE_KEY=${licenseKey || "TRIAL_MODE"}
ANTHROPIC_API_KEY=${anthropicKey}
ADZUNA_APP_ID=${adzunaAppId || ""}
ADZUNA_APP_KEY=${adzunaAppKey || ""}
REED_API_KEY=${reedKey || ""}
GMAIL_USER=${gmailUser || ""}
GMAIL_APP_PASSWORD=${gmailAppPassword || ""}
SKIP_LICENSE_CHECK=${licenseKey ? "false" : "true"}
`;
  fs.writeFileSync(path.join(__dirname, ".env"), envContent);
  console.log(chalk.green("   ✓ .env created"));

  const configDir = path.join(__dirname, "config");
  if (!fs.existsSync(configDir)) fs.mkdirSync(configDir);
  fs.writeFileSync(path.join(configDir, "config.yml"), yaml.stringify(config));
  console.log(chalk.green("   ✓ config/config.yml created"));

  const dataDir = path.join(__dirname, "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

  const cvPath = path.join(dataDir, "cv.md");
  if (!fs.existsSync(cvPath)) {
    fs.writeFileSync(cvPath, `# Your CV in Markdown\n\nPaste your CV here.\n\nThe agent uses this to evaluat