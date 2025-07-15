const apiUrl = "https://api.binance.com/api/v3/klines";
const limit = 100;

let chart, candlestickSeries;
let currentSymbol = "BTCUSDT"; // Binance symbol format
let currentInterval = "1h"; // Binance intervals: 1m, 5m, 1h, 1d etc.

const symbolInput = document.getElementById("symbol");
const intervalInput = document.getElementById("interval");
const updateButton = document.getElementById("updateChart");
const container = document.getElementById("chart-container");

// 🧠 Fetch and format Binance candlestick data
function fetchCandlestickData(symbol, interval) {
  const url = `${apiUrl}?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`;

  return fetch(url)
    .then((res) => res.json())
    .then((data) => {
      // Binance returns: [open time, open, high, low, close, ...]
      const chartData = data.map((candle) => ({
        time: Math.floor(candle[0] / 1000), // convert to UNIX
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
      }));

      return chartData;
    });
}

// 📊 Initialize TradingView-style chart
function createChart(chartData) {
  chart = LightweightCharts.createChart(container, {
    width: container.clientWidth,
    height: container.clientHeight,
    layout: {
      backgroundColor: "#ffffff",
      textColor: "#333333",
    },
    grid: {
      vertLines: { color: "#f0f0f0" },
      horzLines: { color: "#f0f0f0" },
    },
  });

  candlestickSeries = chart.addCandlestickSeries({
    upColor: "#26a69a",
    downColor: "#ef5350",
    borderVisible: false,
    wickUpColor: "#26a69a",
    wickDownColor: "#ef5350",
  });

  candlestickSeries.setData(chartData);

  window.addEventListener("resize", () => {
    chart.resize(container.clientWidth, container.clientHeight);
  });
}

// 🔄 Update chart with new data
function updateChart(symbol, interval) {
  fetchCandlestickData(symbol, interval)
    .then((chartData) => {
      if (!candlestickSeries) {
        createChart(chartData);
      } else {
        candlestickSeries.setData(chartData);
      }
    })
    .catch((err) => console.error("Error updating chart:", err));
}

// 🕹️ Bind update events
updateButton.addEventListener("click", () => {
  const symbol = symbolInput.value.trim().toUpperCase();
  const interval = intervalInput.value.trim();

  if (!symbol || !interval) {
    alert("Please enter both a symbol and an interval.");
    return;
  }

  currentSymbol = symbol;
  currentInterval = interval;
  updateChart(currentSymbol, currentInterval);
});

// 🚀 Load chart on page load
window.addEventListener("DOMContentLoaded", () => {
  updateChart(currentSymbol, currentInterval);

  // refresh every minute
  setInterval(() => {
    updateChart(currentSymbol, currentInterval);
  }, 60000);
});
