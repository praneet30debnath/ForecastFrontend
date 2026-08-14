import { useState } from "react";
import StockChart from "./components/StockChart";
import AttentionPane from "./components/AttentionPane";
import { fetchForecast } from "./api";

const formatPrice = (v) =>
  `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const formatDateLong = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const RANGES = [
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "6M", days: 180 },
  { label: "1Y", days: 365 },
];
const DEFAULT_RANGE_DAYS = 90;

function App() {
  const [symbolInput, setSymbolInput] = useState("");
  const [activeSymbol, setActiveSymbol] = useState("");
  const [historyDays, setHistoryDays] = useState(DEFAULT_RANGE_DAYS);
  const [status, setStatus] = useState("idle"); // idle | loading | error | done
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [showTable, setShowTable] = useState(false);

  async function runForecast(symbol, days) {
    setStatus("loading");
    setError("");
    try {
      const result = await fetchForecast(symbol, { historyDays: days });
      setData(result);
      setActiveSymbol(symbol);
      setStatus("done");
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    const symbol = symbolInput.trim();
    if (!symbol) return;
    runForecast(symbol, historyDays);
  }

  function handleRangeChange(days) {
    setHistoryDays(days);
    if (activeSymbol) runForecast(activeSymbol, days);
  }

  const isRefetching = status === "loading" && data != null;

  return (
    <>
      <header className="page-header">
        <h1>NSE Stock Forecast</h1>
        <p>Enter an NSE ticker to see its recent trend and a projected forecast.</p>
      </header>

      <form className="search-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={symbolInput}
          onChange={(e) => setSymbolInput(e.target.value)}
          placeholder="e.g. TCS, INFY, SEDEMAC"
          autoCapitalize="characters"
          disabled={status === "loading"}
        />
        <button type="submit" disabled={status === "loading" || !symbolInput.trim()}>
          {status === "loading" ? "Forecasting…" : "Forecast"}
        </button>
      </form>
      <p className="hint">Data from NSE via Yahoo Finance. Forecast is model-generated, not investment advice.</p>

      <details className="explainer">
        <summary>How this forecast is made</summary>
        <p>
          Kronos is a transformer model trained on historical candlestick (OHLCV) patterns
          across many stocks. It looks at up to the last 512 trading days plus calendar
          signals (day of week, month) and autoregressively predicts one plausible future
          price path — it does not know about news, fundamentals, or company events, and a
          different run can produce a different path. The panel under the chart below shows
          which historical days it leaned on most for this particular forecast.
        </p>
      </details>

      {status === "error" && (
        <div className="status-banner error" role="alert">
          {error}
        </div>
      )}

      {status === "loading" && !data && (
        <div className="empty-state">Forecasting…</div>
      )}

      {data && (
        <div className={`card${isRefetching ? " is-refetching" : ""}`}>
          <div className="stat-row">
            <span className="symbol">{data.symbol}</span>
            <span className="price">{formatPrice(data.last_close)}</span>
            <span className="as-of">as of {formatDateLong(data.last_date)}</span>
          </div>

          <div className="range-row">
            {RANGES.map((r) => (
              <button
                key={r.label}
                type="button"
                className={`range-pill${historyDays === r.days ? " active" : ""}`}
                onClick={() => handleRangeChange(r.days)}
                disabled={status === "loading"}
              >
                {r.label}
              </button>
            ))}
          </div>

          <StockChart
            historical={data.historical}
            forecast={data.forecast}
            lastDate={data.last_date}
          />

          {data.explanation && (
            <div className="why-callout">
              <h3>Why this forecast?</h3>
              <p>{data.explanation.summary}</p>
              <AttentionPane attention={data.explanation.attention} />
            </div>
          )}

          <button
            type="button"
            className="table-toggle"
            onClick={() => setShowTable((v) => !v)}
          >
            {showTable ? "Hide data table" : "View as table"}
          </button>

          {showTable && (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Open</th>
                    <th>High</th>
                    <th>Low</th>
                    <th>Close</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data.historical.map((d) => ({ ...d, forecast: false })),
                    ...data.forecast.map((d) => ({ ...d, forecast: true }))].map((d) => (
                    <tr key={d.date}>
                      <td>
                        {formatDateLong(d.date)}
                        {d.forecast ? " (forecast)" : ""}
                      </td>
                      <td className={d.forecast ? "segment-forecast" : ""}>{d.open.toFixed(2)}</td>
                      <td className={d.forecast ? "segment-forecast" : ""}>{d.high.toFixed(2)}</td>
                      <td className={d.forecast ? "segment-forecast" : ""}>{d.low.toFixed(2)}</td>
                      <td className={d.forecast ? "segment-forecast" : ""}>{d.close.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {status === "idle" && !data && (
        <div className="empty-state">Enter a symbol above to get started.</div>
      )}
    </>
  );
}

export default App;
