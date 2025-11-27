const mongoose = require("mongoose");

const DangerousGoodsInfoSchema = new mongoose.Schema(
  {
    un_number: {
      type: String,
      match: /^UN[0-9]{4}$/,
    },
    proper_shipping_name: { type: String },
    hazard_class: {
      type: String,
      match: /^(1|2\.[0-9]|3|4\.[0-9]|5\.[0-9]|6\.[0-9]|7|8|9)$/,
    },
    packing_group: {
      type: String,
      enum: ["I", "II", "III", null],
      default: null,
    },
    subrisk: { type: String, default: null },
    net_quantity_kg: { type: Number },
    packaging_type: {
      type: String,
      enum: ["Drum", "Box", "Jerrican", "IBC", "Other"],
    },
    marine_pollutant: { type: Boolean },
    lqd: { type: Boolean },
    emergency_contact: {
      type: {
        name: { type: String },
        phone: { type: String },
      },
      default: undefined,
    },
  },
  { _id: false }
);

const CargoSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    weight_kg: { type: Number, required: true },
    volume_cbm: { type: Number },
    is_dangerous_goods: { type: Boolean, default: false, required: true },

    cargo_value_usd: { type: Number, min: 0 },

    dangerous_goods_info: {
      type: DangerousGoodsInfoSchema,
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
  { _id: false }
);

const DangerousGoodsDeclarationSchema = new mongoose.Schema(
  {
    signed_by: {
      type: String,
      match: /^0x[a-fA-F0-9]{40}$/,
    },
    signed_at: {
      type: Date,
    },
    declaration_text: {
      type: String,
      default:
        "Tôi xin cam kết rằng hàng hóa được khai báo đúng theo UN Model Regulations, được đóng gói và dán nhãn phù hợp với IMDG Code.",
    },
    digital_signature_cid: { type: String },
  },
  { _id: false }
);

const PickupProofSchema = new mongoose.Schema(
  {
    image_hashes: {
      type: [
        {
          type: String,
          match: /^[a-f0-9]{64}$/,
        },
      ],
      validate: [(arr) => arr.length > 0, "Cần ít nhất 1 hình ảnh pickup"],
    },
    uploaded_at: { type: Date, required: true },
    uploaded_by: {
      type: String,
      match: /^0x[a-fA-F0-9]{40}$/,
      required: true,
    },
    location: {
      type: {
        lat: Number,
        lng: Number,
      },
      default: undefined,
    },
    device_info: {
      type: {
        user_agent: String,
        ip_address: String,
      },
      default: undefined,
    },
  },
  { _id: false }
);

const PaymentSchema = new mongoose.Schema(
  {
    escrow_id: { type: String, default: null },
    token_used: {
      type: String,
      match: /^0x[a-fA-F0-9]{40}$/,
    },
    amount_usd: { type: Number },
    paid_at: { type: Date, default: null },
  },
  { _id: false }
);

const TransportOrderSchema = new mongoose.Schema(
  {
    order_ref: {
      type: String,
      unique: true,
      required: true,
    },

    from_wallet: {
      type: String,
      required: true,
      match: /^0x[a-fA-F0-9]{40}$/,
    },

    to_wallet: {
      type: String,
      required: true,
      match: /^0x[a-fA-F0-9]{40}$/,
    },

    cargo: {
      type: CargoSchema,
      required: true,
    },

    dangerous_goods_declaration: {
      type: DangerousGoodsDeclarationSchema,
      default: null,
    },

    pickup_proof: {
      type: PickupProofSchema,
      required: true,
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
      type: PaymentSchema,
      default: {},
    },

    delivery_proof_cid: { type: String, default: null },

    created_at: { type: Date, required: true, default: Date.now },
    updated_at: { type: Date, required: true, default: Date.now },
  },
  {
    collection: "transport_orders",
  }
);

TransportOrderSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model("TransportOrder", TransportOrderSchema);
