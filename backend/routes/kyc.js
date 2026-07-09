import express from "express";

const router = express.Router();

import auth from "../middleware/auth.js";

import {
  submitKyc,
  getAllKyc,
  approveKyc,
  rejectKyc,
} from "../controllers/kycController.js";

// ✅ Ab ye route bina kisi image upload (multer) ke chalega, sirf text data accept karega
router.post(
  "/submit",
  auth,
  submitKyc
);

router.get("/admin/all", auth, getAllKyc);
router.patch("/admin/approve/:id", auth, approveKyc);
router.patch("/admin/reject/:id", auth, rejectKyc);

export default router;
