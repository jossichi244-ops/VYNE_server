// models/CompanyRegistration.js
import mongoose from "mongoose";

// 📄 Giấy phép đăng ký kinh doanh
const registrationDocumentSchema = new mongoose.Schema(
  {
    file_cid: {
      type: String,
      required: true,
      description: "IPFS CID của giấy phép kinh doanh",
    },
    verified_at: {
      type: Date,
    },
  },
  { _id: false }
);

// 📞 Thông tin liên hệ
const contactInfoSchema = new mongoose.Schema(
  {
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String },
  },
  { _id: false }
);

// 🏠 Địa chỉ
const addressSchema = new mongoose.Schema(
  {
    street: { type: String },
    ward: { type: String },
    district: { type: String },
    city: { type: String },
    country: { type: String },
  },
  { _id: false }
);

// 🏢 Schema chính cho đăng ký công ty
const companyRegistrationSchema = new mongoose.Schema(
  {
    company_id: {
      type: String,
      unique: true,
      index: true,
    },
    applicant_wallet: {
      type: String,
      match: /^0x[a-fA-F0-9]{40}$/,
      required: true,
      description:
        "Người nộp hồ sơ (sẽ trở thành company_owner nếu được duyệt)",
    },
    business_name: {
      type: String,
      required: true,
      trim: true,
    },
    tax_code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    registration_document: {
      type: registrationDocumentSchema,
      required: true,
    },
    contact_info: {
      type: contactInfoSchema,
    },
    address: {
      type: addressSchema,
    },
    // 🟩 Phân loại doanh nghiệp theo loại hình trong chuỗi logistics
    type: {
      type: String,
      enum: [
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
      ],
      required: true,
      description: "Phân loại loại hình doanh nghiệp trong chuỗi logistics",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approved_by: { type: String },
    approved_at: { type: Date },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    collection: "company_registrations",
  }
);

export default mongoose.model("CompanyRegistration", companyRegistrationSchema);
