import axios from "axios";
import * as cheerio from "cheerio";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-GB,en;q=0.9",
};

// ── Stop words to ignore when matching ───────────────────────────────────────
const STOP = new Set(["a","an","the","and","or","in","at","to","of","for","with","on","by","as","is","are","was","be","this","that","it","its","we","our","you","your","they","their","from","have","has","had","will","can","do","does","not","but","if","so","up","out","about","into","than","then","just","also","over","after","all","more","most","some","such","these","those","been","being","he","she","him","her","his","they","which","who","whom","what","when","where","how","why","no","yes","i","my","me","us"]);

// ── Tokenise query into meaningful words ─────────────────────────────────────
function tokenise(query) {
  return query.toLowerCase().split(/[\s,\/\-+]+/).filter(w => w.length > 2 && !STOP.has(w));
}

// ── Score a job against query tokens ─────────────────────────────────────────
// Returns 0 if no match at all, higher = more relevant
function score(job, tokens) {
  if (!tokens.length) return 1;
  const title  = (job.title || "").toLowerCase();
  const desc   = (job.description || "").toLowerCase();
  const tags   = ((job.tags || []).join(" ")).toLowerCase();
  const full   = `${title} ${desc} ${tags}`;

  let pts = 0, titleHits = 0;
  for (const t of tokens) {
    if (title.includes(t))      { pts += 4; titleHits++; }
    else if (full.includes(t))  { pts += 1; }
  }

  // Hard filter: at least ONE meaningful token must appear in the title
  if (titleHits === 0) return 0;

  // Bonus: all tokens in title = very strong match
  if (tokens.every(t => title.includes(t))) pts += 6;

  return pts;
}

// ── Reed ─────────────────────────────────────────────────────────────────────
async function scrapeReed(query, location = "uk") {
  try {
    const loc = location === "us" ? "united-states" : location === "in" ? "india" : "united-kingdom";
    const url = `https://www.reed.co.uk/jobs/${query.toLowerCase().replace(/\s+/g,"-")}-jobs?keywords=${encodeURIComponent(query)}&location=${loc}&fulltime=True`;
    const { data } = await axios.get(url, { headers: HEADERS, timeout: 8000 });
    const $ = cheerio.load(data);
    const jobs = [];
    $("article[data-job-id]").each((_, el) => {
      const id      = $(el).attr("data-job-id");
      const title   = $(el).find('h2.title a,[data-qa="job-title"]').first().text().trim();
      const company = $(el).find('.recruiter,[data-qa="job-recruiter"]').first().text().trim();
      const loc2    = $(el).find('.location,[data-qa="job-location"]').first().text().trim();
      const salary  = $(el).find('.salary,[data-qa="job-salary"]').first().text().trim();
      const posted  = $(el).find('.posted,[data-qa="job-posted"]').first().text().trim();
      const snippet = $(el).find('.description,[data-qa="job-description"]').first().text().trim().slice(0, 300);
      const href    = $(el).find('h2.title a,[data-qa="job-title"]').first().attr("href") || "";
      if (title && company) {
        jobs.push({ id:`reed_${id||Date.now()+Math.random()}`, title, company,
          location: loc2||loc, salary: salary||"Salary not listed",
          posted: posted||"Recently", description: snippet,
          url: href.startsWith("http") ? href : `https://www.reed.co.uk${href}`,
          platform:"reed" });
      }
    });
    return jobs.slice(0, 25);
  } catch(err) { console.error("Reed error:", err.message); return []; }
}

// ── RemoteOK ─────────────────────────────────────────────────────────────────
async function fetchRemoteOK(tokens) {
  try {
    const { data } = await axios.get("https://remoteok.com/api", {
      headers: { ...HEADERS, Accept:"application/json" }, timeout: 8000 });
    const listings = Array.isArray(data) ? data.slice(1) : [];
    return listings
      .map(job => ({
        id:`remoteok_${job.id}`, title:job.position||"", company:job.company||"",
        location:"Remote",
        salary: job.salary_min ? `$${Number(job.salary_min).toLocaleString()} – $${Number(job.salary_max||job.salary_min).toLocaleString()}` : "Salary not listed",
        posted: job.date ? new Date(job.date*1000).toLocaleDateString("en-GB") : "Recently",
        description: (job.description||"").replace(/<[^>]*>/g,"").slice(0,300),
        url: job.url||`https://remoteok.com/l/${job.slug}`,
        platform:"remoteok", tags: job.tags||[] }))
      .filter(j => j.title && j.company && score(j, tokens) > 0);
  } catch(err) { console.error("RemoteOK error:", err.message); return []; }
}

