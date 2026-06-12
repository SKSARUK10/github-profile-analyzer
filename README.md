# 🔍 GitHub Profile Analyzer API

A production-ready backend service built with **Node.js + Express + MySQL** that analyzes GitHub user profiles, computes rich developer insights, and stores them for fast retrieval.

🔗 **Live API**: https://github-profile-analyzer-v0dj.onrender.com
📦 **GitHub Repo**: https://github.com/SKSARUK10/github-profile-analyzer

> ⚠️ Hosted on Render's free tier — if the service has been idle, the first request may take 30-60 seconds while it wakes up. Subsequent requests are fast.

---

## ⚡ Quick Test (Live API)

```bash
# Health check
curl https://github-profile-analyzer-v0dj.onrender.com/health

# Analyze a GitHub profile (fetches + stores in MySQL)
curl -X POST https://github-profile-analyzer-v0dj.onrender.com/api/profiles/analyze/torvalds

# List all analyzed profiles
curl https://github-profile-analyzer-v0dj.onrender.com/api/profiles

# Get a single profile
curl https://github-profile-analyzer-v0dj.onrender.com/api/profiles/torvalds
```

---

## 🚀 Features

| Feature | Description |
|---|---|
| **Profile Analysis** | Fetch & analyze any public GitHub user |
| **Activity Score** | 0–100 score computed from repos, followers, gists, account age |
| **Language Stats** | Top 10 languages used across all repositories |
| **Top Repositories** | Top 5 repos ranked by star count |
| **Pagination & Sorting** | List endpoint supports page/limit/sort/order |
| **Re-analyze** | Call analyze again to refresh stale data |
| **Rate Limiting** | Protects against abuse (100 req/15 min globally, 10/min for analyze) |
| **Input Validation** | All inputs validated before processing |
| **Health Check** | `/health` endpoint for uptime monitoring |

---

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL (via `mysql2` connection pool)
- **External API**: GitHub REST API v3
- **Security**: `helmet`, `cors`, `express-rate-limit`

---

## 📦 Setup Instructions

### Prerequisites
- Node.js v18+
- MySQL 8.0+
- A GitHub Personal Access Token *(optional but recommended)*

### 1. Clone the repository
```bash
git clone https://github.com/SKSARUK10/github-profile-analyzer.git
cd github-profile-analyzer
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
```

Edit `.env` with your values:
```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=github_analyzer

# Optional — avoids GitHub API rate limit (60 req/hr → 5000 req/hr)
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
```

### 4. Create the database
```sql
CREATE DATABASE github_analyzer CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Or use the schema file:
```bash
mysql -u root -p < sql/schema.sql
```

### 5. Run database migrations
```bash
npm run migrate
```

### 6. Start the server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

---

## 📡 API Reference

### Base URL
```
http://localhost:3000/api
```

---

### `POST /api/profiles/analyze/:username`
Fetches the GitHub profile, computes insights, and saves to the database. If the profile was analyzed before, it is **updated** with fresh data.

**Example:**
```bash
curl -X POST http://localhost:3000/api/profiles/analyze/torvalds
```

**Response:**
```json
{
  "success": true,
  "message": "Profile 'torvalds' analyzed and saved successfully",
  "data": {
    "id": 1,
    "github_username": "torvalds",
    "name": "Linus Torvalds",
    "stats": {
      "public_repos": 6,
      "followers": 240000,
      "activity_score": 97.5
    },
    "top_languages": { "C": 3, "Python": 1 },
    "top_repositories": [ ... ]
  }
}
```

---

### `GET /api/profiles`
Returns all analyzed profiles with pagination.

**Query Parameters:**

| Param | Default | Options |
|---|---|---|
| `page` | 1 | any positive integer |
| `limit` | 10 | 1–100 |
| `sort` | `last_analyzed_at` | `last_analyzed_at`, `activity_score`, `followers`, `public_repos`, `created_at` |
| `order` | `DESC` | `ASC`, `DESC` |

**Example:**
```bash
curl "http://localhost:3000/api/profiles?page=1&limit=5&sort=activity_score&order=DESC"
```

---

### `GET /api/profiles/:username`
Returns a single stored profile. Returns 404 if not yet analyzed.

```bash
curl http://localhost:3000/api/profiles/torvalds
```

---

### `DELETE /api/profiles/:username`
Removes a profile from the database.

```bash
curl -X DELETE http://localhost:3000/api/profiles/torvalds
```

---

### `GET /health`
Service health check.

```bash
curl http://localhost:3000/health
```

---

## 📊 Activity Score Formula

The activity score (0–100) is calculated as:

```
Score = repo_score + follower_score + gist_score + following_score + age_score

repo_score      = min(repos / 50, 1)  × 30   → max 30 pts
follower_score  = min(followers / 1000, 1) × 40  → max 40 pts
gist_score      = min(gists / 20, 1)  × 10   → max 10 pts
following_score = min(following / 200, 1) × 10  → max 10 pts
age_score       = min(age_years / 5, 1) × 10  → max 10 pts
```

---

## 🗄 Database Schema

See [`sql/schema.sql`](sql/schema.sql) for the full schema with comments.

**Key columns in `github_profiles`:**

| Column | Type | Description |
|---|---|---|
| `github_username` | VARCHAR | Primary identifier (unique) |
| `public_repos` | INT | Public repository count |
| `followers` | INT | Follower count |
| `activity_score` | DECIMAL | Computed 0–100 score |
| `top_languages` | JSON | Language distribution |
| `top_repositories` | JSON | Top 5 repos by stars |
| `last_analyzed_at` | DATETIME | When last refreshed from GitHub |

---

## 🧪 Postman Collection

Import the file `postman_collection.json` (in the repo root) into Postman to test all endpoints with pre-filled examples.

---

## 📁 Project Structure

```
github-profile-analyzer/
├── src/
│   ├── app.js                  # Express entry point
│   ├── config/
│   │   ├── db.js               # MySQL connection pool
│   │   └── migrate.js          # DB migration script
│   ├── controllers/
│   │   └── profileController.js
│   ├── middleware/
│   │   ├── errorHandler.js     # Global error handler
│   │   └── validate.js         # express-validator middleware
│   ├── models/
│   │   └── profileModel.js     # DB queries (upsert, find, delete)
│   ├── routes/
│   │   └── profileRoutes.js
│   └── services/
│       └── githubService.js    # GitHub API calls + insight computation
├── sql/
│   └── schema.sql              # Database schema export
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 🌐 Live Deployment

**Live API Base URL**: https://github-profile-analyzer-v0dj.onrender.com
**GitHub Repository**: https://github.com/SKSARUK10/github-profile-analyzer

### Deployment stack used
- **Backend hosting**: [Render](https://render.com) — free web service, auto-deploys from GitHub on push
- **Database**: [Aiven](https://aiven.io) — free-tier managed MySQL (SSL-enabled connection)

### Deploying this project yourself
1. Push the repo to GitHub
2. Create a free MySQL service on [Aiven](https://aiven.io) and note the host/port/user/password/database
3. Run `sql/schema.sql` against that database (or `npm run migrate` once env vars are set)
4. Create a new **Web Service** on [Render](https://render.com), connect your GitHub repo
5. Set build command: `npm install`, start command: `npm start`
6. Add environment variables in Render's dashboard (see `.env.example`):
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL=true`, `GITHUB_TOKEN`, `NODE_ENV=production`
7. Deploy 🎉

---

## 👤 Author

Built for the GitHub Profile Analyzer API assignment.
