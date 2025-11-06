const mongoose = require("mongoose");

const RoleSchema = new mongoose.Schema({
  role_type: {
    type: String,
    enum: ["company_owner", "company_admin", "individual"],
  },
  entity_id: String,
  status: {
    type: String,
    enum: ["active", "suspended", "pending"],
    default: "active",
  },
  assigned_by: String,
  assigned_at: Date,
  evidence: {
    source_collection: String,
    record_id: String,
    verification_method: {
      type: String,
      enum: [
        "wallet_match",
        "document_verified",
        "invite_code",
        "vneid_verified",
        "cross_verified_document",
      ],
    },
  },
});

const UserSchema = new mongoose.Schema({
  wallet_address: {
    type: String,
    match: /^0x[a-fA-F0-9]{40}$/,
    unique: true,
    required: true,
  },
  tokens: {
    type: Number,
    default: 0,
  },
  nonce: {
    type: String,
    minlength: 32,
    maxlength: 64,
    required: true,
  },
  nonce_expires_at: {
    type: Date,
    required: true,
  },
  last_login_at: Date,
  roles: [RoleSchema],
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", UserSchema);
