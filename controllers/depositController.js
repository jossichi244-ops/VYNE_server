const DepositTransaction = require("../models/deposit_transactions");
const TransportOrder = require("../models/TransportOrder");

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

    // Update deposit
    deposit.status = "confirmed";
    deposit.confirmed_at = new Date();
    await deposit.save();

    // Update order status mà không validate toàn bộ document
    const updatedOrder = await TransportOrder.findOneAndUpdate(
      { order_ref: deposit.order_ref },
      { status: "paid", updated_at: new Date() },
      { new: true } // trả về document mới
    );

    if (!updatedOrder)
      return res.status(404).json({ error: "Order liên quan không tồn tại" });

    res.json({
      message: "Deposit confirmed và order status updated nếu cần",
      deposit,
      order: updatedOrder,
    });
  } catch (err) {
    console.error("Confirm Deposit Error:", err);
    res.status(500).json({ error: "Lỗi server khi xác nhận deposit" });
  }
};

const createDeposit = async (req, res) => {
  try {
    const { order_ref, buyer_wallet, amount_token, token_address, tx_hash } =
      req.body;
    console.log("REQ.BODY:", req.body);
    const depositRef = `DEP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newDeposit = new DepositTransaction({
      deposit_ref: depositRef,
      order_ref,
      buyer_wallet,
      amount_token,
      token_address,
      tx_hash,
      status: "pending",
      created_at: new Date(),
      updated_at: new Date(),
    });

    await newDeposit.save();

    res.status(201).json({ message: "Deposit created", deposit: newDeposit });
  } catch (err) {
    console.error("Create Deposit Error:", err);
    res.status(500).json({ error: "Lỗi server khi tạo deposit" });
  }
};

module.exports = {
  createDeposit,
  confirmDeposit,
};
