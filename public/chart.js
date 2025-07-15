const apiUrl = "https://api.coingecko.com/api/v3/coins";
const limit = 100;

let chart, candlestickSeries;
let currentSymbol = "bitcoin"; // CoinGecko ID
let currentInterval = "hourly"; // accepted: "daily", "hourly"

const symbolInput = document.getElementById("symbol");
const intervalInput = document.getElementById("interval");
const updateButton = document.getElementById("updateChart");
const container = document.getElementById("chart-container");

function fetchCandlestickData(coinId, interval) {
  return fetch(
    `${apiUrl}/${coinId}/market_chart?vs_currency=usd&days=1&interval=${interval}`
  )
    .then((res) => res.json())
    .then((data) => {
      // CoinGecko returns [timestamp, price]
      const prices = data.prices.slice(-limit);

      const chartData = prices.map((point, i, arr) => {
        const time = Math.floor(point[0] / 1000);
        const open = i > 0 ? arr[i - 1][1] : point[1];
        const close = point[1];
        const high = Math.max(open, close);
        const low = Math.min(open, close);

        return { time, open, high, low, close };
      });

      return chartData;
    });
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
  const symbol = symbolInput.value.trim().toLowerCase(); // lowercase for CoinGecko
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
  }, 60000); // Update chart every minute (CoinGecko cache limit)
});
