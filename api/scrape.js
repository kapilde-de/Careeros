// frontend/api/scrape.js

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: "URL required" });

  // ── Detect platform ───────────────────────────────────────────────────────
  const isLinkedIn = url.includes("linkedin.com");
  const isIndeed = url.includes("indeed.com");
  const isReed = url.includes("reed.co.uk");
  const isAdzuna = url.includes("adzuna.co.uk") || url.includes("adzuna.com");
  const isTotalJobs = url.includes("totaljobs.com");
  const isCVLibrary = url.includes("cv-library.co.uk");
  const isGlassdoor = url.includes("glassdoor.co.uk") || url.includes("glassdoor.com");

  // LinkedIn requires login — can't scrape. Give helpful message.
  if (isLinkedIn) {
    return res.status(400).json({
      error: "linkedin_blocked",
      message: "LinkedIn requires login to view job details. Please open the job on LinkedIn, copy the full job description text, and paste it in the Job Description box.",
      platform: "LinkedIn",
    });
  }

  // Glassdoor also blocks scraping
  if (isGlassdoor) {
    return res.status(400).json({
      error: "glassdoor_blocked",
      message: "Glassdoor blocks automated access. Please open the job on Glassdoor, copy the job description, and paste it manually.",
      platform: "Glassdoor",
    });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Upgrade-Insecure-Requests": "1",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // Check if we got a login/auth wall
    const loginWallIndicators = [
      "sign in to view",
      "log in to view",
      "please sign in",
      "please log in",
      "create an account to",
      "register to view",
      "login required",
    ];
    const htmlLower = html.toLowerCase();
    const hitLoginWall = loginWallIndicators.some(indicator => htmlLower.includes(indicator));

    if (hitLoginWall && html.length < 50000) {
      return res.status(400).json({
        error: "login_required",
        message: `This job site requires you to be logged in. Please open the job in your browser, copy the job description text, and paste it manually.`,
      });
    }

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]{3,200})<\/title>/i);
    let title = titleMatch ? titleMatch[1].replace(/\s*[\|–\-—]\s*.*/g, "").trim() : "Job Role";
    // Clean common title patterns
    title = title.replace(/jobs?\s+at\s+/i, "").replace(/\s+\|\s+.*$/i, "").trim();

    // ── Platform-specific extraction ────────────────────────────────────────

    let extracted = "";

    // Reed.co.uk — use official Reed API for reliable extraction
    if (isReed) {
      try {
        const jobIdMatch = url.match(/\/(\d{6,})/);
        if (jobIdMatch) {
          const jobId = jobIdMatch[1];
          const reedApiKey = process.env.REED_API_KEY || "";
          const auth = Buffer.from(`${reedApiKey}:`).toString("base64");
          const reedRes = await fetch(`https://www.reed.co.uk/api/1.0/jobs/${jobId}`, {
            headers: { "Authorization": `Basic ${auth}`, "Accept": "application/json" },
            signal: AbortSignal.timeout(8000),
          });
          if (reedRes.ok) {
            const reedData = await reedRes.json();
            if (reedData.jobDescription) {
              const desc = reedData.jobDescription
                .replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n")
                .replace(/<\/li>/gi, "\n").replace(/<[^>]+>/g, " ")
                .replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&pound;/g, "£")
                .replace(/\s{3,}/g, "\n").trim();
              const meta = [
                reedData.jobTitle && `Role: ${reedData.jobTitle}`,
                reedData.employerName && `Company: ${reedData.employerName}`,
                reedData.locationName && `Location: ${reedData.locationName}`,
                reedData.minimumSalary && `Salary: £${reedData.minimumSalary}–£${reedData.maximumSalary || reedData.minimumSalary}`,
              ].filter(Boolean).join("\n");
              return res.status(200).json({
                success: true,
                title: reedData.jobTitle || title,
                content: `${meta}\n\n${desc}`.slice(0, 5000),
                platform: "Reed",
                url,
              });
            }
          }
        }
      } catch (reedErr) {
        console.error("Reed API error:", reedErr.message);
        // Fall through to generic HTML extraction
      }
    }

    // Indeed — has jobDescriptionText
    if (isIndeed && !extracted) {
      const indeedMatch = html.match(/id="jobDescriptionText"[^>]*>([\s\S]{100,8000}?)<\/div>/i)
        || html.match(/class="[^"]*jobsearch-jobDescriptionText[^"]*"[^>]*>([\s\S]{100,8000}?)<\/div>/i);
      if (indeedMatch) extracted = indeedMatch[1];
    }

    // Adzuna
    if (isAdzuna && !extracted) {
      const adzunaMatch = html.match(/class="[^"]*job-description[^"]*"[^>]*>([\s\S]{100,8000}?)<\/(?:div|section)>/i)
        || html.match(/class="[^"]*adp-body[^"]*"[^>]*>([\s\S]{100,8000}?)<\/(?:div|section)>/i);
      if (adzunaMatch) extracted = adzunaMatch[1];
    }

    // Generic extraction if platform-specific didn't work
    if (!extracted || extracted.length < 100) {
      // Remove noise elements
      let clean = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, " ")
        .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, " ")
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, " ")
        .replace(/<!--[\s\S]*?-->/g, " ");

      // Convert to text
      clean = clean
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n")
        .replace(/<\/li>/gi, "\n")
        .replace(/<\/h[1-6]>/gi, "\n")
        .replace(/<[^>]+>/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&nbsp;/g, " ")
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&pound;/g, "£")
        .replace(/\s{3,}/g, "\n")
        .trim();

      // Find the most job-dense section
      const jobWords = ["responsibilities","requirements","experience","skills","qualifications","salary","benefits","role","position","team","candidate","apply"];
      let bestStart = 0, bestScore = 0;
      const chunkSize = 2500;
      const step = 300;

      for (let i = 0; i < Math.max(0, clean.length - chunkSize); i += step) {
        const chunk = clean.slice(i, i + chunkSize).toLowerCase();
        const score = jobWords.reduce((acc, w) => acc + (chunk.split(w).length - 1) * 2, 0);
        if (score > bestScore) { bestScore = score; bestStart = i; }
      }

      extracted = clean.slice(bestStart, bestStart + chunkSize);
    } else {
      // Clean the extracted HTML
      extracted = extracted
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n")
        .replace(/<\/li>/gi, "\n")
        .replace(/<[^>]+>/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&nbsp;/g, " ")
        .replace(/&pound;/g, "£")
        .replace(/&#39;/g, "'")
        .replace(/\s{3,}/g, "\n")
        .trim();
    }

    if (!extracted || extracted.length < 80) {
      return res.status(400).json({
        error: "extraction_failed",
        message: "Could not extract job description from this page. Please copy and paste the job description text manually.",
      });
    }

    return res.status(200).json({
      success: true,
      title: title.slice(0, 100),
      content: extracted.slice(0, 5000),
      platform: isReed ? "Reed" : isIndeed ? "Indeed" : isAdzuna ? "Adzuna" : isTotalJobs ? "TotalJobs" : "Job Board",
      url,
    });

  } catch (err) {
    console.error("Scrape error:", err.message);

    // Timeout
    if (err.name === "TimeoutError" || err.message.includes("timeout")) {
      return res.status(400).json({
        error: "timeout",
        message: "The job page took too long to load. Please copy and paste the job description manually.",
      });
    }

    return res.status(500).json({
      error: "fetch_failed",
      message: "Could not load this page. Please copy and paste the job description manually.",
      details: err.message,
    });
  }
}
