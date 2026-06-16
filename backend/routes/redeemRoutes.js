import express from "express";
const router = express.Router();

import {
  getRedeemData,
  requestWithdraw,
  getWithdrawHistory,
} from "../controllers/redeemController.js";

import auth from "../middleware/auth.js"; 

router.get("/", auth, getRedeemData);
router.post("/withdraw", auth, requestWithdraw);
router.get("/withdraw-history", auth, getWithdrawHistory);

export default router;