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

const transactionColor = document.querySelectorAll(".transaction-color");

const heads = document.querySelectorAll(".tab-head");

const forms = document.querySelectorAll(".tab-content");

const withdraw = document.querySelectorAll(".withdraw-tab");

const withdrawActive = document.querySelectorAll(".withdraw-form");

transactionColor.forEach((transaction) => {
  transaction.style.color =
    transaction.textContent === "withdraw" ? "red" : "#7ddd74c0";
});

// ✅ Class toggles
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

// 🧠 DOM Elements
const dataContainer = document.querySelector(".live-data");

// 🏃‍♂️ Smooth Scroll Animation (optimized)
let scrollSpeed = 50; // Adjust speed to taste
function dataScroll() {
  dataContainer.scrollLeft += scrollSpeed / 60;
  requestAnimationFrame(dataScroll);
}
dataScroll();

// Create WebSocket connection.
const coinIds = [
  "bitcoin",
  "ethereum",
  "binancecoin",
  "solana",
  "ripple",
  "cardano",
  "dogecoin",
  "polygon",
  "polkadot",
  "internet-computer",
];

const container = document.querySelector(".live-data");

async function simulateCoinGeckoStream() {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds.join(
        ","
      )}&vs_currencies=usd`
    );
    const data = await res.json();

    const timestamp = new Date().toLocaleTimeString();

    // Clear old entries
    container.innerHTML = "";

    for (const [id, info] of Object.entries(data)) {
      const div = document.createElement("div");
      div.className = "data";
      div.innerHTML = `
          <h4 style="color: rgb(52, 241, 52); margin-bottom: 0;">${id.toUpperCase()}</h4>
          <div class="data-flex">
            <h2 style="color: red; margin: 0;">$${info.usd}</h2>
            <p style="margin: 0; font-size: 12px;">${timestamp}</p>
          </div>
        `;
      container.appendChild(div);
    }
  } catch (err) {
    console.error("CoinGecko fetch error:", err.message);
  }
}

// Run every 5 seconds like a streaming simulation
setInterval(simulateCoinGeckoStream, 5000);
simulateCoinGeckoStream(); // Initial call
// // 🌐 CoinCap WebSocket Setup
// const socket = new WebSocket(
//   "wss://ws.coincap.io/prices?assets=bitcoin,ethereum,litecoin"
// );

// const dataContainer = document.querySelector(".live-data"); // Make sure this exists in HTML
// let latestPrices = {};
// let updateTimeout;

// socket.onmessage = (event) => {
//   const priceData = JSON.parse(event.data);

//   // Merge new prices into latestPrices
//   Object.keys(priceData).forEach((symbol) => {
//     const symbolUpper = symbol.toUpperCase();
//     latestPrices[symbolUpper + "-USD"] = parseFloat(priceData[symbol]);
//   });

//   // 🔁 Throttled DOM update
//   clearTimeout(updateTimeout);
//   updateTimeout = setTimeout(() => {
//     dataContainer.innerHTML = ""; // Clear old entries

//     Object.keys(latestPrices).forEach((symbol) => {
//       const div = document.createElement("div");
//       div.className = "data";
//       div.style.display = "inline-block";
//       div.style.marginRight = "20px";
//       div.innerHTML = `
//         <h4 style="color: rgb(52,241,52)">${symbol.replace("-USD", "")}</h4>
//         <div class="data-flex">
//           <h2 style="color: red">$${latestPrices[symbol].toFixed(2)}</h2>
//         </div>
//       `;
//       dataContainer.appendChild(div);
//     });

//     // ✅ Optional: update account balance display
//     updateBalanceDisplay(latestPrices);
//   }, 100);
// };

// // ♻️ Reconnect if closed
// socket.onclose = () => {
//   console.warn("WebSocket closed. Reconnecting...");
//   setTimeout(() => window.location.reload(), 3000);
// };

// socket.onerror = (error) => {
//   console.error("WebSocket error:", error);
// };
// ✅ Update BTC balance in USD
function updateBalanceDisplay(priceMap) {
  const rawBTC = document.getElementById("account-balance").textContent.trim();
  const btcAmount = parseFloat(rawBTC.replace(/[^\d.]/g, ""));

  if (priceMap["BTC-USD"]) {
    const usdAmount = btcAmount * priceMap["BTC-USD"];
    const usdValueEl = document.getElementById("usd-value");
    if (usdValueEl) {
      usdValueEl.textContent = usdAmount.toFixed(2);
    }
  }
}
