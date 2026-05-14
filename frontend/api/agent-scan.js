import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import axios from "axios";

// ── Curated company list for agent scans (fast, high-signal) ─────────────────
const GH_SLUGS = [
  "airbnb","stripe","hubspot","figma","mongodb","twilio","zendesk","asana",
  "dropbox","datadog","canva","coinbase","brex","rippling","notion","gusto",
  "intercom","amplitude","miro","retool","openai","anthropic","cohere",
  "doordash","discord","duolingo","airtable","webflow","freshworks","monday",
  "ramp","deel","klarna","monzo","gartner","wayfair","samsara","toast","adyen",
  "pagerduty","squarespace","shutterstock","grubhub","tripadvisor","benchling",
  "snap","pinterest","peloton","roblox","coursera","udemy","navan",
];

const LV_SLUGS = [
  "netflix","spotify","reddit","lyft","cloudflare","zscaler","fastly",
  "qualtrics","pluralsight","shopify","gitlab","netlify","vercel",
  "databricks","confluent","posthog","grafana","sentry","kraken",
  "twitch","carta","flexport","culture-amp","lattice","clearbit",
  "eventbrite","glassdoor","expensify","remitly","domo","podium",
];

// ── Scoring helpers ───────────────────────────────────────────────────────────
const STOP = new Set(["a","an","the","and","or","in","at","to","of","for","with","on","by","as","is","are","was","be","this","that","it","its","we","our","you","your"]);

function tokenise(q) {
  return q.toLowerCase().split(/[\s,\/\-+]+/).filter(w => w.length > 2 && !STOP.has(w));
}

function scoreJob(job, tokens) {
  if (!tokens.length) return 1;
  const title = (job.title || "").toLowerCase();
  let pts = 0, hits = 0;
  for (const t of tokens) {
    if (title.includes(t)) { pts += 4; hits++; }
    else if ((job.description || "").toLowerCase().includes(t)) pts += 1;
  }
  if (hits === 0) return 0;
  if (tokens.every(t => title.includes(t))) pts += 6;
  return pts;
}

// ── Source fetchers ───────────────────────────────────────────────────────────
async function fetchGH(slug, tokens) {
  try {
    const { data } = await axios.get(
      `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`,
      { timeout: 5000, headers: { Accept: "application/json" } }
    );
    return (data.jobs || [])
      .map(j => ({
        id: `gh_${slug}_${j.id}`,
        title: j.title || "",
        company: slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " "),
        location: j.location?.name || "",
        salary: "See listing",
        description: "",
        url: j.absolute_url || `https://boards.greenhouse.io/${slug}`,
        platform: "greenhouse",
      }))
      .filter(j => j.title && scoreJob(j, tokens) > 0);
  } catch { return []; }
}

async function fetchLV(slug, tokens) {
  try {
    const { data } = await axios.get(
      `https://api.lever.co/v0/postings/${slug}?mode=json`,
      { timeout: 5000, headers: { Accept: "application/json" } }
    );
    if (!Array.isArray(data)) return [];
    return data
      .map(j => ({
        id: `lv_${slug}_${j.id}`,
        title: j.text || "",
        company: slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " "),
        location: j.categories?.location || j.categories?.allLocations?.[0] || "",
        salary: "See listing",
        description: (j.descriptionPlain || "").replace(/<[^>]*>/g, "").slice(0, 300),
        url: j.hostedUrl || `https://jobs.lever.co/${slug}`,
        platform: "lever",
      }))
      .filter(j => j.title && scoreJob(j, tokens) > 0);
  } catch { return []; }
}

