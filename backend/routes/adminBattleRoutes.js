import express from "express";
import { 
  getAllBattles, 
  getBattleById, 
  approveBattle, 
  rejectBattle,
  getDashboardStats // 👈 Yeh naya controller import add kiya hai
} from "../controllers/adminBattleController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/", auth, getAllBattles);
router.get("/dashboard-stats", auth, getDashboardStats); // 👈 Yeh Today/All-Time data filter ke liye naya route hai
router.get("/:battleId", auth, getBattleById);

router.patch("/approve/:battleId", auth, approveBattle);
router.patch("/reject/:battleId", auth, rejectBattle);

export default router;
