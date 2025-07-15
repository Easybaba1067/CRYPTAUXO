const crypto = require("crypto");
const axios = require("axios");
const User = require("../models/User");

async function verifyPayment(userId) {
  const timestamp = Date.now();
  const query = `timestamp=${timestamp}`;
  const signature = crypto
    .createHmac("sha256", process.env.BINANCE_API_SECRET)
    .update(query)
    .digest("hex");

  try {
    const response = await axios.get(
      `https://api.binance.com/sapi/v1/capital/deposit/hisrec?${query}&signature=${signature}`,
      {
        headers: { "X-MBX-APIKEY": process.env.BINANCE_API_KEY }
      }
    );

    const deposits = response.data;
    const confirmed = deposits.find(dep => dep.status === 1 && dep.asset === "BTC");

    if (confirmed) {
      await User.updateOne(
        { _id: userId, "transactions.orderId": confirmed.txId },
        {
          $set: {
            "transactions.$.status": "confirmed",
            "transactions.$.txId": confirmed.txId,
            "transactions.$.confirmedAt": new Date()
          }
        }
      );

      return { success: true, tx: confirmed.txId };
    }

    return { success: false, message: "No confirmed BTC deposit found" };
  } catch (err) {
    console.error("Verification error:", err);
    return { success: false, message: "Verification failed" };
  }
}

module.exports = verifyPayment;