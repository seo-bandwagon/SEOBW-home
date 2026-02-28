"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";

interface HistoryEntry {
  position: number | null;
  url: string | null;
  recordedAt: string;
}

interface Props {
  history: HistoryEntry[];
}

export function RankHistoryChart({ history }: Props) {
  // Format data for recharts — oldest first
  const data = [...history]
    .reverse()
    .filter((h) => h.position !== null)
    .map((h) => ({
      date: new Date(h.recordedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      position: h.position,
      fullDate: new Date(h.recordedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    }));

  if (data.length < 2) return null;

  const maxPos = Math.max(...data.map((d) => d.position ?? 0));
  const yMax = Math.min(Math.ceil(maxPos / 10) * 10 + 5, 105);

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(245,245,245,0.06)" />
          <XAxis
            dataKey="date"
            tick={{ fill: "rgba(245,245,245,0.4)", fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "rgba(245,245,245,0.1)" }}
          />
          <YAxis
            reversed
            domain={[1, yMax]}
            tick={{ fill: "rgba(245,245,245,0.4)", fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "rgba(245,245,245,0.1)" }}
            label={{
              value: "Position",
              angle: -90,
              position: "insideLeft",
              fill: "rgba(245,245,245,0.3)",
              fontSize: 12,
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#000022",
              border: "1px solid rgba(245,55,150,0.3)",
              borderRadius: "8px",
              color: "#F5F5F5",
              fontSize: 13,
            }}
            formatter={(value: number) => [`#${value}`, "Position"]}
            labelFormatter={(_, payload) => {
              if (payload && payload[0]) {
                return (payload[0].payload as { fullDate: string }).fullDate;
              }
              return "";
            }}
          />
          <ReferenceLine
            y={10}
            stroke="rgba(245,55,150,0.3)"
            strokeDasharray="5 5"
            label={{
              value: "Page 1",
              fill: "rgba(245,55,150,0.5)",
              fontSize: 11,
              position: "right",
            }}
          />
          <Line
            type="monotone"
            dataKey="position"
            stroke="#F53796"
            strokeWidth={2}
            dot={{ fill: "#F53796", strokeWidth: 0, r: 4 }}
            activeDot={{ fill: "#F53796", strokeWidth: 2, stroke: "#F5F5F5", r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
