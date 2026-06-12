const axios = require("axios");

const githubClient = axios.create({
  baseURL: "https://api.github.com",
  timeout: 10000,
  headers: {
    Accept: "application/vnd.github.v3+json",
    ...(process.env.GITHUB_TOKEN && {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    }),
  },
});

/**
 * Fetch a GitHub user's public profile
 */
async function fetchGitHubUser(username) {
  try {
    const { data } = await githubClient.get(`/users/${username}`);
    return data;
  } catch (err) {
    if (err.response?.status === 404) {
      const error = new Error(`GitHub user '${username}' not found`);
      error.statusCode = 404;
      throw error;
    }
    if (err.response?.status === 403) {
      const error = new Error("GitHub API rate limit exceeded. Add a GITHUB_TOKEN in .env to increase the limit.");
      error.statusCode = 429;
      throw error;
    }
    throw new Error(`GitHub API error: ${err.message}`);
  }
}

/**
 * Fetch all public repositories of a user (handles pagination)
 */
async function fetchUserRepos(username) {
  const repos = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const { data } = await githubClient.get(`/users/${username}/repos`, {
      params: { per_page: perPage, page, sort: "updated", type: "owner" },
    });
    repos.push(...data);
    if (data.length < perPage) break;
    page++;
    if (page > 5) break; // cap at 500 repos to avoid very long requests
  }

  return repos;
}

/**
 * Calculate language distribution from repos
 */
function computeLanguageStats(repos) {
  const langCount = {};
  for (const repo of repos) {
    if (repo.language) {
      langCount[repo.language] = (langCount[repo.language] || 0) + 1;
    }
  }
  // Sort by count descending, return top 10
  return Object.entries(langCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .reduce((acc, [lang, count]) => ({ ...acc, [lang]: count }), {});
}

/**
 * Pick top 5 repos by star count
 */
function getTopRepos(repos) {
  return repos
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 5)
    .map((r) => ({
      name: r.name,
      description: r.description,
      stars: r.stargazers_count,
      forks: r.forks_count,
      language: r.language,
      url: r.html_url,
      topics: r.topics || [],
    }));
}

/**
 * Compute an activity score (0–100) to give recruiters a quick snapshot
 *
 * Formula (weighted):
 *   repos    → up to 30 pts  (30 pts at 50+ repos)
 *   followers→ up to 40 pts  (40 pts at 1000+ followers)
 *   gists    → up to 10 pts  (10 pts at 20+ gists)
 *   following→ up to 10 pts  (10 pts at 200+ following)
 *   account age → up to 10 pts (10 pts at 5+ years)
 */
function computeActivityScore(user, accountAgeDays) {
  const repoScore     = Math.min((user.public_repos / 50) * 30, 30);
  const followerScore = Math.min((user.followers / 1000) * 40, 40);
  const gistScore     = Math.min((user.public_gists / 20) * 10, 10);
  const followingScore= Math.min((user.following / 200) * 10, 10);
  const ageScore      = Math.min((accountAgeDays / (5 * 365)) * 10, 10);
  return parseFloat((repoScore + followerScore + gistScore + followingScore + ageScore).toFixed(2));
}

/**
 * Main analysis function — combines user + repo data into a single insight object
 */
async function analyzeProfile(username) {
  const [user, repos] = await Promise.all([
    fetchGitHubUser(username),
    fetchUserRepos(username),
  ]);

  const accountCreatedAt = new Date(user.created_at);
  const accountAgeDays   = Math.floor((Date.now() - accountCreatedAt) / (1000 * 60 * 60 * 24));
  const activityScore    = computeActivityScore(user, accountAgeDays);
  const topLanguages     = computeLanguageStats(repos);
  const topRepositories  = getTopRepos(repos);

  return {
    github_username:    user.login,
    name:               user.name || null,
    bio:                user.bio || null,
    location:           user.location || null,
    company:            user.company || null,
    blog:               user.blog || null,
    email:              user.email || null,
    avatar_url:         user.avatar_url,
    github_url:         user.html_url,
    account_created_at: accountCreatedAt,
    account_age_days:   accountAgeDays,
    public_repos:       user.public_repos,
    public_gists:       user.public_gists,
    followers:          user.followers,
    following:          user.following,
    activity_score:     activityScore,
    hireable:           user.hireable ? 1 : 0,
    twitter_username:   user.twitter_username || null,
    top_languages:      JSON.stringify(topLanguages),
    top_repositories:   JSON.stringify(topRepositories),
    last_analyzed_at:   new Date(),
  };
}

module.exports = { analyzeProfile };
