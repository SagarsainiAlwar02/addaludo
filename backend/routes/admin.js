import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import auth from "../middleware/auth.js";
import Battle from "../models/battle.js";
import Match from "../models/match.js";
import Wallet from "../models/wallet.js";
import Transaction from "../models/transaction.js";
import User from "../models/user.js";
import Deposit from "../models/deposit.js";
import Withdraw from "../models/withdraw.js";
import PaymentSetting from "../models/paymentSetting.js";

// ✅ NEW: Admin controller functions import
import {
  setBattleWinner,
  cancelBattle,
  setMatchWinner,
  adminCancelMatch,
} from "../controllers/adminController.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ================= UPLOAD SETUP =================
const uploadDir = path.join(__dirname, "../uploads/payment");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, "scanner-" + Date.now() + ext);
  },
});
const upload = multer({ storage });

// ================= HELPERS =================
const getAdminId = (req) => req.user?._id || req.user?.id || req.user || null;

const todayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const cleanPhone = (mobile) => String(mobile || "").replace(/\D/g, "").slice(-10);

const getPaymentSetting = async () => {
  let setting = await PaymentSetting.findOne();
  if (!setting) {
    setting = await PaymentSetting.create({
      scanner: { image: "", min: 0, max: 2000, active: true },
      upiList: [],
      upiLimit: { min: 2000, max: 100000 },
      bank: { name: "", accountNumber: "", ifsc: "" },
    });
  }
  return setting;
};

