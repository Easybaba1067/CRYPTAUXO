let btcAmountGlobal = 0;

const amountSelect = document.getElementById("amountSelect");
const amountSummary = document.getElementById("amountSummary");
const wallet = document.getElementById("wallet");
const qrcodeDiv = document.getElementById("qrcode");
const confirmBtn = document.getElementById("confirmBtn");
const statusMessage = document.getElementById("statusMessage");

// 📦 Update summary and QR code when user selects an amount
function updateAmountSummary() {
  const selectedUSD = parseFloat(amountSelect.value);
  const btcRate = 120132; // You can inject live rate from server here
  btcAmountGlobal = parseFloat((selectedUSD / btcRate).toFixed(8));

  amountSummary.innerHTML = `Send <strong>$${selectedUSD}</strong> via <strong>Bitcoin Network</strong> to the wallet below`;
  generateQRCode(btcAmountGlobal);
}

// 📲 Generate QR code with BTC payment URI
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

// 🧠 Handle Payment Verification with backend POST
confirmBtn.addEventListener("click", async () => {
  const walletAddress = wallet.textContent.trim();
  const usdAmount = parseFloat(amountSelect.value);

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
        usd: usdAmount,
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

// 🧭 Initialize on page load
updateAmountSummary();
amountSelect.addEventListener("change", updateAmountSummary);
