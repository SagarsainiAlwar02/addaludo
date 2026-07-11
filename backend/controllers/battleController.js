import Battle from "../models/battle.js";
import Wallet from "../models/wallet.js";
import Transaction from "../models/transaction.js";
import User from "../models/user.js";

const OPEN_BATTLE_EXPIRE_MS = 5 * 60 * 1000;
const MAX_SEARCHING_BATTLES = 2;

const PUBLIC_BATTLE_STATUSES = [
  "open",
  "join_requested",
  "running",
  "room_submitted",
];

const ACTIVE_USER_BLOCK_STATUSES = [
  "join_requested",
  "running",
  "room_submitted",
  "cancel_requested",
  "result_submitted",
];

function makeBattleId() {
  return "battle_" + Date.now() + "_" + Math.floor(Math.random() * 9999);
}

function getUserId(req) {
  return String(req.user?._id || req.userData?._id || req.user?.id || req.user);
}

function getPlayableBalance(wallet) {
  return Number(wallet.balance || 0) + Number(wallet.winnings || 0) + Number(wallet.bonus || 0);
}

function validateBattleAmount(amount) {
  amount = Number(amount);
  if (!amount || amount < 50) return "Minimum battle amount ₹50 required";
  if (amount > 100000) return "Maximum battle amount ₹100000 allowed";
  if (amount % 50 !== 0) return "Battle amount ₹50 ke multiple me hona chahiye";
  return null;
}

function calculateBattlePrize(amount) {
  const amt = parseInt(amount, 10);
  if (isNaN(amt)) return 0;

  const totalPool = amt * 2;
  let platformFee = 0;

  if (amt >= 50 && amt <= 500) {
    platformFee = amt * 0.05 * 2;
  } else if (amt > 500 && amt <= 100000) {
    platformFee = amt * 0.025 * 2;
  }

  return Math.floor(totalPool - platformFee);
}

function hasSubmittedResult(battle, userId) {
  return Array.isArray(battle.results)
    ? battle.results.some((item) => item.user.toString() === userId.toString())
    : false;
}

async function hasUserActiveUnsubmittedBattle(userId) {
  const battles = await Battle.find({
    status: { $in: ACTIVE_USER_BLOCK_STATUSES },
    $or: [{ createdBy: userId }, { opponent: userId }],
  }).select("status results createdBy opponent battleId");

  return battles.some((battle) => {
    const status = String(battle.status || "").toLowerCase();
    if (["cancel_requested", "result_submitted"].includes(status)) {
      return !hasSubmittedResult(battle, userId);
    }
    return true;
  });
}

async function getWallet(userId) {
  // ✅ FIX: agar userId hi nahi hai (null/undefined) to wallet dhoondhne/banane ki koshish mat karo.
  // Pehle ye getWallet(null) bula leta tha jo ek corrupt "userId: null" wala wallet bana sakta tha.
  if (!userId) return null;

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
  amount = Number(amount || 0);

  if (getPlayableBalance(wallet) < amount) {
    throw new Error("Insufficient wallet balance");
  }

  let remaining = amount;

  // ✅ FIX: schema me field ka naam "bonus" hai, "bonusAmount" nahi.
  // Pehle "bonusAmount" likha tha jo schema me exist hi nahi karta — is wajah se
  // ye deduction kabhi kaam hi nahi karta tha (silently ignored by Mongoose).
  const useBonus = Math.min(Number(wallet.bonus || 0), remaining);
  wallet.bonus = Number(wallet.bonus || 0) - useBonus;
  remaining -= useBonus;

  // 2. Agar abhi bhi bacha hai, toh Main/Deposit Balance se kaato
  const useBalance = Math.min(Number(wallet.balance || 0), remaining);
  wallet.balance = Number(wallet.balance || 0) - useBalance;
  remaining -= useBalance;

  // 3. Agar abhi bhi bacha hai, toh Winnings se kaato
  const useWinnings = Math.min(Number(wallet.winnings || 0), remaining);
  wallet.winnings = Number(wallet.winnings || 0) - useWinnings;
  remaining -= useWinnings;

  wallet.locked = Number(wallet.locked || 0) + amount;
  await wallet.save();

  await Transaction.create({
    userId,
    amount,
    type: "game_entry",
    status: "success",
    roomId,
    note: "Battle entry fee locked",
    uniqueTransactionKey: `${roomId}_entry_${userId}`,
    balanceAfter: getPlayableBalance(wallet),
  });

  return wallet;
}

