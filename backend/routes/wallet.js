const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const {
  getWallet,
  addMoney,
  deductMoney,
  getTransactions,
  withdrawRequest
} = require("../controllers/walletController"); // ✅ FIXED (capital C)


// ================== WALLET ==================
router.get("/", auth, getWallet);

// ================== MONEY ==================
router.post("/add", auth, addMoney);
router.post("/deduct", auth, deductMoney);

// ================== TRANSACTIONS ==================
router.get("/transactions", auth, getTransactions);

// ================== WITHDRAW ==================
router.post("/withdraw", auth, withdrawRequest);

module.exports = router;