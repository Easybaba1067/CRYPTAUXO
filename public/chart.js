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

const limit = 100;
let chart, candlestickSeries;

let currentSymbol = "BTC";
let currentComparisonSymbol = "USD";
let currentInterval = "1h";

const symbolInput = document.getElementById("symbol");
const intervalInput = document.getElementById("interval");
const updateButton = document.getElementById("updateChart");
const chartContainer = document.getElementById("chart-container");

const apiKey =
  "94f4487b2d7dec3fb6d0e3607ff4b8428af176fd5d7863c0d157226ad07345f7";

// 🧠 Map interval to CryptoCompare endpoints
function getEndpoint(interval) {
  switch (interval) {
    case "1m":
      return "histominute";
    case "1h":
      return "histohour";
    case "1d":
      return "histoday";
    default:
      return "histohour"; // fallback
  }
}

// 📡 Fetch candlestick data
function fetchCandlestickData(symbol, comparisonSymbol, intervalType) {
  const endpoint = getEndpoint(intervalType);
  const url = `https://min-api.cryptocompare.com/data/${endpoint}?fsym=${symbol.toUpperCase()}&tsym=${comparisonSymbol}&limit=${limit}&api_key=${apiKey}`;

  return fetch(url)
    .then((res) => res.json())
    .then((data) => {
      if (!data || data.Response === "Error" || !Array.isArray(data.Data)) {
        throw new Error(data.Message || "Invalid CryptoCompare response");
      }

      return data.Data.map((candle) => ({
        time: candle.time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      }));
    });
}

// 📊 Create chart instance
function createChart(chartData) {
  chart = LightweightCharts.createChart(chartContainer, {
    width: chartContainer.clientWidth,
    height: chartContainer.clientHeight,
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
    wickUpColor: "#26a69a",
    wickDownColor: "#ef5350",
  });

  candlestickSeries.setData(chartData);

  window.addEventListener("resize", () => {
    chart.resize(chartContainer.clientWidth, chartContainer.clientHeight);
  });
}

// 🔄 Refresh chart safely
function updateChart(symbol, comparisonSymbol, intervalType) {
  fetchCandlestickData(symbol, comparisonSymbol, intervalType)
    .then((chartData) => {
      // If a chart already exists, remove it completely and redraw
      if (chart) {
        chart.remove();
        chart = null;
        candlestickSeries = null;
      }

      createChart(chartData);
    })
    .catch((err) => {
      console.error("Error updating chart:", err);
      chartContainer.innerHTML = `<p style="color:red; text-align:center;">Failed to load chart data</p>`;
    });
}

// 🕹️ Handle user input
updateButton.addEventListener("click", () => {
  const symbol = symbolInput.value.trim().toUpperCase();
  const interval = intervalInput.value.trim();

  if (!symbol || !interval) {
    alert("Please enter both a symbol and interval.");
    return;
  }

  currentSymbol = symbol;
  currentInterval = interval;
  updateChart(currentSymbol, currentComparisonSymbol, currentInterval);
});

// 🚀 Initialize chart on load
window.addEventListener("DOMContentLoaded", () => {
  updateChart(currentSymbol, currentComparisonSymbol, currentInterval);
  setInterval(() => {
    updateChart(currentSymbol, currentComparisonSymbol, currentInterval);
  }, 60000); // auto-refresh every minute
});
