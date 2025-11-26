const express = require("express");
const router = express.Router();
const qrCtrl = require("../controllers/qrCodeController");

router.post("/company/:companyId/generate", qrCtrl.generateQRCodesForCompany);
router.post("/claim/signature", qrCtrl.claimQrWithSignature);
router.post("/physical/create", qrCtrl.createPhysicalQR);
router.post("/claim/existing-user", qrCtrl.claimQrByExistingUser);

module.exports = router;
