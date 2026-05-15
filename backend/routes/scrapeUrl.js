const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-GB,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate',
};

router.post('/', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL missing' });

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    // Block sites that require auth
    if (hostname.includes('linkedin.com')) {
      return res.json({ error: 'linkedin_blocked', message: 'LinkedIn requires login — copy the job description manually.' });
    }
    if (hostname.includes('glassdoor.')) {
      return res.json({ error: 'glassdoor_blocked', message: 'Glassdoor blocks auto-import — copy the job description manually.' });
    }

    const { data } = await axios.get(url, { headers: HEADERS, timeout: 10000, maxRedirects: 5 });
    const $ = cheerio.load(data);

    // Remove noise elements
    $('script, style, nav, header, footer, aside, [class*="cookie"], [class*="banner"], [id*="cookie"], [id*="nav"], [class*="sidebar"]').remove();

    // Try common job description selectors first
    const selectors = [
      '[class*="job-description"]',
      '[class*="jobDescription"]',
      '[class*="job_description"]',
      '[id*="job-description"]',
      '[id*="jobDescription"]',
      '[class*="description"]',
      'article',
      'main',
      '.content',
      '#content',
    ];

    let content = '';
    for (const sel of selectors) {
      const el = $(sel).first();
      if (el.length && el.text().trim().length > 200) {
        content = el.text().trim();
        break;
      }
    }

    // Fallback: grab all body text
    if (!content || content.length < 200) {
      content = $('body').text().trim();
    }

    // Clean up whitespace
    content = content.replace(/\s{3,}/g, '\n\n').replace(/\n{4,}/g, '\n\n').trim();

    // Truncate to 5000 chars max for prompt use
    if (content.length > 5000) content = content.slice(0, 5000) + '...';

    if (!content || content.length < 100) {
      return res.json({ error: 'no_content', message: 'Could not extract text from this page. Please paste the job description manually.' });
    }

    res.json({ content });
  } catch (err) {
    console.error('scrapeUrl error:', err.message);
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      return res.json({ error: 'unreachable', message: 'Could not reach that URL. Check the link and try again.' });
    }
    res.json({ error: 'fetch_failed', message: 'Could not fetch this page. Please paste the job description manually.' });
  }
});

module.exports = router;
