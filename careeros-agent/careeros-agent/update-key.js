// ════════════════════════════════════════════════════════════════════════
// CareerOS Agent — API Key Updater
// Run: node update-key.js  (or double-click update-key.bat)
// Updates ONLY the API key in .env — nothing else changes
// ════════════════════════════════════════════════════════════════════════

import readline from "readline";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, ".env");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = q => new Promise(r => rl.question(q, r));

console.log(chalk.cyan(`
╔════════════════════════════════════════╗
║  🔑  CareerOS Agent — Key Updater     ║
╚════════════════════════════════════════╝
`));

(async () => {
  console.log("Get your Anthropic API key at: " + chalk.underline("console.anthropic.com") + "\n");

  const newKey = await ask("Paste your new ANTHROPIC_API_KEY: ");
  
  if (!newKey.trim().startsWith("sk-ant-")) {
    console.log(chalk.red("\n❌ That doesn't look like an Anthropic key (should start with sk-ant-)"));
    console.log(chalk.yellow("   Get one at console.anthropic.com → API Keys → Create Key"));
    rl.close();
    return;
  }

  // Read existing .env
  let envContent = "";
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf8");
    // Replace existing key line
    if (envContent.includes("ANTHROPIC_API_KEY=")) {
      envContent = envContent.replace(/ANTHROPIC_API_KEY=.*/g, `ANTHROPIC_API_KEY=${newKey.trim()}`);
    } else {
      envContent += `\nANTHROPIC_API_KEY=${newKey.trim()}`;
    }
  } else {
    envContent = `ANTHROPIC_API_KEY=${newKey.trim()}\n`;
  }

  fs.writeFileSync(envPath, envContent);

  console.log(chalk.green("\n✅ API key updated successfully!"));
  console.log(chalk.yellow("   Restart the agent with start.bat to apply the new key.\n"));

  rl.close();
})();
