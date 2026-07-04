const express = require("express");
const { listLevels, getLevel } = require("../controllers/levelController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, listLevels);
router.get("/:levelNumber", protect, getLevel);

module.exports = router;
