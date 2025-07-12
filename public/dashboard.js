// JQuery
$(document).ready(function () {
  $(".bi-list").click(() => {
    $(".bi-x-lg").show("slow");
    $(".bi-list").hide("slow");
    $(".nav ul").show("slow");
  });
});
$(".bi-x-lg").click(() => {
  $(".bi-x-lg").hide("slow");
  $(".bi-list").show("slow");
  $(".nav ul").hide("slow");
});

//btc increament
window.addEventListener("DOMContentLoaded", function () {
  // Get fiat amount from #balance
  const rawAmount = document.getElementById("balance").textContent.trim();
  const fiatAmount = parseFloat(rawAmount.replace(/[^\d.]/g, ""));

  // Fetch BTC price from Binance
  fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT")
    .then((response) => response.json())
    .then((data) => {
      const btcPrice = parseFloat(data.price);
      const fiatAmount = parseFloat(
        document.getElementById("balance").textContent.replace(/[^\d.]/g, "")
      );
      const btcAmount = fiatAmount / btcPrice;
      document.getElementById(
        "account-balance"
      ).textContent = `${btcAmount.toFixed(8)} BTC`;
    })
    .catch((error) => console.error("Fetch error:", error));
});
const transactionColor = document.querySelectorAll(".transaction-color");
const heads = document.querySelectorAll(".head");
const forms = document.querySelectorAll(".form-active");
const withdraw = document.querySelectorAll(".head-withdraw");
const withdrawActive = document.querySelectorAll(".withdraw-active");
const data = document.querySelector(".live-data");

// Account transaction color type

transactionColor.forEach((transaction) => {
  if (transaction.textContent === "withdraw") {
    transaction.style.color = "red";
  } else {
    transaction.style.color = "#7ddd74c0";
  }
});
function removeClass(events) {
  events.forEach((event) => {
    event.classList.remove("active");
  });
}
function transferingClick(events, eventSecounds) {
  events.forEach((event, index) => {
    event.addEventListener("click", () => {
      removeClass(events);
      event.classList.add("active");
      eventSecounds.forEach((secound, i) => {
        if (index === i) {
          removeClass(eventSecounds);
          secound.classList.add("active");
        }
      });
    });
  });
}
transferingClick(heads, forms);
transferingClick(withdraw, withdrawActive);

const scrollSpead = 200;
function dataScroll() {
  data.scrollLeft += scrollSpead / 60;
  requestAnimationFrame(dataScroll);
}
dataScroll();

// Create WebSocket connection.
var socket = new WebSocket(
  "wss://stream.binance.com:9443/stream?streams=btcusdt@trade/ethusdt@trade/bnbusdt@trade/solusdt@trade"
);
// Listen for messages
socket.addEventListener("message", (event) => {
  raw = JSON.parse(event.data);
  output = raw.data;

  // // parent div
  const div = document.createElement("div");
  div.className = "data";
  div.innerHTML = `<h4 style="color:  rgb(52, 241, 52)">${output.s}</h4>`;

  // // nested div
  const dataFlex = document.createElement("div");
  dataFlex.className = "data-flex";
  dataFlex.innerHTML = `<h2 style="color: red">${output.q}</h2><p>$${output.p}</p>`;

  // append
  div.appendChild(dataFlex);
  data.appendChild(div);
});
