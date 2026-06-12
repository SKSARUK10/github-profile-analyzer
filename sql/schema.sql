-- ============================================================
--  GitHub Profile Analyzer — Database Schema
--  Run this file to set up the database from scratch
-- ============================================================

CREATE DATABASE IF NOT EXISTS github_analyzer
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE github_analyzer;

-- Drop table if re-running
DROP TABLE IF EXISTS github_profiles;

CREATE TABLE github_profiles (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  github_username VARCHAR(100) NOT NULL UNIQUE   COMMENT 'GitHub login (lowercase)',
  name            VARCHAR(200)                   COMMENT 'Display name',
  bio             TEXT                           COMMENT 'Profile bio',
  location        VARCHAR(200)                   COMMENT 'Self-reported location',
  company         VARCHAR(200)                   COMMENT 'Self-reported company',
  blog            VARCHAR(300)                   COMMENT 'Website / blog URL',
  email           VARCHAR(200)                   COMMENT 'Public email (if set)',
  avatar_url      VARCHAR(500)                   COMMENT 'GitHub avatar image URL',
  github_url      VARCHAR(300)                   COMMENT 'Profile HTML URL',
  account_created_at  DATETIME                   COMMENT 'When the GitHub account was created',
  account_age_days    INT                        COMMENT 'Days since account creation',

  -- Core GitHub stats
  public_repos        INT DEFAULT 0              COMMENT 'Number of public repositories',
  public_gists        INT DEFAULT 0              COMMENT 'Number of public gists',
  followers           INT DEFAULT 0              COMMENT 'Follower count',
  following           INT DEFAULT 0              COMMENT 'Following count',

  -- Computed insights
  activity_score      DECIMAL(5,2) DEFAULT 0.00  COMMENT 'Activity score 0-100 (repos, followers, gists, age)',
  hireable            TINYINT(1)                 COMMENT '1 = user marked as hireable on GitHub',
  twitter_username    VARCHAR(100)               COMMENT 'Twitter/X handle if provided',

  -- JSON insight blobs
  top_languages       JSON  COMMENT 'Language → repo-count map, top 10 (e.g. {"JavaScript":12,"Python":5})',
  top_repositories    JSON  COMMENT 'Array of top 5 repos by stars [{name,stars,forks,language,url}]',

  -- Timestamps
  last_analyzed_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP  COMMENT 'When this profile was last fetched from GitHub',
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_username   (github_username),
  INDEX idx_activity   (activity_score),
  INDEX idx_followers  (followers),
  INDEX idx_analyzed   (last_analyzed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Sample data (optional) ───────────────────────────────────────────────
-- You can seed a test row after running migrations:
-- INSERT INTO github_profiles (github_username, public_repos, followers, activity_score, last_analyzed_at)
-- VALUES ('torvalds', 6, 240000, 97.50, NOW());
