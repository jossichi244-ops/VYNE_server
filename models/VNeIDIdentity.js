// models/VNeIDIdentity.js
const mongoose = require("mongoose");

const VNeIDIdentitySchema = new mongoose.Schema(
  {
    id_type: {
      type: String,
      enum: ["CCCD", "CMND", "Passport"],
      required: true,
    },
    id_number: { type: String, required: true, index: true },
    full_name: { type: String, required: true },
    dob: { type: String },
    verified_at: { type: Date, required: true },
  },
  { collection: "collection_identity_vneid" }
);

module.exports = mongoose.model("VNeIDIdentity", VNeIDIdentitySchema);
