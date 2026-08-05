import express from "express";
const router = express.Router();

import { register, login, profile, updateName, submitKyc } from "../controllers/usercontroller.js";

import auth from "../middleware/auth.js";

router.post("/register", register);
router.post("/login", login);
router.get("/profile", auth, profile);
router.patch("/profile/name", auth, updateName);
router.post("/kyc", auth, submitKyc);

router.get("/test", (req, res) => {
  res.send("User route working ✅");
});

export default router;