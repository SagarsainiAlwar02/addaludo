import express from "express";
const router = express.Router();
import auth from "../middleware/auth.js";

import {
  requestWithdraw,
  getWithdraws
} from "../controllers/withdrawcontroller.js";

router.post("/request", auth, requestWithdraw);
router.get("/", auth, getWithdraws);

export default router;