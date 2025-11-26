const express = require("express");
const router = express.Router();
const controller = require("../controllers/multiPartyContract.controller");

router.get("/", controller.getAllContracts);
router.get("/:id", controller.getContractById);

router.post("/create-from-order", controller.createContractFromOrder);
router.post("/:contractId/sign", controller.signContract);
router.patch("/:contractId/status", controller.updateStatus);

module.exports = router;
