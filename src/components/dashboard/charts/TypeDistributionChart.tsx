"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { TICKET_TYPE_LABELS } from "@/lib/types";

interface Props {
  data: Record<string, number>;
}

const COLORS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#6366f1",
  "#8b5cf6",
  "#6b7280",
];

export default function TypeDistributionChart({ data }: Props) {
  const chartData = Object.entries(data).map(([key, value], index) => ({
    name: TICKET_TYPE_LABELS[key as keyof typeof TICKET_TYPE_LABELS] || key,
    value,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