async function refundAmount(userId, amount, roomId, note = "Battle amount refunded") {
  const refundKey = `${roomId}_refund_${userId}`;

  const alreadyRefunded = await Transaction.findOne({
    uniqueTransactionKey: refundKey,
  });

  if (alreadyRefunded) return null;

  const wallet = await getWallet(userId);
  if (!wallet) return null;

  amount = Number(amount || 0);

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
    uniqueTransactionKey: refundKey,
    balanceAfter: getPlayableBalance(wallet),
  });

  return wallet;
}

async function giveReferralCommission(winnerId, betAmount, roomId) {
  try {
    const winner = await User.findById(winnerId).select("referredBy phone name");
    if (!winner || !winner.referredBy) return;

    const referrerId = winner.referredBy;
    const commission = Number((Number(betAmount || 0) * 0.02).toFixed(2));
    if (commission <= 0) return;

    const alreadyGiven = await Transaction.findOne({
      userId: referrerId,
      type: "referral_commission",
      roomId,
    });

    if (alreadyGiven) return;

    const referrerWallet = await getWallet(referrerId);
    if (!referrerWallet) return;

    referrerWallet.referralBalance = Number(referrerWallet.referralBalance || 0) + commission;
    await referrerWallet.save();

    await User.findByIdAndUpdate(referrerId, {
      $inc: { totalReferralEarning: commission },
    });

    await Transaction.create({
      userId: referrerId,
      amount: commission,
      type: "referral_commission",
      status: "success",
      roomId,
      note: "Referral commission 2% from referred player's winning battle",
      balanceAfter: referrerWallet.referralBalance,
    });
  } catch (err) {
    // ✅ FIX: referral commission ek "nice to have" side-effect hai.
    // Isme error aane se MAIN winner payment fail/rollback nahi honi chahiye.
    console.error("[giveReferralCommission] FAILED (winner payment not affected):", err);
  }
}

/**
 * ✅ REWRITTEN settleWinner
 * Fixes:
 * 1. Poora adminNote/prize update ek hi atomic $set me — do alag-alag .save() calls
 *    (jo pehle silently fail ho sakte the) hata diye.
 * 2. Wallet-credit step ko try/catch me wrap kiya + console.error logging, taaki
 *    agar wallet-save/transaction-create fail ho to server logs me turant dikhe,
 *    aur battle document "half-updated" state me na phase.
 * 3. loserId null hone par crash/corrupt-wallet se bachaav (getWallet null-safe).
 * 4. alreadyPaid case me bhi clearly return value se pata chalta hai ki payment
 *    naya hua ya pehle se hi ho chuka tha (caller isko check kar sakta hai).
 */
