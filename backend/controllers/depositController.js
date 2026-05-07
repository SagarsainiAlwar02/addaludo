const mongoose = require("mongoose");
const Deposit = require("../models/deposit");
const Wallet = require("../models/wallet");
const Transaction = require("../models/transaction");

const getUserId = (req) => {
  let userId = req.user?._id || req.userData?._id || req.user?.id || req.user;

  if (Buffer.isBuffer(userId)) {
    userId = userId.toString("hex");
  }

  return new mongoose.Types.ObjectId(String(userId));
};

const getAdminId = (req) => {
  let adminId = req.user?._id || req.userData?._id || req.user?.id || req.user;

  if (Buffer.isBuffer(adminId)) {
    adminId = adminId.toString("hex");
  }

  try {
    return new mongoose.Types.ObjectId(String(adminId));
  } catch {
    return null;
  }
};

const getOrCreateWallet = async (userId) => {
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
};

const getPaymentMethodByAmount = (amount) => {
  if (amount <= 2000) return "qr";
  return "upi_bank";
};

// ================= USER CREATE DEPOSIT REQUEST =================
exports.createDepositRequest = async (req, res) => {
  try {
    const userId = getUserId(req);
    const amount = Number(req.body.amount);
    const utr = String(req.body.utr || "").trim();

    if (!amount || amount < 100) {
      return res.status(400).json({
        success: false,
        msg: "Minimum deposit ₹100 hai",
      });
    }

    if (amount > 100000) {
      return res.status(400).json({
        success: false,
        msg: "Maximum deposit ₹1,00,000 hai",
      });
    }

    if (!utr || utr.length < 6) {
      return res.status(400).json({
        success: false,
        msg: "Valid UTR / Transaction ID required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        msg: "Payment screenshot required",
      });
    }

    const existing = await Deposit.findOne({ utr });

    if (existing) {
      return res.status(400).json({
        success: false,
        msg: "Ye UTR already used hai",
      });
    }

    const paymentMethod = getPaymentMethodByAmount(amount);
    const screenshot = `/uploads/${req.file.filename}`;

    const deposit = await Deposit.create({
      userId,
      amount,
      paymentMethod,
      utr,
      screenshot,
      status: "pending",
    });

    return res.json({
      success: true,
      msg:
        paymentMethod === "qr"
          ? "QR deposit request submitted. Admin approval ke baad balance add hoga."
          : "UPI/Bank deposit request submitted. Admin approval ke baad balance add hoga.",
      deposit,
    });
  } catch (err) {
    console.log("❌ CREATE DEPOSIT ERROR:", err);
    return res.status(500).json({
      success: false,
      msg: err.message,
    });
  }
};

// ================= USER MY DEPOSITS =================
exports.myDeposits = async (req, res) => {
  try {
    const userId = getUserId(req);

    const deposits = await Deposit.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      deposits,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      msg: err.message,
    });
  }
};

// ================= ADMIN GET ALL DEPOSITS =================
exports.adminGetDeposits = async (req, res) => {
  try {
    const status = req.query.status;

    const filter = {};
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      filter.status = status;
    }

    const deposits = await Deposit.find(filter)
      .populate("userId", "name phone email")
      .populate("approvedBy", "name phone email role")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      deposits,
    });
  } catch (err) {
    console.log("❌ ADMIN GET DEPOSITS ERROR:", err);
    return res.status(500).json({
      success: false,
      msg: err.message,
    });
  }
};

// ================= ADMIN APPROVE DEPOSIT =================
exports.adminApproveDeposit = async (req, res) => {
  try {
    const adminId = getAdminId(req);
    const deposit = await Deposit.findById(req.params.id);

    if (!deposit) {
      return res.status(404).json({
        success: false,
        msg: "Deposit request not found",
      });
    }

    if (deposit.status !== "pending") {
      return res.status(400).json({
        success: false,
        msg: "Deposit already processed",
      });
    }

    const wallet = await getOrCreateWallet(deposit.userId);

    wallet.balance =
      Number(wallet.balance || 0) + Number(deposit.amount || 0);

    await wallet.save();

    deposit.status = "approved";
    deposit.approvedBy = adminId;
    deposit.approvedAt = new Date();
    deposit.adminNote = req.body.adminNote || "Approved";
    await deposit.save();

    await Transaction.create({
      userId: deposit.userId,
      amount: deposit.amount,
      type: "deposit",
      status: "success",
      note: `Deposit approved via ${deposit.paymentMethod}. UTR: ${deposit.utr}`,
      balanceAfter: wallet.balance,
      approvedBy: adminId,
      approvedAt: new Date(),
    });

    return res.json({
      success: true,
      msg: "Deposit approved and wallet balance added",
      deposit,
      wallet,
    });
  } catch (err) {
    console.log("❌ APPROVE DEPOSIT ERROR:", err);
    return res.status(500).json({
      success: false,
      msg: err.message,
    });
  }
};

// ================= ADMIN REJECT DEPOSIT =================
exports.adminRejectDeposit = async (req, res) => {
  try {
    const adminId = getAdminId(req);
    const deposit = await Deposit.findById(req.params.id);

    if (!deposit) {
      return res.status(404).json({
        success: false,
        msg: "Deposit request not found",
      });
    }

    if (deposit.status !== "pending") {
      return res.status(400).json({
        success: false,
        msg: "Deposit already processed",
      });
    }

    deposit.status = "rejected";
    deposit.approvedBy = adminId;
    deposit.approvedAt = new Date();
    deposit.adminNote = req.body.adminNote || "Rejected";
    await deposit.save();

    await Transaction.create({
      userId: deposit.userId,
      amount: deposit.amount,
      type: "deposit",
      status: "failed",
      note: `Deposit rejected via ${deposit.paymentMethod}. UTR: ${deposit.utr}`,
      balanceAfter: null,
      approvedBy: adminId,
      approvedAt: new Date(),
    });

    return res.json({
      success: true,
      msg: "Deposit rejected",
      deposit,
    });
  } catch (err) {
    console.log("❌ REJECT DEPOSIT ERROR:", err);
    return res.status(500).json({
      success: false,
      msg: err.message,
    });
  }
};