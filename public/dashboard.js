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

setInterval(() => {
  const rawBTC = document.getElementById("account-balance").textContent.trim();
  const btcAmount = parseFloat(rawBTC.replace(/[^\d.]/g, ""));

  // ✅ Pull BTC price from CoinGecko
  fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
  )
    .then((response) => response.json())
    .then((data) => {
      const btcPrice = data.bitcoin.usd;
      const usdAmount = btcAmount * btcPrice;

      document.getElementById("balance").textContent = `$${usdAmount.toFixed(
        2
      )}`;
    })
    .catch((error) => console.error("CoinGecko fetch error:", error));
}, 10000); // Updates every 10 seconds
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
setInterval(async () => {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,solana&vs_currencies=usd"
    );
    const data = await res.json();

    for (const [id, info] of Object.entries(data)) {
      const div = document.createElement("div");
      div.className = "data";
      div.innerHTML = `
        <h4 style="color: rgb(52,241,52)">${id.toUpperCase()}</h4>
        <div class="data-flex">
          <h2 style="color: red">$${info.usd}</h2>
        </div>
      `;
      dataContainer.appendChild(div); // Assuming `dataContainer` is your wrapper
    }
  } catch (err) {
    console.error("CoinGecko polling error:", err);
  }
}, 5000); // Poll every 5 seconds