async function settleWinner(battle, winnerId) {
  // Step 1: Status atomically lock karo taaki koi doosra parallel request
  // isi battle ko dobara settle na kar sake.
  const lockedBattle = await Battle.findOneAndUpdate(
    {
      _id: battle._id,
      resultSettled: { $ne: true },
      status: { $nin: ["approved", "cancelled", "rejected"] },
    },
    {
      $set: {
        resultSettled: true,
        winner: winnerId,
        status: "approved",
      },
    },
    { new: true }
  );

  if (!lockedBattle) {
    return { battle: null, alreadyPaid: false };
  }

  const alreadyPaid = await Transaction.findOne({
    roomId: lockedBattle.battleId,
    type: "game_win",
    status: "success",
  });

  if (alreadyPaid) {
    // ✅ FIX: caller ko explicitly bataya ja raha hai ki is call me payment
    // NAYA nahi hua (pehle se ho chuka tha) — silently "success" nahi dikhaya jayega.
    return { battle: lockedBattle, alreadyPaid: true };
  }

  const finalPrize = calculateBattlePrize(lockedBattle.amount);

  const creatorId = lockedBattle.createdBy.toString();
  const winnerString = winnerId.toString();
  const loserId = winnerString === creatorId ? lockedBattle.opponent : lockedBattle.createdBy;

  try {
    const winnerWallet = await getWallet(winnerId);
    if (!winnerWallet) {
      throw new Error(`Winner wallet nahi mila/bana (winnerId: ${winnerId})`);
    }

    winnerWallet.locked = Math.max(
      0,
      Number(winnerWallet.locked || 0) - Number(lockedBattle.amount || 0)
    );
    winnerWallet.winnings = Number(winnerWallet.winnings || 0) + Number(finalPrize || 0);
    await winnerWallet.save();

    await Transaction.create({
      userId: winnerId,
      amount: finalPrize,
      type: "game_win",
      status: "success",
      roomId: lockedBattle.battleId,
      uniqueTransactionKey: `${lockedBattle.battleId}_game_win_${winnerId}`,
      note: "Battle winning prize",
      balanceAfter: getPlayableBalance(winnerWallet),
    });

    // ✅ FIX: agar loserId null hai (opponent set hi nahi hua tha), to skip karo —
    // pehle ye getWallet(null) bula ke corrupt wallet bana sakta tha.
    if (loserId) {
      const loserWallet = await getWallet(loserId);
      if (loserWallet) {
        loserWallet.locked = Math.max(
          0,
          Number(loserWallet.locked || 0) - Number(lockedBattle.amount || 0)
        );
        await loserWallet.save();
      }
    }

    await giveReferralCommission(winnerId, lockedBattle.amount, lockedBattle.battleId);

    // ✅ FIX: prize + adminNote ek hi update me save, alag se dusra .save() call nahi.
    lockedBattle.prize = finalPrize;
    if (!lockedBattle.adminNote) {
      lockedBattle.adminNote = "Auto approved because one user submitted win and other submitted loss";
    }
    await lockedBattle.save();

    return { battle: lockedBattle, alreadyPaid: false };
  } catch (err) {
    // ✅ FIX: ye sabse important part hai. Pehle koi bhi error yahan silently
    // upar throw ho jaata tha aur battle "resultSettled: true, status: approved"
    // reh jaata tha LEKIN paisa kabhi credit nahi hota tha — aur kahin log bhi
    // nahi hota tha ki aisa kyun hua.
    console.error(
      `[settleWinner] Payment credit FAILED for battle ${lockedBattle.battleId}, winnerId ${winnerId}:`,
      err
    );
    // Battle ko "payment_failed" jaisi state me maarke rakho taaki dobara try ho sake.
    // resultSettled ko false wapas kar dete hain taaki admin dobara Win button use kar sake.
    await Battle.updateOne(
      { _id: lockedBattle._id },
      { $set: { resultSettled: false, status: battle.status, winner: null } }
    );
    throw err;
  }
}

async function expireOldOpenBattles() {
  const expiryDate = new Date(Date.now() - OPEN_BATTLE_EXPIRE_MS);
  const oldBattles = await Battle.find({
    status: "open",
    createdAt: { $lte: expiryDate },
  });

  for (const battle of oldBattles) {
    battle.status = "cancelled";
    battle.adminNote = "Auto cancelled after 5 minutes";
    await battle.save();
  }
}

async function cancelOtherOpenBattles(userId, excludeBattleId) {
  const battles = await Battle.find({
    battleId: { $ne: excludeBattleId },
    createdBy: userId,
    status: "open",
  });

  for (const battle of battles) {
    battle.status = "cancelled";
    battle.adminNote = "Auto cancelled because another battle was joined";
    await battle.save();
  }
}

