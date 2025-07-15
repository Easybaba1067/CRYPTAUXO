<script>
  const amountSelect = document.getElementById("amountSelect");
  const amountSummary = document.getElementById("amountSummary");
  const wallet = document.getElementById("wallet");
  const qrcodeDiv = document.getElementById("qrcode");
  const statusMessage = document.getElementById("statusMessage");
  const confirmBtn = document.getElementById("confirmBtn");

  // 🪙 Fetch live BTC price from CoinGecko
  async function fetchBTCPriceUSD() {
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
      );
      const data = await res.json();
      return data.bitcoin.usd; // ✅ Clean BTC/USD value
    } catch (err) {
      console.error("⚠️ CoinGecko fetch error:", err);
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

  // 🔄 Update display based on selected USD amount
  async function updateAmountSummary() {
    const usdAmount = parseFloat(amountSelect.value);
    const btcRate = await fetchBTCPriceUSD();

    if (!btcRate) {
      amountSummary.innerHTML = `⚠️ Failed to load BTC rate.`;
      return;
    }

    const btcAmount = (usdAmount / btcRate).toFixed(8);

    amountSummary.innerHTML = `
      Send <strong>${btcAmount} BTC</strong> (~$${usdAmount} USD)
      via <strong>Bitcoin Network</strong> to the wallet below:
    `;

    generateQRCode(btcAmount);
  }

  // 🧠 Handle Payment Verification
  confirmBtn.addEventListener("click", async () => {
    statusMessage.textContent = "🔄 Verifying payment...";
    confirmBtn.disabled = true;

    try {
      const res = await fetch("/verify-payment");
      const data = await res.json();

      statusMessage.textContent = data.success
        ? `✅ Payment confirmed! Transaction ID: ${data.tx}`
        : `❌ ${data.message}`;
    } catch (error) {
      console.error("Verification error:", error);
      statusMessage.textContent = "⚠️ Error verifying payment.";
    } finally {
      confirmBtn.disabled = false;
    }
  });

  // 🚀 Initialize summary on load
  updateAmountSummary();
  amountSelect.addEventListener("change", updateAmountSummary);
</script>