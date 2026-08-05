import Battle from "../models/battle.js";
import Wallet from "../models/wallet.js";
import Transaction from "../models/transaction.js";
import User from "../models/user.js";

function getPlayableBalance(wallet) {
  return Number(wallet.balance || 0) + Number(wallet.winnings || 0);
}

// 1. GET ALL BATTLES (Tabs, Search Aur Pagination Ke Saath Optimized)
export const getAllBattles = async (req, res) => {
  try {
    const { status, search } = req.query;
    const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
    const page = Math.max(Number(req.query.page || 1), 1);
    const skip = (page - 1) * limit;

    let query = {};

    if (status && status !== "Total Match") {
      if (status === "Running Match") query.status = "running";
      else if (status === "Pending Match") query.status = "pending";
      else if (status === "Completed Match") query.status = "completed";
      else if (status === "Cancel Match") query.status = "cancelled";
      else query.status = status.toLowerCase();
    }

    if (search) {
      const foundUsers = await User.find({
        $or: [
          { mobile: search },
          { phone: search },
          { username: { $regex: search, $options: "i" } }
        ]
      }).select("_id").lean();

      const matchedUserIds = foundUsers.map(u => u._id);

      query.$or = [
        { ludoKingRoomCode: search },
        { battleId: search },
        { createdBy: { $in: matchedUserIds } },
        { opponent: { $in: matchedUserIds } }
      ];
    }

    const [total, battles] = await Promise.all([
      Battle.countDocuments(query),
      Battle.find(query)
        .select("battleId amount prize status createdAt updatedAt createdBy opponent winner ludoKingRoomCode")
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
      createdBy: battle.createdBy ? userMap[String(battle.createdBy)] || { name: "Unknown", mobile: "-" } : null,
      opponent: battle.opponent ? userMap[String(battle.opponent)] || { name: "Waiting...", mobile: "-" } : null,
      winner: battle.winner ? userMap[String(battle.winner)] || null : null,
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
    console.error("ADMIN GET BATTLES ERROR:", err);
    res.status(500).json({
      success: false,
      msg: err.message,
    });
  }
};

// 2. GET BATTLE BY ID
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
    console.error("ADMIN GET SINGLE BATTLE ERROR:", err);
    res.status(500).json({ success: false, msg: err.message });
  }
};

