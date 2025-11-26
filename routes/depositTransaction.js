const express = require("express");
const router = express.Router();
const depositController = require("../controllers/depositController");

router.post("/", depositController.createDeposit);
router.put("/:depositRef/confirm", depositController.confirmDeposit);
module.exports = router;
