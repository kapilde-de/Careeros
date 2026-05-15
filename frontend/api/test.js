import Anthropic from "@anthropic-ai/sdk";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.json({ ok: false, error: "ANTHROPIC_API_KEY missing", step: "env" });

  try {
    const anthropic = new Anthropic({ apiKey: key, timeout: 8000 });
    const r = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 20,
      messages: [{ role: "user", content: "Reply with the word OK only." }],
    });
    return res.json({ ok: true, reply: r.content[0].text, model: "claude-3-5-haiku-20241022" });
  } catch (err) {
    return res.json({ ok: false, error: err.message, status: err.status, step: "anthropic" });
  }
}
