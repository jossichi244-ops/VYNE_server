import { v4 as uuidv4 } from "uuid";
import CompanyRegistration from "../models/CompanyRegistration.js";
import User from "../models/User.js";

/**
 * @desc Đăng ký công ty mới
 * @route POST /api/company-registrations
 * @access Public (nhưng phải có wallet hợp lệ)
 */
export const registerCompany = async (req, res) => {
  try {
    const {
      applicant_wallet,
      business_name,
      tax_code,
      registration_document,
      contact_info,
      address,
      type,
    } = req.body;

    // 🔹 Kiểm tra dữ liệu bắt buộc
    if (
      !applicant_wallet ||
      !business_name ||
      !tax_code ||
      !registration_document?.file_cid ||
      !type
    ) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc." });
    }

    // 🔹 Kiểm tra wallet hợp lệ
    const walletPattern = /^0x[a-fA-F0-9]{40}$/;
    if (!walletPattern.test(applicant_wallet)) {
      return res.status(400).json({ message: "Địa chỉ ví không hợp lệ." });
    }

    // 🔹 Kiểm tra xem đã có công ty nào dùng cùng tax_code chưa
    const existingCompany = await CompanyRegistration.findOne({ tax_code });
    if (existingCompany) {
      return res
        .status(409)
        .json({ message: "Mã số thuế đã tồn tại trong hệ thống." });
    }

    // 🔹 Kiểm tra user có tồn tại không
    const user = await User.findOne({ wallet_address: applicant_wallet });
    if (!user) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy người dùng có ví này." });
    }

    // 🔹 Kiểm tra role: chỉ cho phép user có role "individual" được đăng ký công ty
    const hasIndividualRole = user.roles.some(
      (r) => r.role_type === "individual"
    );
    if (!hasIndividualRole) {
      return res.status(403).json({
        message:
          "Người dùng không có quyền đăng ký công ty (phải có role individual).",
      });
    }

    // 🔹 Tạo company_id (UUID v4)
    const company_id = uuidv4();

    // 🔹 Tạo bản ghi mới trong collection company_registrations
    const newCompany = new CompanyRegistration({
      company_id,
      applicant_wallet,
      business_name,
      tax_code,
      registration_document,
      contact_info,
      address,
      type,
      status: "pending", // tự động set
      approved_by: null,
      approved_at: null,
    });

    await newCompany.save();

    // 🔹 Cập nhật user role (từ individual → company_owner (pending))
    user.roles.push({
      role_type: "company_owner",
      entity_id: company_id,
      status: "pending",
      assigned_by: "system",
      assigned_at: new Date(),
      evidence: {
        source_collection: "company_registrations",
        record_id: newCompany._id.toString(),
        verification_method: "wallet_match",
      },
    });
    await user.save();

    res.status(201).json({
      message: "Đăng ký công ty thành công, đang chờ duyệt.",
      data: newCompany,
    });
  } catch (error) {
    console.error("❌ Lỗi khi đăng ký công ty:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

/**
 * @desc Duyệt công ty (chỉ admin thực hiện)
 * @route PATCH /api/company-registrations/:id/approve
 * @access Admin
 */
export const approveCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const adminWallet = req.body.admin_wallet; // hoặc lấy từ middleware auth

    const company = await CompanyRegistration.findById(id);
    if (!company) {
      return res.status(404).json({ message: "Không tìm thấy hồ sơ công ty." });
    }

    if (company.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Công ty đã được duyệt hoặc bị từ chối." });
    }

    company.status = "approved";
    company.approved_by = adminWallet || "system_admin";
    company.approved_at = new Date();
    await company.save();

    // 🔹 Cập nhật user thành "company_owner" active
    const user = await User.findOne({
      wallet_address: company.applicant_wallet,
    });
    if (user) {
      const role = user.roles.find(
        (r) =>
          r.entity_id === company.company_id && r.role_type === "company_owner"
      );
      if (role) role.status = "active";
      await user.save();
    }

    res.json({ message: "Duyệt công ty thành công.", data: company });
  } catch (error) {
    console.error("❌ Lỗi duyệt công ty:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

/**
 * @desc Lấy danh sách đăng ký công ty (admin)
 * @route GET /api/company-registrations
 * @access Admin
 */
export const getAllCompanies = async (req, res) => {
  try {
    const companies = await CompanyRegistration.find().sort({ created_at: -1 });
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

/**
 * @desc Lấy thông tin chi tiết công ty theo ID
 * @route GET /api/company-registrations/:id
 */
export const getCompanyById = async (req, res) => {
  try {
    const company = await CompanyRegistration.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: "Không tìm thấy công ty." });
    }
    res.json(company);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
