const MultiPartyContract = require("../models/multi_party_contracts.js");
const TransportOrder = require("../models/TransportOrder.js");

/**
 * GET ALL CONTRACTS
 */
exports.getAllContracts = async (req, res) => {
  try {
    const contracts = await MultiPartyContract.find({});
    res.json({ success: true, data: contracts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET CONTRACT BY ID
 */
exports.getContractById = async (req, res) => {
  try {
    const contract = await MultiPartyContract.findById(req.params.id);

    if (!contract) {
      return res
        .status(404)
        .json({ success: false, message: "Contract not found" });
    }

    res.json({ success: true, data: contract });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * CREATE CONTRACT FROM TRANSPORT ORDER (status = paid)
 * Sử dụng được model TransportOrder bạn cung cấp.
 */
exports.createContractFromOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    // lấy order
    const order = await TransportOrder.findOne({
      _id: orderId,
      status: "paid",
    });

    if (!order) {
      return res.status(400).json({
        success: false,
        message: "Order không tồn tại hoặc chưa thanh toán",
      });
    }

    // tạo contract id + ref
    const contractId = `CONTRACT-${order._id}`;
    const contractRef = `CT-${new Date()
      .toISOString()
      .replace(/[-:.TZ]/g, "")}`;

    // tạo document hợp đồng
    const contractData = {
      _id: contractId,
      contract_ref: contractRef,
      order_ref: order._id.toString(),
      parties: [
        {
          role: "buyer",
          wallet: order.from_wallet,
          signed: false,
        },
        {
          role: "seller",
          wallet: order.to_wallet,
          signed: false,
        },
        {
          role: "carrier",
          wallet: order.to_wallet, // nếu có carrier_wallet thì thay thế
          signed: false,
        },
      ],
      status: "pending_signatures",

      contract_terms: {
        delivery_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // tạm thời
        delivery_proof_required: true,
        payment_release_condition: "proof_of_delivery",
        penalty_rate: 0.05,
      },

      created_at: new Date(),
      updated_at: new Date(),
    };

    const newContract = await MultiPartyContract.create(contractData);

    res.json({ success: true, data: newContract });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Contract đã tồn tại",
      });
    }

    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * SIGN CONTRACT BY A PARTY (MetaMask signer)
 */
exports.signContract = async (req, res) => {
  try {
    const { contractId } = req.params;
    const { wallet } = req.body;

    if (!wallet) {
      return res.status(400).json({
        success: false,
        message: "Cần cung cấp địa chỉ ví.",
      });
    }

    const contract = await MultiPartyContract.findById(contractId);

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: "Contract không tồn tại.",
      });
    }

    // tìm party dựa vào wallet
    const party = contract.parties.find(
      (p) => p.wallet.toLowerCase() === wallet.toLowerCase()
    );

    if (!party) {
      return res.status(403).json({
        success: false,
        message: "Ví này không thuộc danh sách parties.",
      });
    }

    if (party.signed) {
      return res.status(400).json({
        success: false,
        message: "Bên này đã ký rồi.",
      });
    }

    // cập nhật đã ký
    party.signed = true;
    contract.updated_at = new Date();

    // check nếu tất cả đã ký → active
    const allSigned = contract.parties.every((p) => p.signed === true);
    if (allSigned) {
      contract.status = "active";
      contract.activated_at = new Date();
    }

    await contract.save();

    res.json({
      success: true,
      message: allSigned
        ? "Tất cả đã ký, hợp đồng kích hoạt."
        : "Ký thành công.",
      data: contract,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * UPDATE STATUS (admin or system)
 */
exports.updateStatus = async (req, res) => {
  try {
    const { contractId } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "pending_signatures",
      "active",
      "in_transit",
      "delivered",
      "disputed",
      "completed",
      "cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Status không hợp lệ." });
    }

    const updated = await MultiPartyContract.findByIdAndUpdate(
      contractId,
      { status, updated_at: new Date() },
      { new: true }
    );

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Contract không tồn tại" });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
