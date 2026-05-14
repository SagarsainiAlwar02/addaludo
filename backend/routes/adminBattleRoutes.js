const express = require("express");
const adminBattleController = require("../controllers/adminBattleController");

const router = express.Router();

router.get("/", adminBattleController.getAllBattles);
router.get("/:battleId", adminBattleController.getBattleById);

router.patch("/approve/:battleId", adminBattleController.approveBattle);
router.patch("/reject/:battleId", adminBattleController.rejectBattle);

module.exports = router;