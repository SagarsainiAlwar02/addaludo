import Battle from "../models/battle.js";
import Wallet from "../models/wallet.js";
import Transaction from "../models/transaction.js";
import User from "../models/user.js";

function getPlayableBalance(wallet) {
  return Number(wallet.balance || 0) + Number(wallet.winnings || 0);
}


export const getAllBattles = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit || 100), 1), 100);
    const page = Math.max(Number(req.query.page || 1), 1);
    const skip = (page - 1) * limit;

    const [total, battles] = await Promise.all([
      Battle.countDocuments({}),
      Battle.find({})
        .select(
          "battleId amount prize status createdAt updatedAt createdBy opponent winner ludoKingRoomCode"
        )
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const userIds = [
      ...new Set(
        battles
          .flatMap((battle) => [battle.createdBy, battle.opponent, battle.winner])
          .filter(Boolean)
          .map(String)
      ),
    ];

    const users = await User.find({ _id: { $in: userIds } })
      .select("name phone mobile username")
      .lean();

    const userMap = users.reduce((map, user) => {
      map[String(user._id)] = user;
      return map;
    }, {});

    const battlesWithUsers = battles.map((battle) => ({
      ...battle,
      createdBy: battle.createdBy ? userMap[String(battle.createdBy)] || battle.createdBy : null,
      opponent: battle.opponent ? userMap[String(battle.opponent)] || battle.opponent : null,
      winner: battle.winner ? userMap[String(battle.winner)] || battle.winner : null,
    }));

    res.json({
      success: true,
      battles: battlesWithUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
        hasPrevPage: page > 1,
        hasNextPage: page * limit < total,
      },
    });
  } catch (err) {
    console.log("ADMIN GET BATTLES ERROR:", err);
    res.status(500).json({
      success: false,
      msg: err.message,
    });
  }
};


export const getBattleById = async (req, res) => {
  try {
    const battle = await Battle.findById(req.params.battleId)
      .populate("createdBy", "name phone email")
      .populate("opponent", "name phone email")
      .populate("winner", "name phone email")
      .populate("roomCodeSetBy", "name phone email")
      .populate("resultSubmittedBy", "name phone email")
      .populate("results.user", "name phone email");

    if (!battle) {
      return res.status(404).json({ success: false, msg: "Battle not found" });
    }

    res.json({ success: true, battle });
  } catch (err) {
    console.log("❌ ADMIN GET SINGLE BATTLE ERROR:", err);
    res.status(500).json({ success: false, msg: err.message });
  }
};

//

