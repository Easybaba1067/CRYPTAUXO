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

// ✅ Transaction styling
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
const liveDataContainer = document.querySelector(".live-data");

// 🏃‍♂️ Smooth Scroll Animation
let scrollSpeed = 50;
function dataScroll() {
  liveDataContainer.scrollLeft += scrollSpeed / 60;
  requestAnimationFrame(dataScroll);
}
dataScroll();

// 📡 CoinGecko Streaming Simulation
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

async function simulateCoinGeckoStream() {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds.join(
        ","
      )}&vs_currencies=usd`
    );
    const data = await res.json();
    const timestamp = new Date().toLocaleTimeString();

    liveDataContainer.innerHTML = "";

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
      liveDataContainer.appendChild(div);
    }
  } catch (err) {
    console.error("CoinGecko fetch error:", err.message);
  }
}
setInterval(simulateCoinGeckoStream, 5000);
simulateCoinGeckoStream();
