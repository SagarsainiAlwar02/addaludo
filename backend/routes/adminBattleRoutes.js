const express = require("express");
const adminBattleController = require("../controllers/adminBattleController");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, adminBattleController.getAllBattles);
router.get("/:battleId", auth, adminBattleController.getBattleById);

router.patch("/approve/:battleId", auth, adminBattleController.approveBattle);
router.patch("/reject/:battleId", auth, adminBattleController.rejectBattle);

module.exports = router;