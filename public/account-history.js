const amountSelect = document.getElementById("amountSelect");
const amountSummary = document.getElementById("amountSummary");
const wallet = document.getElementById("wallet");
const qrcodeDiv = document.getElementById("qrcode");
const statusMessage = document.getElementById("statusMessage");
const confirmBtn = document.getElementById("confirmBtn");

async function fetchBTCPriceUSD() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
    );
    const data = await res.json();
    return data.bitcoin.usd; // Live BTC/USD price
  } catch (err) {
    console.error("Failed to fetch BTC rate:", err);
    return null;
  }
}

function generateQRCode(btcAmount) {
  const address = wallet.textContent.trim();
  const paymentURI = `bitcoin:${address}?amount=${btcAmount}`;
  qrcodeDiv.innerHTML = "";
  new QRCode(qrcodeDiv, {
    text: paymentURI,
    width: 128,
    height: 128,
  });
}

async function updateAmountSummary() {
  const usdAmount = parseFloat(amountSelect.value); // Selected USD amount
  const btcRate = await fetchBTCPriceUSD();

  if (!btcRate) {
    amountSummary.innerHTML = `⚠️ Failed to load BTC rate.`;
    return;
  }

  const btcAmount = (usdAmount / btcRate).toFixed(8); // Converted to BTC

  amountSummary.innerHTML = `
    Send <strong>${btcAmount} BTC</strong> (~$${usdAmount} USD)
    via <strong>Bitcoin Network</strong> to the wallet below:
  `;

  generateQRCode(btcAmount);
}

amountSelect.addEventListener("change", updateAmountSummary);

confirmBtn.addEventListener("click", async () => {
  statusMessage.textContent = "🔄 Verifying payment...";

  try {
    const res = await fetch("/verify-payment");
    const data = await res.json();

    statusMessage.textContent = data.success
      ? `✅ Payment confirmed! Transaction ID: ${data.tx}`
      : `❌ ${data.message}`;
  } catch (error) {
    console.error("Verification error:", error);
    statusMessage.textContent = "⚠️ Error verifying payment.";
  }
});

// Initialize on page load
updateAmountSummary();
