const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const auth = require("../middleware/auth");

const {
  getPaymentSettings,
  uploadScanner,
  saveUpi,
  saveBank,
} = require("../controllers/paymentController");

const paymentDir = path.join(__dirname, "../uploads/payment");

if (!fs.existsSync(paymentDir)) {
  fs.mkdirSync(paymentDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, paymentDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-scanner" + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ✅ Public route - user wallet page bhi payment details read karega
router.get("/payment-settings", getPaymentSettings);

// ✅ Protected routes - sirf admin save/update karega
router.post("/upload-scanner", auth, upload.single("file"), uploadScanner);
router.post("/save-upi", auth, saveUpi);
router.post("/save-bank", auth, saveBank);

module.exports = router;