// ── Arbeitnow ────────────────────────────────────────────────────────────────
async function fetchArbeitnow(query) {
  try {
    const { data } = await axios.get(
      `https://www.arbeitnow.com/api/job-board-api?search=${encodeURIComponent(query)}`,
      { headers: HEADERS, timeout: 8000 });
    return (data.data||[]).slice(0,20).map(job => ({
      id:`arbeitnow_${job.slug}`, title:job.title||"", company:job.company_name||"",
      location:job.location||"Remote", salary:"See listing",
      posted: job.created_at ? new Date(job.created_at*1000).toLocaleDateString("en-GB") : "Recently",
      description:(job.description||"").replace(/<[^>]*>/g,"").slice(0,300),
      url:job.url||"", platform:"arbeitnow", tags:job.tags||[] }));
  } catch(err) { console.error("Arbeitnow error:", err.message); return []; }
}

// ── Jobicy ───────────────────────────────────────────────────────────────────
async function fetchJobicy(query) {
  try {
    const { data } = await axios.get(
      `https://jobicy.com/api/v2/remote-jobs?tag=${encodeURIComponent(query)}&count=20`,
      { headers: HEADERS, timeout: 8000 });
    return (data.jobs||[]).map(job => ({
      id:`jobicy_${job.id}`, title:job.jobTitle||"", company:job.companyName||"",
      location:job.jobGeo||"Remote",
      salary: job.annualSalaryMin ? `$${Number(job.annualSalaryMin).toLocaleString()} – $${Number(job.annualSalaryMax||job.annualSalaryMin).toLocaleString()}` : "Salary not listed",
      posted: job.pubDate ? new Date(job.pubDate).toLocaleDateString("en-GB") : "Recently",
      description:(job.jobDescription||"").replace(/<[^>]*>/g,"").slice(0,300),
      url:job.url||"", platform:"jobicy", tags:job.jobType?[job.jobType]:[] }));
  } catch(err) { console.error("Jobicy error:", err.message); return []; }
}

// ── Adzuna (needs ADZUNA_APP_ID + ADZUNA_APP_KEY env vars) ───────────────────
async function fetchAdzuna(query, country = "gb") {
  const appId  = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return [];
  const cc = country === "us" ? "us" : country === "in" ? "in" : "gb";
  // Build URL manually to avoid any param encoding issues
  const url = `https://api.adzuna.com/v1/api/jobs/${cc}/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=25&what=${encodeURIComponent(query)}&sort_by=relevance`;
  try {
    const { data } = await axios.get(url, {
      timeout: 10000,
      headers: { Accept: "application/json" }
    });
    return (data.results||[]).map(job => ({
      id:`adzuna_${job.id}`, title:job.title||"", company:job.company?.display_name||"",
      location:job.location?.display_name||"",
      salary: job.salary_min ? `£${Math.round(job.salary_min/1000)}k – £${Math.round((job.salary_max||job.salary_min)/1000)}k` : "Salary not listed",
      posted: job.created ? new Date(job.created).toLocaleDateString("en-GB") : "Recently",
      description:(job.description||"").slice(0,300),
      url:job.redirect_url||"", platform:"adzuna", tags:[] }));
  } catch(err) {
    console.error("Adzuna error:", err.response?.status, err.response?.data || err.message);
    return [];
  }
}

