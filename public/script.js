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

function scroll(element) {
  document.querySelector(element).scrollIntoView({ behavior: "smooth" });
}

myLink.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const id = link.getAttribute("href");
    scroll(id);
  });
});
const scrollSpead = 200;
function dataScroll() {
  data.scrollLeft += scrollSpead / 60;
  requestAnimationFrame(dataScroll);
}
dataScroll();

// Create WebSocket connection.
var socket = new WebSocket(
  "wss://stream.binance.com:9443/stream?streams=btcusdt@trade/ethusdt@trade/bnbusdt@trade/solusdt@trade/xrpusdt@trade/adausdt@trade/dogeusdt@trade/maticusdt@trade/dotusdt@trade/itcusdt@trade"
);
// Listen for messages
socket.addEventListener("message", (event) => {
  raw = JSON.parse(event.data);
  output = raw.data;
  // console.log(output);

  // // parent div
  const div = document.createElement("div");
  div.className = "data";
  div.innerHTML = `<h4 style="color:  rgb(52, 241, 52)">${output.s}</h4>`;

  // // nested div
  const dataFlex = document.createElement("div");
  dataFlex.className = "data-flex";
  dataFlex.innerHTML = `<h2 style="color: red">${output.t}</h2><p>$${output.p}</p>`;

  // append
  div.appendChild(dataFlex);
  data.appendChild(div);
});
