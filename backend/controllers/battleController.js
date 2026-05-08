const Battle = require("../models/battle");
const Wallet = require("../models/wallet");
const Transaction = require("../models/transaction");

function makeBattleId() {
  return "battle_" + Date.now() + "_" + Math.floor(Math.random() * 9999);
}

function getUserId(req) {
  return String(req.user?._id || req.userData?._id || req.user?.id || req.user);
}

function validateBattleAmount(amount) {
  amount = Number(amount);

  if (!amount || amount < 50) return "Minimum battle amount ₹50 required";
  if (amount > 100000) return "Maximum battle amount ₹100000 allowed";
  if (amount % 50 !== 0) return "Battle amount ₹50 ke multiple me hona chahiye";

  return null;
}

function calculateBattlePrize(amount) {
  const totalPool = Number(amount) * 2;
  const commissionPercentPerUser = Number(amount) <= 500 ? 5 : 2.5;
  const commission = Math.floor((totalPool * commissionPercentPerUser * 2) / 100);
  return totalPool - commission;
}

async function getWallet(userId) {
  let wallet = await Wallet.findOne({ userId });

  if (!wallet) {
    wallet = await Wallet.create({
      userId,
      balance: 0,
      bonus: 0,
      winnings: 0,
      referralBalance: 0,
      locked: 0,
    });
  }

  return wallet;
}

async function lockAmount(userId, amount, roomId) {
  const wallet = await getWallet(userId);

  if (Number(wallet.balance || 0) < amount) {
    throw new Error("Insufficient wallet balance");
  }

  wallet.balance = Number(wallet.balance || 0) - amount;
  wallet.locked = Number(wallet.locked || 0) + amount;
  await wallet.save();

  await Transaction.create({
    userId,
    amount,
    type: "game_entry",
    status: "success",
    roomId,
    note: "Battle entry amount locked",
    balanceAfter: wallet.balance,
  });

  return wallet;
}

async function refundAmount(userId, amount, roomId, note = "Battle amount refunded") {
  const wallet = await getWallet(userId);

  wallet.locked = Math.max(0, Number(wallet.locked || 0) - amount);
  wallet.balance = Number(wallet.balance || 0) + amount;
  await wallet.save();

  await Transaction.create({
    userId,
    amount,
    type: "refund",
    status: "success",
    roomId,
    note,
    balanceAfter: wallet.balance,
  });

  return wallet;
}

exports.createBattle = async (req, res) => {
  try {
    const userId = getUserId(req);
    const amount = Number(req.body.amount);

    const amountError = validateBattleAmount(amount);
    if (amountError) {
      return res.status(400).json({ success: false, msg: amountError });
    }

    const battleId = makeBattleId();
    const prize = calculateBattlePrize(amount);

    await lockAmount(userId, amount, battleId);

    const battle = await Battle.create({
      battleId,
      amount,
      prize,
      createdBy: userId,
      status: "open",
    });

    return res.json({
      success: true,
      msg: "Battle open ho gayi",
      battle,
    });
  } catch (err) {
    console.log("CREATE BATTLE ERROR:", err);
    return res.status(500).json({ success: false, msg: err.message });
  }
};

exports.getOpenBattles = async (req, res) => {
  try {
    const battles = await Battle.find({
      status: { $in: ["open", "join_requested"] },
    })
      .populate("createdBy", "name phone")
      .populate("opponent", "name phone")
      .sort({ createdAt: -1 });

    return res.json({ success: true, battles });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message });
  }
};

exports.getMyBattles = async (req, res) => {
  try {
    const userId = getUserId(req);

    const battles = await Battle.find({
      $or: [{ createdBy: userId }, { opponent: userId }],
    })
      .populate("createdBy", "name phone")
      .populate("opponent", "name phone")
      .populate("winner", "name phone")
      .sort({ createdAt: -1 });

    return res.json({ success: true, battles });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message });
  }
};

