const { analyzeProfile } = require("../services/githubService");
const profileModel       = require("../models/profileModel");

/**
 * POST /api/profiles/analyze/:username
 * Fetch from GitHub, compute insights, save to DB
 */
async function analyzeUser(req, res, next) {
  try {
    const username = req.params.username.trim().toLowerCase();

    const insights = await analyzeProfile(username);
    await profileModel.upsertProfile(insights);

    const saved = await profileModel.findByUsername(username);
    return res.status(200).json({
      success: true,
      message: `Profile '${username}' analyzed and saved successfully`,
      data: formatProfile(saved),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/profiles
 * List all analyzed profiles with pagination
 */
async function listProfiles(req, res, next) {
  try {
    const { page = 1, limit = 10, sort = "last_analyzed_at", order = "DESC" } = req.query;
    const { profiles, total, ...meta } = await profileModel.findAll({ page, limit, sort, order });

    return res.status(200).json({
      success: true,
      data: profiles.map(formatProfile),
      meta: {
        ...meta,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/profiles/:username
 * Fetch a single stored profile
 */
async function getProfile(req, res, next) {
  try {
    const username = req.params.username.trim().toLowerCase();
    const profile  = await profileModel.findByUsername(username);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: `Profile '${username}' not found. Use POST /api/profiles/analyze/${username} to analyze it first.`,
      });
    }

    return res.status(200).json({ success: true, data: formatProfile(profile) });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/profiles/:username
 * Remove a stored profile
 */
async function deleteProfile(req, res, next) {
  try {
    const username = req.params.username.trim().toLowerCase();
    const deleted  = await profileModel.deleteByUsername(username);

    if (!deleted) {
      return res.status(404).json({ success: false, message: `Profile '${username}' not found` });
    }

    return res.status(200).json({ success: true, message: `Profile '${username}' deleted successfully` });
  } catch (err) {
    next(err);
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseJsonField(field) {
  if (!field) return null;
  if (typeof field === "object") return field; // mysql2 may auto-parse JSON columns
  try { return JSON.parse(field); } catch { return null; }
}

function formatProfile(p) {
  return {
    id:               p.id,
    github_username:  p.github_username,
    name:             p.name,
    bio:              p.bio,
    location:         p.location,
    company:          p.company,
    blog:             p.blog,
    email:            p.email,
    avatar_url:       p.avatar_url,
    github_url:       p.github_url,
    twitter_username: p.twitter_username,
    hireable:         Boolean(p.hireable),
    account_info: {
      created_at:    p.account_created_at,
      age_days:      p.account_age_days,
      age_years:     +(p.account_age_days / 365).toFixed(1),
    },
    stats: {
      public_repos:  p.public_repos,
      public_gists:  p.public_gists,
      followers:     p.followers,
      following:     p.following,
      activity_score: parseFloat(p.activity_score),
    },
    top_languages:   parseJsonField(p.top_languages),
    top_repositories: parseJsonField(p.top_repositories),
    last_analyzed_at: p.last_analyzed_at,
    created_at:       p.created_at,
  };
}

module.exports = { analyzeUser, listProfiles, getProfile, deleteProfile };
