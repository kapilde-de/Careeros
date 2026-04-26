// ─── FILE: frontend/api/jobs.js ───────────────────────────────────────────────
// Global job search API — Adzuna + JSearch + Reed

const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY;
const JSEARCH_KEY = process.env.JSEARCH_KEY;
const REED_API_KEY = process.env.REED_API_KEY;

const ADZUNA_COUNTRIES = { uk:"gb", us:"us", in:"in" };

// ── Visa sponsorship detection ────────────────────────────────────────────────
// Only returns true if the job description EXPLICITLY mentions visa sponsorship
function detectVisaSponsorship(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  const visaPhrases = [
    "visa sponsorship",
    "sponsor visa",
    "tier 2 sponsor",
    "skilled worker visa",
    "work permit sponsor",
    "sponsorship available",
    "we will sponsor",
    "sponsorship provided",
    "visa support",
    "immigration support",
    "h1b sponsor",
    "h-1b sponsor",
    "sponsorship offered",
    "happy to sponsor",
    "able to sponsor",
  ];
  return visaPhrases.some(phrase => lower.includes(phrase));
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { query = "product manager", country = "uk", source = "both", page = 1 } = req.query;

  try {
    let jobs = [];

    if (source === "adzuna") {
      jobs = await searchAdzuna(query, country, page);
    } else if (source === "jsearch") {
      jobs = await searchJSearch(query, country);
    } else if (source === "reed") {
      jobs = await searchReed(query, page);
    } else {
      const [adzunaJobs, jsearchJobs, reedJobs] = await Promise.allSettled([
        searchAdzuna(query, country, page),
        searchJSearch(query, country),
        country === "uk" ? searchReed(query, page) : Promise.resolve([]),
      ]);
      const a = adzunaJobs.status === "fulfilled" ? adzunaJobs.value : [];
      const b = jsearchJobs.status === "fulfilled" ? jsearchJobs.value : [];
      const c = reedJobs.status === "fulfilled" ? reedJobs.value : [];
      jobs = [...a, ...b, ...c];
    }

    return res.status(200).json({ jobs, count: jobs.length });
  } catch (err) {
    console.error("Job search error:", err);
    return res.status(500).json({ error: err.message, jobs: [] });
  }
}

async function searchAdzuna(query, country, page = 1) {
  const countryCode = ADZUNA_COUNTRIES[country] || "gb";
  const url = `https://api.adzuna.com/v1/api/jobs/${countryCode}/search/${page}?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=10&what=${encodeURIComponent(query)}&content-type=application/json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Adzuna error: ${res.status}`);
  const data = await res.json();
  return (data.results || []).map(job => {
    const description = job.description || "";
    return {
      id: job.id,
      title: job.title,
      company: job.company?.display_name || "Unknown Company",
      location: job.location?.display_name || "Unknown Location",
      salary: formatSalary(job.salary_min, job.salary_max, country),
      description: description.slice(0, 400) + (description.length > 400 ? "..." : ""),
      url: job.redirect_url || "",
      posted: formatDate(job.created),
      platform: "adzuna",
      country: country.toUpperCase(),
      type: job.contract_time === "full_time" ? "Full-time" : job.contract_time || "Full-time",
      tags: extractTags(job.title + " " + description),
      match: Math.floor(Math.random() * 25) + 65,
      visaSponsorship: detectVisaSponsorship(description),
      source: "Adzuna",
    };
  });
}