exports.getSingleBattle = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { battleId } = req.params;

    const battle = await Battle.findOne({ battleId })
      .populate("createdBy", "name phone")
      .populate("opponent", "name phone")
      .populate("winner", "name phone")
      .populate("resultSubmittedBy", "name phone");

    if (!battle) {
      return res.status(404).json({ success: false, msg: "Battle not found" });
    }

    const creatorId = battle.createdBy?._id?.toString();
    const opponentId = battle.opponent?._id?.toString();

    if (creatorId !== userId && opponentId !== userId) {
      return res.status(403).json({
        success: false,
        msg: "You are not part of this battle",
      });
    }

    return res.json({ success: true, battle });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message });
  }
};

exports.joinBattle = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { battleId } = req.params;

    const battle = await Battle.findOne({ battleId });

    if (!battle) {
      return res.status(404).json({ success: false, msg: "Battle not found" });
    }

    if (battle.status !== "open") {
      return res.status(400).json({
        success: false,
        msg: "Battle already requested or joined",
      });
    }

    if (battle.createdBy.toString() === userId) {
      return res.status(400).json({
        success: false,
        msg: "You cannot join your own battle",
      });
    }

    await lockAmount(userId, battle.amount, battle.battleId);

    battle.opponent = userId;
    battle.status = "join_requested";
    battle.timerStartedAt = null;
    await battle.save();

    return res.json({
      success: true,
      msg: "Play request sent. Waiting for creator start.",
      battle,
    });
  } catch (err) {
    console.log("JOIN BATTLE ERROR:", err);
    return res.status(500).json({ success: false, msg: err.message });
  }
};

exports.startBattle = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { battleId } = req.params;

    const battle = await Battle.findOne({ battleId });

    if (!battle) {
      return res.status(404).json({ success: false, msg: "Battle not found" });
    }

    if (battle.createdBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        msg: "Only battle creator can start this battle",
      });
    }

    if (battle.status !== "join_requested" || !battle.opponent) {
      return res.status(400).json({
        success: false,
        msg: "No player request found",
      });
    }

    battle.status = "running";
    battle.timerStartedAt = new Date();
    await battle.save();

    return res.json({
      success: true,
      msg: "Battle started",
      battle,
    });
  } catch (err) {
    console.log("START BATTLE ERROR:", err);
    return res.status(500).json({ success: false, msg: err.message });
  }
};

exports.rejectBattleRequest = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { battleId } = req.params;

    const battle = await Battle.findOne({ battleId });

    if (!battle) {
      return res.status(404).json({ success: false, msg: "Battle not found" });
    }

    if (battle.createdBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        msg: "Only battle creator can reject this request",
      });
    }

    if (battle.status !== "join_requested" || !battle.opponent) {
      return res.status(400).json({
        success: false,
        msg: "No pending request found",
      });
    }

    const opponentId = battle.opponent;

    await refundAmount(
      opponentId,
      battle.amount,
      battle.battleId,
      "Battle request rejected by creator"
    );

    battle.opponent = null;
    battle.status = "open";
    battle.timerStartedAt = null;
    await battle.save();

    return res.json({
      success: true,
      msg: "Request rejected. Opponent amount refunded.",
      battle,
    });
  } catch (err) {
    console.log("REJECT BATTLE ERROR:", err);
    return res.status(500).json({ success: false, msg: err.message });
  }
};

exports.submitRoomCode = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { battleId } = req.params;
    const roomCode = String(req.body.roomCode || "").trim();

    if (!/^\d{8}$/.test(roomCode)) {
      return res.status(400).json({
        success: false,
        msg: "Room code only 8 digit",
      });
    }

    const battle = await Battle.findOne({ battleId });

    if (!battle) {
      return res.status(404).json({ success: false, msg: "Battle not found" });
    }

    if (battle.createdBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        msg: "Only battle creator can set room code",
      });
    }

    if (!["running", "room_submitted"].includes(battle.status)) {
      return res.status(400).json({
        success: false,
        msg: "Room code cannot be submitted now",
      });
    }

    battle.ludoKingRoomCode = roomCode;
    battle.roomCodeSetBy = userId;
    battle.status = "room_submitted";
    await battle.save();

    return res.json({ success: true, msg: "Room code submitted", battle });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message });
  }
};

