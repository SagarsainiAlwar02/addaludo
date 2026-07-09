import express from "express";

const router = express.Router();

import auth from "../middleware/auth.js";

import {
  submitKyc,
  getAllKyc,
  approveKyc,
  rejectKyc,
} from "../controllers/kycController.js";

router.post("/submit", auth, submitKyc);

router.get("/admin/all", auth, getAllKyc);
router.patch("/admin/approve/:id", auth, approveKyc);
router.patch("/admin/reject/:id", auth, rejectKyc);

export default router;