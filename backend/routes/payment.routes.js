import { Router } from "express";
import { getPaymentSettings, uploadScanner, saveUpi, saveBank } from "../controllers/payment.controller.js";
import auth from "../middleware/auth.js";
import adminAuth from "../middleware/adminAuth.js";
import { uploadPayment } from "../middleware/upload.js";

const router = Router();

router.get("/settings", getPaymentSettings);
router.post("/upload-scanner", auth, adminAuth, uploadPayment, uploadScanner);
router.post("/save-upi", auth, adminAuth, saveUpi);
router.post("/save-bank", auth, adminAuth, saveBank);

export default router;