exports.submitResult = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { battleId } = req.params;
    const result = String(req.body.result || "").toLowerCase();

    const battle = await Battle.findOne({ battleId });

    if (!battle) {
      return res.status(404).json({ success: false, msg: "Battle not found" });
    }

    const isCreator = battle.createdBy.toString() === userId;
    const isOpponent = battle.opponent?.toString() === userId;

    if (!isCreator && !isOpponent) {
      return res.status(403).json({
        success: false,
        msg: "You are not part of this battle",
      });
    }

    if (!["running", "room_submitted"].includes(battle.status)) {
      return res.status(400).json({
        success: false,
        msg: "Result cannot be submitted now",
      });
    }

    if (result === "win") {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          msg: "Winning screenshot required",
        });
      }

      battle.screenshot = `/uploads/results/${req.file.filename}`;
      battle.winner = userId;
      battle.resultSubmittedBy = userId;
      battle.resultType = "win";
      battle.status = "result_submitted";
      await battle.save();

      return res.json({
        success: true,
        msg: "Win result submitted. Admin approval pending.",
        battle,
      });
    }

    if (result === "loss") {
      const winner = isCreator ? battle.opponent : battle.createdBy;

      battle.winner = winner;
      battle.resultSubmittedBy = userId;
      battle.resultType = "loss";
      battle.status = "result_submitted";
      await battle.save();

      return res.json({
        success: true,
        msg: "Loss submitted. Admin approval pending.",
        battle,
      });
    }

    if (result === "cancel") {
      const alreadyVoted = battle.cancelVotes.some(
        (id) => id.toString() === userId
      );

      if (!alreadyVoted) {
        battle.cancelVotes.push(userId);
      }

      if (battle.cancelVotes.length >= 2) {
        await refundAmount(
          battle.createdBy,
          battle.amount,
          battle.battleId,
          "Battle cancelled by both users"
        );

        if (battle.opponent) {
          await refundAmount(
            battle.opponent,
            battle.amount,
            battle.battleId,
            "Battle cancelled by both users"
          );
        }

        battle.status = "cancelled";
      } else {
        battle.status = "cancel_requested";
      }

      battle.resultSubmittedBy = userId;
      battle.resultType = "cancel";
      await battle.save();

      return res.json({
        success: true,
        msg:
          battle.status === "cancelled"
            ? "Battle cancelled and amount refunded"
            : "Cancel request submitted. Waiting for other user.",
        battle,
      });
    }

    return res.status(400).json({
      success: false,
      msg: "Invalid result type",
    });
  } catch (err) {
    console.log("SUBMIT RESULT ERROR:", err);
    return res.status(500).json({ success: false, msg: err.message });
  }
};

exports.cancelBattle = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { battleId } = req.params;

    const battle = await Battle.findOne({ battleId });

    if (!battle) {
      return res.status(404).json({ success: false, msg: "Battle not found" });
    }

    if (battle.status === "open") {
      if (battle.createdBy.toString() !== userId) {
        return res.status(403).json({
          success: false,
          msg: "Only creator can cancel open battle",
        });
      }

      await refundAmount(
        battle.createdBy,
        battle.amount,
        battle.battleId,
        "Open battle cancelled"
      );

      battle.status = "cancelled";
      await battle.save();

      return res.json({
        success: true,
        msg: "Battle cancelled and refunded",
        battle,
      });
    }

    return res.status(400).json({
      success: false,
      msg: "Running battle cancel ke liye Cancel result button use karein",
    });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message });
  }
};