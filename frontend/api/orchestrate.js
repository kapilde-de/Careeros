/**
 * CareerOS Resume Orchestrator  (optimised — parallel rewrite + score)
 *
 * Pipeline:
 *   Phase 1 — GPT-4o-mini:  Parse JD                          ~3s
 *   Phase 2 — OpenAI embed: Chunk CV → Pinecone upsert        ~4s  (skipped if no key)
 *   Phase 3 — Pinecone:     Batch query top-4 requirements    ~2s  (skipped if no key)
 *   Phase 4 — Claude Haiku: Gap analysis                      ~4s
 *   Phase 5 — PARALLEL:
 *               Claude Sonnet → Full rewrite                  ~18s
 *               GPT-4o-mini   → ATS score                     ~5s
 *   Total ≈ 31s  (well under Vercel's 60s limit)
 */

import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { Pinecone } from "@pinecone-database/pinecone";

// ── Helpers ───────────────────────────────────────────────────────────────────

function chunkCV(cvText) {
  const lines = cvText.split("\n");
  const sectionHeaders = /^(EXPERIENCE|EMPLOYMENT|WORK HISTORY|EDUCATION|SKILLS|PROFILE|SUMMARY|CERTIFICATIONS|ACHIEVEMENTS|PROJECTS|PUBLICATIONS)/i;
  const chunks = [];
  let current = "";
  for (const line of lines) {
    if (sectionHeaders.test(line.trim()) && current.trim().length > 80) {
      chunks.push(current.trim());
      current = line + "\n";
    } else {
      current += line + "\n";
    }
  }
  if (current.trim().length > 50) chunks.push(current.trim());
  if (chunks.length <= 1) {
    return cvText.split(/\n\n+/).filter(s => s.trim().length > 60).slice(0, 12);
  }
  return chunks.slice(0, 12);
}

function safeJSON(text) {
  const clean = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  try { return JSON.parse(clean); } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) try { return JSON.parse(match[0]); } catch {}
  }
  return null;
}

// ── Phase 1: GPT parses the JD ───────────────────────────────────────────────

async function parseJD(jd, openai) {
  console.log("[phase:parseJD] start");
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 1200,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You are a senior talent strategist. Extract job requirements as structured JSON. Return only valid JSON." },
      { role: "user", content: `Extract all requirements from this job description. Return JSON:
{"role":"exact title","company":"exact company","hiringIntent":"1 sentence","mustHave":["r1","r2","r3","r4","r5","r6"],"niceToHave":["n1","n2","n3"],"keywords":["k1","k2","k3","k4","k5","k6","k7","k8","k9","k10"],"leadershipLevel":"seniority level","domainContext":"industry domain","topBulletThemes":["t1","t2","t3","t4","t5"],"summaryAngle":"what the summary must communicate to get shortlisted"}
JD: ${jd.slice(0, 3500)}` }
    ],
  });
  const analysis = JSON.parse(res.choices[0].message.content);
  console.log(`[phase:parseJD] role=${analysis.role} company=${analysis.company}`);
  return analysis;
}

// ── Phase 2+3: Pinecone embed + retrieve (optional) ──────────────────────────

async function pineconeRetrieve(cv, analysis, openai, pinecone, pineconeIndex) {
  const cvChunks = chunkCV(cv);
  if (cvChunks.length === 0) return cv.slice(0, 5000);

  try {
    const ns = `cv_${Date.now()}`;
    const index = pinecone.index(pineconeIndex);

    // Embed all CV chunks in one batch
    const chunkEmbedRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: cvChunks.slice(0, 10),
    });
    const vectors = chunkEmbedRes.data.map((e, i) => ({
      id: `chunk_${i}`,
      values: e.embedding,
      metadata: { text: cvChunks[i], idx: i },
    }));
    await index.namespace(ns).upsert(vectors);
    console.log(`[phase:pinecone] upserted ${vectors.length} chunks`);

    // Embed top-4 requirements in ONE batch, then query
    const topReqs = (analysis.mustHave || []).slice(0, 4);
    const reqEmbedRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: topReqs,
    });

    const seen = new Set();
    const relevant = [];
    // Query each requirement embedding in parallel
    const queryResults = await Promise.all(
      reqEmbedRes.data.map(e =>
        index.namespace(ns).query({ vector: e.embedding, topK: 2, includeMetadata: true })
      )
    );
    for (const result of queryResults) {
      for (const match of result.matches || []) {
        if (match.score > 0.25 && !seen.has(match.metadata.text)) {
          seen.add(match.metadata.text);
          relevant.push(match.metadata.text);
        }
      }
    }

    // Clean up namespace
    try { await index.namespace(ns).deleteAll(); } catch {}
    console.log(`[phase:pinecone] retrieved ${relevant.length} relevant sections`);
    return relevant.length > 0 ? relevant.join("\n\n") : cv.slice(0, 5000);
  } catch (err) {
    console.error("[phase:pinecone] error (falling back to full CV):", err.message);
    return cv.slice(0, 5000);
  }
}