export const createBattle = async (req, res) => {
  try {
    await expireOldOpenBattles();

    const userId = getUserId(req);
    const amount = Number(req.body.amount);

    const amountError = validateBattleAmount(amount);
    if (amountError) return res.status(400).json({ success: false, msg: amountError });

    const activeBattleExists = await hasUserActiveUnsubmittedBattle(userId);
    if (activeBattleExists) {
      return res.status(400).json({
        success: false,
        msg: "Aapki ek battle already chal rahi hai. Pehle uska result update karo.",
      });
    }

    const sameAmountOpenBattle = await Battle.findOne({ amount, status: "open" }).select("battleId amount status");
    if (sameAmountOpenBattle) {
      return res.status(400).json({
        success: false,
        msg: `₹${amount} ki open battle already lagi hui hai`,
      });
    }

    const searchingCount = await Battle.countDocuments({ createdBy: userId, status: "open" });
    if (searchingCount >= MAX_SEARCHING_BATTLES) {
      return res.status(400).json({
        success: false,
        msg: "Maximum 2 searching battles allowed. Pehle kisi battle ka wait/cancel karein.",
      });
    }

    const wallet = await getWallet(userId);
    if (getPlayableBalance(wallet) < amount) {
      return res.status(400).json({ success: false, msg: "Insufficient wallet balance" });
    }

    const battleId = makeBattleId();
    const prize = calculateBattlePrize(amount);

    const battle = await Battle.create({ battleId, amount, prize, createdBy: userId, status: "open" });
    if (req.app.get("io")) { req.app.get("io").emit("newBattle", battle); }
    return res.json({ success: true, msg: "Battle open ho gayi", battle });
  } catch (err) {
    console.error("CREATE BATTLE ERROR:", err);
    return res.status(500).json({ success: false, msg: err.message });
  }
};

export const getOpenBattles = async (req, res) => {
  try {
    await expireOldOpenBattles();
    const battles = await Battle.find({ status: { $in: PUBLIC_BATTLE_STATUSES } })
      .populate("createdBy", "name phone")
      .populate("opponent", "name phone")
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();

    // ✅ NEW: dummy battles ke liye fake name/mobile display karo
    const shaped = battles.map((b) =>
      b.isDummy
        ? { ...b, createdBy: { _id: b._id, name: b.dummyName || "Player", phone: b.dummyMobile || "" } }
        : b
    );

    return res.json({ success: true, battles: shaped });
  } catch (err) {
    console.error("GET OPEN BATTLES ERROR:", err);
    return res.status(500).json({ success: false, msg: err.message });
  }
};

export const getMyBattles = async (req, res) => {
  try {
    const userId = getUserId(req);

    const battles = await Battle.find({
      $or: [{ createdBy: userId }, { opponent: userId }],
    })
      .populate("createdBy", "name phone")
      .populate("opponent", "name phone")
      .populate("winner", "name phone")
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(20);

    return res.json({ success: true, battles });
  } catch (err) {
    console.error("GET MY BATTLES ERROR:", err);
    return res.status(500).json({ success: false, msg: err.message });
  }
};

export const getSingleBattle = async (req, res) => {
  try {
    await expireOldOpenBattles();
    const userId = getUserId(req);
    const { battleId } = req.params;

    const battle = await Battle.findOne({ battleId })
      .populate("createdBy", "name phone")
      .populate("opponent", "name phone")
      .populate("winner", "name phone")
      .populate("resultSubmittedBy", "name phone");

    if (!battle) return res.status(404).json({ success: false, msg: "Battle not found" });

    const creatorId = battle.createdBy?._id?.toString();
    const opponentId = battle.opponent?._id?.toString();

    if (creatorId !== userId && opponentId !== userId) {
      return res.status(403).json({ success: false, msg: "You are not part of this battle" });
    }

    return res.json({ success: true, battle });
  } catch (err) {
    console.error("GET SINGLE BATTLE ERROR:", err);
    return res.status(500).json({ success: false, msg: err.message });
  }
};


