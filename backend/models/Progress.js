const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    level: { type: mongoose.Schema.Types.ObjectId, ref: "Level", required: true },
    levelNumber: { type: Number, required: true },
    completed: { type: Boolean, default: false },
    bestTimeMs: { type: Number, default: null },
    bestMoves: { type: Number, default: null },
    stars: { type: Number, default: 0, min: 0, max: 3 },
    attempts: { type: Number, default: 0 },
    completedAt: { type: Date, default: null },
    // In-progress (unfinished) attempt, kept so the player can resume exactly
    // where they left off, with the same elapsed time, after closing the page.
    // Cleared once the level is completed.
    savedPath: { type: [Number], default: [] },
    savedElapsedMs: { type: Number, default: 0 },
  },
  { timestamps: true }
);

progressSchema.index({ user: 1, level: 1 }, { unique: true });

module.exports = mongoose.model("Progress", progressSchema);
