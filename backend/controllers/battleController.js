const Battle = require("../models/battle");
const Wallet = require("../models/wallet");
const Transaction = require("../models/transaction");

function makeBattleId() {
  return "battle_" + Date.now() + "_" + Math.floor(Math.random() * 9999);
}

function getUserId(req) {
  return String(req.user?._id || req.userData?._id || req.user?.id || req.user);
}

async function getWallet(userId) {
  let wallet = await Wallet.findOne({ userId });

  if (!wallet) {
    wallet = await Wallet.create({
      userId,
      balance: 0,
      bonus: 0,
      winnings: 0,
      locked: 0
    });
  }

  return wallet;
}

async function lockAmount(userId, amount, roomId) {
  const wallet = await getWallet(userId);

  if (wallet.balance < amount) {
    throw new Error("Insufficient wallet balance");
  }

  wallet.balance -= amount;
  wallet.locked += amount;
  await wallet.save();

  await Transaction.create({
    userId,
    amount,
    type: "game_entry",
    status: "success",
    roomId,
    note: "Battle entry amount locked",
    balanceAfter: wallet.balance
  });

  return wallet;
}

async function refundAmount(userId, amount, roomId) {
  const wallet = await getWallet(userId);

  wallet.locked = Math.max(0, wallet.locked - amount);
  wallet.balance += amount;
  await wallet.save();

  await Transaction.create({
    userId,
    amount,
    type: "refund",
    status: "success",
    roomId,
    note: "Battle amount refunded",
    balanceAfter: wallet.balance
  });

  return wallet;
}

exports.createBattle = async (req, res) => {
  try {
    const userId = getUserId(req);
    const amount = Number(req.body.amount);

    if (!amount || amount < 10) {
      return res.status(400).json({
        success: false,
        msg: "Minimum battle amount ₹10 required"
      });
    }

    const battleId = makeBattleId();
    const prize = Math.floor(amount * 2 * 0.9);

    await lockAmount(userId, amount, battleId);

    const battle = await Battle.create({
      battleId,
      amount,
      prize,
      createdBy: userId,
      status: "open"
    });

    return res.json({
      success: true,
      msg: "Battle created successfully",
      battle
    });
  } catch (err) {
    console.log("❌ CREATE BATTLE ERROR:", err);

    return res.status(500).json({
      success: false,
      msg: err.message
    });
  }
};

exports.getOpenBattles = async (req, res) => {
  try {
    const userId = getUserId(req);

    const battles = await Battle.find({
      status: "open",
      createdBy: { $ne: userId }
    })
      .populate("createdBy", "name phone")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      battles
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      msg: err.message
    });
  }
};

exports.getMyBattles = async (req, res) => {
  try {
    const userId = getUserId(req);

    const battles = await Battle.find({
      $or: [{ createdBy: userId }, { opponent: userId }]
    })
      .populate("createdBy", "name phone")
      .populate("opponent", "name phone")
      .populate("winner", "name phone")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      battles
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      msg: err.message
    });
  }
};

exports.getSingleBattle = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { battleId } = req.params;

    const battle = await Battle.findOne({ battleId })
      .populate("createdBy", "name phone")
      .populate("opponent", "name phone")
      .populate("winner", "name phone");

    if (!battle) {
      return res.status(404).json({
        success: false,
        msg: "Battle not found"
      });
    }

    const createdById = battle.createdBy?._id
      ? battle.createdBy._id.toString()
      : battle.createdBy?.toString();

    const opponentId = battle.opponent?._id
      ? battle.opponent._id.toString()
      : battle.opponent?.toString();

    const isPlayer = createdById === userId || opponentId === userId;

    if (!isPlayer) {
      return res.status(403).json({
        success: false,
        msg: "You are not part of this battle"
      });
    }

    return res.json({
      success: true,
      battle
    });
  } catch (err) {
    console.log("❌ SINGLE BATTLE ERROR:", err);

    return res.status(500).json({
      success: false,
      msg: err.message
    });
  }
};

exports.joinBattle = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { battleId } = req.params;

    const battle = await Battle.findOne({ battleId });

    if (!battle) {
      return res.status(404).json({
        success: false,
        msg: "Battle not found"
      });
    }

    if (battle.status !== "open") {
      return res.status(400).json({
        success: false,
        msg: "Battle already joined"
      });
    }

    if (battle.createdBy.toString() === userId) {
      return res.status(400).json({
        success: false,
        msg: "You cannot join your own battle"
      });
    }

    await lockAmount(userId, battle.amount, battle.battleId);

    battle.opponent = userId;
    battle.status = "running";
    await battle.save();

    return res.json({
      success: true,
      msg: "Battle joined successfully",
      battle
    });
  } catch (err) {
    console.log("❌ JOIN BATTLE ERROR:", err);

    return res.status(500).json({
      success: false,
      msg: err.message
    });
  }
};

exports.submitRoomCode = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { battleId } = req.params;
    const { roomCode } = req.body;

    if (!roomCode) {
      return res.status(400).json({
        success: false,
        msg: "Ludo King room code required"
      });
    }

    const battle = await Battle.findOne({ battleId });

    if (!battle) {
      return res.status(404).json({
        success: false,
        msg: "Battle not found"
      });
    }

    const isPlayer =
      battle.createdBy.toString() === userId ||
      battle.opponent?.toString() === userId;

    if (!isPlayer) {
      return res.status(403).json({
        success: false,
        msg: "You are not part of this battle"
      });
    }

    if (!["running", "room_submitted"].includes(battle.status)) {
      return res.status(400).json({
        success: false,
        msg: "Room code cannot be submitted now"
      });
    }

    battle.ludoKingRoomCode = String(roomCode).trim();
    battle.status = "room_submitted";
    await battle.save();

    return res.json({
      success: true,
      msg: "Room code submitted",
      battle
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      msg: err.message
    });
  }
};

exports.submitResult = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { battleId } = req.params;

    const battle = await Battle.findOne({ battleId });

    if (!battle) {
      return res.status(404).json({
        success: false,
        msg: "Battle not found"
      });
    }

    const isPlayer =
      battle.createdBy.toString() === userId ||
      battle.opponent?.toString() === userId;

    if (!isPlayer) {
      return res.status(403).json({
        success: false,
        msg: "You are not part of this battle"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        msg: "Screenshot required"
      });
    }

    battle.screenshot = `/uploads/results/${req.file.filename}`;
    battle.winner = userId;
    battle.status = "result_submitted";
    await battle.save();

    return res.json({
      success: true,
      msg: "Result submitted. Waiting for admin approval.",
      battle
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      msg: err.message
    });
  }
};

exports.cancelBattle = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { battleId } = req.params;

    const battle = await Battle.findOne({ battleId });

    if (!battle) {
      return res.status(404).json({
        success: false,
        msg: "Battle not found"
      });
    }

    if (battle.createdBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        msg: "Only battle creator can cancel"
      });
    }

    if (battle.status !== "open") {
      return res.status(400).json({
        success: false,
        msg: "Joined battle cannot be cancelled"
      });
    }

    await refundAmount(battle.createdBy, battle.amount, battle.battleId);

    battle.status = "cancelled";
    await battle.save();

    return res.json({
      success: true,
      msg: "Battle cancelled and amount refunded",
      battle
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      msg: err.message
    });
  }
};