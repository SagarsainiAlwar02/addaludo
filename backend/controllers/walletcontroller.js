const Wallet = require("../models/wallet");
const Transaction = require("../models/transaction");
const Withdraw = require("../models/withdraw");
const mongoose = require("mongoose");

// ================== USER ID SAFE ==================
const getUserId = (req) => {
  let userId = req.user?._id || req.userData?._id || req.user?.id || req.user;

  if (Buffer.isBuffer(userId)) {
    userId = userId.toString("hex");
  }

  return new mongoose.Types.ObjectId(String(userId));
};

// ================== GET OR CREATE WALLET ==================
const getOrCreateWallet = async (userId) => {
  return await Wallet.findOneAndUpdate(
    { userId },
    {
      $setOnInsert: {
        userId,
        balance: 0,
        bonus: 0,
        winnings: 0,
        locked: 0,
      },
    },
    {
      upsert: true,
      new: true,
    }
  );
};

// ================== GET WALLET ==================
exports.getWallet = async (req, res) => {
  try {
    const userId = getUserId(req);
    const wallet = await getOrCreateWallet(userId);

    res.json({
      balance: wallet.balance,
      bonus: wallet.bonus,
      winnings: wallet.winnings,
      locked: wallet.locked,
    });
  } catch (err) {
    console.log("❌ GET WALLET ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
};

// ================== ADD MONEY DISABLED ==================
// ✅ Direct wallet add unsafe hai.
// ✅ Ab deposit request system use hoga: /api/deposit/create
exports.addMoney = async (req, res) => {
  return res.status(403).json({
    success: false,
    msg: "Direct wallet add disabled. Please use deposit request system.",
  });
};

// ================== DEDUCT MONEY ==================
exports.deductMoney = async (req, res) => {
  try {
    const userId = getUserId(req);
    const amount = Number(req.body.amount);

    if (!amount || amount <= 0) {
      return res.status(400).json({ msg: "Invalid amount" });
    }

    const wallet = await getOrCreateWallet(userId);

    if (wallet.balance < amount) {
      return res.status(400).json({ msg: "Insufficient balance" });
    }

   const updatedWallet = await Wallet.findOneAndUpdate(
  {
    userId,
    balance: { $gte: amount },
  },
  {
    $inc: {
      balance: -amount,
    },
  },
  {
    new: true,
  }
);

if (!updatedWallet) {
  return res.status(400).json({
    msg: "Insufficient balance",
  });
}

    await Transaction.create({
      userId,
      amount,
      type: "admin_adjust",
      status: "success",
      note: "Manual deduction",
    balanceAfter: updatedWallet.balance,
    });

    res.json({
      success: true,
      msg: "Money deducted successfully",
      balance: updatedWallet.balance,
    });
  } catch (err) {
    console.log("❌ DEDUCT MONEY ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
};

// ================== TRANSACTIONS ==================
exports.getTransactions = async (req, res) => {
  try {
    const userId = getUserId(req);

    const txns = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    res.json(txns);
  } catch (err) {
    console.log("❌ TRANSACTIONS ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
};

// ================== WITHDRAW REQUEST ==================
exports.withdrawRequest = async (req, res) => {
  try {
    const userId = getUserId(req);
    const amount = Number(req.body.amount);

    if (!amount || amount < 100) {
      return res.status(400).json({ msg: "Minimum withdraw ₹100 hai" });
    }

    const wallet = await getOrCreateWallet(userId);

    const pendingWithdraw = await Withdraw.findOne({
  userId,
  status: "pending",
});

if (pendingWithdraw) {
  return res.status(400).json({
    msg: "Withdraw request already pending",
  });
}

    if (wallet.balance < amount) {
      return res.status(400).json({ msg: "Not enough balance" });
    }

const updatedWallet = await Wallet.findOneAndUpdate(
  {
    userId,
    balance: { $gte: amount },
  },
  {
    $inc: {
      balance: -amount,
      locked: amount,
    },
  },
  {
    new: true,
  }
);

if (!updatedWallet) {
  return res.status(400).json({
    msg: "Not enough balance",
  });
}
    const withdraw = await Withdraw.create({
      userId,
      amount,
      status: "pending",
    });

    await Transaction.create({
      userId,
      amount,
      type: "withdraw",
      status: "pending",
      note: "Withdraw request",
      balanceAfter: updatedWallet.balance,
    });

    res.json({
      success: true,
      msg: "Withdraw request sent successfully",
      withdraw,
  balance: updatedWallet.balance,
locked: updatedWallet.locked,
    });
  } catch (err) {
    console.log("❌ WITHDRAW ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
};