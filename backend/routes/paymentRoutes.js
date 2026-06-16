import express from "express";
const router = express.Router();
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import auth from "../middleware/auth.js";

import {
  getPaymentSettings,
  uploadScanner,
  saveUpi,
  saveBank,
} from "../controllers/paymentController.js";

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

export default router;