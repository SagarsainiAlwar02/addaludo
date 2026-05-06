const MatchProof = require("../models/matchProof");

exports.uploadMatchProof = async (req, res) => {
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

    const { roomId, entryAmount, prizePool, winAmount } = req.body;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        msg: "Room ID required",
      });
    }

    const proof = await MatchProof.create({
      userId: req.user,
      roomId,
      entryAmount: Number(entryAmount || 0),
      prizePool: Number(prizePool || 0),
      winAmount: Number(winAmount || 0),
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

exports.getMatchProofs = async (req, res) => {
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

exports.updateMatchProofStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        msg: "Invalid status",
      });
    }

    const proof = await MatchProof.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

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