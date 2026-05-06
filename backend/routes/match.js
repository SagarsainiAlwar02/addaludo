const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const Match = require("../models/match");

router.get("/", auth, async (req, res) => {
  try {
    const matches = await Match.find()
      .populate("players.userId", "name phone email")
      .populate("winner.userId", "name phone email")
      .sort({ createdAt: -1 })
      .lean();

    res.json(matches);
  } catch (err) {
    console.log("❌ GET MATCHES ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;