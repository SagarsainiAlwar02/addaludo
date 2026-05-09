const express = require("express");
const router = express.Router();

const {
  getRedeemData,
  requestWithdraw,
  getWithdrawHistory,
} = require("../controllers/redeemController");

const auth = require("../middleware/auth");

router.get("/", auth, getRedeemData);
router.post("/withdraw", auth, requestWithdraw);
router.get("/withdraw-history", auth, getWithdrawHistory);

module.exports = router;