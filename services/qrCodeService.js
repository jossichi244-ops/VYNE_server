import crypto from "crypto";
import QrCode from "../models/StaticQRCode.js";

export const generateCompanyQrBatch = async (companyId) => {
  // Kiểm tra công ty đã có QR trước đó chưa
  const existed = await QrCode.countDocuments({ company_id: companyId });
  if (existed > 0) return { created: false, count: existed };

  // Tạo 10 QR Code
  const batch = Array.from({ length: 10 }).map((_, index) => {
    const randomHex = (bytes) => crypto.randomBytes(bytes).toString("hex");

    const qrToken = randomHex(16);
    const urlToken = randomHex(16);

    return {
      _id: `QR-${companyId}-${index}`,
      user_alias: `UID-${randomHex(4)}`,
      qr_token_static: qrToken,
      qr_content_url: `https://yourapp.com/verify/${companyId}/${urlToken}`,
      qr_binary_hash: null,
      assigned_wallet: null,
      assigned_at: null,
      is_claimed: false,
      status: "available",
      company_id: companyId,
      assigned_to_company: true,
      created_at: new Date(),
      updated_at: new Date(),
    };
  });

  await QrCode.insertMany(batch);

  return { created: true, count: 10 };
};
