const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');

// ── Load API key from .env manually (works with dotenvx v17+) ─────────────────
function getApiKey() {
  // 1. Already in process.env (e.g. set by dotenvx CLI or real env var)
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;

  // 2. Parse .env file manually as fallback
  try {
    const envPath = path.join(__dirname, '../.env');
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const m = line.match(/^ANTHROPIC_API_KEY=(.+)$/);
      if (m) return m[1].trim();
    }
  } catch {}

  return undefined;
}

router.post('/', async (req, res) => {

  try {

    const {
      model,
      max_tokens,
      system,
      messages
    } = req.body;

    if (!messages) {
      return res.status(400).json({ error: 'Messages missing' });
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured in .env' });
    }

    // ── Create client with fresh key each request ──────────────────────────────
    const anthropic = new Anthropic({ apiKey, timeout: 120000 }); // 2 min timeout

    // ── Claude API Call ────────────────────────────────────────────────────────
    const response = await anthropic.messages.create({
      model:      model      || 'claude-haiku-4-5-20251001',
      max_tokens: max_tokens || 2500,
      system:     system     || '',
      messages
    });

    // ── Extract Text ───────────────────────────────────────────────────────────
    const raw = response.content?.[0]?.text || '';

    // Strip markdown code fences if present
    const text = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    // ── Parse JSON Safely ──────────────────────────────────────────────────────
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return res.status(500).json({
        error: 'Claude returned invalid JSON',
        raw: text
      });
    }

    res.json(parsed);

  } catch (err) {
    console.error('Claude API Error:', err.message);
    res.status(500).json({
      error:   'Claude API failed',
      details: err.message,
      full:    JSON.stringify(err, null, 2)
    });
  }
});

module.exports = router;
