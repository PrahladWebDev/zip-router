const express = require("express");
const { completeLevel, getSummary } = require("../controllers/progressController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/summary", protect, getSummary);
router.post("/:levelNumber/complete", protect, completeLevel);

module.exports = router;
