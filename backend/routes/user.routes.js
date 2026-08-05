import { Router } from "express";
import { getProfile, updateProfile, getReferrals, getUserStats, submitKyc } from "../controllers/user.controller.js";
import auth from "../middleware/auth.js";

const router = Router();

router.get("/profile", auth, getProfile);
router.patch("/profile", auth, updateProfile);
router.get("/referrals", auth, getReferrals);
router.get("/stats", auth, getUserStats);
router.post("/kyc", auth, submitKyc);

export default router;
