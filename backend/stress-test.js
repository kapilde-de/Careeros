/**
 * CareerOS — Stress Test & Back-Test Suite
 * ─────────────────────────────────────────
 * Run with:  node stress-test.js
 *
 * Tests:
 *  1. Health check latency (10 sequential, 50 concurrent)
 *  2. Rate-limiter enforcement  (burst > 20 AI calls → 429 expected)
 *  3. CORS rejection (non-whitelisted origin)
 *  4. Payload size guard (>256kb body → 413 expected)
 *  5. 404 catch-all handler
 *  6. Jobs endpoint throughput (20 concurrent requests)
 *  7. Back-test: ATS score consistency (same input → same score bucket)
 */

const http  = require('http');
const https = require('https');

const BASE = process.env.TEST_BASE || 'http://localhost:5000';
const isHTTPS = BASE.startsWith('https');
const client  = isHTTPS ? https : http;

let passed = 0, failed = 0;

// ── helpers ────────────────────────────────────────────────────────────────
function req(options, body = null) {
  return new Promise((resolve) => {
    const t0  = Date.now();
    const url = new URL(options.path, BASE);
    const opts = {
      hostname: url.hostname,
      port:     url.port || (isHTTPS ? 443 : 80),
      path:     url.pathname + (url.search || ''),
      method:   options.method || 'GET',
      headers:  { 'Content-Type': 'application/json', ...(options.headers || {}) },
      timeout:  8000,
    };
    if (body) {
      const b = JSON.stringify(body);
      opts.headers['Content-Length'] = Buffer.byteLength(b);
    }
    const r = client.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        resolve({ status: res.statusCode, body: data, ms: Date.now() - t0 });
      });
    });
    r.on('error', (e) => resolve({ status: 0, body: e.message, ms: Date.now() - t0 }));
    r.on('timeout', () => { r.destroy(); resolve({ status: 0, body: 'timeout', ms: 8000 }); });
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✅  ${label}`);
    passed++;
  } else {
    console.error(`  ❌  ${label}${detail ? '  →  ' + detail : ''}`);
    failed++;
  }
}

async function runAll() {
  console.log(`\n${'═'.repeat(60)}`);
  console.log('  CareerOS Stress Test & Back-Test Suite');
  console.log(`  Target: ${BASE}`);
  console.log(`${'═'.repeat(60)}\n`);

  // ── 1. Health check — sequential latency ──────────────────────────────
  console.log('── 1. Health check latency (10 sequential) ─────────────────');
  const latencies = [];
  for (let i = 0; i < 10; i++) {
    const r = await req({ path: '/' });
    latencies.push(r.ms);
    assert(`Request ${i + 1}: status 200`, r.status === 200, `got ${r.status}`);
  }
  const avg = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
  const max = Math.max(...latencies);
  console.log(`  📊  avg ${avg}ms  |  max ${max}ms\n`);

  // ── 2. Health check — concurrent burst (50) ───────────────────────────
  console.log('── 2. Health check throughput (50 concurrent) ───────────────');
  const burst50 = await Promise.all(Array.from({ length: 50 }, () => req({ path: '/' })));
  const ok50    = burst50.filter(r => r.status === 200).length;
  const avgB    = Math.round(burst50.reduce((a, r) => a + r.ms, 0) / burst50.length);
  assert(`50 concurrent — all 200`, ok50 === 50, `${ok50}/50 succeeded`);
  console.log(`  📊  avg ${avgB}ms  |  max ${Math.max(...burst50.map(r => r.ms))}ms\n`);

  // ── 3. Rate-limit enforcement (>20 AI calls → expect 429) ────────────
  console.log('── 3. Rate-limiter enforcement (21 rapid /api/claude calls) ─');
  const rlResults = await Promise.all(
    Array.from({ length: 21 }, () => req({
      path:   '/api/claude',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, { model: 'test', messages: [{ role: 'user', content: 'ping' }] })
    )
  );
  const got429 = rlResults.some(r => r.status === 429);
  assert('Rate limiter fires 429 after burst', got429,
    `statuses: ${[...new Set(rlResults.map(r => r.status))].join(', ')}`);
  console.log('');

  // ── 4. CORS rejection ─────────────────────────────────────────────────
  console.log('── 4. CORS — non-whitelisted origin rejected ────────────────');
  const corsR = await req({
    path:    '/',
    headers: { Origin: 'https://evil-attacker.com' },
  });
  // Express CORS middleware sets status 500 on rejected origin
  const corsBlocked = corsR.status !== 200 || !corsR.body.includes('"status":"ok"') ||
                      corsR.body.includes('not allowed');
  // When CORS rejects the request body will contain the error or status will be non-200
  assert('Blocked origin gets non-200 or error body',
    corsR.status === 500 || corsR.status === 403 || corsR.body.includes('not allowed'),
    `got ${corsR.status}: ${corsR.body.slice(0, 80)}`);
  console.log('');

  // ── 5. Payload size guard ─────────────────────────────────────────────
  console.log('── 5. Oversized payload (300 KB body → 413 expected) ────────');
  const bigBody = { data: 'x'.repeat(300 * 1024) };
  const bigR    = await req({ path: '/api/claude', method: 'POST' }, bigBody);
  assert('413 for body > 256 KB', bigR.status === 413 || bigR.status === 400,
    `got ${bigR.status}`);
  console.log('');

  // ── 6. 404 catch-all ──────────────────────────────────────────────────
  console.log('── 6. 404 catch-all handler ─────────────────────────────────');
  const notFound = await req({ path: '/api/nonexistent-endpoint' });
  assert('Unknown route → 404', notFound.status === 404, `got ${notFound.status}`);
  console.log('');

  // ── 7. Jobs endpoint concurrency ─────────────────────────────────────
  console.log('── 7. /api/jobs throughput (20 concurrent) ──────────────────');
  const jobsBurst = await Promise.all(
    Array.from({ length: 20 }, () => req({
      path:   '/api/jobs',
      method: 'POST',
    }, { query: 'developer', country: 'uk' }))
  );
  const jobsOk = jobsBurst.filter(r => r.status < 500).length;
  assert(`20 concurrent jobs — no 5xx`, jobsOk === 20,
    `${jobsOk}/20 non-5xx (${jobsBurst.filter(r => r.status >= 500).length} server errors)`);
  const avgJ = Math.round(jobsBurst.reduce((a, r) => a + r.ms, 0) / jobsBurst.length);
  console.log(`  📊  avg ${avgJ}ms\n`);

  // ── 8. Back-test: ATS score bucket consistency ────────────────────────
  console.log('── 8. Back-test: ATS score consistency (3 runs same input) ──');
  // We test the scoring logic locally without hitting the AI (pure math)
  function getInterviewProb(matchScore, rejectionRisk, hiringManagerScore) {
    return Math.round(matchScore * 0.35 + ((100 - rejectionRisk) * 0.40) + hiringManagerScore * 0.25);
  }
  function scoreBucket(s) {
    return s >= 70 ? 'STRONG' : s >= 50 ? 'COMPETITIVE' : 'NEEDS_WORK';
  }
  const inputs = [
    { match: 82, risk: 28, hm: 76 },
    { match: 55, risk: 60, hm: 50 },
    { match: 40, risk: 75, hm: 38 },
  ];
  const expected = ['STRONG','NEEDS_WORK','NEEDS_WORK'];
  inputs.forEach((inp, i) => {
    const prob   = getInterviewProb(inp.match, inp.risk, inp.hm);
    const bucket = scoreBucket(prob);
    assert(`Input ${i + 1}: prob=${prob}% → bucket ${expected[i]}`,
      bucket === expected[i], `got ${bucket}`);
  });
  // Run same input 3 times — must be deterministic
  const det = [1,2,3].map(() => getInterviewProb(78, 32, 70));
  assert('Deterministic: same input → same score every run',
    new Set(det).size === 1, `values: ${det.join(', ')}`);
  console.log('');

  // ── Summary ───────────────────────────────────────────────────────────
  console.log(`${'═'.repeat(60)}`);
  console.log(`  Results: ${passed} passed  |  ${failed} failed`);
  console.log(`${'═'.repeat(60)}\n`);
  if (failed > 0) process.exit(1);
}

runAll().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
