const Level = require("../models/Level");
const Progress = require("../models/Progress");

exports.listLevels = async (req, res) => {
  try {
    const levels = await Level.find().sort({ levelNumber: 1 });
    const progressDocs = await Progress.find({ user: req.user._id });
    const progressByLevel = new Map(progressDocs.map((p) => [p.levelNumber, p]));

    let previousCompleted = true; // level 1 is always unlocked
    const payload = levels.map((lvl) => {
      const progress = progressByLevel.get(lvl.levelNumber);
      const unlocked = previousCompleted;
      previousCompleted = Boolean(progress?.completed);
      return {
        levelNumber: lvl.levelNumber,
        title: lvl.title,
        difficulty: lvl.difficulty,
        size: lvl.size,
        numCheckpoints: lvl.numCheckpoints,
        unlocked,
        completed: Boolean(progress?.completed),
        stars: progress?.stars || 0,
        bestTimeMs: progress?.bestTimeMs ?? null,
      };
    });

    res.json({ levels: payload });
  } catch (err) {
    res.status(500).json({ message: "Failed to load levels", error: err.message });
  }
};

exports.getLevel = async (req, res) => {
  try {
    const levelNumber = Number(req.params.levelNumber);
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

    const progress = await Progress.findOne({ user: req.user._id, level: level._id });
    const nextLevel = await Level.findOne({ levelNumber: levelNumber + 1 }).select("levelNumber");

    res.json({
      puzzle: level.toPublicJSON(),
      nextLevelNumber: nextLevel ? nextLevel.levelNumber : null,
      progress: progress
        ? {
            completed: progress.completed,
            bestTimeMs: progress.bestTimeMs,
            bestMoves: progress.bestMoves,
            stars: progress.stars,
            attempts: progress.attempts,
            savedPath: progress.savedPath,
            savedElapsedMs: progress.savedElapsedMs,
          }
        : null,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load level", error: err.message });
  }
};
