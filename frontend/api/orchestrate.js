/**
 * CareerOS Resume Orchestrator — Claude-only pipeline
 *
 * Phase 1  Claude Haiku  : Parse JD                        ~3s
 * Phase 2  Claude Haiku  : Gap analysis                    ~4s
 * Phase 3  PARALLEL:
 *            Claude Sonnet → Full rewrite                  ~18s
 *            Claude Haiku  → ATS score                     ~6s
 * Total ≈ 25s  (well under Vercel's 60s limit)
 *
 * Requires only: ANTHROPIC_API_KEY
 */

import Anthropic from "@anthropic-ai/sdk";

// ── Helpers ───────────────────────────────────────────────────────────────────

function safeJSON(text) {
  if (!text) return null;
  const clean = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  try { return JSON.parse(clean); } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) try { return JSON.parse(match[0]); } catch {}
  }
  return null;
}

// ── Phase 1: Parse JD ────────────────────────────────────────────────────────

async function parseJD(jd, anthropic) {
  console.log("[phase:parseJD] start");
  const res = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1200,
    system: "You are a senior talent strategist. Extract job requirements as structured JSON. Return ONLY valid JSON, no markdown.",
    messages: [{
      role: "user",
      content: `Extract all requirements from this job description. Return JSON:
{"role":"exact title","company":"exact company","hiringIntent":"1 sentence","mustHave":["r1","r2","r3","r4","r5","r6"],"niceToHave":["n1","n2","n3"],"keywords":["k1","k2","k3","k4","k5","k6","k7","k8","k9","k10"],"leadershipLevel":"seniority level","domainContext":"industry domain","topBulletThemes":["t1","t2","t3","t4","t5"],"summaryAngle":"what the summary must communicate to get shortlisted"}
JD: ${jd.slice(0, 3500)}`
    }],
  });
  const analysis = safeJSON(res.content[0].text) || {};
  console.log(`[phase:parseJD] role=${analysis.role} company=${analysis.company}`);
  return analysis;
}

// ── Phase 2: Gap analysis ────────────────────────────────────────────────────

async function analyzeGaps(analysis, cv, anthropic) {
  console.log("[phase:analyzeGaps] start");
  const a = analysis || {};
  const res = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 800,
    system: "You are a CV strategist. Analyse gaps between candidate and role. Return ONLY valid JSON, no markdown.",
    messages: [{
      role: "user",
      content: `Analyse the gap between this CV and role requirements. Return JSON:
{"strengths":["s1","s2","s3","s4"],"gaps":["g1","g2","g3"],"transferable":["t1","t2","t3"],"rewriteFocus":["specific instruction 1 for rewriter","specific instruction 2","specific instruction 3"]}
Role: ${a.role||""} at ${a.company||""}
Must-Have: ${(a.mustHave||[]).join(" | ")}
Keywords needed: ${(a.keywords||[]).join(", ")}
CV (first 2000 chars): ${cv.slice(0, 2000)}`,
    }],
  });
  const gapAnalysis = safeJSON(res.content[0].text) || {};
  console.log(`[phase:analyzeGaps] gaps=${(gapAnalysis.gaps||[]).length}`);
  return gapAnalysis;
}

// ── Phase 3a: Resume rewrite ─────────────────────────────────────────────────

async function rewriteResume(analysis, gapAnalysis, cv, anthropic) {
  console.log("[phase:rewriteResume] start");
  const a = analysis || {};
  const gaps = gapAnalysis || {};
  const res = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 3500,
    system: "You are a Director-level executive CV writer who has placed 500+ senior candidates. Return ONLY valid JSON, no markdown, no preamble.",
    messages: [{
      role: "user",
      content: `Rewrite this CV to be laser-targeted for the role.

═══ TARGET ROLE ═══
Title: ${a.role||""}  |  Company: ${a.company||""}
Must-Have (address ALL): ${(a.mustHave||[]).join(" | ")}
ATS Keywords — USE VERBATIM: ${(a.keywords||[]).join(", ")}
Bullet themes: ${(a.topBulletThemes||[]).join(" | ")}
Summary must say: ${a.summaryAngle||""}
Seniority: ${a.leadershipLevel||""}

═══ GAP ANALYSIS ═══
Strengths to highlight: ${(gaps.strengths||[]).join(" | ")}
Gaps to address: ${(gaps.gaps||[]).join(" | ")}
Rewrite focus: ${(gaps.rewriteFocus||[]).join(" | ")}

═══ BULLET FORMAT ═══
[Strong past-tense verb] [JD-language context] [metric: number/£/%/time] — MAX 18 WORDS.
✅ "Governed 8-team SDLC delivery program, reducing release defects by 28%"
✅ "Aligned cross-functional stakeholders across 4 units via Jira, cutting escalations 40%"
❌ "Responsible for leading and coordinating various cross-functional teams"

═══ RULES ═══
SUMMARY: 4 sentences. S1: years+title+top must-have. S2: best metric. S3: second must-have+evidence. S4: mention company by name. BANNED: passionate/driven/dynamic/results-oriented/proven track record.
SKILLS: Exactly 12 — verbatim from JD keywords. Match JD capitalisation.
BULLETS: 7 per role minimum. Rotate verbs: Led/Drove/Governed/Aligned/Streamlined/Delivered/Established/Coordinated/Championed/Reduced/Accelerated/Deployed/Orchestrated/Spearheaded/Built. Never "Responsible for".
PRESERVE: Every job title, company, dates exactly. Never invent metrics.
INCLUDE: Every single role, all education, all certifications.

Return ONLY valid JSON:
{"name":"","contact":"email • phone • city","summary":"4 sentences","skills":["s1","s2","s3","s4","s5","s6","s7","s8","s9","s10","s11","s12"],"experience":[{"title":"","company":"","period":"","bullets":["b1","b2","b3","b4","b5","b6","b7"]}],"education":["Qualification — Institution (Year)"],"certifications":["c1"]}

═══ FULL CV (preserve all roles/dates) ═══
${cv.slice(0, 10000)}`,
    }],
  });
  const tailored = safeJSON(res.content[0].text) || {};
  console.log(`[phase:rewriteResume] roles=${(tailored.experience||[]).length}`);
  return tailored;
}

