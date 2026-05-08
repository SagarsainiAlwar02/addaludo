const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const auth = require("../middleware/auth");
const battleController = require("../controllers/battleController");

const router = express.Router();

const uploadDir = path.join(__dirname, "..", "uploads", "results");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

router.post("/create", auth, battleController.createBattle);
router.get("/open", auth, battleController.getOpenBattles);
router.get("/my", auth, battleController.getMyBattles);

router.post("/join/:battleId", auth, battleController.joinBattle);
router.post("/start/:battleId", auth, battleController.startBattle);
router.post("/reject/:battleId", auth, battleController.rejectBattleRequest);

router.post("/room-code/:battleId", auth, battleController.submitRoomCode);
router.post(
  "/result/:battleId",
  auth,
  upload.single("screenshot"),
  battleController.submitResult
);
router.patch("/cancel/:battleId", auth, battleController.cancelBattle);

router.get("/:battleId", auth, battleController.getSingleBattle);

module.exports = router;