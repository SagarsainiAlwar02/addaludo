import User from "../models/user.js";
import Transaction from "../models/transaction.js";
import Wallet from "../models/wallet.js";



// ================= GET USERS =================
export const getUsers = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 50), 100);
    const search = String(req.query.search || "").trim();

    const query = {};

    if (search) {
      query.$or = [
        { phone: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { referralCode: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("name phone mobile email referralCode status createdAt")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const userIds = users.map((u) => u._id);

    const wallets = await Wallet.find({ userId: { $in: userIds } })
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
export const blockUser = async (req, res) => {
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
export const getTransactions = async (req, res) => {
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
export const approveTransaction = async (req, res) => {
  try {
   const tx = await Transaction.findOneAndUpdate(
  {
    _id: req.params.id,
    status: "pending",
  },
  {
    $set: {
      status: "success",
    },
  },
  {
    new: true,
  }
);

if (!tx) {
  return res.status(400).json({
    msg: "Already processed",
  });
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



    await wallet.save();
    await tx.save();

    res.json({ msg: "Transaction approved" });

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// ================= REJECT TRANSACTION =================
export const rejectTransaction = async (req, res) => {
  try {
  const tx = await Transaction.findOneAndUpdate(
  {
    _id: req.params.id,
    status: "pending",
  },
  {
    $set: {
      status: "failed",
    },
  },
  {
    new: true,
  }
);

if (!tx) {
  return res.status(400).json({
    msg: "Already processed",
  });
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


    res.json({ msg: "Transaction rejected" });

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};