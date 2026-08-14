import { useMemo } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { useIsNarrow } from "../hooks/useIsNarrow";

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

const formatPrice = (v) =>
  v == null
    ? ""
    : `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

// Merge historical + forecast into one series. The last historical point is
// duplicated as the first forecast value so the two lines join with no gap.
function buildPoints(historical, forecast) {
  const points = historical.map((d) => ({
    date: d.date,
    historical: d.close,
    forecast: null,
    range: null,
  }));

  if (points.length) {
    const last = points[points.length - 1];
    last.forecast = last.historical;
  }

  forecast.forEach((d) => {
    points.push({
      date: d.date,
      historical: null,
      forecast: d.close,
      range: [d.low, d.high],
    });
  });

  return points;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;
  const isForecast = point.historical == null;
  const value = isForecast ? point.forecast : point.historical;

  return (
    <div className="tooltip-card">
      <div className="tooltip-date">{formatDate(label)}</div>
      <div className="tooltip-row">
        <span className="tooltip-label">
          <span className={`tooltip-key${isForecast ? " forecast" : ""}`} />
          {isForecast ? "Forecast" : "Actual"}
        </span>
        <span className="tooltip-value">{formatPrice(value)}</span>
      </div>
      {isForecast && point.range && (
        <div className="tooltip-range">
          Range {formatPrice(point.range[0])} – {formatPrice(point.range[1])}
        </div>
      )}
    </div>
  );
}

function MarkerDot({ cx, cy, index, targetIndex }) {
  if (index !== targetIndex || cx == null || cy == null) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill="var(--series-1)"
      stroke="var(--surface-1)"
      strokeWidth={2}
    />
  );
}

export default function StockChart({ historical, forecast, lastDate }) {
  const points = useMemo(
    () => buildPoints(historical, forecast),
    [historical, forecast]
  );
  const boundaryIndex = historical.length - 1;
  const forecastEndIndex = points.length - 1;
  const isNarrow = useIsNarrow();

  return (
    <div>
      <div className="legend">
        <span className="legend-item">
          <span className="legend-key historical" />
          Historical close
        </span>
        <span className="legend-item">
          <span className="legend-key forecast" />
          Forecast (projected)
        </span>
      </div>

      <ResponsiveContainer width="100%" height={isNarrow ? 260 : 340}>
        <ComposedChart
          data={points}
          syncId="stock-chart"
          margin={{ top: 12, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid stroke="var(--gridline)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="var(--baseline)"
            tick={{ fill: "var(--text-muted)", fontSize: isNarrow ? 11 : 12 }}
            tickLine={false}
            minTickGap={isNarrow ? 24 : 32}
          />
          <YAxis
            domain={["auto", "auto"]}
            tickFormatter={formatPrice}
            stroke="var(--baseline)"
            tick={{ fill: "var(--text-muted)", fontSize: isNarrow ? 11 : 12 }}
            tickLine={false}
            axisLine={false}
            width={isNarrow ? 48 : 64}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: "var(--baseline)", strokeWidth: 1 }}
          />
          <ReferenceLine
            x={lastDate}
            stroke="var(--text-muted)"
            strokeDasharray="3 3"
            label={{
              value: "Today",
              position: "insideTopRight",
              fill: "var(--text-muted)",
              fontSize: 12,
            }}
          />
          <Area
            dataKey="range"
            stroke="none"
            fill="var(--series-1-wash)"
            connectNulls
            isAnimationActive={false}
          />
          <Line
            dataKey="historical"
            type="monotone"
            stroke="var(--series-1)"
            strokeWidth={2}
            dot={(props) => (
              <MarkerDot key={props.index} {...props} targetIndex={boundaryIndex} />
            )}
            activeDot={{ r: 4, stroke: "var(--surface-1)", strokeWidth: 2 }}
            isAnimationActive={false}
          />
          <Line
            dataKey="forecast"
            type="monotone"
            stroke="var(--series-1)"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={(props) => (
              <MarkerDot key={props.index} {...props} targetIndex={forecastEndIndex} />
            )}
            activeDot={{ r: 4, stroke: "var(--surface-1)", strokeWidth: 2 }}
            connectNulls
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
