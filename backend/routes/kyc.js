const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const auth = require("../middleware/auth");

const {
  submitKyc,
  getAllKyc,
  approveKyc,
  rejectKyc,
} = require("../controllers/kycController");

const uploadDir = path.join(__dirname, "../uploads/kyc");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({ storage });

router.post(
  "/submit",
  auth,
  upload.fields([
    { name: "frontImage", maxCount: 1 },
    { name: "backImage", maxCount: 1 },
  ]),
  submitKyc
);

router.get("/admin/all", auth, getAllKyc);
router.patch("/admin/approve/:id", auth, approveKyc);
router.patch("/admin/reject/:id", auth, rejectKyc);

module.exports = router;