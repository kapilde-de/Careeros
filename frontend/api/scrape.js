// frontend/api/scrape.js
// Scrapes job description from any URL

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: "URL required" });

  try {
    // Fetch the page
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-GB,en;q=0.9",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);

    const html = await response.text();

    // Extract text content - remove scripts, styles, nav
    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, " ")
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, " ")
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " ")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, " ")
      .trim();

    // Try to find the job description section
    // Look for common job description patterns
    const jdPatterns = [
      /job description[:\s]+([\s\S]{200,3000}?)(?:about us|requirements|qualifications|apply|benefits|salary)/i,
      /about the role[:\s]+([\s\S]{200,3000}?)(?:about us|requirements|qualifications|apply|benefits)/i,
      /the role[:\s]+([\s\S]{200,3000}?)(?:about us|requirements|qualifications|apply|benefits)/i,
      /responsibilities[:\s]+([\s\S]{200,3000}?)(?:about us|requirements|qualifications|apply|benefits)/i,
    ];

    let extracted = "";
    for (const pattern of jdPatterns) {
      const match = text.match(pattern);
      if (match) { extracted = match[0]; break; }
    }

    // If no pattern match, just take a smart chunk of the text
    if (!extracted || extracted.length < 200) {
      // Find the densest "job-like" section
      const words = ["experience", "responsibilities", "requirements", "skills", "role", "position", "salary", "team"];
      let bestStart = 0, bestScore = 0;
      for (let i = 0; i < text.length - 2000; i += 200) {
        const chunk = text.slice(i, i + 2000).toLowerCase();
        const score = words.reduce((acc, w) => acc + (chunk.split(w).length - 1), 0);
        if (score > bestScore) { bestScore = score; bestStart = i; }
      }
      extracted = text.slice(bestStart, bestStart + 3000);
    }

    // Clean up and limit
    const cleaned = extracted.replace(/\s+/g, " ").trim().slice(0, 4000);

    // Extract title if possible
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(/[|–-].*/, "").trim() : "Job Role";

    return res.status(200).json({
      success: true,
      title,
      content: cleaned,
      url,
    });

  } catch (err) {
    console.error("Scrape error:", err.message);
    return res.status(500).json({
      error: "Could not fetch this URL. Please paste the job description manually.",
      details: err.message,
    });
  }
}
