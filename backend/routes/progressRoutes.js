const express = require("express");
const {
  completeLevel,
  saveProgress,
  getSummary,
  getLevelLeaderboard,
  getGlobalLeaderboard,
} = require("../controllers/progressController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/summary", protect, getSummary);
router.get("/leaderboard", protect, getGlobalLeaderboard);
router.get("/leaderboard/:levelNumber", protect, getLevelLeaderboard);
router.post("/:levelNumber/complete", protect, completeLevel);
router.put("/:levelNumber/save", protect, saveProgress);

module.exports = router;
