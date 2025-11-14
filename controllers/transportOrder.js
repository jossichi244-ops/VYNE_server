const crypto = require("crypto");
const TransportOrder = require("../models/TransportOrder");
const User = require("../models/User");
function hashImageToBinaryHex(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

const walletExists = async (wallet) => {
  const count = await User.countDocuments({ wallet_address: wallet });
  return count > 0;
};

function encryptBufferAESGCM(buffer, key) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [
    iv.toString("base64"),
    ciphertext.toString("base64"),
    authTag.toString("base64"),
  ].join(":");
}

function decryptBufferAESGCM(str, key) {
  const [ivB64, ctB64, tagB64] = str.split(":");
  const iv = Buffer.from(ivB64, "base64");
  const ciphertext = Buffer.from(ctB64, "base64");
  const authTag = Buffer.from(tagB64, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

const createOrder = async (req, res) => {
  try {
    const {
      from_wallet,
      to_wallet,
      cargo,
      location,
      device_info,
      uploaded_by,
      token_used,
      amount_usd,
    } = req.body;

    // ✅ Validate wallets
    if (!/^0x[a-fA-F0-9]{40}$/.test(from_wallet))
      return res.status(400).json({ error: "from_wallet không hợp lệ" });

    if (!/^0x[a-fA-F0-9]{40}$/.test(to_wallet))
      return res.status(400).json({ error: "to_wallet không hợp lệ" });

    const fromExists = await walletExists(from_wallet);
    const toExists = await walletExists(to_wallet);

    if (!fromExists)
      return res
        .status(404)
        .json({ error: "from_wallet không tồn tại trong hệ thống" });

    if (!toExists)
      return res
        .status(404)
        .json({ error: "to_wallet không tồn tại trong hệ thống" });

    // ✅ Xử lý ảnh
    let imageBuffers = [];
    if (req.files?.length > 0) {
      imageBuffers = req.files.map((f) => f.buffer);
    } else if (Array.isArray(req.body.pickup_images)) {
      imageBuffers = req.body.pickup_images.map((b64) =>
        Buffer.from(b64, "base64")
      );
    }

    if (imageBuffers.length === 0)
      return res.status(400).json({ error: "Thiếu ảnh pickup_proof" });

    const image_hashes = imageBuffers.map((buf) => hashImageToBinaryHex(buf));
    const now = new Date();

    // ✅ Sinh order_ref unique
    const randomHash = crypto.randomBytes(8).toString("hex");
    const orderRef = `ORD-${now.getTime()}-${randomHash}`;

    // ✅ Tạo document mới
    const newOrder = new TransportOrder({
      order_ref: orderRef,
      from_wallet,
      to_wallet,
      cargo,
      pickup_proof: {
        image_hashes,
        uploaded_at: now,
        uploaded_by:
          uploaded_by && /^0x[a-fA-F0-9]{40}$/.test(uploaded_by)
            ? uploaded_by
            : from_wallet,
        location: location || null,
        device_info: device_info || null,
      },
      status: "pending_payment",
      payment: {
        escrow_id: null,
        token_used: token_used || null,
        amount_usd: amount_usd || 0,
        paid_at: null,
      },
      created_at: now,
      updated_at: now,
    });

    await newOrder.save();

    return res.status(201).json({
      message: "Tạo đơn hàng thành công",
      data: newOrder,
    });
  } catch (err) {
    console.error("CREATE ORDER ERROR:", err);
    return res.status(500).json({
      error: "Lỗi tạo đơn hàng",
      details: err.message,
    });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await TransportOrder.find().sort({ created_at: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi lấy danh sách đơn hàng." });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await TransportOrder.findById(req.params.id);
    if (!order)
      return res.status(404).json({ error: "Không tìm thấy đơn hàng." });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi lấy chi tiết đơn hàng." });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await TransportOrder.findByIdAndUpdate(
      req.params.id,
      { status, updated_at: new Date() },
      { new: true }
    );
    if (!order)
      return res.status(404).json({ error: "Không tìm thấy đơn hàng." });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi cập nhật đơn hàng." });
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
};
