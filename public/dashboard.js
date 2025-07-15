// ✅ Menu toggle handlers
$(document).ready(() => {
  $(".bi-list").click(() => {
    $(".bi-x-lg").show("slow");
    $(".bi-list").hide("slow");
    $(".nav ul").show("slow");
  });

  $(".bi-x-lg").click(() => {
    $(".bi-x-lg").hide("slow");
    $(".bi-list").show("slow");
    $(".nav ul").hide("slow");
  });
});

// ✅ Transaction color styling
transactionColor.forEach((transaction) => {
  transaction.style.color =
    transaction.textContent === "withdraw" ? "red" : "#7ddd74c0";
});

// ✅ Class toggles for tab switching
function removeClass(events) {
  events.forEach((event) => event.classList.remove("active"));
}

function transferingClick(events, eventSections) {
  events.forEach((event, index) => {
    event.addEventListener("click", () => {
      removeClass(events);
      event.classList.add("active");

      eventSections.forEach((section, i) => {
        if (i === index) {
          removeClass(eventSections);
          section.classList.add("active");
        }
      });
    });
  });
}

transferingClick(heads, forms);
transferingClick(withdraw, withdrawActive);

// ✅ Auto-scroll display container
const scrollSpeed = 200;
function dataScroll() {
  data.scrollLeft += scrollSpeed / 60;
  requestAnimationFrame(dataScroll);
}
dataScroll();

// ✅ Real-time price updates using Binance WebSocket
const socket = new WebSocket("wss://stream.binance.com:9443/ws/!ticker@arr");

socket.onmessage = (event) => {
  const tickers = JSON.parse(event.data);
  dataContainer.innerHTML = ""; // Clear previous entries

  const symbolsToWatch = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT"];

  tickers.forEach((ticker) => {
    if (symbolsToWatch.includes(ticker.s)) {
      const div = document.createElement("div");
      div.className = "data";
      div.innerHTML = `
        <h4 style="color: rgb(52,241,52)">${ticker.s.replace("USDT", "")}</h4>
        <div class="data-flex">
          <h2 style="color: red">$${parseFloat(ticker.c).toFixed(2)}</h2>
        </div>
      `;
      dataContainer.appendChild(div);
    }
  });
};

// ✅ Update account balance value in USD
function updateBalanceDisplay(priceMap) {
  const rawBTC = document.getElementById("account-balance").textContent.trim();
  const btcAmount = parseFloat(rawBTC.replace(/[^\d.]/g, ""));

  if (priceMap["BTCUSDT"]) {
    const usdAmount = btcAmount * priceMap["BTCUSDT"];
    document.getElementById("balance").textContent = `$${usdAmount.toFixed(2)}`;
  }
}

// Optional: maintain latest prices in memory for balance updating
let latestPrices = {};
socket.onmessage = (event) => {
  const tickers = JSON.parse(event.data);
  latestPrices = {}; // reset

  const symbolsToWatch = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT"];
  dataContainer.innerHTML = "";

  tickers.forEach((ticker) => {
    if (symbolsToWatch.includes(ticker.s)) {
      latestPrices[ticker.s] = parseFloat(ticker.c);

      const div = document.createElement("div");
      div.className = "data";
      div.innerHTML = `
        <h4 style="color: rgb(52,241,52)">${ticker.s.replace("USDT", "")}</h4>
        <div class="data-flex">
          <h2 style="color: red">$${parseFloat(ticker.c).toFixed(2)}</h2>
        </div>
      `;
      dataContainer.appendChild(div);
    }
  });

  // Update BTC-based balance
  updateBalanceDisplay(latestPrices);
};
