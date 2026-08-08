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
  getDummyContests,
  getAdminList,
  createAdminAccount,
  updateAdminAccount,
  deleteAdminAccount,
  getAgentReport,
  getWebsiteSettings,
  saveWebsiteSettings,
  addTrackedAccount,
  getTrackedAccounts,
  deleteTrackedAccount,
  getTrackedAccountsReport,
  getSettingsReport,
  getMe,
} from "../controllers/admin.controller.js";
import {
  createDummyContest,
  deleteDummyContest,
} from "../controllers/contest.controller.js";
import {
  uploadScanner,
  saveUpi,
  saveBank,
} from "../controllers/payment.controller.js";
import auth from "../middleware/auth.js";
import adminAuth from "../middleware/adminAuth.js";
import { requirePermission, requireAdmin } from "../middleware/permission.js";
import { uploadPayment } from "../middleware/upload.js";

const router = Router();

router.use(auth, adminAuth);

// ============ ROUTES WITH SECTION PERMISSIONS ============
// Dashboard
router.get("/dashboard", requirePermission("dashboard"), getDashboardStats);

// Users
router.get("/users", requirePermission("user"), getUsers);
router.patch("/users/:id/block", requirePermission("user"), blockUser);

// Matches
router.get("/contests", requirePermission("matches"), getContests);
router.get("/contests/:id", requirePermission("matches"), getContestById);
router.patch("/contests/:id/approve", requirePermission("matches"), approveContest);
router.patch("/contests/:id/reject", requirePermission("matches"), rejectContest);

// Deposits
router.get("/deposits", requirePermission("deposit"), getDeposits);
router.patch("/deposits/:id/approve", requirePermission("deposit"), approveDeposit);
router.patch("/deposits/:id/reject", requirePermission("deposit"), rejectDeposit);

// Withdraws
router.get("/withdraws", requirePermission("withdraw"), getWithdraws);
router.patch("/withdraws/:id/approve", requirePermission("withdraw"), approveWithdraw);
router.patch("/withdraws/:id/reject", requirePermission("withdraw"), rejectWithdraw);

// Settings (bonus / penalty / reports)
router.post("/bonus", requirePermission("setting"), addBonus);
router.post("/penalty", requirePermission("setting"), addPenalty);
router.get("/settings-report", requirePermission("setting"), getSettingsReport);

// KYC
router.get("/kyc", requirePermission("kyc"), getKycList);
router.patch("/kyc/:id/approve", requirePermission("kyc"), approveKyc);
router.patch("/kyc/:id/reject", requirePermission("kyc"), rejectKyc);

// Client tracking
router.post("/tracked-accounts", requirePermission("client_tracking"), addTrackedAccount);
router.get("/tracked-accounts", requirePermission("client_tracking"), getTrackedAccounts);
router.delete("/tracked-accounts/:id", requirePermission("client_tracking"), deleteTrackedAccount);
router.get("/tracked-accounts/report", requirePermission("client_tracking"), getTrackedAccountsReport);

// Payment control
router.post("/upload-scanner", requirePermission("payment_control"), uploadPayment, uploadScanner);
router.post("/save-upi", requirePermission("payment_control"), saveUpi);
router.post("/save-bank", requirePermission("payment_control"), saveBank);

// Admin control -> Website Settings (agents with admin_control can view/edit these)
router.get("/settings", requirePermission("admin_control"), getWebsiteSettings);
router.post("/settings", requirePermission("admin_control"), saveWebsiteSettings);

// Dummy battles -> admin only (no permission key, hidden from agents)
router.get("/dummy-contests", requireAdmin, getDummyContests);
router.post("/dummy-contests", requireAdmin, createDummyContest);
router.delete("/dummy-contests/:id", requireAdmin, deleteDummyContest);

// ============ ADMIN-ONLY ROUTES (admin/agent management) ============
router.get("/admin-list", requireAdmin, getAdminList);
router.post("/create-admin", requireAdmin, createAdminAccount);
router.patch("/update/:id", requireAdmin, updateAdminAccount);
router.delete("/delete/:id", requireAdmin, deleteAdminAccount);
router.get("/agent-report", requireAdmin, getAgentReport);

// ============ SESSION ============
router.get("/me", getMe);

export default router;
