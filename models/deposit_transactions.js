const mongoose = require("mongoose");

const RiskProfileSchema = new mongoose.Schema(
  {
    risk_category: {
      type: String,
      enum: ["normal", "oversized", "dangerous"],
      required: true,
    },
    deposit_percentage: {
      type: Number,
      min: 0.2,
      max: 1.0,
      required: true,
    },
    input_factors: {
      type: {
        weight_kg: { type: Number, min: 0, required: true },
        is_dangerous_goods: { type: Boolean, required: true },
        hazard_class: { type: String, default: null },
        packaging_type: { type: String, required: true },
        cargo_value_usd: { type: Number, min: 0, required: true },
        distance_km: { type: Number, min: 0, default: null },
      },
      required: true,
      _id: false,
    },
  },
  { _id: false }
);

const BalanceCheckSchema = new mongoose.Schema(
  {
    user_balance_token: { type: String, required: true },
    required_amount_token: { type: String, required: true },
    sufficient_balance: { type: Boolean, required: true },
    checked_at: { type: Date, required: true },
  },
  { _id: false }
);

const ConfirmationSchema = new mongoose.Schema(
  {
    confirmed_by_recipient: { type: Boolean, default: false, required: true },
    confirmed_at: { type: Date, default: null },
    confirmed_wallet: {
      type: String,
      match: /^0x[a-fA-F0-9]{40}$/,
      default: null,
    },
  },
  { _id: false }
);

const FundDeductionSchema = new mongoose.Schema(
  {
    deducted: { type: Boolean, required: true, default: false },
    deducted_at: { type: Date, default: null },
    deduction_reference: { type: String, default: null },
  },
  { _id: false }
);

const DepositTransactionSchema = new mongoose.Schema(
  {
    deposit_ref: {
      type: String,
      required: true,
      unique: true,
    },

    order_ref: {
      type: String,
      required: true,
    },

    buyer_wallet: {
      type: String,
      required: true,
      match: /^0x[a-fA-F0-9]{40}$/,
    },

    recipient_wallet: {
      type: String,
      required: true,
      match: /^0x[a-fA-F0-9]{40}$/,
    },

    amount_token: {
      type: String,
      required: true,
    },

    amount_usd: {
      type: Number,
      min: 0,
      required: true,
    },

    token_address: {
      type: String,
      required: true,
      match: /^0x[a-fA-F0-9]{40}$/,
    },

    tx_hash: {
      type: String,
      default: null,
    },

    risk_profile: {
      type: RiskProfileSchema,
      required: true,
    },

    balance_check: {
      type: BalanceCheckSchema,
      required: true,
    },

    confirmation: {
      type: ConfirmationSchema,
      required: true,
    },

    fund_deduction: {
      type: FundDeductionSchema,
      required: true,
    },

    remaining_payment_usd: {
      type: Number,
      min: 0,
      default: null,
    },

    status: {
      type: String,
      enum: [
        "pending_balance_check",
        "insufficient_balance",
        "balance_checked",
        "awaiting_recipient_confirmation",
        "confirmed",
        "failed",
        "refunded",
      ],
      default: "pending_balance_check",
      required: true,
    },

    created_at: {
      type: Date,
      default: Date.now,
      required: true,
    },

    updated_at: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    collection: "deposit_transactions",
  }
);

DepositTransactionSchema.pre("save", function (next) {
  this.updated_at = new Date();

  // RULE: confirmed_wallet phải trùng recipient_wallet nếu có
  if (
    this.confirmation?.confirmed_wallet &&
    this.confirmation.confirmed_wallet !== this.recipient_wallet
  ) {
    return next(new Error("confirmed_wallet must match recipient_wallet"));
  }

  next();
});

module.exports = mongoose.model("DepositTransaction", DepositTransactionSchema);
