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
  },
  { timestamps: true }
);

progressSchema.index({ user: 1, level: 1 }, { unique: true });

module.exports = mongoose.model("Progress", progressSchema);
