import { Router } from "express";
import {
  requestDeposit,
  getMyDeposits,
  requestWithdraw,
  getMyWithdraws,
  getMyHistory,
  redeemReferralBalance,
} from "../controllers/transaction.controller.js";
import auth from "../middleware/auth.js";
import { uploadDeposit } from "../middleware/upload.js";

const router = Router();

router.post("/deposit", auth, uploadDeposit, requestDeposit);
router.get("/deposits", auth, getMyDeposits);
router.post("/withdraw", auth, requestWithdraw);
router.get("/withdraws", auth, getMyWithdraws);
router.get("/history", auth, getMyHistory);
router.post("/redeem-referral", auth, redeemReferralBalance);

export default router;
