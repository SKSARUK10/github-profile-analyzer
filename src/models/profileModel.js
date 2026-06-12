const { pool } = require("../config/db");

/**
 * Upsert a profile (insert or update if username already exists)
 */
async function upsertProfile(data) {
  const sql = `
    INSERT INTO github_profiles
      (github_username, name, bio, location, company, blog, email,
       avatar_url, github_url, account_created_at, account_age_days,
       public_repos, public_gists, followers, following,
       activity_score, hireable, twitter_username,
       top_languages, top_repositories, last_analyzed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      name               = VALUES(name),
      bio                = VALUES(bio),
      location           = VALUES(location),
      company            = VALUES(company),
      blog               = VALUES(blog),
      email              = VALUES(email),
      avatar_url         = VALUES(avatar_url),
      github_url         = VALUES(github_url),
      account_created_at = VALUES(account_created_at),
      account_age_days   = VALUES(account_age_days),
      public_repos       = VALUES(public_repos),
      public_gists       = VALUES(public_gists),
      followers          = VALUES(followers),
      following          = VALUES(following),
      activity_score     = VALUES(activity_score),
      hireable           = VALUES(hireable),
      twitter_username   = VALUES(twitter_username),
      top_languages      = VALUES(top_languages),
      top_repositories   = VALUES(top_repositories),
      last_analyzed_at   = VALUES(last_analyzed_at)
  `;

  const values = [
    data.github_username, data.name, data.bio, data.location,
    data.company, data.blog, data.email, data.avatar_url, data.github_url,
    data.account_created_at, data.account_age_days, data.public_repos,
    data.public_gists, data.followers, data.following, data.activity_score,
    data.hireable, data.twitter_username, data.top_languages,
    data.top_repositories, data.last_analyzed_at,
  ];

  const [result] = await pool.query(sql, values);
  return result;
}

/**
 * Find a single profile by username
 */
async function findByUsername(username) {
  const [rows] = await pool.query(
    "SELECT * FROM github_profiles WHERE github_username = ? LIMIT 1",
    [username.toLowerCase()]
  );
  return rows[0] || null;
}

/**
 * Get all profiles with optional pagination
 */
async function findAll({ page = 1, limit = 10, sort = "last_analyzed_at", order = "DESC" }) {
  const allowedSorts  = ["last_analyzed_at", "activity_score", "followers", "public_repos", "created_at"];
  const allowedOrders = ["ASC", "DESC"];

  const safeSort  = allowedSorts.includes(sort)  ? sort  : "last_analyzed_at";
  const safeOrder = allowedOrders.includes(order.toUpperCase()) ? order.toUpperCase() : "DESC";

  const offset = (page - 1) * limit;

  const [rows]  = await pool.query(
    `SELECT * FROM github_profiles ORDER BY ${safeSort} ${safeOrder} LIMIT ? OFFSET ?`,
    [parseInt(limit), offset]
  );
  const [[{ total }]] = await pool.query("SELECT COUNT(*) AS total FROM github_profiles");

  return { profiles: rows, total, page: parseInt(page), limit: parseInt(limit) };
}

/**
 * Delete a profile by username
 */
async function deleteByUsername(username) {
  const [result] = await pool.query(
    "DELETE FROM github_profiles WHERE github_username = ?",
    [username.toLowerCase()]
  );
  return result.affectedRows;
}

module.exports = { upsertProfile, findByUsername, findAll, deleteByUsername };
