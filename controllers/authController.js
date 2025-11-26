const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { verifyEthereumSignature } = require("../utils/signature");
const TransportOrder = require("../models/TransportOrder");
const JWT_SECRET = process.env.JWT_SECRET;

// 🧩 Step 1: Yêu cầu nonce (client gửi wallet_address)
const requestNonce = async (req, res) => {
  try {
    const { wallet_address } = req.body;
    if (!wallet_address)
      return res.status(400).json({ error: "Missing wallet address" });

    const nonce = crypto.randomBytes(32).toString("hex");
    const nonceExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const user = await User.findOneAndUpdate(
      { wallet_address },
      {
        wallet_address,
        nonce,
        nonce_expires_at: nonceExpiresAt,
        updated_at: new Date(),
        $setOnInsert: { created_at: new Date() },
      },
      { new: true, upsert: true }
    );

    res.json({ wallet_address: user.wallet_address, nonce: user.nonce });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// 🧩 Step 2: Xác minh chữ ký
const verifySignature = async (req, res) => {
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

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find(
      {},
      { _id: 0, wallet_address: 1, created_at: 1, last_login_at: 1 }
    );
    res.json({ total: users.length, users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Cannot load users" });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const { wallet_address } = req.params;
    if (!wallet_address)
      return res
        .status(400)
        .json({ error: "Missing wallet_address in params" });

    /**---------------------
     * 1️⃣ Fetch User Profile
     ----------------------*/
    const user = await User.findOne(
      { wallet_address },
      {
        _id: 0,
        wallet_address: 1,
        created_at: 1,
        last_login_at: 1,
        updated_at: 1,
        roles: 1,
        balance: 1,
        transactions: 1,
        avatarUrl: 1,
      }
    ).lean();

    if (!user) return res.status(404).json({ error: "User not found" });

    /**---------------------
     * 2️⃣ Fetch Orders (Filter + Sort + Pagination)
     ----------------------*/
    const {
      status,
      sort = "created_at",
      order = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    const query = {
      $or: [{ from_wallet: wallet_address }, { to_wallet: wallet_address }],
    };
    if (status) query.status = status;

    const skip = (page - 1) * Number(limit);

    const orders = await TransportOrder.find(query)
      .sort({ [sort]: order === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    /**---------------------
     * 3️⃣ Analytics + Status Summary
     ----------------------*/
    const statusSummary = await TransportOrder.aggregate([
      { $match: query },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const totalOrders = statusSummary.reduce((sum, x) => sum + x.count, 0);

    /**---------------------
     * 🔥 Final Response (FE-friendly format)
     ----------------------*/
    return res.json({
      user: {
        walletAddress: user.wallet_address,
        createdAt: user.created_at,
        lastLoginAt: user.last_login_at,
        updatedAt: user.updated_at,
        avatarUrl: user.avatarUrl || null,
        roles: user.roles || [],
        balance: user.balance ?? 0,
        transactions: user.transactions ?? 0,
      },
      stats: {
        totalOrders,
        byStatus: statusSummary,
      },
      pagination: {
        page: Number(page),
        limit: Number(limit),
        sortField: sort,
        sortOrder: order,
        statusFilter: status || "all",
      },
      orders,
    });
  } catch (error) {
    console.error("❌ GET USER PROFILE ERROR:", error);
    return res.status(500).json({ error: "Cannot load user profile" });
  }
};

module.exports = { requestNonce, verifySignature, getAllUsers, getUserProfile };
