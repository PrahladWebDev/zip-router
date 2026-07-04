require("dotenv").config();
const mongoose = require("mongoose");
const Level = require("../models/Level");
const { generatePuzzle } = require("../utils/generatePuzzle");

// Progression: 25 levels, grid size/checkpoints/wall density still ramp up
// in order (so later levels stay mechanically harder), but the difficulty
// *label* shown to players is now assigned randomly at seed time instead of
// being hand-picked per level. Feel free to extend this array - each entry
// produces one permanent, deterministic level in the DB.
const DIFFICULTIES = ["easy", "medium", "hard", "expert"];

function randomDifficulty() {
  return DIFFICULTIES[Math.floor(Math.random() * DIFFICULTIES.length)];
}

const LEVEL_CONFIGS = [
  { title: "First Connection", size: 4, numCheckpoints: 3, wallRatio: 0.0 },
  { title: "Warm Circuit", size: 4, numCheckpoints: 4, wallRatio: 0.02 },
  { title: "Signal Boost", size: 5, numCheckpoints: 4, wallRatio: 0.03 },
  { title: "Steady Current", size: 5, numCheckpoints: 5, wallRatio: 0.05 },
  { title: "Grid Lock", size: 5, numCheckpoints: 6, wallRatio: 0.06 },
  { title: "Cross Talk", size: 6, numCheckpoints: 5, wallRatio: 0.06 },
  { title: "Relay Station", size: 6, numCheckpoints: 6, wallRatio: 0.08 },
  { title: "Feedback Loop", size: 6, numCheckpoints: 7, wallRatio: 0.09 },
  { title: "Overclocked", size: 6, numCheckpoints: 8, wallRatio: 0.11 },
  { title: "Fault Line", size: 7, numCheckpoints: 7, wallRatio: 0.1 },
  { title: "Deep Trace", size: 7, numCheckpoints: 8, wallRatio: 0.12 },
  { title: "Short Circuit", size: 7, numCheckpoints: 9, wallRatio: 0.13 },
  { title: "Kernel Panic", size: 8, numCheckpoints: 9, wallRatio: 0.13 },
  { title: "Full Mesh", size: 8, numCheckpoints: 10, wallRatio: 0.15 },
  { title: "The Router", size: 8, numCheckpoints: 12, wallRatio: 0.16 },
  { title: "Latency Spike", size: 8, numCheckpoints: 11, wallRatio: 0.17 },
  { title: "Packet Storm", size: 8, numCheckpoints: 13, wallRatio: 0.18 },
  { title: "Broadcast Domain", size: 9, numCheckpoints: 10, wallRatio: 0.15 },
  { title: "Subnet Maze", size: 9, numCheckpoints: 12, wallRatio: 0.17 },
  { title: "Firewall Breach", size: 9, numCheckpoints: 14, wallRatio: 0.19 },
  { title: "Deadlock", size: 9, numCheckpoints: 16, wallRatio: 0.21 },
  { title: "Bandwidth Ceiling", size: 10, numCheckpoints: 12, wallRatio: 0.17 },
  { title: "Backbone Collapse", size: 10, numCheckpoints: 15, wallRatio: 0.19 },
  { title: "Zero Day", size: 10, numCheckpoints: 18, wallRatio: 0.21 },
  { title: "Root Access", size: 10, numCheckpoints: 20, wallRatio: 0.23 },
];

function computeTiming(size, numCheckpoints) {
  const total = size * size;
  const parTimeMs = Math.round(total * 1100 + numCheckpoints * 700);
  const goodTimeMs = Math.round(parTimeMs * 1.6);
  return { parTimeMs, goodTimeMs };
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected. Clearing existing levels...");
  await Level.deleteMany({});

  const docs = LEVEL_CONFIGS.map((cfg, i) => {
    const puzzle = generatePuzzle(cfg);
    const { parTimeMs, goodTimeMs } = computeTiming(cfg.size, puzzle.numCheckpoints);
    const difficulty = randomDifficulty();
    console.log(
      `Level ${i + 1} - "${cfg.title}" -> difficulty: ${difficulty}`
    );
    return {
      levelNumber: i + 1,
      title: cfg.title,
      difficulty,
      size: cfg.size,
      path: puzzle.path,
      checkpoints: puzzle.checkpoints,
      walls: puzzle.walls,
      numCheckpoints: puzzle.numCheckpoints,
      parTimeMs,
      goodTimeMs,
    };
  });

  await Level.insertMany(docs);
  console.log(`Seeded ${docs.length} levels.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});