// ================= USERS =================
router.get("/users", auth, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 }).lean();
    const userIds = users.map((u) => u._id);
    const wallets = await Wallet.find({ userId: { $in: userIds } }).lean();

    const walletMap = {};
    wallets.forEach((wallet) => {
      walletMap[String(wallet.userId)] = wallet;
    });

    const usersWithWallet = users.map((user) => {
      const wallet = walletMap[String(user._id)] || {};
      const depositBalance = Number(wallet.balance || 0);
      const winningsBalance = Number(wallet.winnings || 0);
      const bonusBalance = Number(wallet.bonus || 0);
      const referralBalance = Number(wallet.referralBalance || 0);
      const lockedBalance = Number(wallet.locked || 0);
      const totalBalance = depositBalance + winningsBalance;

      return {
        ...user,
        balance: totalBalance,
        wallet: {
          balance: depositBalance,
          deposit: depositBalance,
          winnings: winningsBalance,
          bonus: bonusBalance,
          referralBalance,
          locked: lockedBalance,
          totalBalance,
        },
      };
    });

    res.json(usersWithWallet);
  } catch (err) {
    console.log("❌ ADMIN USERS ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

router.patch("/block/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "User not found" });
    user.status = user.status === "blocked" ? "active" : "blocked";
    await user.save();
    res.json({ msg: `User ${user.status}`, user });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.delete("/user/:id", auth, async (req, res) => {
  try {
    const userId = req.params.id;
    await Wallet.deleteMany({ userId });
    await Transaction.deleteMany({ userId });
    await Withdraw.deleteMany({ userId });
    await User.findByIdAndDelete(userId);
    res.json({ msg: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ================= ADMIN / AGENT LIST =================
router.get("/admin-list", auth, async (req, res) => {
  try {
    const admins = await User.find({ role: { $in: ["admin", "agent"] } })
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();
    res.json(admins);
  } catch (err) {
    console.log("❌ ADMIN LIST ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

// ================= CREATE ADMIN / AGENT =================
router.post("/create-admin", auth, async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const role = String(req.body.role || "admin").trim();

    if (!name || !email || !password) {
      return res.status(400).json({ msg: "Name, Email aur Password required hai" });
    }
    if (!["admin", "agent"].includes(role)) {
      return res.status(400).json({ msg: "Invalid role" });
    }
    if (password.length < 6) {
      return res.status(400).json({ msg: "Password minimum 6 characters hona chahiye" });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ msg: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await User.create({
      name, email, password: hashedPassword,
      phone: "ADM" + Date.now(),
      role, status: "active",
    });

    res.json({
      success: true,
      msg: `${role} created successfully`,
      admin: { _id: admin._id, name: admin.name, email: admin.email, role: admin.role, status: admin.status },
    });
  } catch (err) {
    console.log("❌ CREATE ADMIN ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

// ================= DELETE ADMIN / AGENT =================
router.delete("/delete/:id", auth, async (req, res) => {
  try {
    const admin = await User.findById(req.params.id);
    if (!admin) return res.status(404).json({ msg: "Admin / Agent not found" });
    if (!["admin", "agent"].includes(admin.role)) {
      return res.status(400).json({ msg: "Only admin/agent delete ho sakta hai" });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, msg: "Admin / Agent deleted successfully" });
  } catch (err) {
    console.log("❌ DELETE ADMIN ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

// ================= DASHBOARD =================
router.get("/dashboard", auth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalBlockedUsers = await User.countDocuments({ role: "user", status: "blocked" });

    const txAgg = await Transaction.aggregate([
      { $match: { status: "success" } },
      { $group: { _id: "$type", total: { $sum: "$amount" } } },
    ]);

    const txMap = {};
    txAgg.forEach((item) => { txMap[item._id] = item.total || 0; });

    const walletAgg = await Wallet.aggregate([
      { $group: { _id: null, walletBalance: { $sum: "$balance" }, holdBalance: { $sum: "$locked" }, totalReferral: { $sum: "$referralBalance" }, totalWinnings: { $sum: "$winnings" } } },
    ]);

    const userReferralAgg = await User.aggregate([
      { $group: { _id: null, totalReferralEarning: { $sum: "$totalReferralEarning" } } },
    ]);

    const walletData = walletAgg[0] || {};
    const userReferralData = userReferralAgg[0] || {};

    const totalDeposit = txMap.deposit || 0;
    const totalWithdraw = txMap.withdraw || 0;
    const totalBonus = txMap.bonus || 0;
    const totalPenalty = txMap.penalty || 0;
    const totalReferralRedeem = txMap.referral_redeem || 0;
    const totalGameEntry = txMap.game_entry || 0;
    const totalGameWin = txMap.game_win || 0;
    const totalRefund = txMap.refund || 0;
    const totalEarnings = totalGameEntry + totalPenalty - totalGameWin - totalRefund;

    res.json({
      totalUsers, totalBlockedUsers, totalDeposit, totalWithdraw,
      totalEarnings: Math.max(0, totalEarnings),
      totalCommission: txMap.referral_commission || 0,
      totalReferral: Number(walletData.totalReferral || 0) + Number(userReferralData.totalReferralEarning || 0) + Number(totalReferralRedeem || 0),
      totalBonus, totalPenalty,
      holdBalance: walletData.holdBalance || 0,
      walletBalance: walletData.walletBalance || 0,
      totalWinnings: walletData.totalWinnings || 0,
    });
  } catch (err) {
    console.log("❌ DASHBOARD ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

// ================= BONUS =================
router.post("/add-bonus", auth, async (req, res) => {
  try {
    const adminId = getAdminId(req);
    const { name, mobile, amount, reason } = req.body;
    const phone = cleanPhone(mobile);
    const bonusAmount = Number(amount);

    if (!phone || phone.length !== 10) return res.status(400).json({ msg: "Valid mobile number required" });
    if (!bonusAmount || bonusAmount <= 0) return res.status(400).json({ msg: "Valid amount required" });

    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ msg: "User not found with this mobile number" });

    let wallet = await Wallet.findOne({ userId: user._id });
    if (!wallet) {
      wallet = await Wallet.create({ userId: user._id, balance: 0, bonus: 0, winnings: 0, referralBalance: 0, locked: 0 });
    }

    wallet.bonus = Number(wallet.bonus || 0) + bonusAmount;
    await wallet.save();

    const transaction = await Transaction.create({
      userId: user._id, amount: bonusAmount, type: "bonus", status: "success",
      note: reason || "Admin bonus added", balanceAfter: wallet.bonus,
      approvedBy: adminId, approvedAt: new Date(),
    });

    res.json({ success: true, msg: "Bonus added successfully", user: { _id: user._id, name: user.name || name || "", phone: user.phone }, wallet, transaction });
  } catch (err) {
    console.log("❌ ADD BONUS ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

// ================= PENALTY =================
router.post("/add-penalty", auth, async (req, res) => {
  try {
    const adminId = getAdminId(req);
    const { name, mobile, amount, reason } = req.body;
    const phone = cleanPhone(mobile);
    const penaltyAmount = Number(amount);

    if (!phone || phone.length !== 10) return res.status(400).json({ msg: "Valid mobile number required" });
    if (!penaltyAmount || penaltyAmount <= 0) return res.status(400).json({ msg: "Valid amount required" });

    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ msg: "User not found with this mobile number" });

    let wallet = await Wallet.findOne({ userId: user._id });
    if (!wallet) {
      wallet = await Wallet.create({ userId: user._id, balance: 0, bonus: 0, winnings: 0, referralBalance: 0, locked: 0 });
    }


const bonusBalance = Number(wallet.bonus || 0);
const depositBalance = Number(wallet.balance || 0);
const winningBalance = Number(wallet.winnings || 0);
const totalWallet = bonusBalance + depositBalance + winningBalance;

if (totalWallet < penaltyAmount) {
  return res.status(400).json({ msg: `User wallet balance low. Current wallet ₹${totalWallet}` });
}

let remainingPenalty = penaltyAmount;

// 1. Pehle Bonus se kaato
const cutFromBonus = Math.min(bonusBalance, remainingPenalty);
wallet.bonus = bonusBalance - cutFromBonus;
remainingPenalty -= cutFromBonus;

// 2. Fir Deposit Balance se kaato
const cutFromBalance = Math.min(depositBalance, remainingPenalty);
wallet.balance = depositBalance - cutFromBalance;
remainingPenalty -= cutFromBalance;

// 3. Fir Winnings se kaato
const cutFromWinnings = Math.min(winningBalance, remainingPenalty);
wallet.winnings = winningBalance - cutFromWinnings;
remainingPenalty -= cutFromWinnings;

await wallet.save();

const transaction = await Transaction.create({
  userId: user._id, amount: penaltyAmount, type: "penalty", status: "success",
  note: reason || `Admin penalty deducted. Bonus ₹${cutFromBonus}, Deposit ₹${cutFromBalance}, Winnings ₹${cutFromWinnings}`,
  balanceAfter: Number(wallet.bonus || 0) + Number(wallet.balance || 0) + Number(wallet.winnings || 0),
  approvedBy: adminId, approvedAt: new Date(),
});

    res.json({ success: true, msg: "Penalty deducted successfully", user: { _id: user._id, name: user.name || name || "", phone: user.phone }, wallet, transaction });
  } catch (err) {
    console.log("❌ ADD PENALTY ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

// ================= SETTINGS REPORT =================
router.get("/settings-report", auth, async (req, res) => {
  try {
    const bonus = await Transaction.find({ type: "bonus", status: "success" })
      .populate("userId", "name phone email")
      .populate("approvedBy", "name phone email role")
      .sort({ createdAt: -1 }).lean();

    const penalty = await Transaction.find({ type: "penalty", status: "success" })
      .populate("userId", "name phone email")
      .populate("approvedBy", "name phone email role")
      .sort({ createdAt: -1 }).lean();

    const formatReport = (items) => items.map((item) => ({
      _id: item._id,
      name: item.userId?.name || "Unknown User",
      mobile: item.userId?.phone || "",
      email: item.userId?.email || "",
      amount: item.amount || 0,
      reason: item.note || "",
      balanceAfter: item.balanceAfter || 0,
      adminName: item.approvedBy?.name || "Admin",
      adminPhone: item.approvedBy?.phone || "",
      createdAt: item.createdAt,
    }));

    res.json({ bonus: formatReport(bonus), penalty: formatReport(penalty) });
  } catch (err) {
    console.log("❌ SETTINGS REPORT ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

// ================= PAYMENT SETTINGS =================
router.get("/payment-settings", async (req, res) => {
  try {
    const setting = await getPaymentSetting();
    res.json({
      scanner: setting.scanner,
      scannerImage: setting.scanner?.image || "",
      scannerLimit: { min: setting.scanner?.min || 0, max: setting.scanner?.max || 2000 },
      upiList: setting.upiList || [],
      upiLimit: setting.upiLimit || { min: 2000, max: 100000 },
      bank: setting.bank || { name: "", accountNumber: "", ifsc: "" },
    });
  } catch (err) {
    console.log("❌ PAYMENT SETTINGS ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

router.post("/upload-scanner", auth, upload.single("file"), async (req, res) => {
  try {
    const setting = await getPaymentSetting();
    let scannerLimit = {};
    try { scannerLimit = JSON.parse(req.body.scannerLimit || "{}"); } catch { scannerLimit = {}; }
    if (req.file) setting.scanner.image = `/uploads/payment/${req.file.filename}`;
    setting.scanner.min = Number(scannerLimit.min || 0);
    setting.scanner.max = Number(scannerLimit.max || 2000);
    setting.scanner.active = true;
    await setting.save();
    res.json({ success: true, msg: "Scanner saved successfully", scanner: setting.scanner });
  } catch (err) {
    console.log("❌ SAVE SCANNER ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

router.post("/save-upi", auth, async (req, res) => {
  try {
    const setting = await getPaymentSetting();
    const { upiList, upiLimit } = req.body;
    const cleanUpi = Array.isArray(upiList) ? upiList.map((x) => String(x).trim()).filter(Boolean) : [];
    setting.upiList = cleanUpi;
    setting.upiLimit = { min: Number(upiLimit?.min || 2000), max: Number(upiLimit?.max || 100000) };
    await setting.save();
    res.json({ success: true, msg: "UPI saved successfully", upiList: setting.upiList, upiLimit: setting.upiLimit });
  } catch (err) {
    console.log("❌ SAVE UPI ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

router.post("/save-bank", auth, async (req, res) => {
  try {
    const setting = await getPaymentSetting();
    setting.bank = { name: req.body.name || "", accountNumber: req.body.accountNumber || "", ifsc: req.body.ifsc || "" };
    await setting.save();
    res.json({ success: true, msg: "Bank details saved successfully", bank: setting.bank });
  } catch (err) {
    console.log("❌ SAVE BANK ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

// ================= TRANSACTIONS =================
router.get("/transactions", auth, async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate("userId", "name phone email")
      .populate("approvedBy", "name phone email role")
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ================= DEPOSITS =================
router.get("/deposits", auth, async (req, res) => {
  try {
    const deposits = await Deposit.find()
      .populate("userId", "name phone email")
      .populate("approvedBy", "name phone email role")
      .sort({ createdAt: -1 }).lean();

    const bonus = await Transaction.find({ type: "bonus" })
      .populate("userId", "name phone email")
      .populate("approvedBy", "name phone email role")
      .sort({ createdAt: -1 }).lean();

    const bonusRows = bonus.map((item) => ({ ...item, utr: "-", screenshot: "", paymentMethod: "bonus" }));
    const finalList = [...deposits, ...bonusRows].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(finalList);
  } catch (err) {
    console.log("❌ DEPOSITS ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

// ================= WITHDRAWS =================
router.get("/withdraws", auth, async (req, res) => {
  try {
    const withdraws = await Withdraw.find()
      .populate("userId", "name phone email")
      .populate("actionBy", "name phone email role")
      .sort({ createdAt: -1 }).lean();
    res.json(withdraws.map((w) => ({ ...w, type: "withdraw" })));
  } catch (err) {
    console.log("❌ WITHDRAWS ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

// ================= APPROVE WITHDRAW =================
router.patch("/withdraw/approve/:id", auth, async (req, res) => {
  try {
    const adminId = getAdminId(req);
    const withdraw = await Withdraw.findById(req.params.id);
    if (!withdraw) return res.status(404).json({ msg: "Withdraw not found" });
    if (withdraw.status !== "pending") return res.status(400).json({ msg: "Already processed" });

    const wallet = await Wallet.findOne({ userId: withdraw.userId });
    if (!wallet) return res.status(404).json({ msg: "Wallet not found" });

    const amount = Number(withdraw.amount || 0);
    if (Number(wallet.locked || 0) < amount) return res.status(400).json({ msg: "Invalid locked balance" });

    wallet.locked = Math.max(0, Number(wallet.locked || 0) - amount);
    await wallet.save();

    withdraw.status = "approved";
    withdraw.actionBy = adminId;
    withdraw.actionAt = new Date();
    await withdraw.save();

    await Transaction.create({
      userId: withdraw.userId, amount, type: "withdraw", status: "success",
      note: "Withdraw approved by agent/admin", balanceAfter: wallet.balance,
      approvedBy: adminId, approvedAt: new Date(),
    });

    res.json({ msg: "Withdraw approved", withdraw });
  } catch (err) {
    console.log("❌ APPROVE WITHDRAW ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

// ================= REJECT WITHDRAW =================
router.patch("/withdraw/reject/:id", auth, async (req, res) => {
  try {
    const adminId = getAdminId(req);
    const withdraw = await Withdraw.findById(req.params.id);
    if (!withdraw) return res.status(404).json({ msg: "Withdraw not found" });
    if (withdraw.status !== "pending") return res.status(400).json({ msg: "Already processed" });

    const wallet = await Wallet.findOne({ userId: withdraw.userId });
    if (!wallet) return res.status(404).json({ msg: "Wallet not found" });

    const amount = Number(withdraw.amount || 0);
    wallet.winnings = Number(wallet.winnings || 0) + amount;
    wallet.locked = Math.max(0, Number(wallet.locked || 0) - amount);
    await wallet.save();

    withdraw.status = "rejected";
    withdraw.actionBy = adminId;
    withdraw.actionAt = new Date();
    await withdraw.save();

    await Transaction.create({
      userId: withdraw.userId, amount, type: "refund", status: "success",
      note: "Withdraw rejected refund to winnings", balanceAfter: wallet.winnings,
      approvedBy: adminId, approvedAt: new Date(),
    });

    res.json({ msg: "Withdraw rejected", withdraw });
  } catch (err) {
    console.log("❌ REJECT WITHDRAW ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});


// ================= DUMMY BATTLES =================
router.post("/dummy-battle/create", auth, async (req, res) => {
  try {
    const { name, mobile, amount } = req.body;
    const dummyAmount = Number(amount);

    if (!name || !dummyAmount || dummyAmount < 50) {
      return res.status(400).json({ msg: "Name aur valid amount (min ₹50) required hai" });
    }

    const battleId = "battle_" + Date.now() + "_" + Math.floor(Math.random() * 9999);
    const totalPool = dummyAmount * 2;
    const platformFee = dummyAmount <= 500 ? dummyAmount * 0.05 * 2 : dummyAmount * 0.025 * 2;
    const prize = Math.floor(totalPool - platformFee);

    const battle = await Battle.create({
      battleId,
      amount: dummyAmount,
      prize,
      status: "open",
      isDummy: true,
      dummyName: String(name).trim(),
      dummyMobile: String(mobile || "").trim(),
    });

    res.json({ success: true, msg: "Dummy battle created", battle });
  } catch (err) {
    console.log("❌ CREATE DUMMY BATTLE ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

router.get("/dummy-battle/all", auth, async (req, res) => {
  try {
    const battles = await Battle.find({ isDummy: true }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, battles });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.delete("/dummy-battle/:id", auth, async (req, res) => {
  try {
    await Battle.findOneAndDelete({ _id: req.params.id, isDummy: true });
    res.json({ success: true, msg: "Dummy battle removed" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});



// ================= ADMIN BATTLES =================
router.get("/battles", auth, async (req, res) => {
  try {
    const battles = await Battle.find()
      .populate("createdBy", "name phone")
      .populate("opponent", "name phone")
      .populate("winner", "name phone")
      .populate("roomCodeSetBy", "name phone")
      .populate("resultSubmittedBy", "name phone")
      .populate("results.user", "name phone")
      .sort({ createdAt: -1 }).lean();
    res.json({ success: true, battles });
  } catch (err) {
    console.log("❌ ADMIN BATTLES ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

router.get("/battles/:id", auth, async (req, res) => {
  try {
    const battle = await Battle.findById(req.params.id)
      .populate("createdBy", "name phone")
      .populate("opponent", "name phone")
      .populate("winner", "name phone")
      .populate("results.user", "name phone")
      .lean();
    if (!battle) return res.status(404).json({ msg: "Battle not found" });
    res.json({ success: true, battle });
  } catch (err) {
    console.log("❌ ADMIN BATTLE DETAIL ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

// ================= APPROVE BATTLE =================
router.patch("/battles/approve/:id", auth, async (req, res) => {
  try {
    const adminId = getAdminId(req);
    const { winnerId, adminNote } = req.body;

    if (!winnerId) return res.status(400).json({ msg: "Winner required hai" });

    const battle = await Battle.findOneAndUpdate(
      { _id: req.params.id, resultSettled: false },
      { $set: { resultSettled: true } },
      { new: true }
    );

    if (!battle) return res.status(400).json({ msg: "Battle already settled or not found" });

    const creatorId = String(battle.createdBy);
    const opponentId = battle.opponent ? String(battle.opponent) : null;

    if (![creatorId, opponentId].filter(Boolean).includes(String(winnerId))) {
      return res.status(400).json({ msg: "Winner is match ka player nahi hai" });
    }

    const amount = Number(battle.amount || 0);
    const prize = Number(battle.prize || amount * 2 || 0);

    const alreadyPaid = await Transaction.findOne({
      type: "game_win", status: "success",
      $or: [{ roomId: battle.battleId }, { roomId: String(battle._id) }],
    });

    if (alreadyPaid) {
      battle.status = "approved";
      battle.winner = winnerId;
      battle.adminNote = adminNote || "Already settled. Duplicate payment stopped.";
      battle.actionBy = adminId;
      battle.actionAt = new Date();
      await battle.save();
      return res.json({ success: true, msg: "Battle already paid thi. Duplicate payment stop kar diya.", battle });
    }

    const playerIds = [battle.createdBy, battle.opponent].filter(Boolean);

    for (const playerId of playerIds) {
      const wallet = await Wallet.findOne({ userId: playerId });
      if (!wallet) continue;

      wallet.locked = Math.max(0, Number(wallet.locked || 0) - amount);

      if (String(playerId) === String(winnerId)) {
        wallet.winnings = Number(wallet.winnings || 0) + prize;
        await Transaction.create({
          userId: playerId, amount: prize, type: "game_win", status: "success",
          note: adminNote || "Admin declared match winner",
          roomId: battle.battleId,
          balanceAfter: Number(wallet.balance || 0) + Number(wallet.winnings || 0),
          approvedBy: adminId, approvedAt: new Date(),
        });
      }
      await wallet.save();
    }

    battle.status = "approved";
    battle.winner = winnerId;
    battle.adminNote = adminNote || "Winner declared by admin";
    battle.actionBy = adminId;
    battle.actionAt = new Date();
    await battle.save();

    res.json({ success: true, msg: "Winner declared successfully", battle });
  } catch (err) {
    console.log("❌ ADMIN BATTLE APPROVE ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

// ================= REJECT BATTLE =================
router.patch("/battles/reject/:id", auth, async (req, res) => {
  try {
    const adminId = getAdminId(req);
    const { adminNote } = req.body;

    const battle = await Battle.findOneAndUpdate(
      { _id: req.params.id, resultSettled: false },
      { $set: { resultSettled: true } },
      { new: true }
    );

    if (!battle) return res.status(400).json({ msg: "Battle already settled or not found" });

    const amount = Number(battle.amount || 0);

    const alreadyRefunded = await Transaction.findOne({
      type: "refund", status: "success",
      $or: [{ roomId: battle.battleId }, { roomId: String(battle._id) }],
    });

    if (alreadyRefunded) {
      battle.status = "cancelled";
      battle.adminNote = adminNote || "Already settled. Duplicate refund stopped.";
      battle.actionBy = adminId;
      battle.actionAt = new Date();
      await battle.save();
      return res.json({ success: true, msg: "Battle already refunded. Duplicate refund stop kar diya.", battle });
    }

    const playerIds = [battle.createdBy, battle.opponent].filter(Boolean);

    for (const playerId of playerIds) {
      const wallet = await Wallet.findOne({ userId: playerId });
      if (!wallet) continue;
      wallet.locked = Math.max(0, Number(wallet.locked || 0) - amount);
      wallet.winnings = Number(wallet.winnings || 0) + amount;
      await wallet.save();

      await Transaction.create({
        userId: playerId, amount, type: "refund", status: "success",
        note: adminNote || "Match cancelled by admin refund",
        roomId: battle.battleId,
        balanceAfter: Number(wallet.balance || 0) + Number(wallet.winnings || 0),
        approvedBy: adminId, approvedAt: new Date(),
      });
    }

    battle.status = "cancelled";
    battle.resultSettled = true;
    battle.adminNote = adminNote || "Battle cancelled/refunded by admin";
    battle.actionBy = adminId;
    battle.actionAt = new Date();
    await battle.save();

    res.json({ success: true, msg: "Battle cancelled and refund processed", battle });
  } catch (err) {
    console.log("❌ ADMIN BATTLE REJECT ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

// ================= ADMIN MATCHES =================
// ✅ NEW: Get all matches
router.get("/matches", auth, async (req, res) => {
  try {
    const matches = await Match.find()
      .populate("players.userId", "name phone email")
      .populate("winner.userId", "name phone email")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, matches });
  } catch (err) {
    console.log("❌ ADMIN MATCHES ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

// ✅ NEW: Declare match winner (admin panel se)
router.patch("/matches/winner/:id", auth, setMatchWinner);

// ✅ NEW: Cancel match + refund (admin panel se)
router.patch("/matches/cancel/:id", auth, adminCancelMatch);

// ================= AGENT REPORT =================
router.get("/agent-report", auth, async (req, res) => {
  try {
    const { start, end } = todayRange();

    const report = await Transaction.aggregate([
      { $match: { approvedBy: { $ne: null }, status: "success", type: { $in: ["deposit", "withdraw", "bonus", "penalty"] } } },
      {
        $group: {
          _id: "$approvedBy",
          totalDeposit: { $sum: { $cond: [{ $eq: ["$type", "deposit"] }, "$amount", 0] } },
          totalWithdraw: { $sum: { $cond: [{ $eq: ["$type", "withdraw"] }, "$amount", 0] } },
          todayDeposit: { $sum: { $cond: [{ $and: [{ $eq: ["$type", "deposit"] }, { $gte: ["$approvedAt", start] }, { $lte: ["$approvedAt", end] }] }, "$amount", 0] } },
          todayWithdraw: { $sum: { $cond: [{ $and: [{ $eq: ["$type", "withdraw"] }, { $gte: ["$approvedAt", start] }, { $lte: ["$approvedAt", end] }] }, "$amount", 0] } },
          totalBonus: { $sum: { $cond: [{ $eq: ["$type", "bonus"] }, "$amount", 0] } },
          totalPenalty: { $sum: { $cond: [{ $eq: ["$type", "penalty"] }, "$amount", 0] } },
          totalApprovedCount: { $sum: 1 },
        },
      },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "admin" } },
      { $unwind: { path: "$admin", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          adminId: "$_id",
          adminName: { $ifNull: ["$admin.name", "Unknown Admin"] },
          adminPhone: { $ifNull: ["$admin.phone", ""] },
          adminRole: { $ifNull: ["$admin.role", "admin"] },
          totalDeposit: 1, totalWithdraw: 1, todayDeposit: 1, todayWithdraw: 1,
          totalBonus: 1, totalPenalty: 1, totalApprovedCount: 1,
        },
      },
      { $sort: { totalDeposit: -1 } },
    ]);

    res.json(report);
  } catch (err) {
    console.log("❌ AGENT REPORT ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});




export default router;