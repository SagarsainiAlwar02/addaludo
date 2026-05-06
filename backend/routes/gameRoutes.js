const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");

const {
  createMatch,
  joinMatch,
  declareWinner
} = require("../controllers/matchController");

const Match = require("../models/match");


// ================= GET ALL MATCHES =================
router.get("/", auth, async (req, res) => {
  try {
    const matches = await Match.find()
      .populate("players", "name email")
      .populate("winner", "name")
      .sort({ createdAt: -1 });

    res.json(matches);

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});


// ================= CREATE MATCH =================
router.post("/create", auth, createMatch);


// ================= JOIN MATCH =================
router.post("/join/:id", auth, joinMatch);


// ================= DECLARE WINNER =================
router.post("/winner/:id", auth, declareWinner);


// ================= SINGLE MATCH DETAIL =================
router.get("/:id", auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate("players", "name email")
      .populate("winner", "name");

    if (!match) {
      return res.status(404).json({ msg: "Match not found" });
    }

    res.json(match);

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});


// ================= 🔥 BONUS: ACTIVE MATCHES ONLY =================
// (REAL GAMING SYSTEM ME YE BAHUT IMPORTANT HOTA HAI)
router.get("/active/list", auth, async (req, res) => {
  try {
    const matches = await Match.find({ winner: null })
      .populate("players", "name")
      .sort({ createdAt: -1 });

    res.json(matches);

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});


// ================= 🔥 BONUS: USER MATCH HISTORY =================
router.get("/user/history", auth, async (req, res) => {
  try {
    const matches = await Match.find({
      players: req.user._id
    })
      .populate("winner", "name")
      .sort({ createdAt: -1 });

    res.json(matches);

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;