const mongoose = require("mongoose");

const TransportOrderSchema = new mongoose.Schema(
  {
    order_ref: {
      type: String,
      unique: true,
      required: true,
      description: "Mã đơn hàng duy nhất",
    },

    from_wallet: {
      type: String,
      required: true,
      match: /^0x[a-fA-F0-9]{40}$/,
      description: "Ví người gửi (web3)",
    },

    to_wallet: {
      type: String,
      required: true,
      match: /^0x[a-fA-F0-9]{40}$/,
      description: "Ví người vận chuyển / người nhận (web3)",
    },

    cargo: {
      type: {
        description: { type: String, required: true },
        weight_kg: { type: Number, required: true },
        volume_cbm: { type: Number },
        is_dangerous_goods: { type: Boolean, required: true, default: false },
        un_class_number: {
          type: String,
          match: /^[1-9]$|^[1-8][0-9]?$|^9[0-9]?$/,
          default: null,
        },
        msds_document_cid: { type: String, default: null },
        msds_verification_status: {
          type: String,
          enum: ["not_required", "pending", "verified", "rejected"],
          default: "not_required",
        },
        customs_hs_code: { type: String, default: null },
        packaging_type: {
          type: String,
          enum: ["container", "pallet", "drum", "bulk", "other"],
        },
      },
      required: true,
      _id: false,
    },

    pickup_proof: {
      type: {
        image_hashes: {
          type: [
            {
              type: String,
              match: /^[a-f0-9]{64}$/, // SHA-256 hex string
              required: true,
            },
          ],
          validate: [(arr) => arr.length > 0, "Cần ít nhất 1 hash ảnh"],
        },
        uploaded_at: { type: Date, required: true },
        uploaded_by: {
          type: String,
          match: /^0x[a-fA-F0-9]{40}$/,
          required: true,
        },
        location: {
          type: {
            lat: { type: Number },
            lng: { type: Number },
          },
          default: undefined,
        },
        device_info: {
          type: {
            user_agent: { type: String },
            ip_address: { type: String },
          },
          default: undefined,
        },
      },
      required: true,
      _id: false,
    },

    status: {
      type: String,
      enum: [
        "pending_payment",
        "paid",
        "in_transit",
        "delivered",
        "disputed",
        "completed",
        "cancelled",
      ],
      default: "pending_payment",
    },

    payment: {
      type: {
        escrow_id: { type: String, default: null },
        token_used: {
          type: String,
          match: /^0x[a-fA-F0-9]{40}$/,
        },
        amount_usd: { type: Number },
        paid_at: { type: Date, default: null },
      },
      default: {},
      _id: false,
    },

    delivery_proof_cid: {
      type: String,
      default: null,
    },

    created_at: {
      type: Date,
      required: true,
      default: Date.now,
    },

    updated_at: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    collection: "transport_orders",
  }
);

module.exports = mongoose.model("TransportOrder", TransportOrderSchema);
