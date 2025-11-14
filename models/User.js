const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
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
});

module.exports = mongoose.model("User", UserSchema);
