const apiUrl = "https://api.binance.com/api/v3/klines";
const limit = 100;

let chart, candlestickSeries;
let currentSymbol = "BTCUSDT";
let currentInterval = "5m";

const symbolInput = document.getElementById("symbol");
const intervalInput = document.getElementById("interval");
const updateButton = document.getElementById("updateChart");
const container = document.getElementById("chart-container");

function fetchCandlestickData(symbol, interval) {
  return fetch(`${apiUrl}?symbol=${symbol}&interval=${interval}&limit=${limit}`)
    .then((res) => res.json())
    .then((data) =>
      data.map((candle) => ({
        time: candle[0] / 1000,
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
      }))
    );
}

function createChart(chartData) {
  chart = LightweightCharts.createChart(container, {
    width: container.clientWidth,
    height: container.clientHeight,
    layout: { backgroundColor: "#ffffff", textColor: "#333333" },
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

updateButton.addEventListener("click", () => {
  const symbol = symbolInput.value.toUpperCase().trim();
  const interval = intervalInput.value.trim();

  if (!symbol || !interval) {
    alert("Please enter both a symbol and an interval.");
    return;
  }

  currentSymbol = symbol;
  currentInterval = interval;
  updateChart(currentSymbol, currentInterval);
});

window.addEventListener("DOMContentLoaded", () => {
  updateChart(currentSymbol, currentInterval);

  setInterval(() => {
    updateChart(currentSymbol, currentInterval);
  }, 1000); // Update chart every second
});