// ── Greenhouse public boards (no API key needed) ──────────────────────────────
// Real companies publishing public Greenhouse job boards (no auth needed)
const GREENHOUSE_SLUGS = [
  // ── Big Tech & Product-led SaaS ──────────────────────────────────────────────
  "airbnb","stripe","hubspot","figma","mongodb","twilio","zendesk","asana",
  "dropbox","datadog","hashicorp","canva","robinhood","coinbase","plaid",
  "brex","rippling","lattice","notion","gusto","checkr","intercom",
  "mixpanel","segment","amplitude","loom","miro","linear","retool",
  // ── AI & ML companies ────────────────────────────────────────────────────────
  "openai","anthropic","cohere","scale-ai","huggingface","runway",
  "stability","inflection","adept","character","mistral",
  // ── Consumer & Marketplace ───────────────────────────────────────────────────
  "doordash","peloton","duolingo","discord","roblox","snap","pinterest",
  "etsy","chewy","bumble","calm","noom","headspace","betterup",
  "coursera","udemy","masterclass","brainly","quizlet","kahoot",
  // ── HR, Ops & Productivity ───────────────────────────────────────────────────
  "airtable","webflow","clickup","freshworks","monday","navan",
  "deel","remote","oyster","papaya-global","personio","workable",
  // ── Enterprise & Fortune 500 ─────────────────────────────────────────────────
  "thoughtworks","tripadvisor","squarespace","shutterstock","wayfair",
  "grubhub","pagerduty","zuora","zenefits","namely","lever","greenhouse",
  "gartner","samsara","toast","benchling","verkada","weave",
  "draftKings","fanduel","draftkings","expedia","booking","tripadvisor",
  // ── Fintech & Payments ───────────────────────────────────────────────────────
  "transferwise","wise","braintree","adyen","marqeta","affirm","chime",
  "ramp","mercury","unit","treasury-prime","modern-treasury","lithic",
  "checkout","klarna","nubank","n26","monzo","revolut","starling",
  "goCardless","gocardless","sumup","curve","tide","freetrade","oaknorth",
  // ── Cyber, Infra & DevTools ──────────────────────────────────────────────────
  "snyk","lacework","orca-security","wiz","axonius","ermetic",
  "netlify","supabase","planetscale","neon","airbyte","fivetran",
  "dbt-labs","hightouch","census","segment",
  // ── Healthcare & Biotech ─────────────────────────────────────────────────────
  "ro","hims","headway","cerebral","spring-health","lyra-health",
  "tempus","recursion","insitro","benchling",
  // ── UK & European HQ ─────────────────────────────────────────────────────────
  "deliveroo","bulb","octopus-energy","secondnature","unmind",
  "cleo","coconut","countingup","habito","cazoo","zego",
];

async function fetchGreenhouseCompany(slug, tokens) {
  try {
    const { data } = await axios.get(
      `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`,
      { timeout: 5000, headers:{ Accept:"application/json" }});
    return (data.jobs||[])
      .map(job => ({
        id:`gh_${slug}_${job.id}`,
        title: job.title||"",
        company: slug.charAt(0).toUpperCase()+slug.slice(1).replace(/-/g," "),
        location: (job.location?.name)||"",
        salary: "See listing",
        posted: job.updated_at ? new Date(job.updated_at).toLocaleDateString("en-GB") : "Recently",
        description: "",
        url: job.absolute_url||`https://boards.greenhouse.io/${slug}`,
        platform:"greenhouse", tags:[] }))
      .filter(j => j.title && score(j, tokens) > 0);
  } catch { return []; }
}

async function fetchAllGreenhouse(tokens, query) {
  // Run up to 30 companies in parallel, with individual timeouts
  const results = await Promise.allSettled(
    GREENHOUSE_SLUGS.map(slug => fetchGreenhouseCompany(slug, tokens))
  );
  return results.flatMap(r => r.status === "fulfilled" ? r.value : []);
}

// Real companies publishing public Lever job boards (no auth needed)
const LEVER_SLUGS = [
  // ── Media, Consumer & Gaming ─────────────────────────────────────────────────
  "netflix","spotify","reddit","lyft","yelp","eventbrite","glassdoor",
  "twitch","medium","substack","buzzfeed","vox","axios",
  // ── E-commerce & Retail ──────────────────────────────────────────────────────
  "shopify","bigcommerce","faire","returnly","loop-returns",
  // ── Enterprise SaaS ──────────────────────────────────────────────────────────
  "expensify","carta","flexport","checkr","modern-health",
  "remitly","domo","zscaler","cloudflare","fastly","pendo",
  "bazaarvoice","podium","qualtrics","degreed","instructure","ivanti",
  "pluralsight","workfront","entelo","lever","greenhouse-software",
  "lucidchart","divvy","healthequity","workspot","automox","clearbit",
  // ── Data, Analytics & AI ─────────────────────────────────────────────────────
  "databricks","confluent","dbt-labs","prefect","dagster",
  "metabase","grafana","posthog","mixpanel",
  // ── Dev Tools & Infra ────────────────────────────────────────────────────────
  "gitlab","netlify","vercel","render","railway","fly","tailscale",
  "1password","bitwarden","dashlane","nordvpn","proton",
  "sentry","rollbar","honeycomb","incident-io","opsgenie",
  // ── Fintech ──────────────────────────────────────────────────────────────────
  "kraken","gemini","blockchain","paxos","anchorage",
  "brex","pipe","capchase","clearco","lighter-capital",
  // ── Future of Work & HR Tech ─────────────────────────────────────────────────
  "remote","deel","oyster","boundless","globalhr","horizons",
  "lattice","culture-amp","15five","leapsome","workleap",
  // ── UK Tech ──────────────────────────────────────────────────────────────────
  "monzo","revolut","starling-bank","oaknorth","atom-bank","tandem",
  "iwoca","funding-circle","zopa","assetz-capital","folk2folk",
  "bulb","octopus","ovo","ecotricity","pod-point","osprey",
];

