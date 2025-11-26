const { ethers } = require("ethers");

/**
 * Xác minh chữ ký Ethereum
 * @param {string} walletAddress - Ví người dùng (0x...)
 * @param {string} message - Nội dung đã ký
 * @param {string} signature - Chữ ký ký bằng personal_sign
 * @returns {boolean}
 */
function verifyEthereumSignature(walletAddress, message, signature) {
  try {
    if (!walletAddress || !message || !signature) return false;

    // Lấy ví từ chữ ký + message
    const recoveredAddress = ethers.verifyMessage(message, signature);

    // So sánh
    return recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
  } catch (err) {
    console.error("❌ verifyEthereumSignature error:", err);
    return false;
  }
}

module.exports = { verifyEthereumSignature };
