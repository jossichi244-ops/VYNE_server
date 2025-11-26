const mongoose = require("mongoose");

const DepositTransactionSchema = new mongoose.Schema(
  {
    deposit_ref: {
      type: String,
      required: true,
      unique: true,
      description: "Mã giao dịch đặt cọc duy nhất",
    },

    order_ref: {
      type: String,
      required: true,
      description: "Liên kết với transport_orders.order_ref",
    },

    buyer_wallet: {
      type: String,
      required: true,
      match: /^0x[a-fA-F0-9]{40}$/,
    },

    amount_token: {
      type: String,
      required: true,
      description: "Số lượng token đặt cọc (wei hoặc smallest unit)",
    },

    token_address: {
      type: String,
      required: true,
      match: /^0x[a-fA-F0-9]{40}$/,
    },

    tx_hash: {
      type: String,
      required: true,
      description: "Hash giao dịch blockchain",
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "failed", "refunded"],
      default: "pending",
      required: true,
    },

    confirmed_at: {
      type: Date,
      default: null,
    },

    refunded_at: {
      type: Date,
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
    collection: "deposit_transactions",
  }
);

// Optional: Update `updated_at` on save
DepositTransactionSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model("DepositTransaction", DepositTransactionSchema);
