import mongoose from "mongoose";
import crypto from "crypto";

// Helper: Generate random hex (32–64)
const generateStaticToken = () => crypto.randomBytes(32).toString("hex");

const staticQrCodeSchema = new mongoose.Schema(
  {
    user_alias: {
      type: String,
      unique: true,
      sparse: true,
      description: "Mã định danh duy nhất, được sinh khi xác nhận thành công",
    },

    qr_token_static: {
      type: String,
      required: true,
      unique: true,
      minlength: 32,
      maxlength: 64,
      default: generateStaticToken, // Tự sinh nếu không nhập
      description: "UUID cố định, in lên QR",
    },

    qr_content_url: {
      type: String,
      required: true,
      match: /^https?:\/\/.+/i,
    },

    qr_binary_hash: {
      type: String,
      required: true,
      match: /^[a-fA-F0-9]{64}$/, // SHA-256
    },

    assigned_wallet: {
      type: String,
      match: /^0x[a-fA-F0-9]{40}$/,
      default: null,
    },

    assigned_at: {
      type: Date,
      default: null,
    },

    is_claimed: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["available", "claimed", "revoked"],
      default: "available",
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    collection: "static_qr_codes",
    strict: true, // Không cho field ngoài JSON Schema
  }
);

export default mongoose.model("StaticQRCode", staticQrCodeSchema);
