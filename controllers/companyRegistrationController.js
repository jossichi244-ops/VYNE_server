import CompanyRegistration from "../models/CompanyRegistration.js";
import { generateCompanyQrBatch } from "../services/qrCodeService.js";

/**
 * @desc Đăng ký công ty mới
 * @route POST /api/company-registrations
 * @access Public
 */
export const registerCompany = async (req, res) => {
  try {
    const { business_name, tax_code, type } = req.body;

    // 🔹 Validate bắt buộc
    if (!business_name || !tax_code) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc." });
    }

    // 🔹 Validate type (nếu có)
    const validTypes = [
      "manufacturer",
      "supplier",
      "distributor",
      "logistics_provider",
      "carrier",
      "warehouse",
      "retailer",
      "customs_broker",
      "financial_institution",
      "other",
    ];

    if (type && !validTypes.includes(type)) {
      return res
        .status(400)
        .json({ message: "Loại hình doanh nghiệp không hợp lệ." });
    }

    // 🔹 Kiểm tra tax_code đã tồn tại
    const existingCompany = await CompanyRegistration.findOne({ tax_code });
    if (existingCompany) {
      return res.status(409).json({
        message: "Mã số thuế đã tồn tại.",
      });
    }

    // 🔹 Tạo company mới (company_id tự sinh trong model)
    const newCompany = new CompanyRegistration({
      business_name,
      tax_code,
      type: type || "other",
    });

    await newCompany.save();

    return res.status(201).json({
      message: "Đăng ký công ty thành công.",
      data: newCompany,
    });
  } catch (error) {
    console.error("❌ Lỗi khi đăng ký công ty:", error);
    return res
      .status(500)
      .json({ message: "Lỗi server", error: error.message });
  }
};

/**
 * @desc Lấy danh sách công ty
 * @route GET /api/company-registrations
 * @access Public hoặc Admin tuỳ quyền hệ thống
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
 * @desc Lấy chi tiết 1 công ty
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

/**
 * @desc Duyệt công ty & tự tạo 10 QR code như pipeline yêu cầu
 * @route PATCH /api/company-registrations/:id/approve
 */
export const approveCompany = async (req, res) => {
  try {
    const companyId = req.params.id;

    const company = await CompanyRegistration.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: "Không tìm thấy công ty." });
    }

    if (company.status === "approved") {
      return res
        .status(400)
        .json({ message: "Công ty đã được duyệt trước đó." });
    }

    // Cập nhật trạng thái
    company.status = "approved";
    await company.save();

    // Tạo batch QR
    const qrResult = await generateCompanyQrBatch(companyId);

    return res.status(200).json({
      message: "Duyệt công ty thành công.",
      qr_codes_created: qrResult,
    });
  } catch (error) {
    console.error("❌ approveCompany error:", error);
    return res
      .status(500)
      .json({ message: "Lỗi server", error: error.message });
  }
};
