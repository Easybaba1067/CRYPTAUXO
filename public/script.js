$(document).ready(function () {
  $(".bi-list").click(() => {
    $(".inner-nav").slideToggle("slow");
    $(".bi-x-lg").show("slow");
    $(".bi-list").hide("slow");
  });
  $(".bi-x-lg").click(() => {
    $(".inner-nav").slideToggle("slow");
    $(".bi-x-lg").hide("slow");
    $(".bi-list").show("slow");
  });
});
const click = document.querySelector(".about");
const contact = document.querySelector(".contact");
const plan = document.querySelector(".service");
const myLink = document.querySelectorAll(".links");
const data = document.querySelector(".live-data");
const year = document.querySelector(".year");

function scroll(element) {
  document.querySelector(element).scrollIntoView({ behavior: "smooth" });
}
const liveDataContainer = document.querySelector(".live-data");
// 🏃‍♂️ Smooth Scroll Animation
let scrollSpeed = 50;
function dataScroll() {
  liveDataContainer.scrollLeft += scrollSpeed / 60;
  requestAnimationFrame(dataScroll);
}
dataScroll();

myLink.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const id = link.getAttribute("href");
    scroll(id);
  });
});

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
  "tron",
  "avalanche-2",
  "uniswap",
  "stellar",
  "cosmos",
  "filecoin",
  "aptos",
  "tezos",
  "arbitrum",
  "near",
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

// Set dynamic copyright year
const currentYear = new Date().getFullYear();
document.querySelector(".year").textContent = currentYear;