// ── Phase 4: Claude Haiku — gap analysis ─────────────────────────────────────

async function analyzeGaps(analysis, retrievedContext, anthropic) {
  console.log("[phase:analyzeGaps] start");
  const res = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    system: "You are a CV strategist. Analyse gaps between candidate and role. Return only valid JSON.",
    messages: [{
      role: "user",
      content: `Analyse the gap between this CV and role requirements. Return JSON:
{"strengths":["s1","s2","s3","s4"],"gaps":["g1","g2","g3"],"transferable":["t1","t2","t3"],"rewriteFocus":["specific instruction 1 for rewriter","specific instruction 2","specific instruction 3"]}
Role: ${analysis.role || ""} at ${analysis.company || ""}
Must-Have: ${(analysis.mustHave || []).join(" | ")}
Keywords needed: ${(analysis.keywords || []).join(", ")}
Most relevant CV sections:
${retrievedContext.slice(0, 2000)}`,
    }],
  });
  const gapAnalysis = safeJSON(res.content[0].text) || {};
  console.log(`[phase:analyzeGaps] gaps=${(gapAnalysis.gaps||[]).length}`);
  return gapAnalysis;
}

// ── Phase 5a: Claude Sonnet — resume rewrite ─────────────────────────────────

async function rewriteResume(analysis, gapAnalysis, retrievedContext, cv, anthropic) {
  console.log("[phase:rewriteResume] start");
  const a = analysis || {};
  const gaps = gapAnalysis || {};
  const res = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 3500,
    system: "You are a Director-level executive CV writer who has placed 500+ senior candidates. Return only valid JSON.",
    messages: [{
      role: "user",
      content: `Rewrite this CV to be laser-targeted for the role. Use the gap analysis and retrieved CV sections to produce precise, impactful bullets.

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
❌ "Responsible for leading and coordinating various cross-functional teams on software programs"

═══ RULES ═══
SUMMARY: 4 sentences. S1: years+title+top must-have. S2: best metric. S3: second must-have+evidence. S4: mention company by name. BANNED: passionate/driven/dynamic/results-oriented/proven track record.
SKILLS: Exactly 12 — verbatim from JD keywords. Match JD capitalisation.
BULLETS: 7 per role minimum. Rotate verbs: Led/Drove/Governed/Aligned/Streamlined/Delivered/Established/Coordinated/Championed/Reduced/Accelerated/Deployed/Orchestrated/Spearheaded/Built. Never "Responsible for".
PRESERVE: Every job title, company, dates exactly. Never invent metrics.
INCLUDE: Every single role, all education, all certifications.

Return ONLY valid JSON — no markdown, no preamble:
{"name":"","contact":"email • phone • city","summary":"4 sentences","skills":["s1","s2","s3","s4","s5","s6","s7","s8","s9","s10","s11","s12"],"experience":[{"title":"","company":"","period":"","bullets":["b1","b2","b3","b4","b5","b6","b7"]}],"education":["Qualification — Institution (Year)"],"certifications":["c1"]}

═══ MOST RELEVANT CV SECTIONS ═══
${retrievedContext}

═══ FULL CV (preserve all roles/dates) ═══
${cv.slice(0, 10000)}`,
    }],
  });
  const tailored = safeJSON(res.content[0].text) || {};
  console.log(`[phase:rewriteResume] roles=${(tailored.experience||[]).length}`);
  return tailored;
}

