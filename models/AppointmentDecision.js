const mongoose = require("mongoose");

const AppointmentDecisionSchema = new mongoose.Schema({
  wallet_address: { type: String, index: true },
  normalized: {
    company_name: String,
    company_type: String,
    personal_info: {
      id_type: String,
      id_number: String,
      full_name: String,
    },
    appointment_date: {
      day: Number,
      month: Number,
      year: Number,
    },
    signing_authority: String,
    signing_person: {
      full_name: String,
      title: String,
      is_authorized: Boolean,
      authorization_rule: String,
    },
  },
  status: {
    type: String,
    enum: ["pending", "verified", "rejected"],
    default: "pending",
  },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model(
  "AppointmentDecision",
  AppointmentDecisionSchema,
  "collection_appointment_decisions"
);
