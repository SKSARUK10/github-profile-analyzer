require("dotenv").config();

const express      = require("express");
const cors         = require("cors");
const helmet       = require("helmet");
const morgan       = require("morgan");
const rateLimit    = require("express-rate-limit");

const { testConnection } = require("./config/db");
const profileRoutes      = require("./routes/profileRoutes");
const errorHandler       = require("./middleware/errorHandler");

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Security & utility middleware ──────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ─── Rate limiting (prevent abuse) ──────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
});
app.use(limiter);

// Stricter limit for analyze endpoint (hits GitHub API)
const analyzeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { success: false, message: "Analyze rate limit reached. Wait 1 minute." },
});
app.use("/api/profiles/analyze", analyzeLimiter);

// ─── Health check ────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "GitHub Profile Analyzer API",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// ─── API routes ──────────────────────────────────────────────────────────────
app.use("/api/profiles", profileRoutes);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    hint: "Available routes: POST /api/profiles/analyze/:username | GET /api/profiles | GET /api/profiles/:username | DELETE /api/profiles/:username",
  });
});

// ─── Global error handler ────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Boot ────────────────────────────────────────────────────────────────────
async function start() {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`\n🚀 GitHub Profile Analyzer running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/health`);
    console.log(`📚 API base:     http://localhost:${PORT}/api/profiles\n`);
  });
}

start();
