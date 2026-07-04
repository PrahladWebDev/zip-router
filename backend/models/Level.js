const mongoose = require("mongoose");

const levelSchema = new mongoose.Schema(
  {
    levelNumber: { type: Number, required: true, unique: true, index: true },
    title: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard", "expert"],
      required: true,
    },
    size: { type: Number, required: true }, // grid is size x size
    // The Hamiltonian solution path (array of cell indices, 0..size*size-1).
    // Kept server-side authoritative and also sent to the client so the
    // "hint" feature can draw it - this is a single-player puzzle game so
    // there's no competitive integrity concern in shipping it.
    path: { type: [Number], required: true },
    // cellIndex (as string) -> checkpoint order number (1, 2, 3 ...)
    checkpoints: {
      type: Map,
      of: Number,
      required: true,
    },
    // blocked edges, each entry "a_b" with a < b
    walls: { type: [String], default: [] },
    numCheckpoints: { type: Number, required: true },
    // time thresholds (ms) used to award stars on completion
    parTimeMs: { type: Number, required: true },
    goodTimeMs: { type: Number, required: true },
  },
  { timestamps: true }
);

levelSchema.methods.toPublicJSON = function () {
  return {
    levelNumber: this.levelNumber,
    title: this.title,
    difficulty: this.difficulty,
    size: this.size,
    total: this.size * this.size,
    path: this.path,
    checkpoints: Object.fromEntries(this.checkpoints),
    walls: this.walls,
    numCheckpoints: this.numCheckpoints,
    parTimeMs: this.parTimeMs,
    goodTimeMs: this.goodTimeMs,
  };
};

module.exports = mongoose.model("Level", levelSchema);
