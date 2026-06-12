const express    = require("express");
const { param, query } = require("express-validator");
const controller = require("../controllers/profileController");
const validate   = require("../middleware/validate");

const router = express.Router();

// Username validator — GitHub usernames are alphanumeric + hyphens, 1-39 chars
const usernameParam = param("username")
  .trim()
  .isLength({ min: 1, max: 39 })
  .matches(/^[a-zA-Z0-9-]+$/)
  .withMessage("Invalid GitHub username");

// ─── Routes ─────────────────────────────────────────────────────────────────

// Analyze (or re-analyze) a GitHub user profile
router.post("/analyze/:username", usernameParam, validate, controller.analyzeUser);

// List all stored profiles with pagination
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
    query("sort").optional().isIn(["last_analyzed_at", "activity_score", "followers", "public_repos", "created_at"]),
    query("order").optional().isIn(["ASC", "DESC", "asc", "desc"]),
  ],
  validate,
  controller.listProfiles
);

// Get a single stored profile
router.get("/:username", usernameParam, validate, controller.getProfile);

// Delete a stored profile
router.delete("/:username", usernameParam, validate, controller.deleteProfile);

module.exports = router;
