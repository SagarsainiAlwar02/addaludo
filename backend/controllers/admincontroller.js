const User = require("../models/user");
const Transaction = require("../models/transaction");
const Wallet = require("../models/wallet");



// ================= GET USERS =================
exports.getUsers = async (req, res) => {
  try {
    const limit = Number(req.query.limit || 100);

    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const wallets = await Wallet.find({
      userId: { $in: users.map((u) => u._id) },
    })
      .select("userId balance winnings bonus locked")
      .lean();

    const walletMap = {};
    wallets.forEach((w) => {
      walletMap[String(w.userId)] = w;
    });

    const finalUsers = users.map((user) => {
      const wallet = walletMap[String(user._id)] || {};

      const balance = Number(wallet.balance || 0);
      const winnings = Number(wallet.winnings || 0);
      const bonus = Number(wallet.bonus || 0);
      const locked = Number(wallet.locked || 0);

      return {
        ...user,
        wallet: {
          balance,
          winnings,
          bonus,
          locked,
          totalBalance: balance + winnings,
        },
        balance: balance + winnings,
      };
    });

    res.json(finalUsers);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// ================= BLOCK / UNBLOCK USER =================
exports.blockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    user.status = user.status === "blocked" ? "active" : "blocked";
    await user.save();

    res.json({ msg: `User ${user.status}` });

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// ================= TRANSACTIONS =================
exports.getTransactions = async (req, res) => {
  try {
    const limit = Number(req.query.limit || 100);

    const tx = await Transaction.find()
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json(tx);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// ================= APPROVE TRANSACTION =================
exports.approveTransaction = async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id);

    if (!tx) return res.status(404).json({ msg: "Transaction not found" });

    if (tx.status !== "pending") {
      return res.status(400).json({ msg: "Already processed" });
    }

    const wallet = await Wallet.findOne({ userId: tx.userId });

    if (!wallet) {
      return res.status(404).json({ msg: "Wallet not found" });
    }

    // ✅ DEPOSIT
    if (tx.type === "deposit") {
      wallet.balance += tx.amount;
    }

    // ✅ WITHDRAW
    if (tx.type === "withdraw") {
      wallet.locked -= tx.amount;
    }

    tx.status = "success";

    await wallet.save();
    await tx.save();

    res.json({ msg: "Transaction approved" });

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// ================= REJECT TRANSACTION =================
exports.rejectTransaction = async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id);

    if (!tx) return res.status(404).json({ msg: "Transaction not found" });

    if (tx.status !== "pending") {
      return res.status(400).json({ msg: "Already processed" });
    }

    const wallet = await Wallet.findOne({ userId: tx.userId });

   if (tx.type === "withdraw" && wallet) {
  wallet.winnings =
    Number(wallet.winnings || 0) + Number(tx.amount || 0);

  wallet.locked = Math.max(
    0,
    Number(wallet.locked || 0) - Number(tx.amount || 0)
  );

  await wallet.save();
}

    tx.status = "failed";
    await tx.save();

    res.json({ msg: "Transaction rejected" });

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};