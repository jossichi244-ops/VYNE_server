const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    wallet_address: {
      type: String,
      match: /^0x[a-fA-F0-9]{40}$/,
      unique: true,
      required: true,
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
    last_login_at: {
      type: Date,
      required: true,
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
    collection: "users",
  }
);

userSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model("User", userSchema);