async function fetchLeverCompany(slug, tokens) {
  try {
    const { data } = await axios.get(
      `https://api.lever.co/v0/postings/${slug}?mode=json`,
      { timeout: 5000, headers:{ Accept:"application/json" }});
    if (!Array.isArray(data)) return [];
    return data
      .map(job => ({
        id:`lever_${slug}_${job.id}`,
        title: job.text||"",
        company: slug.charAt(0).toUpperCase()+slug.slice(1).replace(/-/g," "),
        location: job.categories?.location||job.categories?.allLocations?.[0]||"",
        salary: "See listing",
        posted: job.createdAt ? new Date(job.createdAt).toLocaleDateString("en-GB") : "Recently",
        description: (job.descriptionPlain||job.description||"").replace(/<[^>]*>/g,"").slice(0,300),
        url: job.hostedUrl||`https://jobs.lever.co/${slug}`,
        platform:"lever", tags: job.categories?.team ? [job.categories.team] : [] }))
      .filter(j => j.title && score(j, tokens) > 0);
  } catch { return []; }
}

async function fetchAllLever(tokens) {
  const results = await Promise.allSettled(
    LEVER_SLUGS.map(slug => fetchLeverCompany(slug, tokens))
  );
  return results.flatMap(r => r.status === "fulfilled" ? r.value : []);
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const {
    query   = "software engineer",
    country = "uk",
    type    = "all",
    location = "",
    salaryMin = "",
  } = req.query;

  const tokens = tokenise(query);
  const skipOnsite = type === "remote";

  try {
    // Run all sources in parallel
    const [
      reedRes, remoteOKRes, arbeitnowRes, jobicyRes,
      adzunaRes, greenhouseRes, leverRes
    ] = await Promise.allSettled([
      skipOnsite ? Promise.resolve([]) : scrapeReed(query, location || country),
      fetchRemoteOK(tokens),
      fetchArbeitnow(query),
      fetchJobicy(query),
      fetchAdzuna(query, country),
      fetchAllGreenhouse(tokens, query),
      fetchAllLever(tokens),
    ]);

    const extract = r => r.status === "fulfilled" ? r.value : [];

    // Combine
    let all = [
      ...extract(reedRes),
      ...extract(remoteOKRes),
      ...extract(arbeitnowRes),
      ...extract(jobicyRes),
      ...extract(adzunaRes),
      ...extract(greenhouseRes),
      ...extract(leverRes),
    ].filter(j => j.title && j.company);

    // Score every job
    all = all.map(j => ({ ...j, _score: score(j, tokens) }));

    // Remove zero-score results (no title match)
    all = all.filter(j => j._score > 0);

    // Deduplicate by title+company
    const seen = new Set();
    all = all.filter(j => {
      const key = `${j.title.toLowerCase().slice(0,40)}|${j.company.toLowerCase().slice(0,30)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort: highest score first, then by platform (greenhouse/lever = real companies)
    all.sort((a, b) => {
      if (b._score !== a._score) return b._score - a._score;
      const tier = p => ["greenhouse","lever","adzuna","reed"].indexOf(p);
      return tier(a.platform) - tier(b.platform);
    });

    // Remove internal score field before sending
    const jobs = all.map(({ _score, ...j }) => j);

    return res.json({
      jobs,
      total: jobs.length,
      sources: {
        reed:        extract(reedRes).length,
        remoteok:    extract(remoteOKRes).length,
        arbeitnow:   extract(arbeitnowRes).length,
        jobicy:      extract(jobicyRes).length,
        adzuna:      extract(adzunaRes).length,
        greenhouse:  extract(greenhouseRes).length,
        lever:       extract(leverRes).length,
      },
    });

  } catch (err) {
    console.error("Jobs error:", err);
    return res.status(500).json({ error: "Job search failed", jobs: [] });
  }
}
