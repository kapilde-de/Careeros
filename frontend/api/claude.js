import Anthropic from "@anthropic-ai/sdk";

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { model, max_tokens, system, messages } = req.body;
    if (!messages) return res.status(400).json({ error: "Messages missing" });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });

    const anthropic = new Anthropic({ apiKey, timeout: 55000 });

    const usedModel = model || "claude-haiku-4-5";
    console.log(`[claude] model=${usedModel} max_tokens=${max_tokens}`);

    const response = await anthropic.messages.create({
      model: usedModel,
      max_tokens: max_tokens || 2500,
      system: system || "",
      messages,
    });

    const raw = response.content?.[0]?.text || "";
    const text = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      console.error("[claude] JSON parse failed, raw:", text.slice(0, 300));
      // Try to extract JSON from the response if it has extra text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
          return res.json(parsed);
        } catch {}
      }
      return res.status(500).json({ error: "Claude returned invalid JSON", raw: text.slice(0, 500) });
    }

    return res.json(parsed);
  } catch (err) {
    console.error("[claude] error:", err.message, err.status, err.error);
    return res.status(500).json({ error: "Claude API failed", details: err.message, status: err.status });
  }
}
