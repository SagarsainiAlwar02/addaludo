import { Router } from "express";
import {
  createContest,
  getOpenContests,
  joinContest,
  acceptContest,
  rejectJoinRequest,
  submitRoomCode,
  submitResult,
  cancelContest,
  getMyContests,
  getSingleContest,
  createDummyContest,
  deleteDummyContest,
} from "../controllers/contest.controller.js";
import auth from "../middleware/auth.js";
import adminAuth from "../middleware/adminAuth.js";
import { requireAdmin } from "../middleware/permission.js";
import { uploadResult } from "../middleware/upload.js";

const router = Router();

router.get("/open", getOpenContests);
router.post("/create", auth, createContest);
router.post("/join/:contestId", auth, joinContest);
router.post("/accept/:contestId", auth, acceptContest);
router.post("/reject/:contestId", auth, rejectJoinRequest);
router.post("/room-code/:contestId", auth, submitRoomCode);
router.post("/result/:contestId", auth, uploadResult, submitResult);
router.post("/cancel/:contestId", auth, cancelContest);
router.get("/my-contests", auth, getMyContests);
router.get("/:contestId", auth, getSingleContest);
router.post("/dummy", auth, adminAuth, requireAdmin, createDummyContest);
router.delete("/dummy/:id", auth, adminAuth, requireAdmin, deleteDummyContest);

export default router;
