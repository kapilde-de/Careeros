require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');

const app = express();

// ── Security headers (helmet) ────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "cdnjs.cloudflare.com"],
      styleSrc:   ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc:    ["'self'", "fonts.gstatic.com"],
      imgSrc:     ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.anthropic.com", "https://*.supabase.co"],
      frameSrc:   ["'none'"],
      objectSrc:  ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // allow iframes for resume preview
  frameguard: { action: "deny" },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
}));

// ── CORS — lock to your actual frontend origins ──────────────────────────────
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:4173",
  "https://careeros-rose.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin '${origin}' not allowed`));
  },
  methods: ["GET","POST","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
  credentials: false,
}));

// ── Body size limits (prevent DoS via large payloads) ───────────────────────
app.use(express.json({ limit: "256kb" }));
app.use(express.urlencoded({ extended: false, limit: "64kb" }));

// ── Global rate limits ───────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 120,                   // 120 req/min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
});
app.use(globalLimiter);

// ── Stricter limit on AI/Claude endpoints ───────────────────────────────────
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 20,                    // 20 AI calls/min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "AI rate limit reached. Please wait a moment." },
  // use default IP key (IPv6-safe)
});

// ── Routes ─────────────────────────────────────────────────────────────────
const parseResumeRoute   = require('./routes/parseResume');
const claudeRoute        = require('./routes/claude');
const jobsRoute          = require('./routes/jobs');
const scrapeUrlRoute     = require('./routes/scrapeUrl');
const downloadResumeRoute = require('./routes/downloadResume');

app.use('/api/parseResume',   parseResumeRoute);
app.use('/api/claude',        aiLimiter, claudeRoute);   // AI endpoint — stricter limit
app.use('/api/downloadResume', downloadResumeRoute);
app.use('/api/jobs',          jobsRoute);
app.use('/api/scrapeUrl',     scrapeUrlRoute);

// ── Health Check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: "ok", service: "CareerOS API" });
});

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  // Never leak stack traces to the client
  const status  = err.status || err.statusCode || 500;
  const message = status < 500 ? err.message : "Internal server error";
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} — ${err.message}`);
  res.status(status).json({ error: message });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅  CareerOS backend running on port ${PORT}`);
});
