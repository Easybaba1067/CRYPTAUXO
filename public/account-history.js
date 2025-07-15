const amountSelect = document.getElementById("amountSelect");
const amountSummary = document.getElementById("amountSummary");
const wallet = document.getElementById("wallet");
const qrcodeDiv = document.getElementById("qrcode");
const statusMessage = document.getElementById("statusMessage");
const confirmBtn = document.getElementById("confirmBtn");

let btcAmountGlobal = 0; // store BTC amount for later use
// 🪙 Fetch live BTC price from Binance
async function fetchBTCPriceUSD() {
  try {
    const res = await fetch(
      "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT"
    );
    const data = await res.json();
    return parseFloat(data.price); // Binance returns a string—parse it to float
  } catch (err) {
    console.error("⚠️ Binance fetch error:", err);
    return null;
  }
}

// 📲 Generate Bitcoin Payment QR Code
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

// 🔄 Update display and store amount
async function updateAmountSummary() {
  const usdAmount = parseFloat(amountSelect.value);
  const btcRate = await fetchBTCPriceUSD();

  if (!btcRate) {
    amountSummary.innerHTML = `⚠️ Failed to load BTC rate.`;
    return;
  }

  const btcAmount = (usdAmount / btcRate).toFixed(8);
  btcAmountGlobal = btcAmount; // store for verification

  amountSummary.innerHTML = `
    Send <strong>${btcAmount} BTC</strong> (~$${usdAmount} USD)
    via <strong>Bitcoin Network</strong> to the wallet below:
  `;

  generateQRCode(btcAmount);
}

// 🧠 Handle Payment Verification (with POST body)
confirmBtn.addEventListener("click", async () => {
  const walletAddress = wallet.textContent.trim();

  statusMessage.textContent = "🔄 Verifying payment...";
  confirmBtn.disabled = true;

  try {
    const res = await fetch("/verify-payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        wallet: walletAddress,
        amount: btcAmountGlobal,
        currency: "BTC",
        network: "binance",
      }),
    });

    const data = await res.json();

    statusMessage.textContent = data.success
      ? `✅ Payment confirmed! TX: ${data.tx || "Details received"}`
      : `❌ ${data.message || "Verification failed."}`;
  } catch (error) {
    console.error("Verification error:", error);
    statusMessage.textContent = "⚠️ Error verifying payment.";
  } finally {
    confirmBtn.disabled = false;
  }
});

// 🚀 Start on load
updateAmountSummary();
amountSelect.addEventListener("change", updateAmountSummary);
