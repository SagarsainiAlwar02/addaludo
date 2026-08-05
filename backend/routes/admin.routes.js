import { Router } from "express";
import {
  getDashboardStats,
  getUsers,
  blockUser,
  getContests,
  getContestById,
  approveContest,
  rejectContest,
  getDeposits,
  approveDeposit,
  rejectDeposit,
  getWithdraws,
  approveWithdraw,
  rejectWithdraw,
  addBonus,
  addPenalty,
  getKycList,
  approveKyc,
  rejectKyc,
  addTrackedAccount,
  getTrackedAccounts,
  deleteTrackedAccount,
  getTrackedAccountsReport,
  getSettingsReport,
} from "../controllers/admin.controller.js";
import {
  uploadScanner,
  saveUpi,
  saveBank,
} from "../controllers/payment.controller.js";
import auth from "../middleware/auth.js";
import adminAuth from "../middleware/adminAuth.js";
import { uploadPayment } from "../middleware/upload.js";

const router = Router();

router.use(auth, adminAuth);

router.get("/dashboard", getDashboardStats);
router.get("/users", getUsers);
router.patch("/users/:id/block", blockUser);
router.get("/contests", getContests);
router.get("/contests/:id", getContestById);
router.patch("/contests/:id/approve", approveContest);
router.patch("/contests/:id/reject", rejectContest);
router.get("/deposits", getDeposits);
router.patch("/deposits/:id/approve", approveDeposit);
router.patch("/deposits/:id/reject", rejectDeposit);
router.get("/withdraws", getWithdraws);
router.patch("/withdraws/:id/approve", approveWithdraw);
router.patch("/withdraws/:id/reject", rejectWithdraw);
router.post("/bonus", addBonus);
router.post("/penalty", addPenalty);
router.get("/kyc", getKycList);
router.patch("/kyc/:id/approve", approveKyc);
router.patch("/kyc/:id/reject", rejectKyc);
router.post("/tracked-accounts", addTrackedAccount);
router.get("/tracked-accounts", getTrackedAccounts);
router.delete("/tracked-accounts/:id", deleteTrackedAccount);
router.get("/tracked-accounts/report", getTrackedAccountsReport);
router.get("/settings-report", getSettingsReport);
router.post("/upload-scanner", uploadPayment, uploadScanner);
router.post("/save-upi", saveUpi);
router.post("/save-bank", saveBank);

export default router;