export const approveBattle = async (req, res) => {
  try {
    const battleId = req.params.battleId;
    const battle = await Battle.findOneAndUpdate(
  {
    _id: battleId,
    resultSettled: false,
  },
  {
    $set: {
      resultSettled: true,
    },
  },
  {
    new: true,
  }
);

if (!battle) {
  return res.status(400).json({
    success: false,
    msg: "Battle already settled",
  });
}
  

    const winnerId = req.body?.winnerId || battle.winner || battle.resultSubmittedBy;
    if (!winnerId) return res.status(400).json({ success: false, msg: "Winner not found" });

    const isCreator = String(winnerId) === String(battle.createdBy);
    const isOpponent = String(winnerId) === String(battle.opponent);

    if (!isCreator && !isOpponent) {
      return res.status(400).json({ success: false, msg: "Winner is not in this battle" });
    }

    const alreadyPaid = await Transaction.findOne({
      roomId: battle.battleId,
      type: "game_win",
      status: "success",
    });

    if (battle.resultSettled || ["approved", "completed"].includes(battle.status) || alreadyPaid) {
      battle.winner = winnerId;
      battle.status = battle.status === "completed" ? "completed" : "approved";
      battle.resultSettled = true;
      battle.adminNote = "Already settled. Duplicate payout stopped.";
      await battle.save();

      return res.json({
        success: true,
        msg: "Battle already settled. Payment dobara add nahi hua.",
        battle,
      });
    }

    const amount = Number(battle.amount || 0);
   const prize = Math.min(
  Number(battle.prize || amount * 2),
  amount * 2
);

    const creatorWallet = await Wallet.findOne({ userId: battle.createdBy });
    const opponentWallet = await Wallet.findOne({ userId: battle.opponent });
    const winnerWallet = await Wallet.findOne({ userId: winnerId });

    if (!winnerWallet) {
      return res.status(404).json({ success: false, msg: "Winner wallet not found" });
    }

    if (creatorWallet) {
      creatorWallet.locked = Math.max(0, Number(creatorWallet.locked || 0) - amount);
      await creatorWallet.save();
    }

    if (opponentWallet) {
      opponentWallet.locked = Math.max(0, Number(opponentWallet.locked || 0) - amount);
      await opponentWallet.save();
    }

    winnerWallet.winnings = Number(winnerWallet.winnings || 0) + prize;
    await winnerWallet.save();

    await Transaction.create({
      userId: winnerId,
      amount: prize,
      type: "game_win",
      status: "success",
      note: `Battle ${battle.battleId} approved by admin`,
      roomId: battle.battleId,
      balanceAfter: getPlayableBalance(winnerWallet),
    });

    battle.winner = winnerId;
    battle.status = "approved";
    battle.resultSettled = true;
    battle.adminNote = req.body?.adminNote || "Winner approved by admin";
    await battle.save();

    return res.json({ success: true, msg: "Battle approved", battle });
  } catch (err) {
    console.log("❌ APPROVE BATTLE ERROR:", err);
    res.status(500).json({ success: false, msg: err.message });
  }
};

//
export const rejectBattle = async (req, res) => {
  try {
    const battleId = req.params.battleId;
  const battle = await Battle.findOneAndUpdate(
  {
    _id: battleId,
    resultSettled: false,
  },
  {
    $set: {
      resultSettled: true,
    },
  },
  {
    new: true,
  }
);

if (!battle) {
  return res.status(400).json({
    success: false,
    msg: "Battle already settled",
  });
}

    const alreadyPaid = await Transaction.findOne({
      roomId: battle.battleId,
      type: "game_win",
      status: "success",
    });

    if (alreadyPaid) {
      return res.status(400).json({
        success: false,
        msg: "Ye battle already winner ko paid hai, cancel/refund nahi ho sakta.",
      });
    }

    if (battle.resultSettled || ["cancelled", "rejected"].includes(battle.status)) {
      return res.json({
        success: true,
        msg: "Battle already cancelled/refunded. Refund dobara add nahi hua.",
        battle,
      });
    }

    const amount = Number(battle.amount || 0);

    if (battle.entryLocked) {
      const players = [battle.createdBy, battle.opponent].filter(Boolean);

      for (const userId of players) {
        const refundKey = `${battle.battleId}_refund_${userId}`;

        const alreadyRefundedUser = await Transaction.findOne({
          uniqueTransactionKey: refundKey,
        });

        if (alreadyRefundedUser) continue;

        const wallet = await Wallet.findOne({ userId });
        if (!wallet) continue;

        wallet.locked = Math.max(0, Number(wallet.locked || 0) - amount);
        wallet.winnings = Number(wallet.winnings || 0) + amount;
        await wallet.save();

        await Transaction.create({
          userId,
          amount,
          type: "refund",
          status: "success",
          note: `Battle ${battle.battleId} cancelled refund`,
          roomId: battle.battleId,
          uniqueTransactionKey: refundKey,
          balanceAfter: getPlayableBalance(wallet),
        });
      }
    }

    battle.status = "cancelled";
    battle.winner = null;
    battle.resultSettled = true;
    battle.adminNote = req.body?.adminNote || "Cancelled by admin";
    await battle.save();

    return res.json({ success: true, msg: "Battle cancelled and refunded", battle });
  } catch (err) {
    console.log("❌ REJECT BATTLE ERROR:", err);
    res.status(500).json({ success: false, msg: err.message });
  }
};
