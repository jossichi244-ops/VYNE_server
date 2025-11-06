const VNeIDIdentity = require("../models/VNeIDIdentity");
const User = require("../models/User");

/**
 * @desc Verify user identity with VNeID and assign role 'individual'
 * @route POST /api/auth/verify-vneid
 */
exports.verifyIdentity = async (req, res) => {
  try {
    const { wallet_address, id_type, id_number, dob } = req.body;

    if (!wallet_address || !id_type || !id_number || !dob) {
      return res.status(400).json({
        message: "Thiếu thông tin xác minh (id_type, id_number, dob)",
      });
    }

    // 1️⃣ Tìm trong collection_identity_vneid
    const identity = await VNeIDIdentity.findOne({
      id_type,
      id_number,
      dob,
    });

    if (!identity) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin VNeID phù hợp.",
      });
    }

    // 2️⃣ Tìm user theo ví
    const user = await User.findOne({ wallet_address });
    if (!user) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy user để cập nhật" });
    }

    // 3️⃣ Kiểm tra xem user đã có role 'individual' chưa
    const alreadyHasRole = user.roles.some((r) => r.role_type === "individual");

    if (!alreadyHasRole) {
      user.roles.push({
        role_type: "individual",
        status: "active",
        assigned_by: "system_vneid_verifier",
        assigned_at: new Date(),
        evidence: {
          source_collection: "collection_identity_vneid",
          record_id: identity._id.toString(),
          verification_method: "document_verified",
        },
      });
      await user.save();
    }

    return res.json({
      success: true,
      message: "✅ Xác minh thành công. Đã gán vai trò 'individual'.",
      user,
    });
  } catch (err) {
    console.error("❌ Lỗi verifyIdentity:", err);
    res.status(500).json({ message: "Lỗi server khi xác minh danh tính" });
  }
};
