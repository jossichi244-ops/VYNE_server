import CompanyRegistration from "../models/CompanyRegistration.js";
import { generateCompanyQrBatch } from "../services/qrCodeService.js";

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

export const getAllCompanies = async (req, res) => {
  try {
    const companies = await CompanyRegistration.find().sort({ created_at: -1 });
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

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

export const approveCompany = async (req, res) => {
  try {
    const { company_id } = req.body;

    const company = await Company.findOne({ company_id });
    if (!company)
      return res.status(404).json({ message: "Không tìm thấy công ty" });

    company.status = "approved";
    company.updated_at = new Date();
    await company.save();

    // nếu đã có token → không tạo lại
    const exist = await StaticQR.find({ company_id });
    if (exist.length > 0)
      return res.json({ message: "Đã có token trước đó", total: exist.length });

    const qrList = [];
    for (let i = 0; i < 10; i++) {
      qrList.push({
        _id: `QR-${company_id}-${i}`,
        company_id,
        user_alias: `UID-${crypto.randomBytes(4).toString("hex")}`,
        qr_token_static: crypto.randomBytes(16).toString("hex"),
        qr_content_url: `VYNECOOP/${company_id}/${crypto
          .randomBytes(16)
          .toString("hex")}`,
        qr_binary_hash: null,
        assigned_wallet: null,
        assigned_at: null,
        is_claimed: false,
        status: "available",
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    await StaticQR.insertMany(qrList);

    res.json({
      message: "Approve thành công + sinh 10 token",
      total: 10,
    });
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

export const getCompanyTokens = async (req, res) => {
  try {
    const { company_id } = req.params;
    const tokens = await StaticQR.find({ company_id });

    return res.json({
      company_id,
      total_tokens: tokens.length,
      tokens,
    });
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

export const resetAll = async (req, res) => {
  try {
    await Company.deleteMany({});
    await StaticQR.deleteMany({});
    return res.json({ message: "Đã reset toàn bộ dữ liệu" });
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};
