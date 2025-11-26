import mongoose from "mongoose";

const userProfileSchema = new mongoose.Schema(
  {
    wallet_address: {
      type: String,
      required: true,
      unique: true,
      match: /^0x[a-fA-F0-9]{40}$/,
    },

    user_alias: {
      type: String,
      required: true,
      unique: true,
      description: "Mã định danh duy nhất do hệ thống cấp",
    },

    qr_code_id: {
      type: String,
      required: true,
      description: "Tham chiếu đến qr_codes._id",
    },

    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },

    created_at: {
      type: Date,
      required: true,
      default: () => new Date(),
    },

    updated_at: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
  },
  {
    collection: "user_profiles",
  }
);

// Auto-update updated_at
userProfileSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

export default mongoose.model("UserProfile", userProfileSchema);
