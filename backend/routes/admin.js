const express = require("express");
const router = express.Router();

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");

const auth = require("../middleware/auth");

const Withdraw = require("../models/withdraw");
const Wallet = require("../models/wallet");
const Transaction = require("../models/transaction");
const User = require("../models/user");
const PaymentSetting = require("../models/paymentSetting");

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
const getAdminId = (req) => {
  return req.user?._id || req.user?.id || req.user || null;
};

const todayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const cleanPhone = (mobile) => {
  return String(mobile || "").replace(/\D/g, "").slice(-10);
};

const getPaymentSetting = async () => {
  let setting = await PaymentSetting.findOne();

  if (!setting) {
    setting = await PaymentSetting.create({
      scanner: {
        image: "",
        min: 0,
        max: 2000,
        active: true,
      },
      upiList: [],
      upiLimit: {
        min: 2000,
        max: 100000,
      },
      bank: {
        name: "",
        accountNumber: "",
        ifsc: "",
      },
    });
  }

  return setting;
};

// ================= USERS =================
router.get("/users", auth, async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    const userIds = users.map((u) => u._id);
    const wallets = await Wallet.find({ userId: { $in: userIds } }).lean();

    const walletMap = {};
    wallets.forEach((wallet) => {
      walletMap[String(wallet.userId)] = wallet;
    });

    const usersWithWallet = users.map((user) => {
      const wallet = walletMap[String(user._id)] || {};

      return {
        ...user,
        balance: wallet.balance || 0,
        wallet: {
          balance: wallet.balance || 0,
          bonus: wallet.bonus || 0,
          winnings: wallet.winnings || 0,
          referralBalance: wallet.referralBalance || 0,
          locked: wallet.locked || 0,
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
    const admins = await User.find({
      role: { $in: ["admin", "agent"] },
    })
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
      return res.status(400).json({
        msg: "Name, Email aur Password required hai",
      });
    }

    if (!["admin", "agent"].includes(role)) {
      return res.status(400).json({ msg: "Invalid role" });
    }

    if (password.length < 6) {
      return res.status(400).json({
        msg: "Password minimum 6 characters hona chahiye",
      });
    }

    const exists = await User.findOne({ email });

    if (exists) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await User.create({
      name,
      email,
      password: hashedPassword,
      phone: "ADM" + Date.now(),
      role,
      status: "active",
    });

    res.json({
      success: true,
      msg: `${role} created successfully`,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        status: admin.status,
      },
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

    if (!admin) {
      return res.status(404).json({ msg: "Admin / Agent not found" });
    }

    if (!["admin", "agent"].includes(admin.role)) {
      return res.status(400).json({
        msg: "Only admin/agent delete ho sakta hai",
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      msg: "Admin / Agent deleted successfully",
    });
  } catch (err) {
    console.log("❌ DELETE ADMIN ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

// ================= DASHBOARD =================
router.get("/dashboard", auth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "user" });

    const totalBlockedUsers = await User.countDocuments({
      role: "user",
      status: "blocked",
    });

    const txAgg = await Transaction.aggregate([
      { $match: { status: "success" } },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
        },
      },
    ]);

    const txMap = {};
    txAgg.forEach((item) => {
      txMap[item._id] = item.total || 0;
    });

    const walletAgg = await Wallet.aggregate([
      {
        $group: {
          _id: null,
          walletBalance: { $sum: "$balance" },
          holdBalance: { $sum: "$locked" },
          totalReferral: { $sum: "$referralBalance" },
          totalWinnings: { $sum: "$winnings" },
        },
      },
    ]);

    const userReferralAgg = await User.aggregate([
      {
        $group: {
          _id: null,
          totalReferralEarning: { $sum: "$totalReferralEarning" },
        },
      },
    ]);

    const walletData = walletAgg[0] || {};
    const userReferralData = userReferralAgg[0] || {};

    const totalDeposit = txMap.deposit || 0;
    const totalWithdraw = txMap.withdraw || 0;
    const totalBonus = txMap.bonus || 0;
    const totalPenalty = txMap.penalty || 0;
    const totalCommission = txMap.referral_commission || 0;
    const totalReferralRedeem = txMap.referral_redeem || 0;

    const totalGameEntry = txMap.game_entry || 0;
    const totalGameWin = txMap.game_win || 0;
    const totalRefund = txMap.refund || 0;

    const totalEarnings =
      totalGameEntry + totalPenalty - totalGameWin - totalRefund;

    res.json({
      totalUsers,
      totalBlockedUsers,
      totalDeposit,
      totalWithdraw,
      totalEarnings: Math.max(0, totalEarnings),
      totalCommission,
      totalReferral:
        Number(walletData.totalReferral || 0) +
        Number(userReferralData.totalReferralEarning || 0) +
        Number(totalReferralRedeem || 0),
      totalBonus,
      totalPenalty,
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

    if (!phone || phone.length !== 10) {
      return res.status(400).json({ msg: "Valid mobile number required" });
    }

    if (!bonusAmount || bonusAmount <= 0) {
      return res.status(400).json({ msg: "Valid amount required" });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({ msg: "User not found with this mobile number" });
    }

    let wallet = await Wallet.findOne({ userId: user._id });

    if (!wallet) {
      wallet = await Wallet.create({
        userId: user._id,
        balance: 0,
        bonus: 0,
        winnings: 0,
        referralBalance: 0,
        locked: 0,
      });
    }

    wallet.balance = Number(wallet.balance || 0) + bonusAmount;
    await wallet.save();

    const transaction = await Transaction.create({
      userId: user._id,
      amount: bonusAmount,
      type: "bonus",
      status: "success",
      note: reason || "Admin bonus added",
      balanceAfter: wallet.balance,
      approvedBy: adminId,
      approvedAt: new Date(),
    });

    res.json({
      success: true,
      msg: "Bonus added successfully",
      user: {
        _id: user._id,
        name: user.name || name || "",
        phone: user.phone,
      },
      wallet,
      transaction,
    });
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

    if (!phone || phone.length !== 10) {
      return res.status(400).json({ msg: "Valid mobile number required" });
    }

    if (!penaltyAmount || penaltyAmount <= 0) {
      return res.status(400).json({ msg: "Valid amount required" });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({ msg: "User not found with this mobile number" });
    }

    let wallet = await Wallet.findOne({ userId: user._id });

    if (!wallet) {
      wallet = await Wallet.create({
        userId: user._id,
        balance: 0,
        bonus: 0,
        winnings: 0,
        referralBalance: 0,
        locked: 0,
      });
    }

    if (Number(wallet.balance || 0) < penaltyAmount) {
      return res.status(400).json({
        msg: `User balance low. Current balance ₹${wallet.balance || 0}`,
      });
    }

    wallet.balance = Number(wallet.balance || 0) - penaltyAmount;
    await wallet.save();

    const transaction = await Transaction.create({
      userId: user._id,
      amount: penaltyAmount,
      type: "penalty",
      status: "success",
      note: reason || "Admin penalty deducted",
      balanceAfter: wallet.balance,
      approvedBy: adminId,
      approvedAt: new Date(),
    });

    res.json({
      success: true,
      msg: "Penalty deducted successfully",
      user: {
        _id: user._id,
        name: user.name || name || "",
        phone: user.phone,
      },
      wallet,
      transaction,
    });
  } catch (err) {
    console.log("❌ ADD PENALTY ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

// ================= SETTINGS REPORT =================
router.get("/settings-report", auth, async (req, res) => {
  try {
    const bonus = await Transaction.find({
      type: "bonus",
      status: "success",
    })
      .populate("userId", "name phone email")
      .populate("approvedBy", "name phone email role")
      .sort({ createdAt: -1 })
      .lean();

    const penalty = await Transaction.find({
      type: "penalty",
      status: "success",
    })
      .populate("userId", "name phone email")
      .populate("approvedBy", "name phone email role")
      .sort({ createdAt: -1 })
      .lean();

    const formatReport = (items) => {
      return items.map((item) => ({
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
    };

    res.json({
      bonus: formatReport(bonus),
      penalty: formatReport(penalty),
    });
  } catch (err) {
    console.log("❌ SETTINGS REPORT ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

// ================= WEBSITE SETTINGS SAVE =================
router.post("/settings", auth, async (req, res) => {
  try {
    res.json({
      success: true,
      msg: "Settings saved successfully",
      settings: req.body,
    });
  } catch (err) {
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
      scannerLimit: {
        min: setting.scanner?.min || 0,
        max: setting.scanner?.max || 2000,
      },
      upiList: setting.upiList || [],
      upiLimit: setting.upiLimit || {
        min: 2000,
        max: 100000,
      },
      bank: setting.bank || {
        name: "",
        accountNumber: "",
        ifsc: "",
      },
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

    try {
      scannerLimit = JSON.parse(req.body.scannerLimit || "{}");
    } catch {
      scannerLimit = {};
    }

    if (req.file) {
      setting.scanner.image = `/uploads/payment/${req.file.filename}`;
    }

    setting.scanner.min = Number(scannerLimit.min || 0);
    setting.scanner.max = Number(scannerLimit.max || 2000);
    setting.scanner.active = true;

    await setting.save();

    res.json({
      success: true,
      msg: "Scanner saved successfully",
      scanner: setting.scanner,
    });
  } catch (err) {
    console.log("❌ SAVE SCANNER ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

router.post("/save-upi", auth, async (req, res) => {
  try {
    const setting = await getPaymentSetting();

    const { upiList, upiLimit } = req.body;

    const cleanUpi = Array.isArray(upiList)
      ? upiList.map((x) => String(x).trim()).filter(Boolean)
      : [];

    setting.upiList = cleanUpi;
    setting.upiLimit = {
      min: Number(upiLimit?.min || 2000),
      max: Number(upiLimit?.max || 100000),
    };

    await setting.save();

    res.json({
      success: true,
      msg: "UPI saved successfully",
      upiList: setting.upiList,
      upiLimit: setting.upiLimit,
    });
  } catch (err) {
    console.log("❌ SAVE UPI ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

router.post("/save-bank", auth, async (req, res) => {
  try {
    const setting = await getPaymentSetting();

    setting.bank = {
      name: req.body.name || "",
      accountNumber: req.body.accountNumber || "",
      ifsc: req.body.ifsc || "",
    };

    await setting.save();

    res.json({
      success: true,
      msg: "Bank details saved successfully",
      bank: setting.bank,
    });
  } catch (err) {
    console.log("❌ SAVE BANK ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

// ================= AGENT / ADMIN REPORT =================
router.get("/agent-report", auth, async (req, res) => {
  try {
    const { start, end } = todayRange();

    const report = await Transaction.aggregate([
      {
        $match: {
          approvedBy: { $ne: null },
          status: "success",
          type: { $in: ["deposit", "withdraw", "bonus", "penalty"] },
        },
      },
      {
        $group: {
          _id: "$approvedBy",
          totalDeposit: {
            $sum: { $cond: [{ $eq: ["$type", "deposit"] }, "$amount", 0] },
          },
          totalWithdraw: {
            $sum: { $cond: [{ $eq: ["$type", "withdraw"] }, "$amount", 0] },
          },
          todayDeposit: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$type", "deposit"] },
                    { $gte: ["$approvedAt", start] },
                    { $lte: ["$approvedAt", end] },
                  ],
                },
                "$amount",
                0,
              ],
            },
          },
          todayWithdraw: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$type", "withdraw"] },
                    { $gte: ["$approvedAt", start] },
                    { $lte: ["$approvedAt", end] },
                  ],
                },
                "$amount",
                0,
              ],
            },
          },
          totalBonus: {
            $sum: { $cond: [{ $eq: ["$type", "bonus"] }, "$amount", 0] },
          },
          totalPenalty: {
            $sum: { $cond: [{ $eq: ["$type", "penalty"] }, "$amount", 0] },
          },
          totalApprovedCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "admin",
        },
      },
      { $unwind: { path: "$admin", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          adminId: "$_id",
          adminName: { $ifNull: ["$admin.name", "Unknown Admin"] },
          adminPhone: { $ifNull: ["$admin.phone", ""] },
          adminEmail: { $ifNull: ["$admin.email", ""] },
          adminRole: { $ifNull: ["$admin.role", "admin"] },
          totalDeposit: 1,
          totalWithdraw: 1,
          todayDeposit: 1,
          todayWithdraw: 1,
          totalBonus: 1,
          totalPenalty: 1,
          totalApprovedCount: 1,
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

// ================= APPROVE TRANSACTION =================
router.patch("/transaction/:id", auth, async (req, res) => {
  try {
    const adminId = getAdminId(req);

    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ msg: "Transaction not found" });
    }

    if (transaction.status !== "pending") {
      return res.status(400).json({ msg: "Already processed" });
    }

    const wallet = await Wallet.findOne({ userId: transaction.userId });

    if (!wallet) {
      return res.status(404).json({ msg: "Wallet not found" });
    }

    const amount = Number(transaction.amount || 0);

    if (transaction.type === "deposit") {
      wallet.balance += amount;
    }

    if (transaction.type === "withdraw") {
      wallet.locked = Math.max(0, Number(wallet.locked || 0) - amount);
    }

    transaction.status = "success";
    transaction.approvedBy = adminId;
    transaction.approvedAt = new Date();
    transaction.balanceAfter = wallet.balance;

    await wallet.save();
    await transaction.save();

    res.json({
      msg: "Transaction approved",
      transaction,
      wallet,
    });
  } catch (err) {
    console.log("❌ APPROVE TRANSACTION ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

// ================= REJECT TRANSACTION =================
router.patch("/transaction/reject/:id", auth, async (req, res) => {
  try {
    const adminId = getAdminId(req);

    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ msg: "Transaction not found" });
    }

    if (transaction.status !== "pending") {
      return res.status(400).json({ msg: "Already processed" });
    }

    const wallet = await Wallet.findOne({ userId: transaction.userId });

    if (transaction.type === "withdraw" && wallet) {
      const amount = Number(transaction.amount || 0);
      wallet.balance += amount;
      wallet.locked = Math.max(0, Number(wallet.locked || 0) - amount);
      await wallet.save();
    }

    transaction.status = "failed";
    transaction.approvedBy = adminId;
    transaction.approvedAt = new Date();

    await transaction.save();

    res.json({
      msg: "Transaction rejected",
      transaction,
    });
  } catch (err) {
    console.log("❌ REJECT TRANSACTION ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

// ================= DEPOSITS + BONUS HISTORY =================
router.get("/deposits", auth, async (req, res) => {
  try {
    const deposits = await Transaction.find({
      type: { $in: ["deposit", "bonus"] },
    })
      .populate("userId", "name phone email")
      .populate("approvedBy", "name phone email role")
      .sort({ createdAt: -1 })
      .lean();

    res.json(deposits);
  } catch (err) {
    console.log("❌ DEPOSITS ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

// ================= WITHDRAWS + PENALTY PENDING =================
router.get("/withdraws", auth, async (req, res) => {
  try {
    const withdraws = await Withdraw.find()
      .populate("userId", "name phone email")
      .populate("actionBy", "name phone email role")
      .sort({ createdAt: -1 })
      .lean();

    const penalties = await Transaction.find({ type: "penalty" })
      .populate("userId", "name phone email")
      .populate("approvedBy", "name phone email role")
      .sort({ createdAt: -1 })
      .lean();

    const normalWithdrawRows = withdraws.map((w) => ({
      ...w,
      type: "withdraw",
    }));

    const penaltyRows = penalties.map((p) => ({
      _id: p._id,
      userId: p.userId,
      amount: p.amount,
      method: "penalty",
      details: {
        reason: p.note || "Admin penalty deducted",
      },
      status: "pending",
      type: "penalty",
      actionBy: p.approvedBy,
      actionAt: p.approvedAt || p.createdAt,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    const finalList = [...normalWithdrawRows, ...penaltyRows].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json(finalList);
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

    if (withdraw.status !== "pending") {
      return res.status(400).json({ msg: "Already processed" });
    }

    const wallet = await Wallet.findOne({ userId: withdraw.userId });

    if (!wallet) return res.status(404).json({ msg: "Wallet not found" });

    const amount = Number(withdraw.amount || 0);

    if (Number(wallet.locked || 0) < amount) {
      return res.status(400).json({ msg: "Invalid locked balance" });
    }

    wallet.locked = Math.max(0, Number(wallet.locked || 0) - amount);
    await wallet.save();

    withdraw.status = "approved";
    withdraw.actionBy = adminId;
    withdraw.actionAt = new Date();
    await withdraw.save();

    const transaction = await Transaction.create({
      userId: withdraw.userId,
      amount,
      type: "withdraw",
      status: "success",
      note: "Withdraw approved by agent/admin",
      balanceAfter: wallet.balance,
      approvedBy: adminId,
      approvedAt: new Date(),
    });

    res.json({
      msg: "Withdraw approved",
      withdraw,
      transaction,
    });
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

    if (withdraw.status !== "pending") {
      return res.status(400).json({ msg: "Already processed" });
    }

    const wallet = await Wallet.findOne({ userId: withdraw.userId });

    if (!wallet) return res.status(404).json({ msg: "Wallet not found" });

    const amount = Number(withdraw.amount || 0);

    if (Number(wallet.locked || 0) < amount) {
      return res.status(400).json({ msg: "Invalid locked balance" });
    }

    wallet.balance = Number(wallet.balance || 0) + amount;
    wallet.locked = Math.max(0, Number(wallet.locked || 0) - amount);
    await wallet.save();

    withdraw.status = "rejected";
    withdraw.actionBy = adminId;
    withdraw.actionAt = new Date();
    await withdraw.save();

    const transaction = await Transaction.create({
      userId: withdraw.userId,
      amount,
      type: "refund",
      status: "success",
      note: "Withdraw rejected refund",
      balanceAfter: wallet.balance,
      approvedBy: adminId,
      approvedAt: new Date(),
    });

    res.json({
      msg: "Withdraw rejected",
      withdraw,
      transaction,
    });
  } catch (err) {
    console.log("❌ REJECT WITHDRAW ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;