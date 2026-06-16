import Battle from "../models/battle.js";

import MatchProof from "../models/matchProof.js";

export const uploadMatchProof = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        msg: "Unauthorized",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        msg: "Screenshot required",
      });
    }

const { roomId } = req.body;
    if (!roomId) {
      return res.status(400).json({
        success: false,
        msg: "Room ID required",
      });
    }
    const battle = await Battle.findOne({ battleId: roomId });

if (!battle) {
  return res.status(404).json({
    success: false,
    msg: "Battle not found",
  });
}

  const proof = await MatchProof.create({
  userId: req.user,
  roomId,
  entryAmount: Number(battle.amount || 0),
  prizePool: Number(battle.prize || 0),
  winAmount: Number(battle.prize || 0),
  screenshotUrl: `/uploads/screenshots/${req.file.filename}`,
  status: "pending",
});

    res.status(201).json({
      success: true,
      msg: "Screenshot uploaded successfully",
      proof,
    });
  } catch (err) {
    console.log("Upload proof error:", err);
    res.status(500).json({
      success: false,
      msg: "Server error",
    });
  }
};

export const getMatchProofs = async (req, res) => {
  try {
    const proofs = await MatchProof.find()
      .populate("userId", "name phone")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      proofs,
    });
  } catch (err) {
    console.log("Get proofs error:", err);
    res.status(500).json({
      success: false,
      msg: "Server error",
    });
  }
};

export const updateMatchProofStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        msg: "Invalid status",
      });
    }

    const proof = await MatchProof.findOneAndUpdate(
  {
    _id: req.params.id,
    status: "pending",
  },
  {
    $set: {
      status,
    },
  },
  {
    new: true,
  }
);

if (!proof) {
  return res.status(400).json({
    success: false,
    msg: "Proof already processed or not found",
  });
}

    if (!proof) {
      return res.status(404).json({
        success: false,
        msg: "Proof not found",
      });
    }

    res.json({
      success: true,
      msg: `Proof ${status}`,
      proof,
    });
  } catch (err) {
    console.log("Update proof error:", err);
    res.status(500).json({
      success: false,
      msg: "Server error",
    });
  }
};