async function searchJSearch(query, country) {
  const locationStr = country === "in" ? "India" : country === "us" ? "United States" : "United Kingdom";
  const searchQuery = `${query} in ${locationStr}`;
  const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(searchQuery)}&num_pages=1&page=1`;
  const res = await fetch(url, {
    headers: {
      "X-RapidAPI-Key": JSEARCH_KEY,
      "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
    },
  });
  if (!res.ok) throw new Error(`JSearch error: ${res.status}`);
  const data = await res.json();
  return (data.data || []).map(job => {
    const description = job.job_description || "";
    return {
      id: job.job_id,
      title: job.job_title,
      company: job.employer_name || "Unknown Company",
      location: [job.job_city, job.job_country].filter(Boolean).join(", "),
      salary: job.job_min_salary && job.job_max_salary
        ? `${formatCurrency(country)}${Math.round(job.job_min_salary/1000)}k–${formatCurrency(country)}${Math.round(job.job_max_salary/1000)}k`
        : "Competitive",
      description: description.slice(0, 400) + (description.length > 400 ? "..." : ""),
      url: job.job_apply_link || "",
      posted: job.job_posted_at_datetime_utc ? formatDate(job.job_posted_at_datetime_utc) : "Recently",
      platform: job.job_publisher?.toLowerCase().includes("linkedin") ? "linkedin"
        : job.job_publisher?.toLowerCase().includes("indeed") ? "indeed"
        : job.job_publisher?.toLowerCase().includes("glassdoor") ? "glassdoor" : "jsearch",
      country: country.toUpperCase(),
      type: job.job_employment_type || "Full-time",
      tags: extractTags(job.job_title + " " + description),
      match: Math.floor(Math.random() * 25) + 65,
      visaSponsorship: detectVisaSponsorship(description),
      source: job.job_publisher || "JSearch",
    };
  });
}

async function searchReed(query, page = 1) {
  const credentials = Buffer.from(REED_API_KEY + ":").toString("base64");
  const url = `https://www.reed.co.uk/api/1.0/search?keywords=${encodeURIComponent(query)}&resultsToTake=10&resultsToSkip=${(page-1)*10}`;
  const res = await fetch(url, {
    headers: { "Authorization": `Basic ${credentials}` }
  });
  if (!res.ok) throw new Error(`Reed error: ${res.status}`);
  const data = await res.json();
  return (data.results || []).map(job => {
    const description = job.jobDescription || "";
    return {
      id: "reed-" + job.jobId,
      title: job.jobTitle,
      company: job.employerName || "Unknown",
      location: job.locationName || "UK",
      salary: job.minimumSalary && job.maximumSalary
        ? `£${Math.round(job.minimumSalary/1000)}k–£${Math.round(job.maximumSalary/1000)}k`
        : job.minimumSalary ? `£${Math.round(job.minimumSalary/1000)}k+` : "Competitive",
      description: description.slice(0, 400) + (description.length > 400 ? "..." : ""),
      url: job.jobUrl || "",
      posted: formatDate(job.date),
      platform: "reed",
      country: "UK",
      type: job.contractType || "Full-time",
      tags: extractTags(job.jobTitle + " " + description),
      match: Math.floor(Math.random() * 25) + 65,
      visaSponsorship: detectVisaSponsorship(description),
      source: "Reed",
    };
  });
}

function formatSalary(min, max, country) {
  if (!min && !max) return "Competitive";
  const currency = formatCurrency(country);
  const minK = min ? `${currency}${Math.round(min/1000)}k` : "";
  const maxK = max ? `${currency}${Math.round(max/1000)}k` : "";
  if (minK && maxK) return `${minK}–${maxK}`;
  return minK || maxK;
}

function formatCurrency(country) {
  if (country === "us") return "$";
  if (country === "in") return "₹";
  return "£";
}

function formatDate(dateStr) {
  if (!dateStr) return "Recently";
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1d ago";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays/7)}w ago`;
  return `${Math.floor(diffDays/30)}mo ago`;
}

function extractTags(text) {
  const keywords = [
    "Python","JavaScript","React","Node","AWS","Azure","GCP",
    "SQL","Product","Agile","Scrum","Leadership","Strategy",
    "Sales","Marketing","Finance","Data","AI","ML","Java",
    "DevOps","Cloud","Remote","Management","Analytics","Design",
    "Engineering","Consulting","B2B","SaaS","Fintech","Healthcare",
  ];
  return keywords.filter(kw => text.toLowerCase().includes(kw.toLowerCase())).slice(0, 4);
}
