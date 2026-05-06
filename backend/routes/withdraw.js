const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const {
  requestWithdraw,
  getWithdraws
} = require("../controllers/withdrawController");

router.post("/request", auth, requestWithdraw);
router.get("/", auth, getWithdraws);

module.exports = router;