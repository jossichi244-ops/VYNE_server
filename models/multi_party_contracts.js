const mongoose = require("mongoose");

const PartySchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["buyer", "seller", "carrier"],
      required: true,
    },
    wallet: {
      type: String,
      match: /^0x[a-fA-F0-9]{40}$/,
      required: true,
    },
    signed: {
      type: Boolean,
      default: false,
      required: true,
    },
    deposit_amount_token: {
      type: String,
      default: null,
    },
    deposit_paid_at: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const ContractTermsSchema = new mongoose.Schema(
  {
    delivery_deadline: {
      type: Date,
    },
    delivery_proof_required: {
      type: Boolean,
      default: true,
    },
    payment_release_condition: {
      type: String,
      enum: ["proof_of_delivery", "manual_approval", "time_based"],
    },
    penalty_rate: {
      type: Number,
    },
  },
  { _id: false }
);

const MultiPartyContractSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
    },
    contract_ref: {
      type: String,
      unique: true,
    },

    order_ref: {
      type: String,
      required: true,
    },

    parties: {
      type: [PartySchema],
      required: true,
    },

    escrow_id: {
      type: String,
    },

    status: {
      type: String,
      enum: [
        "pending_signatures",
        "active",
        "in_transit",
        "delivered",
        "disputed",
        "completed",
        "cancelled",
      ],
      default: "pending_signatures",
      required: true,
    },

    contract_terms: {
      type: ContractTermsSchema,
      default: {},
    },

    created_at: {
      type: Date,
      required: true,
    },

    activated_at: {
      type: Date,
    },

    updated_at: {
      type: Date,
      required: true,
    },
  },
  {
    collection: "multi_party_contracts",
  }
);

module.exports = mongoose.model("MultiPartyContract", MultiPartyContractSchema);
