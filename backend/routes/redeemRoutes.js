const express = require("express");
const router = express.Router();

const {
  getRedeemData,
  requestWithdraw,
} = require("../controllers/redeemController");

const auth = require("../middleware/auth");

router.get("/", auth, getRedeemData);
router.post("/withdraw", auth, requestWithdraw);

module.exports = router;