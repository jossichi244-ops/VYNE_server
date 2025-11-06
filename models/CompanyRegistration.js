// models/CompanyRegistration.js
import mongoose from "mongoose";

const registrationDocumentSchema = new mongoose.Schema(
  {
    file_cid: {
      type: String,
      required: true,
      description: "IPFS CID của giấy phép kinh doanh",
    },
    ocr_verified: { type: Boolean, default: false },
    ocr_data: { type: Object, default: {} },
    verified_by_admin: { type: Boolean, default: false },
    verified_at: { type: Date },
  },
  { _id: false }
);

const contactInfoSchema = new mongoose.Schema(
  {
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String },
  },
  { _id: false }
);

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
