import CompanyRegistration from "../models/CompanyRegistration.js";
import { generateCompanyQrBatch } from "../services/qrCodeService.js";
import StaticQR from "../models/StaticQRCode.js";
import crypto from "crypto";
import QRCode from "qrcode";
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
    const company = await CompanyRegistration.findOne({
      company_id: req.params.id,
    });
    if (!company) {
      return res.status(404).json({ message: "Không tìm thấy công ty." });
    }
    res.json(company);
  } catch (error) {
    console.error("GET COMPANY ERROR:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

export const approveCompany = async (req, res) => {
  try {
    const { company_id } = req.body;
    if (!company_id)
      return res.status(400).json({ message: "company_id required" });

    const company = await CompanyRegistration.findOne({ company_id });
    if (!company)
      return res.status(404).json({ message: "Không tìm thấy công ty" });

    // Cập nhật trạng thái
    company.status = "approved";
    company.updated_at = new Date();
    await company.save();

    // Kiểm tra token đã tạo trước đó
    const exist = await StaticQR.find({ company_id });
    if (exist.length > 0)
      return res.json({
        message: "Đã có token trước đó",
        total: exist.length,
      });

    // Tạo 10 QR token mới
    const qrList = [];
    for (let i = 0; i < 10; i++) {
      const token = crypto.randomBytes(32).toString("hex"); // token mạnh
      const url = `https://vynecoop.com/q/${company_id}/${crypto
        .randomBytes(16)
        .toString("hex")}`;
      const hash = crypto.createHash("sha256").update(token).digest("hex");

      qrList.push({
        company_id,
        user_alias: `UID-${crypto.randomBytes(4).toString("hex")}`,
        qr_token_static: token,
        qr_content_url: url,
        qr_binary_hash: hash,
        assigned_wallet: null,
        assigned_at: null,
        is_claimed: false,
        status: "available",
      });
    }

    await StaticQR.insertMany(qrList);

    res.json({
      message: "Approve thành công + sinh 10 token",
      total: 10,
    });
  } catch (err) {
    console.error("APPROVE ERROR:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
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

export const getCompanyQRs = async (req, res) => {
  try {
    const { company_id } = req.params;

    const company = await CompanyRegistration.findOne({ company_id });
    if (!company) {
      return res.status(404).json({ message: "Không tìm thấy công ty." });
    }

    if (company.status !== "approved") {
      return res.status(403).json({ message: "Công ty chưa được approve." });
    }

    const qrTokens = await StaticQR.find({ company_id })
      .sort({ created_at: 1 })
      .select("user_alias qr_content_url status"); // chỉ lấy dữ liệu public

    // Tạo QR code base64
    const qrList = await Promise.all(
      qrTokens.map(async (qr) => {
        const payload = {
          user_alias: qr.user_alias,
          qr_content_url: qr.qr_content_url,
          status: qr.status,
        };
        const qr_image = await QRCode.toDataURL(JSON.stringify(payload));
        return {
          _id: qr._id,
          user_alias: qr.user_alias,
          qr_image, // base64
          status: qr.status,
        };
      })
    );

    res.json({
      company_id,
      qrList,
    });
  } catch (error) {
    console.error("GET COMPANY QR ERROR:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
