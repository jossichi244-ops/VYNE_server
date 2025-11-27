const express = require("express");
const {
  registerCompany,
  approveCompany,
  getAllCompanies,
  getCompanyById,
  getCompanies,
  getCompanyQRs,
  getCompanyTokens,
  resetAll,
} = require("../controllers/companyRegistrationController");

const router = express.Router();

router.post("/reg_comp", registerCompany);
router.get("/reg_comp", getAllCompanies);
router.get("/:id", getCompanyById);
router.patch("/:id/approve", approveCompany);
router.post("/approve", approveCompany);
router.get("/tokens/:company_id", getCompanyTokens);
router.delete("/reset", resetAll);
router.get("/qr/:company_id", getCompanyQRs);
module.exports = router;
