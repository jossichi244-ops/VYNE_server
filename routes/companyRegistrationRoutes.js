const express = require("express");
const {
  registerCompany,
  approveCompany,
  getAllCompanies,
  getCompanyById,
} = require("../controllers/companyRegistrationController");

const router = express.Router();

router.post("/reg_comp", registerCompany);
router.get("/reg_comp", getAllCompanies);
router.get("/:id", getCompanyById);
router.patch("/:id/approve", approveCompany);

module.exports = router;
