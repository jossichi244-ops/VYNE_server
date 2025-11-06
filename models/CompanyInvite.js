// models/CompanyInvite.js
import mongoose from "mongoose";

const companyInviteSchema = new mongoose.Schema(
  {
    company_id: {
      type: String,
      required: true,
      ref: "CompanyRegistration",
    },
    inviter_wallet: {
      type: String,
      required: true,
      match: /^0x[a-fA-F0-9]{40}$/,
    },
    invitee_wallet: {
      type: String,
      required: true,
      match: /^0x[a-fA-F0-9]{40}$/,
    },
    role: {
      type: String,
      enum: ["employee", "manager", "auditor"],
      default: "employee",
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
    token: {
      type: String,
      unique: true,
      required: true,
    },
    expires_at: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "company_invites",
  }
);

export default mongoose.model("CompanyInvite", companyInviteSchema);