// 3. APPROVE BATTLE (WINNER PRIZE MANAGEMENT)
export const approveBattle = async (req, res) => {
  try {
    const battleId = req.params.battleId;

    // ✅ Atomic lock: sirf tabhi resultSettled true set hoga jab pehle woh false tha.
    // Agar pehle se true tha, findOneAndUpdate null return karega aur neeche
    // turant "already settled" error mil jayega.
    const battle = await Battle.findOneAndUpdate(
      { _id: battleId, resultSettled: false },
      { $set: { resultSettled: true } },
      { new: true }
    );

    if (!battle) {
      return res.status(400).json({ success: false, msg: "Battle already settled" });
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

    // 🔴 ASLI BUG YAHAN THA:
    // Pehle condition thi: `if (battle.resultSettled || [...].includes(battle.status) || alreadyPaid)`
    // `battle.resultSettled` UPAR hi humne $set se true kiya tha, isliye ye
    // HAMESHA true milta tha — matlab ye poora "duplicate payout" wala block
    // HAR BAAR chal jaata tha, chahe ye battle pehli baar hi settle ho rahi ho.
    // Isi wajah se status "approved" ho jaata tha lekin wallet credit /
    // Transaction create KABHI nahi hota tha.
    //
    // ✅ FIX: sirf `alreadyPaid` (actual Transaction record) ko duplicate-check
    // ke liye use karo — resultSettled ka check yahan zaroori hi nahi hai,
    // kyunki upar wala findOneAndUpdate hi already guarantee kar chuka hai ki
    // ye battle pehle settled nahi thi.
    if (alreadyPaid) {
      battle.winner = winnerId;
      battle.status = battle.status === "completed" ? "completed" : "approved";
      battle.adminNote = "Already settled. Duplicate payout stopped.";
      await battle.save();

      return res.json({
        success: true,
        msg: "Battle already paid thi. Duplicate payment stop kar diya.",
        battle,
      });
    }

    const amount = Number(battle.amount || 0);
    const prize = Math.min(Number(battle.prize || amount * 2), amount * 2);

    const creatorWallet = await Wallet.findOne({ userId: battle.createdBy });
    const opponentWallet = await Wallet.findOne({ userId: battle.opponent });
    const winnerWallet = await Wallet.findOne({ userId: winnerId });

    if (!winnerWallet) {
      // ✅ FIX: agar wallet hi nahi mila to resultSettled ko wapas false karo
      // taaki admin dobara try kar sake — warna battle hamesha ke liye
      // "stuck" reh jaata (settled but unpaid).
      await Battle.updateOne({ _id: battle._id }, { $set: { resultSettled: false } });
      return res.status(404).json({ success: false, msg: "Winner wallet not found. Dobara try karein." });
    }

    try {
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
      battle.adminNote = req.body?.adminNote || "Winner approved by admin";
      await battle.save();

      return res.json({ success: true, msg: "Battle approved aur payment credit ho gayi", battle });
    } catch (creditErr) {
      // ✅ FIX: pehle koi error yahan aaye to silently upar chala jaata tha aur
      // battle "resultSettled: true" reh jaata tha lekin payment kabhi hoti
      // nahi thi — ab clearly log hoga aur battle retry ke liye khula rahega.
      console.error(`[approveBattle] Payment credit FAILED for battle ${battle.battleId}:`, creditErr);
      await Battle.updateOne({ _id: battle._id }, { $set: { resultSettled: false } });
      return res.status(500).json({
        success: false,
        msg: "Payment credit karte waqt error aayi. Payment credit NAHI hui. Dobara try karein.",
      });
    }
  } catch (err) {
    console.error("APPROVE BATTLE ERROR:", err);
    res.status(500).json({ success: false, msg: err.message });
  }
};

// 4. REJECT BATTLE (REFUND MANAGEMENT)
export const rejectBattle = async (req, res) => {
  try {
    const battleId = req.params.battleId;

    const battle = await Battle.findOneAndUpdate(
      { _id: battleId, resultSettled: false },
      { $set: { resultSettled: true } },
      { new: true }
    );

    if (!battle) {
      return res.status(400).json({ success: false, msg: "Battle already settled" });
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

    // 🔴 Yahan bhi wahi bug tha: `battle.resultSettled ||` hamesha true milta
    // tha (upar hi set kiya tha), isliye ye condition bhi HAMESHA trigger ho
    // jaati thi aur refund kabhi hota hi nahi tha, seedha yahi return ho jaata.
    // ✅ FIX: sirf battle.status check rakha hai (jo is update se touch nahi
    // hua, isliye reliable hai), resultSettled ka check hata diya.
    if (["cancelled", "rejected"].includes(battle.status)) {
      return res.json({
        success: true,
        msg: "Battle already cancelled/refunded. Refund dobara add nahi hua.",
        battle,
      });
    }

    const amount = Number(battle.amount || 0);

    try {
      if (battle.entryLocked) {
        const players = [battle.createdBy, battle.opponent].filter(Boolean);

        for (const userId of players) {
          const refundKey = `${battle.battleId}_refund_${userId}`;
          const alreadyRefundedUser = await Transaction.findOne({ uniqueTransactionKey: refundKey });

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
      battle.adminNote = req.body?.adminNote || "Cancelled by admin";
      await battle.save();

      return res.json({ success: true, msg: "Battle cancelled and refunded", battle });
    } catch (refundErr) {
      // ✅ FIX: pehle refund fail hone par bhi silently rah jaata tha.
      console.error(`[rejectBattle] Refund FAILED for battle ${battle.battleId}:`, refundErr);
      await Battle.updateOne({ _id: battle._id }, { $set: { resultSettled: false } });
      return res.status(500).json({
        success: false,
        msg: "Refund process karte waqt error aayi. Refund NAHI hua. Dobara try karein.",
      });
    }
  } catch (err) {
    console.error("REJECT BATTLE ERROR:", err);
    res.status(500).json({ success: false, msg: err.message });
  }
};