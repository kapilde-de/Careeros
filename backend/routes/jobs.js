const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-GB,en;q=0.9',
};

// ── Reed scraper ──────────────────────────────────────────────────────────────
async function scrapeReed(query, location = 'uk') {
  try {
    const loc = location === 'us' ? 'united-states' : location === 'in' ? 'india' : 'united-kingdom';
    const slug = query.toLowerCase().replace(/\s+/g, '-');
    const url = `https://www.reed.co.uk/jobs/${slug}-jobs?keywords=${encodeURIComponent(query)}&location=${loc}&fulltime=True`;

    const { data } = await axios.get(url, { headers: HEADERS, timeout: 8000 });
    const $ = cheerio.load(data);
    const jobs = [];

    $('article[data-job-id]').each((_, el) => {
      const id = $(el).attr('data-job-id');
      const title = $(el).find('h2.title a, [data-qa="job-title"]').first().text().trim();
      const company = $(el).find('.recruiter, [data-qa="job-recruiter"]').first().text().trim();
      const locationText = $(el).find('.location, [data-qa="job-location"]').first().text().trim();
      const salary = $(el).find('.salary, [data-qa="job-salary"]').first().text().trim();
      const posted = $(el).find('.posted, [data-qa="job-posted"]').first().text().trim();
      const snippet = $(el).find('.description, [data-qa="job-description"]').first().text().trim().slice(0, 200);
      const href = $(el).find('h2.title a, [data-qa="job-title"]').first().attr('href') || '';

      if (title && company) {
        jobs.push({
          id: `reed_${id || Date.now() + Math.random()}`,
          title,
          company,
          location: locationText || loc,
          salary: salary || 'Salary not listed',
          posted: posted || 'Recently',
          description: snippet,
          url: href.startsWith('http') ? href : `https://www.reed.co.uk${href}`,
          platform: 'reed',
        });
      }
    });

    return jobs.slice(0, 20);
  } catch (err) {
    console.error('Reed scrape error:', err.message);
    return [];
  }
}

// ── RemoteOK API (free, no key) ───────────────────────────────────────────────
async function fetchRemoteOK(query) {
  try {
    const { data } = await axios.get('https://remoteok.com/api', {
      headers: { ...HEADERS, 'Accept': 'application/json' },
      timeout: 8000,
    });

    // First element is a notice object, skip it
    const listings = Array.isArray(data) ? data.slice(1) : [];
    const q = query.toLowerCase();

    return listings
      .filter(job => {
        const text = `${job.position} ${job.company} ${(job.tags || []).join(' ')}`.toLowerCase();
        return q.split(' ').some(word => word.length > 2 && text.includes(word));
      })
      .slice(0, 15)
      .map(job => ({
        id: `remoteok_${job.id}`,
        title: job.position || '',
        company: job.company || '',
        location: 'Remote',
        salary: job.salary_min ? `$${job.salary_min.toLocaleString()} – $${job.salary_max?.toLocaleString() || '?'}` : 'Salary not listed',
        posted: job.date ? new Date(job.date * 1000).toLocaleDateString('en-GB') : 'Recently',
        description: (job.description || '').replace(/<[^>]*>/g, '').slice(0, 200),
        url: job.url || `https://remoteok.com/l/${job.slug}`,
        platform: 'remoteok',
        tags: job.tags || [],
      }));
  } catch (err) {
    console.error('RemoteOK error:', err.message);
    return [];
  }
}

// ── Arbeitnow API (free, no key, remote + EU) ─────────────────────────────────
async function fetchArbeitnow(query) {
  try {
    const { data } = await axios.get(
      `https://www.arbeitnow.com/api/job-board-api?search=${encodeURIComponent(query)}`,
      { headers: HEADERS, timeout: 8000 }
    );

    return (data.data || []).slice(0, 15).map(job => ({
      id: `arbeitnow_${job.slug}`,
      title: job.title || '',
      company: job.company_name || '',
      location: job.location || 'Remote',
      salary: 'See listing',
      posted: job.created_at ? new Date(job.created_at * 1000).toLocaleDateString('en-GB') : 'Recently',
      description: (job.description || '').replace(/<[^>]*>/g, '').slice(0, 200),
      url: job.url || '',
      platform: 'arbeitnow',
      tags: job.tags || [],
    }));
  } catch (err) {
    console.error('Arbeitnow error:', err.message);
    return [];
  }
}

// ── Jobicy API (free, no key, remote jobs) ────────────────────────────────────
async function fetchJobicy(query) {
  try {
    const { data } = await axios.get(
      `https://jobicy.com/api/v2/remote-jobs?tag=${encodeURIComponent(query)}&count=15`,
      { headers: HEADERS, timeout: 8000 }
    );

    return (data.jobs || []).slice(0, 15).map(job => ({
      id: `jobicy_${job.id}`,
      title: job.jobTitle || '',
      company: job.companyName || '',
      location: job.jobGeo || 'Remote',
      salary: job.annualSalaryMin
        ? `$${Number(job.annualSalaryMin).toLocaleString()} – $${Number(job.annualSalaryMax).toLocaleString()}`
        : 'Salary not listed',
      posted: job.pubDate ? new Date(job.pubDate).toLocaleDateString('en-GB') : 'Recently',
      description: (job.jobDescription || '').replace(/<[^>]*>/g, '').slice(0, 200),
      url: job.url || '',
      platform: 'jobicy',
      tags: job.jobType ? [job.jobType] : [],
    }));
  } catch (err) {
    console.error('Jobicy error:', err.message);
    return [];
  }
}

// ── Route ─────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { query = 'software engineer', country = 'uk', source = 'all', type = 'all', location = '', salaryMin = '' } = req.query;

  try {
    // Run all sources in parallel (skip non-remote sources when type=remote)
    const skipOnsite = type === 'remote';
    const [reedJobs, remoteJobs, arbeitnowJobs, jobicyJobs] = await Promise.allSettled([
      skipOnsite ? Promise.resolve([]) : scrapeReed(query, location || country),
      fetchRemoteOK(query),
      fetchArbeitnow(query),
      fetchJobicy(query),
    ]);

    const extract = r => (r.status === 'fulfilled' ? r.value : []);

    const all = [
      ...extract(reedJobs),
      ...extract(remoteJobs),
      ...extract(arbeitnowJobs),
      ...extract(jobicyJobs),
    ].filter(j => j.title && j.company);

    // Deduplicate by title+company
    const seen = new Set();
    const unique = all.filter(j => {
      const key = `${j.title.toLowerCase()}|${j.company.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    res.json({
      jobs: unique,
      total: unique.length,
      sources: {
        reed: extract(reedJobs).length,
        remoteok: extract(remoteJobs).length,
        arbeitnow: extract(arbeitnowJobs).length,
        jobicy: extract(jobicyJobs).length,
      },
    });
  } catch (err) {
    console.error('Jobs route error:', err);
    res.status(500).json({ error: 'Job search failed', jobs: [] });
  }
});

module.exports = router;
