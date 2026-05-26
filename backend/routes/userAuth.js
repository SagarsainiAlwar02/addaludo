const express = require("express");
const router = express.Router();

const userController = require("../controllers/usercontroller");

const auth = require("../middleware/auth");

router.post("/register", userController.register);
router.post("/login", userController.login);
router.get("/profile", auth, userController.profile);
router.patch("/profile/name", auth, userController.updateName);
router.post("/kyc", auth, userController.submitKyc);

router.get("/test", (req, res) => {
  res.send("User route working ✅");
});

module.exports = router;