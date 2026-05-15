/**
 * CareerOS Resume Orchestrator — optimised for Vercel Hobby (≤10s)
 *
 * Phase 1  Claude Haiku : Parse JD + Gap analysis (combined)   ~3s
 * Phase 2  PARALLEL:
 *            Claude Haiku → Full rewrite                        ~5s
 *            Claude Haiku → ATS score                           ~3s
 * Total ≈ 8s  (within Hobby plan 10s limit)
 *
 * Requires only: ANTHROPIC_API_KEY
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

// Phase 1: parse JD + gap analysis combined (saves 1 round-trip)
async function parseAndAnalyse(jd, cv, anthropic) {
  console.log("[phase:parseAndAnalyse] start");
  const res = await anthropic.messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 1400,
    system: "You are a talent strategist and CV coach. Return ONLY valid JSON, no markdown.",
    messages: [{
      role: "user",
      content: `Analyse this job description and CV together. Return ONE JSON object:
{
  "role":"exact title","company":"exact company name","hiringIntent":"1 sentence",
  "mustHave":["r1","r2","r3","r4","r5"],
  "keywords":["k1","k2","k3","k4","k5","k6","k7","k8","k9","k10"],
  "topBulletThemes":["t1","t2","t3","t4"],
  "summaryAngle":"what summary must say to get shortlisted",
  "leadershipLevel":"seniority level",
  "strengths":["s1","s2","s3"],
  "gaps":["g1","g2"],
  "rewriteFocus":["specific rewrite instruction 1","specific rewrite instruction 2","specific rewrite instruction 3"]
}
JD: ${jd.slice(0, 2500)}
CV: ${cv.slice(0, 1500)}`
    }],
  });
  const data = safeJSON(res.content[0].text) || {};
  console.log(`[phase:parseAndAnalyse] role=${data.role}`);
  return data;
}

// Phase 2a: full resume rewrite
async function rewriteResume(ctx, cv, anthropic) {
  console.log("[phase:rewriteResume] start");
  const res = await anthropic.messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 2800,
    system: "You are a Director-level executive CV writer. Return ONLY valid JSON, no markdown.",
    messages: [{
      role: "user",
      content: `Rewrite this CV for the role. Return ONLY JSON, no extra text.

ROLE: ${ctx.role||""} at ${ctx.company||""}
MUST-HAVE: ${(ctx.mustHave||[]).join(" | ")}
ATS KEYWORDS (use verbatim): ${(ctx.keywords||[]).join(", ")}
SUMMARY MUST SAY: ${ctx.summaryAngle||""}
STRENGTHS: ${(ctx.strengths||[]).join(" | ")}
REWRITE FOCUS: ${(ctx.rewriteFocus||[]).join(" | ")}

BULLET RULES: Past-tense verb + JD context + metric, max 18 words.
✅ "Reduced deployment defects by 28% governing 8-team SDLC program"
❌ "Responsible for leading teams"

SUMMARY: 4 sentences. S1: years+title+must-have. S2: best metric. S3: evidence. S4: name the company.
SKILLS: Exactly 10, verbatim from JD keywords.
BULLETS: 5 per role. Rotate verbs (Led/Drove/Reduced/Delivered/Aligned/Streamlined).
PRESERVE all job titles, companies, dates exactly.

Return JSON:
{"name":"","contact":"email • phone • city","summary":"4 sentences","skills":["s1"..."s10"],"experience":[{"title":"","company":"","period":"","bullets":["b1","b2","b3","b4","b5"]}],"education":["Qual — Institution (Year)"],"certifications":[]}

CV: ${cv.slice(0, 6000)}`
    }],
  });
  const tailored = safeJSON(res.content[0].text) || {};
  console.log(`[phase:rewriteResume] roles=${(tailored.experience||[]).length}`);
  return tailored;
}

// Phase 2b: ATS + hiring manager score
async function scoreATS(ctx, cv, anthropic) {
  console.log("[phase:scoreATS] start");
  const res = await anthropic.messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 1200,
    system: "You are a senior ATS and hiring specialist. Return ONLY valid JSON, no markdown.",
    messages: [{
      role: "user",
      content: `Score this CV for the role. Return JSON:
{"matchScore":75,"hiringManagerScore":70,
 "rejectionRisk":{"score":30,"topReasons":["r1","r2"],"ghostingRisk":"LOW","cvScreenRisk":"MEDIUM","interviewRisk":"LOW","howToFix":["f1","f2"]},
 "salaryIntelligence":{"marketMin":"£X","marketMax":"£Y","recommendedAsk":"£Z","insight":"market context","negotiationScript":"word-for-word offer script"},
 "gapAnalysis":{"strengths":["s1","s2"],"gaps":["g1","g2"],"transferable":["t1"]},
 "hiringManagerInsights":{"firstImpression":"10-second view","humanAppeal":"standout quality","redFlags":["flag1"],"standoutFactors":["f1","f2"]},
 "improvements":["tip1","tip2","tip3"]}
ROLE: ${ctx.role||""} at ${ctx.company||""}
MUST-HAVE: ${(ctx.mustHave||[]).join(", ")}
KEYWORDS: ${(ctx.keywords||[]).join(", ")}
CV: ${cv.slice(0, 800)}`
    }],
  });
  const scores = safeJSON(res.content[0].text) || {};
  console.log(`[phase:scoreATS] matchScore=${scores.matchScore}`);
  return scores;
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
  console.log("[orchestrate] pipeline start");

  try {
    // Phase 1: combined parse + gap
    const ctx = await parseAndAnalyse(jd, cv, anthropic);

    // Phase 2: rewrite + score in parallel
    const [tailored, scores] = await Promise.all([
      rewriteResume(ctx, cv, anthropic),
      scoreATS(ctx, cv, anthropic),
    ]);

    const s = scores || {};
    const g = ctx    || {};

    console.log("[orchestrate] pipeline complete ✓");
    return res.json({
      jdAnalysis: {
        role:         ctx.role         || "",
        company:      ctx.company      || "",
        mustHave:     ctx.mustHave     || [],
        niceToHave:   [],
        keywords:     ctx.keywords     || [],
        hiringIntent: ctx.hiringIntent || "",
      },
      matchScore:            s.matchScore           || 75,
      hiringManagerScore:    s.hiringManagerScore   || 70,
      rejectionRisk:         s.rejectionRisk        || {},
      salaryIntelligence:    s.salaryIntelligence   || {},
      gapAnalysis: {
        strengths:    g.strengths    || s.gapAnalysis?.strengths    || [],
        gaps:         g.gaps         || s.gapAnalysis?.gaps         || [],
        transferable: s.gapAnalysis?.transferable || [],
      },
      hiringManagerInsights: s.hiringManagerInsights || {},
      improvements:          s.improvements          || [],
      resume:                tailored,
      _pipeline: "haiku-parse+gap → [haiku-rewrite ∥ haiku-score]",
    });

  } catch (err) {
    console.error("[orchestrate] error:", err.message, err.status, err.stack?.slice(0, 300));
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
