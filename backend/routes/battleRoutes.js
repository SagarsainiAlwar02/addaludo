// const express = require("express");
// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");

// const battleController = require("../controllers/battleController");

// const auth = require("../middleware/auth");
// const battleController = require("../controllers/battleController");

// const router = express.Router();

// const uploadDir = path.join(__dirname, "..", "uploads", "results");

// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, uploadDir);
//   },
//   filename: function (req, file, cb) {
//     const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     cb(null, unique + path.extname(file.originalname));
//   },
// });

// const upload = multer({ storage });

// router.post("/create", auth, battleController.createBattle);
// router.get("/open", auth, battleController.getOpenBattles);
// router.get("/my", auth, battleController.getMyBattles);

// router.post("/join/:battleId", auth, battleController.joinBattle);
// router.post("/start/:battleId", auth, battleController.startBattle);
// router.post("/reject/:battleId", auth, battleController.rejectBattleRequest);

// router.post("/room-code/:battleId", auth, battleController.submitRoomCode);
// router.post(
//   "/result/:battleId",
//   auth,
//   upload.single("screenshot"),
//   battleController.submitResult
// );
// router.patch("/cancel/:battleId", auth, battleController.cancelBattle);

// router.get("/:battleId", auth, battleController.getSingleBattle);

import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url"; 

import auth from "../middleware/auth.js";
// Changed to named imports from battleController
import {
  createBattle,
  getOpenBattles,
  getMyBattles,
  joinBattle,
  startBattle,
  rejectBattleRequest,
  submitRoomCode,
  submitResult,
  cancelBattle,
  getAdminBattles,
  getAdminSingleBattle,
  approveAdminBattle,
  rejectAdminBattle,
  getSingleBattle
} from "../controllers/battleController.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// ==========================================
// 🧑‍💻 USER SIDE BATTLE ROUTES
// ==========================================
router.post("/create", auth, createBattle);
router.get("/open", auth, getOpenBattles);
router.get("/my", auth, getMyBattles);

router.post("/join/:battleId", auth, joinBattle);
router.post("/start/:battleId", auth, startBattle);
router.post("/reject/:battleId", auth, rejectBattleRequest);

router.post("/room-code/:battleId", auth, submitRoomCode);
router.post(
  "/result/:battleId",
  auth,
  upload.single("screenshot"),
  submitResult
);
router.patch("/cancel/:battleId", auth, cancelBattle);


// ==========================================
// 👑 ADMIN SIDE BATTLE ROUTES (New Added)
// ==========================================
router.get("/admin/battles", auth, getAdminBattles);
router.get("/admin/battles/:id", auth, getAdminSingleBattle);
router.patch("/admin/battles/approve/:id", auth, approveAdminBattle);
router.patch("/admin/battles/reject/:id", auth, rejectAdminBattle);


// ==========================================
// 🔍 SINGLE BATTLE ROUTE (Hamesha Last Me Hona Chahiye)
// ==========================================
router.get("/:battleId", auth, getSingleBattle);

export default router;
