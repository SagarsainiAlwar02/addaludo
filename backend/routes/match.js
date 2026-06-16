import express from "express";
const router = express.Router();

import auth from "../middleware/auth.js";
import Match from "../models/match.js";

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

export default router;