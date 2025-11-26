const mongoose = require("mongoose");

const qrChallengeSchema = new mongoose.Schema(
  {
    qr_token_static: {
      type: String,
      required: true,
      description: "Liên kết với QR cần xác thực",
    },

    nonce: {
      type: String,
      required: true,
      description: "Nonce dùng để ký",
    },

    expires_at: {
      type: Date,
      required: true,
      description: "Thời gian hết hạn challenge",
    },

    used: {
      type: Boolean,
      default: false,
      required: true,
      description: "Đã được sử dụng hay chưa",
    },

    created_at: {
      type: Date,
      default: () => new Date(),
      required: true,
    },

    updated_at: {
      type: Date,
      default: () => new Date(),
      required: true,
    },
  },
  {
    collection: "qr_challenges",
  }
);

// Auto-update timestamp
qrChallengeSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model("QrChallenge", qrChallengeSchema);
