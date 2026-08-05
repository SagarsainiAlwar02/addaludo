import express from "express";
const router = express.Router();
import multer from "multer";
import path from "path";

import auth from "../middleware/auth.js";
import {
  createDepositRequest,
  myDeposits,
  adminGetDeposits,
  adminApproveDeposit,
  adminRejectDeposit,
} from "../controllers/depositController.js";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "deposit-" + unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: function (req, file, cb) {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only image files allowed"));
    }

    cb(null, true);
  },
});

// USER
router.post("/create", auth, upload.single("screenshot"), createDepositRequest);
router.get("/my", auth, myDeposits);

// ADMIN
router.get("/admin/all", auth, adminGetDeposits);
router.patch("/admin/approve/:id", auth, adminApproveDeposit);
router.patch("/admin/reject/:id", auth, adminRejectDeposit);

export default router;