const Battle = require("../models/battle");
const Wallet = require("../models/wallet");
const Transaction = require("../models/transaction");

// ================= GET ALL BATTLES =================
exports.getAllBattles = async (req, res) => {
  try {
    const battles = await Battle.find()
      .populate("createdBy", "name phone")
      .populate("opponent", "name phone")
      .populate("winner", "name phone")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      battles,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      msg: err.message,
    });
  }
};

// ================= APPROVE BATTLE =================
exports.approveBattle = async (req, res) => {
  try {
    const { battleId } = req.params;

    const battle = await Battle.findOne({ battleId });

    if (!battle) {
      return res.status(404).json({
        success: false,
        msg: "Battle not found",
      });
    }

    if (battle.status === "approved") {
      return res.status(400).json({
        success: false,
        msg: "Battle already approved",
      });
    }

    if (battle.status !== "result_submitted") {
      return res.status(400).json({
        success: false,
        msg: "Result not submitted yet",
      });
    }

    if (!battle.winner) {
      return res.status(400).json({
        success: false,
        msg: "Winner not selected",
      });
    }

    if (!battle.createdBy || !battle.opponent) {
      return res.status(400).json({
        success: false,
        msg: "Both players required",
      });
    }

    const loser =
      battle.winner.toString() === battle.createdBy.toString()
        ? battle.opponent
        : battle.createdBy;

    const winnerWallet = await Wallet.findOne({ userId: battle.winner });
    const loserWallet = await Wallet.findOne({ userId: loser });

    if (!winnerWallet || !loserWallet) {
      return res.status(400).json({
        success: false,
        msg: "Wallet missing",
      });
    }

    // ✅ dono players ka locked amount release
    winnerWallet.locked = Math.max(0, winnerWallet.locked - battle.amount);
    loserWallet.locked = Math.max(0, loserWallet.locked - battle.amount);

    // ✅ winning amount sirf winnings me add hoga
    // ❌ balance me add nahi karna, warna deposit coin bhi badh jayega
    winnerWallet.winnings += battle.prize;

    await winnerWallet.save();
    await loserWallet.save();

    await Transaction.create({
      userId: battle.winner,
      amount: battle.prize,
      type: "game_win",
      status: "success",
      roomId: battle.battleId,
      note: "Battle winning approved by admin",
      balanceAfter: winnerWallet.winnings,
    });

    battle.status = "approved";
    battle.adminNote = req.body.adminNote || "Approved";
    await battle.save();

    return res.json({
      success: true,
      msg: "Battle approved and prize added in winning coin",
      prize: battle.prize,
      battle,
    });
  } catch (err) {
    console.log("❌ APPROVE BATTLE ERROR:", err);

    return res.status(500).json({
      success: false,
      msg: err.message,
    });
  }
};

// ================= REJECT BATTLE =================
exports.rejectBattle = async (req, res) => {
  try {
    const { battleId } = req.params;

    const battle = await Battle.findOne({ battleId });

    if (!battle) {
      return res.status(404).json({
        success: false,
        msg: "Battle not found",
      });
    }

    if (battle.status === "rejected") {
      return res.status(400).json({
        success: false,
        msg: "Battle already rejected",
      });
    }

    if (!["result_submitted", "room_submitted", "running"].includes(battle.status)) {
      return res.status(400).json({
        success: false,
        msg: "Battle cannot be rejected now",
      });
    }

    const players = [battle.createdBy, battle.opponent].filter(Boolean);

    for (const userId of players) {
      const wallet = await Wallet.findOne({ userId });

      if (wallet) {
        wallet.locked = Math.max(0, wallet.locked - battle.amount);
        wallet.balance += battle.amount;

        await wallet.save();

        await Transaction.create({
          userId,
          amount: battle.amount,
          type: "refund",
          status: "success",
          roomId: battle.battleId,
          note: "Battle rejected by admin, amount refunded",
          balanceAfter: wallet.balance,
        });
      }
    }

    battle.status = "rejected";
    battle.adminNote = req.body.adminNote || "Rejected by admin";
    await battle.save();

    return res.json({
      success: true,
      msg: "Battle rejected and amount refunded",
      battle,
    });
  } catch (err) {
    console.log("❌ REJECT BATTLE ERROR:", err);

    return res.status(500).json({
      success: false,
      msg: err.message,
    });
  }
};