require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const { pool, testConnection } = require("./db");

const CREATE_PROFILES_TABLE = `
CREATE TABLE IF NOT EXISTS github_profiles (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  github_username VARCHAR(100) NOT NULL UNIQUE,
  name            VARCHAR(200),
  bio             TEXT,
  location        VARCHAR(200),
  company         VARCHAR(200),
  blog            VARCHAR(300),
  email           VARCHAR(200),
  avatar_url      VARCHAR(500),
  github_url      VARCHAR(300),
  account_created_at  DATETIME,
  account_age_days    INT,

  -- Core insights
  public_repos        INT DEFAULT 0,
  public_gists        INT DEFAULT 0,
  followers           INT DEFAULT 0,
  following           INT DEFAULT 0,

  -- Computed insights
  activity_score      DECIMAL(5,2) DEFAULT 0.00  COMMENT '0-100 score based on repos, followers, gists',
  hireable            TINYINT(1),
  twitter_username    VARCHAR(100),

  -- Language breakdown (stored as JSON)
  top_languages       JSON COMMENT 'e.g. {"JavaScript": 12, "Python": 5}',

  -- Top repos (stored as JSON array)
  top_repositories    JSON COMMENT 'Array of top 5 repos by stars',

  -- Timestamps
  last_analyzed_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_username (github_username),
  INDEX idx_activity (activity_score),
  INDEX idx_followers (followers)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

async function migrate() {
  await testConnection();
  try {
    await pool.query(CREATE_PROFILES_TABLE);
    console.log("✅ Table 'github_profiles' is ready");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  }
}

migrate();