export const joinBattle = async (req, res) => {
  try {
    await expireOldOpenBattles();
    const userId = getUserId(req);
    const { battleId } = req.params;

    const battle = await Battle.findOne({ battleId });
    if (!battle) return res.status(404).json({ success: false, msg: "Battle not found" });

    // ✅ Dummy battle check sabse pehle — koi bhi aur restriction se pehle
    if (battle.isDummy) {
      await Battle.deleteOne({ _id: battle._id });
      return res.status(400).json({
        success: false,
        msg: "Ye battle abhi available nahi hai. Koi doosri table try karein.",
      });
    }

    const activeBattleExists = await hasUserActiveUnsubmittedBattle(userId);
    if (activeBattleExists) {
      return res.status(400).json({
        success: false,
        msg: "Aapki ek battle already chal rahi hai. Pehle uska result update karo.",
      });
    }

    if (battle.status !== "open") {
      return res.status(400).json({ success: false, msg: "Battle already requested or joined" });
    }

    if (battle.createdBy.toString() === userId) {
      return res.status(400).json({ success: false, msg: "You cannot join your own battle" });
    }

    const wallet = await getWallet(userId);
    if (getPlayableBalance(wallet) < Number(battle.amount || 0)) {
      return res.status(400).json({ success: false, msg: "Insufficient wallet balance" });
    }

    battle.opponent = userId;
    battle.status = "join_requested";
    battle.timerStartedAt = null;
    await battle.save();

    await cancelOtherOpenBattles(battle.createdBy, battle.battleId);
    await cancelOtherOpenBattles(userId, battle.battleId);

    return res.json({ success: true, msg: "Play request sent. Other searching battles removed.", battle });
  } catch (err) {
    console.error("JOIN BATTLE ERROR:", err);
    return res.status(500).json({ success: false, msg: err.message });
  }
};



export const startBattle = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { battleId } = req.params;

    const battle = await Battle.findOne({ battleId });
    if (!battle) return res.status(404).json({ success: false, msg: "Battle not found" });

    if (battle.createdBy.toString() !== userId) {
      return res.status(403).json({ success: false, msg: "Only battle creator can start this battle" });
    }

    if (battle.status !== "join_requested" || !battle.opponent) {
      return res.status(400).json({ success: false, msg: "No player request found" });
    }

    const amount = Number(battle.amount || 0);
    const prize = calculateBattlePrize(amount);

    const lockedBattle = await Battle.findOneAndUpdate(
      { _id: battle._id, status: "join_requested", entryLocked: { $ne: true } },
      { $set: { entryLocked: true, status: "running", timerStartedAt: new Date(), prize } },
      { new: true }
    );

    if (!lockedBattle) {
      const latestBattle = await Battle.findById(battle._id);
      return res.json({ success: true, msg: "Battle already started. Amount dobara deduct nahi hua.", battle: latestBattle });
    }

    const creatorWallet = await getWallet(lockedBattle.createdBy);
    const opponentWallet = await getWallet(lockedBattle.opponent);

    if (getPlayableBalance(creatorWallet) < amount) {
      lockedBattle.entryLocked = false;
      lockedBattle.status = "join_requested";
      await lockedBattle.save();
      return res.status(400).json({ success: false, msg: "Creator wallet me insufficient balance hai" });
    }

    if (getPlayableBalance(opponentWallet) < amount) {
      lockedBattle.entryLocked = false;
      lockedBattle.status = "join_requested";
      await lockedBattle.save();
      return res.status(400).json({ success: false, msg: "Opponent wallet me insufficient balance hai" });
    }

    await lockAmount(lockedBattle.createdBy, amount, lockedBattle.battleId);
    await lockAmount(lockedBattle.opponent, amount, lockedBattle.battleId);

    return res.json({ success: true, msg: "Battle started", battle: lockedBattle });
  } catch (err) {
    console.error("START BATTLE ERROR:", err);
    return res.status(500).json({ success: false, msg: err.message });
  }
};

export const rejectBattleRequest = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { battleId } = req.params;

    const battle = await Battle.findOne({ battleId });
    if (!battle) return res.status(404).json({ success: false, msg: "Battle not found" });

    if (battle.createdBy.toString() !== userId) {
      return res.status(403).json({ success: false, msg: "Only battle creator can reject this request" });
    }

    if (battle.status !== "join_requested" || !battle.opponent) {
      return res.status(400).json({ success: false, msg: "No pending request found" });
    }

    battle.opponent = null;
    battle.status = "open";
    battle.timerStartedAt = null;
    await battle.save();

    return res.json({ success: true, msg: "Request rejected.", battle });
  } catch (err) {
    console.error("REJECT BATTLE ERROR:", err);
    return res.status(500).json({ success: false, msg: err.message });
  }
};

