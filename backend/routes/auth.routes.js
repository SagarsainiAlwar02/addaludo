import { Router } from "express";
import { sendOtp, verifyOtp, adminLogin, createAdmin } from "../controllers/auth.controller.js";
import auth from "../middleware/auth.js";
import { requireAdmin } from "../middleware/permission.js";

const router = Router();

router.post("/otp/send", sendOtp);
router.post("/otp/verify", verifyOtp);
router.post("/admin/login", adminLogin);
// Dev helper: only a main admin can (re)create the default admin account.
// Never allow agents - otherwise an agent could reset the admin password.
router.post("/create-admin", auth, requireAdmin, createAdmin);

export default router;
