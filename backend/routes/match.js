// import express from "express";
// const router = express.Router();

// import auth from "../middleware/auth.js";
// import Match from "../models/match.js";

// router.get("/", auth, async (req, res) => {
//   try {
//     const matches = await Match.find()
//       .populate("players.userId", "name phone email")
//       .populate("winner.userId", "name phone email")
//       .sort({ createdAt: -1 })
//       .lean();

//     res.json(matches);
//   } catch (err) {
//     console.log("❌ GET MATCHES ERROR:", err);
//     res.status(500).json({ msg: err.message });
//   }
// });

// export default router;



import express from "express";
const router = express.Router();

import auth from "../middleware/auth.js";
import Match from "../models/match.js";
import {
  createMatch,
  joinMatch,
  declareWinner,
  cancelMatch,
} from "../controllers/matchController.js";

// ================= GET ALL MATCHES (Admin) =================
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

// ================= GET SINGLE MATCH =================
router.get("/:id", auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate("players.userId", "name phone email")
      .populate("winner.userId", "name phone email")
      .lean();

    if (!match) return res.status(404).json({ msg: "Match not found" });
    res.json(match);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ================= CREATE MATCH =================
router.post("/create", auth, createMatch);

// ================= JOIN MATCH =================
router.post("/join/:id", auth, joinMatch);

// ✅ NEW: DECLARE WINNER (Admin Panel se)
router.patch("/winner/:id", auth, declareWinner);

// ✅ NEW: CANCEL MATCH (Admin Panel se) — entry fee refund hogi
router.patch("/cancel/:id", auth, cancelMatch);

export default router;