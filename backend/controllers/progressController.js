const Level = require("../models/Level");
const Progress = require("../models/Progress");
const User = require("../models/User");
const { validateSolution } = require("../utils/validatePath");

function starsForTime(timeMs, level) {
  if (timeMs <= level.parTimeMs) return 3;
  if (timeMs <= level.goodTimeMs) return 2;
  return 1;
}

exports.completeLevel = async (req, res) => {
  try {
    const levelNumber = Number(req.params.levelNumber);
    const { timeMs, path } = req.body;

    if (typeof timeMs !== "number" || timeMs <= 0) {
      return res.status(400).json({ message: "A valid timeMs is required" });
    }

    const level = await Level.findOne({ levelNumber });
    if (!level) return res.status(404).json({ message: "Level not found" });

    if (levelNumber > 1) {
      const prevProgress = await Progress.findOne({
        user: req.user._id,
        levelNumber: levelNumber - 1,
      });
      if (!prevProgress?.completed) {
        return res.status(403).json({ message: "Level is locked" });
      }
    }

    const check = validateSolution(level, path);
    if (!check.valid) {
      return res.status(400).json({ message: `Invalid solution: ${check.reason}` });
    }

    let progress = await Progress.findOne({ user: req.user._id, level: level._id });
    if (progress?.completed) {
      return res.status(409).json({ message: "Level already completed - it can't be replayed" });
    }

    const stars = starsForTime(timeMs, level);
    const moves = path.length - 1;

    if (!progress) {
      progress = new Progress({
        user: req.user._id,
        level: level._id,
        levelNumber: level.levelNumber,
      });
    }

    progress.attempts += 1;
    const isNewBest = progress.bestTimeMs === null || timeMs < progress.bestTimeMs;
    if (isNewBest) {
      progress.bestTimeMs = timeMs;
      progress.bestMoves = moves;
      progress.stars = Math.max(progress.stars, stars);
    }
    progress.completed = true;
    progress.completedAt = progress.completedAt || new Date();
    progress.savedPath = [];
    progress.savedElapsedMs = 0;
    await progress.save();

    const allProgress = await Progress.find({ user: req.user._id });
    const totalStars = allProgress.reduce((sum, p) => sum + p.stars, 0);
    await User.findByIdAndUpdate(req.user._id, { totalStars });

    const nextLevel = await Level.findOne({ levelNumber: levelNumber + 1 });

    res.json({
      completed: true,
      isNewBest,
      stars: progress.stars,
      bestTimeMs: progress.bestTimeMs,
      bestMoves: progress.bestMoves,
      nextLevelNumber: nextLevel ? nextLevel.levelNumber : null,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to record completion", error: err.message });
  }
};

exports.saveProgress = async (req, res) => {
  try {
    const levelNumber = Number(req.params.levelNumber);
    const { path, elapsedMs } = req.body;

    if (!Array.isArray(path) || typeof elapsedMs !== "number") {
      return res.status(400).json({ message: "path (array) and elapsedMs (number) are required" });
    }

    const level = await Level.findOne({ levelNumber });
    if (!level) return res.status(404).json({ message: "Level not found" });

    let progress = await Progress.findOne({ user: req.user._id, level: level._id });
    if (progress?.completed) {
      // Nothing to save - a completed level can't be replayed.
      return res.json({ saved: false });
    }

    if (!progress) {
      progress = new Progress({
        user: req.user._id,
        level: level._id,
        levelNumber: level.levelNumber,
      });
    }

    progress.savedPath = path;
    progress.savedElapsedMs = elapsedMs;
    await progress.save();

    res.json({ saved: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to save progress", error: err.message });
  }
};

exports.getLevelLeaderboard = async (req, res) => {
  try {
    const levelNumber = Number(req.params.levelNumber);
    const level = await Level.findOne({ levelNumber });
    if (!level) return res.status(404).json({ message: "Level not found" });

    const entries = await Progress.find({ level: level._id, completed: true })
      .sort({ bestTimeMs: 1 })
      .limit(20)
      .populate("user", "name");

    res.json({
      levelNumber,
      leaderboard: entries.map((p, i) => ({
        rank: i + 1,
        name: p.user?.name || "Unknown",
        bestTimeMs: p.bestTimeMs,
        bestMoves: p.bestMoves,
        stars: p.stars,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load leaderboard", error: err.message });
  }
};

exports.getGlobalLeaderboard = async (req, res) => {
  try {
    const users = await User.find().sort({ totalStars: -1 }).limit(20).select("name totalStars");

    res.json({
      leaderboard: users.map((u, i) => ({
        rank: i + 1,
        name: u.name,
        totalStars: u.totalStars,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load leaderboard", error: err.message });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const totalLevels = await Level.countDocuments();
    const progressDocs = await Progress.find({ user: req.user._id }).sort({ levelNumber: 1 });
    const completedCount = progressDocs.filter((p) => p.completed).length;
    const totalStars = progressDocs.reduce((sum, p) => sum + p.stars, 0);

    res.json({
      totalLevels,
      completedCount,
      totalStars,
      maxStars: totalLevels * 3,
      levels: progressDocs.map((p) => ({
        levelNumber: p.levelNumber,
        completed: p.completed,
        stars: p.stars,
        bestTimeMs: p.bestTimeMs,
        attempts: p.attempts,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load summary", error: err.message });
  }
};
