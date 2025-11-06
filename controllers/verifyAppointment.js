const AppointmentDecision = require("../models/AppointmentDecision");
const VNeIDIdentity = require("../models/VNeIDIdentity");
const User = require("../models/User");

exports.verifyAppointment = async (req, res) => {
  try {
    const { wallet_address, id_type, id_number, full_name } = req.body;

    if (!wallet_address || !id_type || !id_number || !full_name) {
      return res.status(400).json({
        success: false,
        message:
          "Thiếu thông tin xác minh (wallet_address, id_type, id_number, full_name)",
      });
    }

    // 1️⃣ Tìm quyết định bổ nhiệm hợp lệ
    const decision = await AppointmentDecision.findOne({
      "normalized.personal_info.id_type": id_type,
      "normalized.personal_info.id_number": id_number,
      "normalized.personal_info.full_name": {
        $regex: new RegExp(full_name, "i"),
      },
      status: "verified",
    });

    if (!decision) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy quyết định bổ nhiệm hợp lệ.",
      });
    }

    // 1.5️⃣ Đối chiếu với dữ liệu VNeID
    const vneid = await VNeIDIdentity.findOne({
      id_type,
      id_number,
    });

    if (!vneid) {
      return res.status(400).json({
        success: false,
        message:
          "Không tìm thấy dữ liệu xác minh danh tính từ VNeID. Vui lòng xác minh cá nhân trước khi xác nhận vai trò Owner.",
      });
    }

    // 2️⃣ Tìm user theo ví
    const user = await User.findOne({ wallet_address });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy user để cập nhật." });
    }

    // 3️⃣ Kiểm tra role owner
    const hasOwnerRole = user.roles.some(
      (r) => r.role_type === "company_owner"
    );
    if (!hasOwnerRole) {
      user.roles.push({
        role_type: "company_owner",
        status: "active",
        assigned_by: "system_appointment_verifier",
        assigned_at: new Date(),
        evidence: {
          source_collections: [
            "collection_appointment_decisions",
            "collection_identity_vneid",
          ],
          records: {
            appointment_id: decision._id.toString(),
            identity_id: vneid._id.toString(),
          },
          verification_method: "cross_verified_document",
          company_name: decision.normalized.company_name,
        },
      });
      await user.save();
    }

    return res.json({
      success: true,
      message:
        "✅ Xác minh thành công. Đã đối chiếu với VNeID và gán vai trò 'owner'.",
      user,
    });
  } catch (err) {
    console.error("❌ Lỗi verifyAppointment:", err);
    res
      .status(500)
      .json({ success: false, message: "Lỗi server khi xác minh bổ nhiệm." });
  }
};
