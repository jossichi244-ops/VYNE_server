// models/CompanyRegistration.js
import mongoose from "mongoose";
import { randomUUID } from "crypto";

const companyRegistrationSchema = new mongoose.Schema(
  {
    company_id: {
      type: String,
      unique: true,
      index: true,
      default: () => randomUUID(), // Tự sinh UUID
      immutable: true, // Không cho user sửa
    },

    business_name: {
      type: String,
      required: true,
      trim: true,
    },

    tax_code: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },

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
      required: false,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },

  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    collection: "company_registrations",
  }
);

// 🔒 Không cho client gửi company_id từ bên ngoài
companyRegistrationSchema.pre("validate", function (next) {
  if (!this.company_id) {
    this.company_id = randomUUID();
  }
  next();
});

export default mongoose.model("CompanyRegistration", companyRegistrationSchema);
