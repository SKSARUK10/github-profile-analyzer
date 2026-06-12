# 🔍 GitHub Profile Analyzer API

A production-ready backend service built with **Node.js + Express + MySQL** that analyzes GitHub user profiles, computes rich developer insights, and stores them for fast retrieval.

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
git clone https://github.com/YOUR_USERNAME/github-profile-analyzer.git
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

> **Live API:** `https://your-deployed-url.com`  
> *(Update this after deploying to Railway / Render / EC2)*

### Recommended free deployment: [Railway](https://railway.app)
1. Push to GitHub
2. Connect Railway to your repo
3. Add a MySQL plugin in Railway
4. Set environment variables from `.env.example`
5. Deploy 🎉

---

## 👤 Author

Built for the GitHub Profile Analyzer API assignment.
