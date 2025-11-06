const express = require("express");
const router = express.Router();

const {
  requestNonce,
  verifySignature,
  getAllUsers,
  getUserProfile,
} = require("../controllers/authController");

router.post("/request-nonce", requestNonce);
router.post("/verify-signature", verifySignature);
router.get("/users", getAllUsers); // Xem toàn bộ user
router.get("/user/:wallet_address", getUserProfile);
module.exports = router;
