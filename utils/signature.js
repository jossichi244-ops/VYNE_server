// ✅ utils/signature.js
const { verifyMessage } = require("ethers");

function verifyEthereumSignature(walletAddress, message, signature) {
  try {
    // Khôi phục địa chỉ ví từ chữ ký
    const recovered = verifyMessage(message, signature);

    console.log("🔹 Recovered address:", recovered);
    console.log("🔹 Expected address:", walletAddress);

    // So sánh (không phân biệt hoa thường)
    return recovered.toLowerCase() === walletAddress.toLowerCase();
  } catch (err) {
    console.error("❌ verifyEthereumSignature error:", err);
    return false;
  }
}

module.exports = { verifyEthereumSignature };
