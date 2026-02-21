"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { SENTIMENT_LABELS } from "@/lib/types";

interface Props {
  data: Record<string, number>;
}

const COLORS = {
  positive: "#10b981",
  neutral: "#f59e0b",
  negative: "#ef4444",
};

export default function SentimentChart({ data }: Props) {
  const chartData = Object.entries(data).map(([key, value]) => ({
    name: SENTIMENT_LABELS[key as keyof typeof SENTIMENT_LABELS] || key,
    count: value,
    color: COLORS[key as keyof typeof COLORS] || "#6b7280",
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count">
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
