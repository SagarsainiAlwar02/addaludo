import express from "express";
import { getAllBattles, getBattleById, approveBattle, rejectBattle } from "../controllers/adminBattleController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/", auth, getAllBattles);
router.get("/:battleId", auth, getBattleById);

router.patch("/approve/:battleId", auth, approveBattle);
router.patch("/reject/:battleId", auth, rejectBattle);

export default router;