async function fetchAdzuna(query, country = "gb") {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return [];
  try {
    const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=15&what=${encodeURIComponent(query)}&sort_by=relevance`;
    const { data } = await axios.get(url, { timeout: 10000, headers: { Accept: "application/json" } });
    return (data.results || []).map(j => ({
      id: `adzuna_${j.id}`,
      title: j.title || "",
      company: j.company?.display_name || "",
      location: j.location?.display_name || "",
      salary: j.salary_min ? `£${Math.round(j.salary_min / 1000)}k – £${Math.round((j.salary_max || j.salary_min) / 1000)}k` : "See listing",
      description: (j.description || "").slice(0, 300),
      url: j.redirect_url || "",
      platform: "adzuna",
    }));
  } catch { return []; }
}

// ── Run full search for one user config ──────────────────────────────────────
async function searchForConfig(config) {
  const titles = config.titles.split(",").map(t => t.trim()).filter(Boolean);
  const excl = (config.exclude_keywords || "").toLowerCase().split(",").map(w => w.trim()).filter(Boolean);
  const allJobs = [];

  for (const title of titles) {
    const query = config.sector ? `${title} ${config.sector}` : title;
    const tokens = tokenise(query);

    const [ghJobs, lvJobs, azJobs] = await Promise.all([
      Promise.allSettled(GH_SLUGS.map(s => fetchGH(s, tokens)))
        .then(r => r.flatMap(x => x.status === "fulfilled" ? x.value : [])),
      Promise.allSettled(LV_SLUGS.map(s => fetchLV(s, tokens)))
        .then(r => r.flatMap(x => x.status === "fulfilled" ? x.value : [])),
      fetchAdzuna(query),
    ]);

    const combined = [...ghJobs, ...lvJobs, ...azJobs]
      .filter(j => j.title && j.company)
      .map(j => {
        const tl = (j.title || "").toLowerCase();
        const qWords = title.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        const hits = qWords.filter(w => tl.includes(w)).length;
        const match = Math.min(94, 52 + hits * 14 + (["greenhouse", "lever"].includes(j.platform) ? 6 : 0));
        return { ...j, match };
      })
      .filter(j => j.match >= 58 && !excl.some(w => (j.title || "").toLowerCase().includes(w)));

    allJobs.push(...combined);
  }

  // Deduplicate + sort + cap at 25
  const seen = new Set();
  return allJobs
    .filter(j => {
      const key = `${(j.title || "").toLowerCase().slice(0, 40)}|${(j.company || "").toLowerCase().slice(0, 30)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.match - a.match)
    .slice(0, 25);
}

// ── Email digest builder ──────────────────────────────────────────────────────
function buildDigestEmail(jobs, firstName, totalNew) {
  const platformColor = { greenhouse: "#0d9488", lever: "#7c3aed", adzuna: "#0891b2", reed: "#cc0000" };

  const rows = jobs.map(j => `
    <div style="padding:14px 0;border-bottom:1px solid #f1f5f9">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;color:#0f172a;font-size:14px;margin-bottom:3px">${j.title}</div>
          <div style="color:#475569;font-size:12px;margin-bottom:2px">🏢 ${j.company} &nbsp;·&nbsp; 📍 ${j.location || "Various"}</div>
          <div style="color:#059669;font-size:12px;font-weight:600;margin-bottom:8px">💰 ${j.salary || "See listing"}</div>
          <a href="${j.url || "https://frontend-pink-one-13.vercel.app"}"
            style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;text-decoration:none;padding:6px 16px;border-radius:8px;font-size:12px;font-weight:700">
            Apply →
          </a>
        </div>
        <div style="flex-shrink:0;text-align:center">
          <div style="width:48px;height:48px;border-radius:50%;background:${j.match >= 85 ? "#7c3aed" : j.match >= 75 ? "#0d9488" : "#b45309"};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:14px">${j.match}%</div>
          <div style="font-size:9px;color:#94a3b8;margin-top:3px;text-transform:uppercase;letter-spacing:0.5px">MATCH</div>
        </div>
      </div>
    </div>
  `).join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px">

    <!-- Header -->
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
      <div style="width:42px;height:42px;background:linear-gradient(135deg,#7c3aed,#6d28d9);border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:22px">🤖</div>
      <div>
        <div style="font-weight:800;font-size:18px;color:#0f172a">CareerOS Agent</div>
        <div style="font-size:12px;color:#64748b">Daily job digest · ${new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
      </div>
    </div>

    <!-- Hero message -->
    <div style="background:linear-gradient(135deg,#f5f3ff,#eff6ff);border-radius:14px;padding:20px;margin-bottom:20px;border:1px solid rgba(124,58,237,0.12)">
      <div style="font-size:16px;font-weight:700;color:#0f172a;margin-bottom:6px">
        👋 Good morning${firstName ? ", " + firstName : ""}!
      </div>
      <div style="font-size:13px;color:#475569;line-height:1.6">
        Your Agent ran overnight and found <strong style="color:#7c3aed">${totalNew} new job ${totalNew === 1 ? "match" : "matches"}</strong> across Greenhouse, Lever, Adzuna and more.
        Here are your top ${jobs.length}:
      </div>
    </div>

    <!-- Job cards -->
    <div style="background:#fff;border-radius:14px;padding:8px 20px;border:1px solid #e2e8f0;margin-bottom:20px">
      ${rows}
      <div style="padding-top:4px"></div>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:24px">
      <a href="https://frontend-pink-one-13.vercel.app"
        style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:700;box-shadow:0 4px 16px rgba(124,58,237,0.3)">
        View All ${totalNew} Matches in CareerOS →
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;font-size:11px;color:#94a3b8">
      CareerOS Agent · Your CV is being tailored for top matches automatically ·
      <a href="https://frontend-pink-one-13.vercel.app" style="color:#7c3aed;text-decoration:none">Manage preferences</a>
    </div>

  </div>
</body>
</html>`;
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  // ── Auth: Vercel cron sets Authorization: Bearer <CRON_SECRET> automatically
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = (req.headers.authorization || "").replace("Bearer ", "");
    if (auth !== cronSecret) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured" });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

  // ── Fetch all active configs ──────────────────────────────────────────────
  const { data: configs, error: cfgErr } = await supabase
    .from("agent_configs")
    .select("*")
    .eq("active", true);

  if (cfgErr) return res.status(500).json({ error: cfgErr.message });
  if (!configs?.length) return res.json({ ok: true, processed: 0, message: "No active agent configs" });

  const summary = [];

  for (const config of configs) {
    try {
      // Search jobs for this user
      const jobs = await searchForConfig(config);

      // Find jobs not yet in this user's queue
      const { data: existing } = await supabase
        .from("agent_jobs")
        .select("job_id")
        .eq("user_id", config.user_id);

      const seenIds = new Set((existing || []).map(j => j.job_id));
      const newJobs = jobs.filter(j => !seenIds.has(j.id));

      // Save new jobs
      if (newJobs.length > 0) {
        await supabase.from("agent_jobs").upsert(
          newJobs.map(j => ({
            user_id:     config.user_id,
            job_id:      j.id,
            title:       j.title,
            company:     j.company,
            location:    j.location,
            salary:      j.salary,
            description: j.description,
            url:         j.url,
            platform:    j.platform,
            match_score: j.match,
            scanned_at:  new Date().toISOString(),
          })),
          { onConflict: "user_id,job_id", ignoreDuplicates: true }
        );
      }

      // Mark last scanned
      await supabase
        .from("agent_configs")
        .update({ last_scanned_at: new Date().toISOString() })
        .eq("user_id", config.user_id);

      // Send email digest if we have new jobs + email + Resend key
      if (resend && newJobs.length > 0 && config.email) {
        const topJobs = newJobs.slice(0, 5);
        try {
          await resend.emails.send({
            from:    "CareerOS Agent <onboarding@resend.dev>",
            to:      [config.email],
            subject: `🤖 ${newJobs.length} new job ${newJobs.length === 1 ? "match" : "matches"} — CareerOS Agent`,
            html:    buildDigestEmail(topJobs, config.full_name?.split(" ")[0] || "", newJobs.length),
          });
        } catch (emailErr) {
          console.error("Email failed for", config.email, emailErr.message);
        }
      }

      summary.push({ userId: config.user_id, new: newJobs.length, total: jobs.length });
    } catch (err) {
      console.error("Scan error for", config.user_id, err.message);
      summary.push({ userId: config.user_id, error: err.message });
    }
  }

  return res.json({ ok: true, processed: configs.length, summary, timestamp: new Date().toISOString() });
}
