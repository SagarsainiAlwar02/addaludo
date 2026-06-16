import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const router = express.Router();

import auth from "../middleware/auth.js";

import {
  submitKyc,
  getAllKyc,
  approveKyc,
  rejectKyc,
} from "../controllers/kycController.js";

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

export default router;