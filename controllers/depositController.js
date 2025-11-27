const DepositTransaction = require("../models/deposit_transactions");
const TransportOrder = require("../models/TransportOrder");
const User = require("../models/User");

// ==========================
// CREATE DEPOSIT (auto-calculated based on Model C)
// ==========================
const createDeposit = async (req, res) => {
  try {
    const { order_ref, buyer_wallet, token_address, tx_hash } = req.body;

    console.log("REQ.BODY:", req.body);

    // 1. Tìm order
    const order = await TransportOrder.findOne({ order_ref });
    if (!order) return res.status(404).json({ error: "Order không tồn tại" });

    // 2. Xác định risk_category
    let riskCategory = "normal";
    if (order.cargo.is_dangerous_goods === true) {
      riskCategory = "dangerous";
    } else if (
      order.cargo.weight_kg >= 20000 ||
      order.cargo.transport_type === "heavy_lift"
    ) {
      riskCategory = "oversized";
    }

    // 3. Tính deposit %
    const depositRate =
      riskCategory === "dangerous"
        ? 0.85
        : riskCategory === "oversized"
        ? 0.5
        : 0.25;

    // 4. Tính deposit amount
    const amount_usd = order.cargo.cargo_value_usd * depositRate;

    // 5. Check user balance
    const buyer = await User.findOne({ wallet_address: buyer_wallet });
    if (!buyer) return res.status(404).json({ error: "Buyer không tồn tại" });

    const tokenBalance = buyer.balances?.find(
      (b) => b.token_address === token_address
    );

    const sufficient_balance =
      tokenBalance && Number(tokenBalance.amount) >= Number(amount_usd);

    // 6. Save deposit transaction
    const depositRef = `DEP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newDeposit = new DepositTransaction({
      deposit_ref: depositRef,
      order_ref,
      buyer_wallet,
      token_address,
      tx_hash,
      amount_usd,
      risk_profile: {
        risk_category: riskCategory,
        deposit_percentage: depositRate,
      },
      balance_check: {
        required_amount_token: amount_usd.toString(),
        user_balance_token: tokenBalance ? tokenBalance.amount.toString() : "0",
        sufficient_balance,
        checked_at: new Date(),
      },
      status: sufficient_balance ? "balance_checked" : "insufficient_balance",
      created_at: new Date(),
      updated_at: new Date(),
    });

    await newDeposit.save();

    res.status(201).json({
      message: "Deposit created theo risk model",
      deposit: newDeposit,
    });
  } catch (err) {
    console.error("Create Deposit Error:", err);
    res.status(500).json({ error: "Lỗi server khi tạo deposit" });
  }
};

// ==========================
// CONFIRM DEPOSIT (recipient confirms → deduct funds)
// ==========================
const confirmDeposit = async (req, res) => {
  try {
    const { depositRef } = req.params;

    const deposit = await DepositTransaction.findOne({
      deposit_ref: depositRef,
    });

    if (!deposit)
      return res.status(404).json({ error: "Deposit không tồn tại" });

    if (deposit.status === "confirmed")
      return res.status(400).json({ error: "Deposit đã được xác nhận" });

    // 1. Check sufficient balance before deduction
    if (!deposit.balance_check?.sufficient_balance) {
      return res.status(400).json({
        error: "Không thể xác nhận. Số dư không đủ để trừ tiền.",
      });
    }

    // 2. Deduct funds (giả lập)
    deposit.fund_deduction = {
      deducted: true,
      deducted_at: new Date(),
    };

    // 3. Update status
    deposit.status = "confirmed";
    deposit.confirmed_at = new Date();
    deposit.updated_at = new Date();
    await deposit.save();

    // 4. Update TransportOrder (remaining payment)
    const order = await TransportOrder.findOne({
      order_ref: deposit.order_ref,
    });
    if (!order)
      return res.status(404).json({ error: "Order liên quan không tồn tại" });

    const remaining = order.payment.amount_usd - deposit.amount_usd;

    order.status = remaining <= 0 ? "paid" : "partial_paid";
    order.payment.remaining_usd = remaining;
    order.updated_at = new Date();
    await order.save();

    res.json({
      message: "Deposit confirmed, order status updated",
      deposit,
      order,
    });
  } catch (err) {
    console.error("Confirm Deposit Error:", err);
    res.status(500).json({ error: "Lỗi server khi xác nhận deposit" });
  }
};

module.exports = {
  createDeposit,
  confirmDeposit,
};
