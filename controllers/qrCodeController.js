// controllers/qrCodeController.js
const mongoose = require("mongoose");
const QrCode = require("../models/StaticQRCode");
const QrChallenge = require("../models/QrChallenge");
const Company = require("../models/CompanyRegistration");
const UserProfile = require("../models/UserProfile");
const User = require("../models/User");
const crypto = require("crypto");
const { verifyEthereumSignature } = require("../utils/ethVerify.js");

// =========================
// 1. AUTO GENERATE 10 QR WHEN COMPANY APPROVED
// =========================
exports.generateQRCodesForCompany = async (req, res) => {
  try {
    const companyId = req.params.companyId;

    const company = await Company.findOne({
      _id: companyId,
      status: "approved",
    });

    if (!company) {
      return res.status(404).json({
        ok: false,
        message: "Company not found or not approved",
      });
    }

    const existing = await QrCode.countDocuments({ company_id: companyId });
    if (existing > 0) {
      return res.json({
        ok: false,
        message: "QR batch already generated for this company",
      });
    }

    const batch = [...Array(10)].map((_, i) => ({
      _id: `QR-${companyId}-${i}`,
      user_alias: `UID-${crypto.randomBytes(4).toString("hex")}`,
      qr_token_static: crypto.randomBytes(16).toString("hex"),
      qr_content_url:
        "VYNECOOP" + companyId + crypto.randomBytes(16).toString("hex"),

      qr_binary_hash: null,
      assigned_wallet: null,
      assigned_at: null,
      is_claimed: false,
      status: "available",

      company_id: companyId,
      assigned_to_company: true,

      created_at: new Date(),
      updated_at: new Date(),
    }));

    await QrCode.insertMany(batch);

    return res.json({
      ok: true,
      message: "Generated 10 QR codes for company",
      qr_codes: batch,
    });
  } catch (err) {
    console.error("Error generating QR batch: ", err);
    return res.status(500).json({ ok: false, error: err.toString() });
  }
};

// =========================
// 2. CLAIM QR BY SIGNATURE + CHALLENGE
// =========================
exports.claimQrWithSignature = async (req, res) => {
  try {
    const { qr_token_static, wallet, signature } = req.body;

    const qr = await QrCode.findOne({
      qr_token_static,
      is_claimed: false,
      status: "available",
    });

    if (!qr) {
      return res.status(404).json({ ok: false, message: "QR not available" });
    }

    const challenge = await QrChallenge.findOne({
      qr_token_static,
      used: false,
      expires_at: { $gt: new Date() },
    });

    if (!challenge) {
      return res.status(400).json({ ok: false, message: "No valid challenge" });
    }

    const message = "Claim QR: " + challenge.nonce;
    const valid = verifyEthereumSignature(wallet, message, signature);

    if (!valid) {
      return res.status(400).json({ ok: false, message: "Invalid signature" });
    }

    // Mark challenge as used
    challenge.used = true;
    challenge.updated_at = new Date();
    await challenge.save();

    // Update QR code
    qr.assigned_wallet = wallet;
    qr.assigned_at = new Date();
    qr.status = "claimed";
    qr.is_claimed = true;
    qr.updated_at = new Date();
    await qr.save();

    // Create user profile
    const profile = new UserProfile({
      wallet_address: wallet,
      user_alias: qr.user_alias,
      qr_code_id: qr._id,
      personal_info: { full_name: null },
      roles: [],
      status: "active",
      created_at: new Date(),
      updated_at: new Date(),
    });

    await profile.save();

    return res.json({
      ok: true,
      message: "QR claimed successfully",
      profile,
    });
  } catch (err) {
    console.error("Claim QR error:", err);
    return res.status(500).json({ ok: false, error: err.toString() });
  }
};

// =========================
// 3. CREATE QR PHYSICAL CARD (PRINT BEFORE CLAIM)
// =========================
exports.createPhysicalQR = async (req, res) => {
  try {
    const { company_id, sha256_hash, card_info } = req.body;

    const newQR = new QrCode({
      user_alias: "UID-" + crypto.randomBytes(4).toString("hex"),
      qr_token_static: crypto.randomBytes(16).toString("hex"),
      qr_content_url:
        "VYNECOOP" + company_id + crypto.randomBytes(16).toString("hex"),

      qr_binary_hash: sha256_hash,
      assigned_wallet: null,
      assigned_at: null,
      is_claimed: false,
      status: "available",
      physical_card_info: card_info,

      company_id,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await newQR.save();

    return res.json({
      ok: true,
      message: "Physical QR created",
      qr: newQR,
    });
  } catch (err) {
    console.error("Error creating physical QR:", err);
    return res.status(500).json({ ok: false, error: err.toString() });
  }
};

// =========================
// 4. CLAIM QR IF WALLET ALREADY EXISTS IN `users` TABLE
// =========================
exports.claimQrByExistingUser = async (req, res) => {
  try {
    const { qr_token_static, wallet } = req.body;

    const qr = await QrCode.findOne({
      qr_token_static,
      is_claimed: false,
      status: "available",
    });

    if (!qr) {
      return res.status(404).json({ ok: false, message: "QR not available" });
    }

    const userExists = await User.findOne({ wallet_address: wallet });

    if (!userExists) {
      return res.status(400).json({
        ok: false,
        message: "Wallet not registered in users table",
      });
    }

    qr.assigned_wallet = wallet;
    qr.assigned_at = new Date();
    qr.status = "claimed";
    qr.is_claimed = true;
    qr.updated_at = new Date();
    await qr.save();

    const profile = new UserProfile({
      wallet_address: wallet,
      user_alias: qr.user_alias,
      qr_code_id: qr._id,
      personal_info: { full_name: null },
      roles: [],
      status: "active",
      created_at: new Date(),
      updated_at: new Date(),
    });

    await profile.save();

    return res.json({
      ok: true,
      message: "QR claimed by existing user",
      profile,
    });
  } catch (err) {
    console.error("Claim QR user error:", err);
    return res.status(500).json({ ok: false, error: err.toString() });
  }
};
