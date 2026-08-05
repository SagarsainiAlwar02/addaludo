import { Router } from "express";
import { sendOtp, verifyOtp, adminLogin, createAdmin } from "../controllers/auth.controller.js";
import auth from "../middleware/auth.js";
import adminAuth from "../middleware/adminAuth.js";

const router = Router();

router.post("/otp/send", sendOtp);
router.post("/otp/verify", verifyOtp);
router.post("/admin/login", adminLogin);
router.post("/create-admin", auth, adminAuth, createAdmin);

export default router;