// ── Phase 5b: GPT ATS scoring ─────────────────────────────────────────────────

async function scoreATS(analysis, cv, openai) {
  console.log("[phase:scoreATS] start");
  const a = analysis || {};
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 1400,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You are a senior ATS specialist and recruiting expert. Score the CV against the job requirements. Return only valid JSON." },
      { role: "user", content: `Score this CV against the role requirements. Be precise and critical. Return JSON:
{"matchScore":78,"hiringManagerScore":72,"rejectionRisk":{"score":30,"topReasons":["r1","r2","r3"],"ghostingRisk":"LOW","cvScreenRisk":"MEDIUM","interviewRisk":"LOW","howToFix":["f1","f2","f3"]},"salaryIntelligence":{"marketMin":"£X","marketMax":"£Y","recommendedAsk":"£Z","insight":"1 sentence on market rate","negotiationScript":"Confident word-for-word script to use when offer is made — reference the specific salary range and role"},"gapAnalysis":{"strengths":["s1","s2","s3","s4"],"gaps":["g1","g2","g3"],"transferable":["t1","t2","t3"]},"hiringManagerInsights":{"firstImpression":"what a hiring manager notices in 10 seconds","humanAppeal":"what makes this candidate stand out as a person","redFlags":["flag1","flag2"],"standoutFactors":["f1","f2","f3"]},"improvements":["actionable tip 1","actionable tip 2","actionable tip 3"]}
Role: ${a.role||""} at ${a.company||""}
Must-have requirements: ${(a.mustHave||[]).join(", ")}
Keywords: ${(a.keywords||[]).join(", ")}
Candidate CV summary: ${cv.slice(0, 1000)}` },
    ],
  });
  const scores = JSON.parse(res.choices[0].message.content);
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

  const openaiKey     = process.env.OPENAI_API_KEY;
  const anthropicKey  = process.env.ANTHROPIC_API_KEY;
  const pineconeKey   = process.env.PINECONE_API_KEY;
  const pineconeIndex = process.env.PINECONE_INDEX_NAME || "careeros-cv";

  if (!openaiKey)    return res.status(500).json({ error: "OPENAI_API_KEY not configured" });
  if (!anthropicKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });

  const openai    = new OpenAI({ apiKey: openaiKey });
  const anthropic = new Anthropic({ apiKey: anthropicKey, timeout: 55000 });
  const usePinecone = !!pineconeKey;
  const pinecone  = usePinecone ? new Pinecone({ apiKey: pineconeKey }) : null;

  console.log(`[orchestrate] pipeline start — pinecone=${usePinecone}`);

  try {
    // Phase 1 — GPT parses JD
    const analysis = await parseJD(jd, openai);

    // Phase 2+3 — Pinecone embed & retrieve (or full CV fallback)
    const retrievedContext = usePinecone
      ? await pineconeRetrieve(cv, analysis, openai, pinecone, pineconeIndex)
      : cv.slice(0, 5000);

    // Phase 4 — Claude Haiku gap analysis
    const gapAnalysis = await analyzeGaps(analysis, retrievedContext, anthropic);

    // Phase 5 — Rewrite (Sonnet) + Score (GPT) IN PARALLEL ← key speedup
    const [tailored, scores] = await Promise.all([
      rewriteResume(analysis, gapAnalysis, retrievedContext, cv, anthropic),
      scoreATS(analysis, cv, openai),
    ]);

    const g = gapAnalysis || {};
    const s = scores || {};

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
      _pipeline: `gpt-parse → ${usePinecone ? "pinecone-embed → pinecone-batch-retrieve → " : ""}claude-gap → [claude-sonnet-rewrite ∥ gpt-score]`,
    });

  } catch (err) {
    console.error("[orchestrate] error:", err.message, err.stack?.slice(0, 400));
    return res.status(500).json({ error: "Orchestration failed", details: err.message });
  }
}
