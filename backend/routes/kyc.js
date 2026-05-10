const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");

const {
  submitKyc,
  getAllKyc,
  approveKyc,
  rejectKyc,
} = require("../controllers/kycController");

router.post("/submit", auth, submitKyc);
router.get("/admin/all", auth, getAllKyc);
router.patch("/admin/approve/:id", auth, approveKyc);
router.patch("/admin/reject/:id", auth, rejectKyc);

module.exports = router;