// ── Phase 3b: ATS scoring ────────────────────────────────────────────────────

async function scoreATS(analysis, cv, anthropic) {
  console.log("[phase:scoreATS] start");
  const a = analysis || {};
  const res = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1400,
    system: "You are a senior ATS specialist and recruiting expert. Score the CV against job requirements. Return ONLY valid JSON, no markdown.",
    messages: [{
      role: "user",
      content: `Score this CV against the role requirements. Be precise and critical. Return JSON:
{"matchScore":78,"hiringManagerScore":72,"rejectionRisk":{"score":30,"topReasons":["r1","r2","r3"],"ghostingRisk":"LOW","cvScreenRisk":"MEDIUM","interviewRisk":"LOW","howToFix":["f1","f2","f3"]},"salaryIntelligence":{"marketMin":"£X","marketMax":"£Y","recommendedAsk":"£Z","insight":"1 sentence on market rate","negotiationScript":"Confident word-for-word script to use when offer is made — reference the specific salary range and role"},"gapAnalysis":{"strengths":["s1","s2","s3","s4"],"gaps":["g1","g2","g3"],"transferable":["t1","t2","t3"]},"hiringManagerInsights":{"firstImpression":"what a hiring manager notices in 10 seconds","humanAppeal":"what makes this candidate stand out as a person","redFlags":["flag1","flag2"],"standoutFactors":["f1","f2","f3"]},"improvements":["actionable tip 1","actionable tip 2","actionable tip 3"]}
Role: ${a.role||""} at ${a.company||""}
Must-have requirements: ${(a.mustHave||[]).join(", ")}
Keywords: ${(a.keywords||[]).join(", ")}
Candidate CV summary: ${cv.slice(0, 1000)}`,
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

  const anthropic = new Anthropic({ apiKey: anthropicKey, timeout: 55000 });
  console.log("[orchestrate] pipeline start — claude-only");

  try {
    // Phase 1 — Haiku parses JD
    const analysis = await parseJD(jd, anthropic);

    // Phase 2 — Haiku gap analysis
    const gapAnalysis = await analyzeGaps(analysis, cv, anthropic);

    // Phase 3 — Sonnet rewrite + Haiku score IN PARALLEL
    const [tailored, scores] = await Promise.all([
      rewriteResume(analysis, gapAnalysis, cv, anthropic),
      scoreATS(analysis, cv, anthropic),
    ]);

    const g = gapAnalysis || {};
    const s = scores     || {};

    console.log("[orchestrate] pipeline complete ✓");
    return res.json({
      jdAnalysis: {
        role:         analysis.role         || "",
        company:      analysis.company      || "",
        mustHave:     analysis.mustHave     || [],
        niceToHave:   analysis.niceToHave   || [],
        keywords:     analysis.keywords     || [],
        hiringIntent: analysis.hiringIntent || "",
      },
      matchScore:            s.matchScore           || 75,
      hiringManagerScore:    s.hiringManagerScore   || 70,
      rejectionRisk:         s.rejectionRisk        || {},
      salaryIntelligence:    s.salaryIntelligence   || {},
      gapAnalysis: {
        strengths:    g.strengths    || s.gapAnalysis?.strengths    || [],
        gaps:         g.gaps         || s.gapAnalysis?.gaps         || [],
        transferable: g.transferable || s.gapAnalysis?.transferable || [],
      },
      hiringManagerInsights: s.hiringManagerInsights || {},
      improvements:          s.improvements          || [],
      resume:                tailored,
      _pipeline: "claude-haiku-parse → claude-haiku-gap → [claude-sonnet-rewrite ∥ claude-haiku-score]",
    });

  } catch (err) {
    console.error("[orchestrate] error:", err.message, err.stack?.slice(0, 400));
    return res.status(500).json({ error: "Orchestration failed", details: err.message });
  }
}
