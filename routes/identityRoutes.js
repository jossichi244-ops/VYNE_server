// routes/identityRoutes.js
const express = require("express");
const router = express.Router();
const { verifyIdentity } = require("../controllers/roleController");
const verifyController = require("../controllers/verifyAppointment");
router.post("/verify-vneid", verifyIdentity);
router.post("/verify-appointment", verifyController.verifyAppointment);
module.exports = router;
