const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { verifyEthereumSignature } = require("../utils/signature");

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// ✅ Step 1: Request nonce
exports.requestNonce = async (req, res) => {
  try {
    const { wallet_address } = req.body;
    if (!wallet_address)
      return res.status(400).json({ error: "Missing wallet address" });

    const nonce = crypto.randomBytes(32).toString("hex");
    const nonceExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

    const user = await User.findOneAndUpdate(
      { wallet_address },
      {
        wallet_address,
        nonce,
        nonce_expires_at: nonceExpiresAt,
        updated_at: new Date(),
        $setOnInsert: { created_at: new Date(), roles: [] },
      },
      { new: true, upsert: true }
    );

    res.json({ wallet_address: user.wallet_address, nonce: user.nonce });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Step 2: Verify signature
exports.verifySignature = async (req, res) => {
  try {
    const { wallet_address, signature } = req.body;
    if (!wallet_address || !signature)
      return res.status(400).json({ error: "Missing data" });

    const user = await User.findOne({
      wallet_address,
      nonce_expires_at: { $gt: new Date() },
    });

    if (!user)
      return res.status(400).json({ error: "Nonce expired or user not found" });

    const message = `Login to System: ${user.nonce}`;
    const isValid = verifyEthereumSignature(wallet_address, message, signature);

    if (!isValid) return res.status(401).json({ error: "Invalid signature" });

    user.last_login_at = new Date();
    user.updated_at = new Date();
    await user.save();

    const token = jwt.sign({ wallet_address }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, wallet_address });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Authentication failed" });
  }
};