export const submitRoomCode = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { battleId } = req.params;
    const roomCode = String(req.body.roomCode || "").trim();

    if (!/^\d{8}$/.test(roomCode)) {
      return res.status(400).json({ success: false, msg: "Room code only 8 digit" });
    }

    const battle = await Battle.findOne({ battleId });
    if (!battle) return res.status(404).json({ success: false, msg: "Battle not found" });

    if (battle.createdBy.toString() !== userId) {
      return res.status(403).json({ success: false, msg: "Only battle creator can set room code" });
    }

    if (!["running", "room_submitted"].includes(battle.status)) {
      return res.status(400).json({ success: false, msg: "Room code cannot be submitted now" });
    }

    battle.ludoKingRoomCode = roomCode;
    battle.roomCodeSetBy = userId;
    battle.status = "room_submitted";
    await battle.save();

    return res.json({ success: true, msg: "Room code submitted", battle });
  } catch (err) {
    console.error("SUBMIT ROOM CODE ERROR:", err);
    return res.status(500).json({ success: false, msg: err.message });
  }
};

export const submitResult = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { battleId } = req.params;
    const result = String(req.body.result || "").toLowerCase();

    const battle = await Battle.findOne({ battleId });
    if (!battle) return res.status(404).json({ success: false, msg: "Battle not found" });

    const creatorId = battle.createdBy.toString();
    const opponentId = battle.opponent?.toString();
    const isCreator = creatorId === userId;
    const isOpponent = opponentId === userId;

    if (!isCreator && !isOpponent) {
      return res.status(403).json({ success: false, msg: "You are not part of this battle" });
    }

    if (!["running", "room_submitted", "cancel_requested", "result_submitted"].includes(battle.status)) {
      return res.status(400).json({ success: false, msg: "Result cannot be submitted now" });
    }

    if (!["win", "loss", "cancel"].includes(result)) {
      return res.status(400).json({ success: false, msg: "Invalid result type" });
    }

    if (result === "win" && !req.file) {
      return res.status(400).json({ success: false, msg: "Winning screenshot required" });
    }

    const alreadySubmitted = battle.results.some((item) => item.user.toString() === userId);
    if (alreadySubmitted) {
      return res.status(400).json({ success: false, msg: "Aap result already submit kar chuke ho" });
    }

    const screenshotPath = result === "win" && req.file ? `/uploads/results/${req.file.filename}` : "";

    battle.results.push({ user: userId, result, screenshot: screenshotPath, submittedAt: new Date() });

    if (screenshotPath && !battle.screenshot) battle.screenshot = screenshotPath;

    battle.resultSubmittedBy = userId;
    battle.resultType = result;

    const creatorResult = battle.results.find((item) => item.user.toString() === creatorId);
    const opponentResult = battle.results.find((item) => item.user.toString() === opponentId);

    if (!creatorResult || !opponentResult) {
      battle.status = result === "cancel" ? "cancel_requested" : "result_submitted";
      await battle.save();
      return res.json({
        success: true,
        msg: result === "win" ? "You Won ✅ Result submitted." : result === "loss" ? "Loss submitted. Waiting for other user." : "Cancel request submitted. Waiting for other user.",
        battle,
      });
    }

    const r1 = creatorResult.result;
    const r2 = opponentResult.result;

    // Dono cancel — refund dono ko
    if (r1 === "cancel" && r2 === "cancel") {
      if (battle.entryLocked && !battle.resultSettled) {
        await refundAmount(battle.createdBy, battle.amount, battle.battleId, "Battle cancelled by both users");
        await refundAmount(battle.opponent, battle.amount, battle.battleId, "Battle cancelled by both users");
      }

      battle.status = "cancelled";
      battle.winner = null;
      battle.resultSettled = true;
      battle.adminNote = "Auto cancelled because both users cancelled";
      await battle.save();

      return res.json({ success: true, msg: "Battle cancelled by both users.", battle });
    }

    // Ek win ek loss — winner settle karo
    if ((r1 === "win" && r2 === "loss") || (r1 === "loss" && r2 === "win")) {
      // ✅ FIX: pehle results.push() sirf memory me tha, settleWinner() se pehle
      // save hi nahi hota tha. Ab pehle results properly save karte hain,
      // phir settlement karte hain — taaki results history hamesha DB me safe rahe
      // chahe settlement me aage koi bhi error aaye.
      await battle.save();

      const winnerId = r1 === "win" ? battle.createdBy : battle.opponent;

      try {
        const { battle: settledBattle, alreadyPaid } = await settleWinner(battle, winnerId);

        if (!settledBattle) {
          return res.json({ success: true, msg: "Result already settled. Payment dobara add nahi hua.", battle });
        }

        return res.json({
          success: true,
          msg: alreadyPaid ? "Result already settled. Payment dobara add nahi hua." : "Result auto approved aur payment credit ho gaya.",
          battle: settledBattle,
        });
      } catch (settleErr) {
        console.error("SUBMIT RESULT -> AUTO SETTLE ERROR:", settleErr);
        return res.status(500).json({
          success: false,
          msg: "Result submit ho gaya lekin payment process karte waqt error aayi. Admin se contact karein.",
        });
      }
    }

    // Conflict — admin decide karega
    battle.status = "result_submitted";
    battle.adminNote = "Admin approval required because result conflict found";
    await battle.save();

    return res.json({ success: true, msg: "Result submitted. Admin approval pending.", battle });
  } catch (err) {
    console.error("SUBMIT RESULT ERROR:", err);
    return res.status(500).json({ success: false, msg: err.message });
  }
};

