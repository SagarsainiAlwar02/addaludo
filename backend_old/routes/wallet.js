import express from "express";
const router = express.Router();
import auth from "../middleware/auth.js";

import {
  getWallet,
  addMoney,
  deductMoney,
  getTransactions,
  withdrawRequest
} from "../controllers/walletcontroller.js"; // ✅ FIXED (capital C)


// ================== WALLET ==================
router.get("/", auth, getWallet);

// ================== MONEY ==================
router.post("/add", auth, addMoney);
router.post("/deduct", auth, deductMoney);

// ================== TRANSACTIONS ==================
router.get("/transactions", auth, getTransactions);

// ================== WITHDRAW ==================
router.post("/withdraw", auth, withdrawRequest);

export default router;