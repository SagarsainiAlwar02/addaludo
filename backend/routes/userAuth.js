const express = require("express");
const router = express.Router();

const {
  login,
  profile,
  register,
  submitKyc,
} = require("../controllers/userController");

const auth = require("../middleware/auth");

// ✅ REGISTER
router.post("/register", register);

// 👉 Login
router.post("/login", login);

// 👉 Profile
router.get("/profile", auth, profile);

// ✅ Submit KYC
router.post("/kyc", auth, submitKyc);

// 👉 Test
router.get("/test", (req, res) => {
  res.send("User route working ✅");
});

module.exports = router;