export const cancelBattle = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { battleId } = req.params;

    const battle = await Battle.findOne({ battleId });
    if (!battle) return res.status(404).json({ success: false, msg: "Battle not found" });

    if (battle.status === "open") {
      if (battle.createdBy.toString() !== userId) {
        return res.status(403).json({ success: false, msg: "Only creator can cancel open battle" });
      }
      battle.status = "cancelled";
      battle.adminNote = "Open battle cancelled by creator";
      await battle.save();
      return res.json({ success: true, msg: "Battle cancelled", battle });
    }

    if (battle.status === "join_requested") {
      const isCreator = battle.createdBy.toString() === userId;
      const isOpponent = battle.opponent?.toString() === userId;

      if (!isCreator && !isOpponent) {
        return res.status(403).json({ success: false, msg: "You are not part of this battle" });
      }

      if (isOpponent) {
        battle.opponent = null;
        battle.status = "open";
        battle.timerStartedAt = null;
        battle.adminNote = "Join request cancelled by opponent";
        await battle.save();
        return res.json({ success: true, msg: "Request cancelled", battle });
      }

      battle.status = "cancelled";
      battle.adminNote = "Join requested battle cancelled by creator";
      await battle.save();
      return res.json({ success: true, msg: "Battle cancelled", battle });
    }

    return res.status(400).json({ success: false, msg: "Running battle cancel ke liye Cancel result button use karein" });
  } catch (err) {
    console.error("CANCEL BATTLE ERROR:", err);
    return res.status(500).json({ success: false, msg: err.message });
  }
};

export const getAdminBattles = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const page = parseInt(req.query.page, 10) || 1;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.battleId) filter.battleId = req.query.battleId;

    const battles = await Battle.find(filter)
      .select("battleId amount prize status createdAt updatedAt createdBy opponent winner ludoKingRoomCode results resultSubmittedBy resultType winner adminNote")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name phone mobile username")
      .populate("opponent", "name phone mobile username")
      .populate("winner", "name phone mobile username")
      .lean();

    const totalBattles = await Battle.countDocuments(filter);

    return res.json({
      success: true,
      count: battles.length,
      total: totalBattles,
      page,
      totalPages: Math.ceil(totalBattles / limit),
      battles: battles || [],
    });
  } catch (err) {
    console.error("ADMIN FETCH BATTLES ERROR:", err);
    return res.status(500).json({ success: false, msg: err.message });
  }
};

