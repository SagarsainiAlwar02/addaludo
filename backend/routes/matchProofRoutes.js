const express = require("express");
const multer = require("multer");
const path = require("path");

const {
  uploadMatchProof,
  getMatchProofs,
  updateMatchProofStatus,
} = require("../controllers/matchProofController");

const auth = require("../middleware/auth");

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/screenshots");
  },

  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `win_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.post("/upload", auth, upload.single("screenshot"), uploadMatchProof);

// Admin ke liye
router.get("/", getMatchProofs);
router.patch("/:id/status", updateMatchProofStatus);

module.exports = router;