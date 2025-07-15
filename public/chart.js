const limit = 100;
let chart, candlestickSeries;

let currentSymbol = "BTC-USD"; // Coinbase format
let currentInterval = "1h"; // Supported: 1m, 5m, 15m, 1h, 6h, 1d

const symbolInput = document.getElementById("symbol");
const intervalInput = document.getElementById("interval");
const updateButton = document.getElementById("updateChart");
const container = document.getElementById("chart-container");

// 🧠 Map interval string to Coinbase granularity in seconds
function getGranularity(interval) {
  switch (interval) {
    case "1m":
      return 60;
    case "5m":
      return 300;
    case "15m":
      return 900;
    case "1h":
      return 3600;
    case "6h":
      return 21600;
    case "1d":
      return 86400;
    default:
      return 3600;
  }
}

// 📊 Fetch candle data from Coinbase
function fetchCandlestickData(symbol, interval) {
  const granularity = getGranularity(interval);
  const end = Math.floor(Date.now() / 1000);
  const start = end - granularity * limit;

  const url = `https://api.pro.coinbase.com/products/${symbol}/candles?granularity=${granularity}&start=${start}&end=${end}`;

  return fetch(url)
    .then((res) => res.json())
    .then((data) => {
      return data
        .map((candle) => ({
          time: candle[0], // UNIX timestamp
          low: parseFloat(candle[1]),
          high: parseFloat(candle[2]),
          open: parseFloat(candle[3]),
          close: parseFloat(candle[4]),
        }))
        .reverse(); // Coinbase returns descending order
    });
}

// 📈 Initialize Lightweight Charts
function createChart(chartData) {
  chart = LightweightCharts.createChart(container, {
    width: container.clientWidth,
    height: container.clientHeight,
    layout: { backgroundColor: "#fff", textColor: "#333" },
    grid: {
      vertLines: { color: "#f0f0f0" },
      horzLines: { color: "#f0f0f0" },
    },
  });

  candlestickSeries = chart.addCandlestickSeries({
    upColor: "#26a69a",
    downColor: "#ef5350",
    wickUpColor: "#26a69a",
    wickDownColor: "#ef5350",
  });

  candlestickSeries.setData(chartData);

  window.addEventListener("resize", () => {
    chart.resize(container.clientWidth, container.clientHeight);
  });
}

// 🔄 Refresh chart with new data
function updateChart(symbol, interval) {
  fetchCandlestickData(symbol, interval)
    .then((chartData) => {
      if (!candlestickSeries) {
        createChart(chartData);
      } else {
        candlestickSeries.setData(chartData);
      }
    })
    .catch((err) => console.error("Chart update error:", err));
}

// 🕹️ User interaction
updateButton.addEventListener("click", () => {
  const symbol = symbolInput.value.trim().toUpperCase() + "-USD";
  const interval = intervalInput.value.trim();

  if (!symbol || !interval) {
    alert("Please enter both a symbol and an interval.");
    return;
  }

  currentSymbol = symbol;
  currentInterval = interval;
  updateChart(currentSymbol, currentInterval);
});

// 🚀 Initialize chart on page load
window.addEventListener("DOMContentLoaded", () => {
  updateChart(currentSymbol, currentInterval);
  setInterval(() => {
    updateChart(currentSymbol, currentInterval);
  }, 60000); // refresh every minute
});
