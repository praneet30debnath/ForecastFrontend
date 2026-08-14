import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useIsNarrow } from "../hooks/useIsNarrow";

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

function AttentionTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const weight = payload[0].payload.weight;
  return (
    <div className="tooltip-card">
      <div className="tooltip-date">{formatDate(label)}</div>
      <div className="tooltip-row">
        <span className="tooltip-label">
          <span className="tooltip-key" />
          Attention
        </span>
        <span className="tooltip-value">{(weight * 100).toFixed(1)}%</span>
      </div>
    </div>
  );
}

export default function AttentionPane({ attention }) {
  const maxWeight = useMemo(
    () => Math.max(...attention.map((a) => a.weight)),
    [attention]
  );
  const isNarrow = useIsNarrow();

  return (
    <div className="attention-pane">
      <div className="pane-label">Attention by historical day</div>
      <ResponsiveContainer width="100%" height={isNarrow ? 56 : 72}>
        <BarChart
          data={attention}
          syncId="stock-chart"
          margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
        >
          <XAxis dataKey="date" hide />
          {/* hidden axis reserves the same left gutter as the price chart's YAxis, so bars line up under it */}
          <YAxis hide domain={[0, "dataMax"]} width={isNarrow ? 48 : 64} />
          <Tooltip
            content={<AttentionTooltip />}
            cursor={{ fill: "var(--series-1-wash)" }}
          />
          <Bar dataKey="weight" radius={[2, 2, 0, 0]} isAnimationActive={false}>
            {attention.map((a) => (
              <Cell
                key={a.date}
                fill={a.weight === maxWeight ? "var(--series-1)" : "var(--series-1-soft)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