export const getAdminSingleBattle = async (req, res) => {
  try {
    const battle = await Battle.findById(req.params.id)
      .populate("createdBy", "name phone mobile username")
      .populate("opponent", "name phone mobile username")
      .populate("winner", "name phone mobile username")
      .populate("resultSubmittedBy", "name phone");

    if (!battle) return res.status(404).json({ success: false, msg: "Match nahi mila" });
    return res.json({ success: true, battle });
  } catch (err) {
    console.error("GET ADMIN SINGLE BATTLE ERROR:", err);
    return res.status(500).json({ success: false, msg: err.message });
  }
};

export const approveAdminBattle = async (req, res) => {
  try {
    const { id } = req.params;
    const { winnerId, adminNote } = req.body;

    if (!winnerId) {
      return res.status(400).json({ success: false, msg: "Winner ID is required" });
    }

    const battle = await Battle.findById(id);
    if (!battle) return res.status(404).json({ success: false, msg: "Match nahi mila" });

    // ✅ FIX: winner ko match ke players me se hona chahiye, warna galat user ko
    // paisa credit ho sakta hai.
    const creatorId = battle.createdBy?.toString();
    const opponentId = battle.opponent?.toString();
    if (String(winnerId) !== creatorId && String(winnerId) !== opponentId) {
      return res.status(400).json({ success: false, msg: "Winner is not a player in this battle" });
    }

    let settleResult;
    try {
      settleResult = await settleWinner(battle, winnerId);
    } catch (settleErr) {
      // ✅ FIX: ab error yahan CLEARLY log hoga aur admin ko bhi bataya jayega
      // ki payment process karte waqt error aayi (silent "success" nahi dikhega).
      console.error(`APPROVE ADMIN BATTLE -> settleWinner FAILED for battle ${id}:`, settleErr);
      return res.status(500).json({
        success: false,
        msg: "Winner set karte waqt payment process me error aayi. Server logs check karein. Payment credit NAHI hui hai.",
      });
    }

    const { battle: settledBattle, alreadyPaid } = settleResult;

    if (!settledBattle) {
      return res.status(400).json({ success: false, msg: "Result already settled ya invalid status hai" });
    }

    // ✅ FIX: adminNote ko settleWinner ke andar hi set karke ek hi baar save karte
    // hain — pehle ek extra alag .save() call yahan hota tha jo silently fail ho
    // sakta tha.
    if (adminNote && settledBattle.adminNote !== adminNote) {
      await Battle.updateOne({ _id: settledBattle._id }, { $set: { adminNote } });
      settledBattle.adminNote = adminNote;
    }

    return res.json({
      success: true,
      msg: alreadyPaid
        ? "Winner pehle se hi approved tha, payment dobara credit nahi hui."
        : "Winner approved successfully aur payment credit ho gayi.",
      battle: settledBattle,
    });
  } catch (err) {
    console.error("APPROVE ADMIN BATTLE ERROR:", err);
    return res.status(500).json({ success: false, msg: err.message });
  }
};

export const rejectAdminBattle = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNote } = req.body;

    const battle = await Battle.findById(id);
    if (!battle) return res.status(404).json({ success: false, msg: "Match nahi mila" });

    if (["approved", "cancelled", "rejected"].includes(battle.status)) {
      return res.status(400).json({ success: false, msg: "Ye match already close ho chuka hai" });
    }

    if (battle.entryLocked && !battle.resultSettled && ["running", "room_submitted", "result_submitted", "cancel_requested"].includes(battle.status)) {
      if (battle.createdBy) {
        await refundAmount(battle.createdBy, battle.amount, battle.battleId, adminNote || "Cancelled by admin");
      }
      if (battle.opponent) {
        await refundAmount(battle.opponent, battle.amount, battle.battleId, adminNote || "Cancelled by admin");
      }
    }

    battle.status = "cancelled";
    battle.adminNote = adminNote || "Cancelled by admin from match view";
    battle.resultSettled = true;
    await battle.save();

    return res.json({ success: true, msg: "Match cancel aur refund ho gaya", battle });
  } catch (err) {
    console.error("REJECT ADMIN BATTLE ERROR:", err);
    return res.status(500).json({ success: false, msg: err.message });
  }
};