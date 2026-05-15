/**
 * CareerOS Resume Orchestrator — 2 parallel calls, no sequential phase
 * Optimised for Vercel Hobby (≤10s)
 *
 * TWO parallel calls:
 *   Call A → analyse JD + rewrite resume  (~4s, 1800 tokens)
 *   Call B → score ATS + insights         (~3s, 700 tokens)
 * Total ≈ 4-5s
 */

import Anthropic from "@anthropic-ai/sdk";

function safeJSON(text) {
  if (!text) return null;
  const clean = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  try { return JSON.parse(clean); } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) try { return JSON.parse(match[0]); } catch {}
  }
  return null;
}

// Detect currency symbol + label from JD text
function detectCurrency(jd) {
  const t = jd.toLowerCase();
  // India
  if (/\b(india|bangalore|bengaluru|mumbai|hyderabad|chennai|pune|delhi|kolkata|noida|gurgaon|gurugram|₹|inr|lpa|lakhs?)\b/.test(t))
    return { symbol: "₹", label: "INR", example: "₹20L" };
  // US
  if (/\b(united states|usa|u\.s\.a|new york|san francisco|seattle|austin|chicago|boston|los angeles|california|texas|florida|remote.*us|us.*remote|\$[0-9]|usd)\b/.test(t))
    return { symbol: "$", label: "USD", example: "$120k" };
  // Canada
  if (/\b(canada|toronto|vancouver|montreal|cad|ontario|british columbia)\b/.test(t))
    return { symbol: "CA$", label: "CAD", example: "CA$90k" };
  // Australia
  if (/\b(australia|sydney|melbourne|brisbane|aud)\b/.test(t))
    return { symbol: "A$", label: "AUD", example: "A$100k" };
  // Europe (€)
  if (/\b(germany|france|netherlands|spain|italy|amsterdam|berlin|paris|munich|barcelona|madrid|dublin|ireland|€|eur)\b/.test(t))
    return { symbol: "€", label: "EUR", example: "€70k" };
  // Default UK
  return { symbol: "£", label: "GBP", example: "£60k" };
}

// Call A: analyse JD + rewrite CV in one shot
async function analyseAndRewrite(jd, cv, anthropic) {
  const res = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1800,
    system: "You are a CV strategist and executive writer. Return ONLY valid JSON, no markdown.",
    messages: [{
      role: "user",
      content: `Analyse the JD, then rewrite the CV for it. Return ONE JSON object only.

JSON structure:
{
  "role":"exact job title",
  "company":"exact company name",
  "keywords":["k1","k2","k3","k4","k5","k6","k7","k8"],
  "mustHave":["r1","r2","r3","r4"],
  "strengths":["s1","s2"],
  "gaps":["g1","g2"],
  "resume":{
    "name":"",
    "contact":"email • phone • city",
    "summary":"4 sentences: years+title+skills | best metric | evidence | name the company",
    "skills":["s1","s2","s3","s4","s5","s6","s7","s8"],
    "experience":[{"title":"","company":"","period":"","bullets":["b1","b2","b3","b4"]}],
    "education":["Qual — Institution (Year)"],
    "certifications":[]
  }
}

BULLET RULES: Past-tense verb + metric, max 15 words. e.g. "Reduced defects 28% governing 8-team SDLC program"
PRESERVE original job titles, companies, dates exactly.
SKILLS: use JD keywords verbatim.

JD: ${jd.slice(0, 2000)}
CV: ${cv.slice(0, 2000)}`
    }],
  });
  return safeJSON(res.content[0].text) || {};
}

// Call B: score directly from JD + CV
async function scoreCV(jd, cv, anthropic) {
  const { symbol, label, example } = detectCurrency(jd);
  const res = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1100,
    system: "You are a senior ATS specialist. Return ONLY valid JSON, no markdown fences.",
    messages: [{
      role: "user",
      content: `Score this CV against the JD. Return ONLY this JSON, nothing else:
{"matchScore":75,"hiringManagerScore":70,"rejectionRisk":{"score":30,"topReasons":["reason 1","reason 2"],"ghostingRisk":"LOW","cvScreenRisk":"MEDIUM","interviewRisk":"LOW","howToFix":["fix 1","fix 2"]},"salaryIntelligence":{"marketMin":"${example}","marketMax":"${example}","recommendedAsk":"${example}","insight":"one sentence about market","negotiationScript":"one sentence opener"},"hiringManagerInsights":{"firstImpression":"brief first impression","humanAppeal":"standout quality","redFlags":["flag 1"],"standoutFactors":["factor 1"]},"improvements":["improvement 1","improvement 2","improvement 3"]}

IMPORTANT: All salary figures MUST use the ${label} currency symbol "${symbol}" (e.g. "${example}"). Do NOT use any other currency symbol.

Fill in real values based on:
JD: ${jd.slice(0, 1200)}
CV: ${cv.slice(0, 800)}`
    }],
  });
  return safeJSON(res.content[0].text) || {};
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")    return res.status(405).json({ error: "Method not allowed" });

  const { jd, cv } = req.body || {};
  if (!jd || !cv) return res.status(400).json({ error: "jd and cv are required" });

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });

  const anthropic = new Anthropic({ apiKey: anthropicKey, timeout: 9000 });

  try {
    // Both calls run in parallel — total time = slowest call (~4-5s)
    const [ctx, scores] = await Promise.all([
      analyseAndRewrite(jd, cv, anthropic),
      scoreCV(jd, cv, anthropic),
    ]);

    const s = scores || {};
    const g = ctx    || {};

    return res.json({
      jdAnalysis: {
        role:         g.role         || "",
        company:      g.company      || "",
        mustHave:     g.mustHave     || [],
        niceToHave:   [],
        keywords:     g.keywords     || [],
        hiringIntent: "",
      },
      matchScore:            s.matchScore           || 75,
      hiringManagerScore:    s.hiringManagerScore   || 70,
      rejectionRisk:         s.rejectionRisk        || {},
      salaryIntelligence:    s.salaryIntelligence   || {},
      gapAnalysis: {
        strengths:    g.strengths || [],
        gaps:         g.gaps      || [],
        transferable: [],
      },
      hiringManagerInsights: s.hiringManagerInsights || {},
      improvements:          s.improvements          || [],
      resume:                g.resume                || {},
      _pipeline: "haiku-[analyse+rewrite ∥ score]",
    });

  } catch (err) {
    console.error("[orchestrate] error:", err.message, err.status);
    return res.status(500).json({
      error: "Orchestration failed",
      details: err.message,
      hint: err.status === 401 ? "Check ANTHROPIC_API_KEY in Vercel env vars"
          : err.status === 403 ? "API key lacks model access — check Anthropic account"
          : err.status === 429 ? "Rate limit hit — try again in a moment"
          : undefined,
    });
  }
}
