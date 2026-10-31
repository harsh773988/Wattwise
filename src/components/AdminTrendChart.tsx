"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RegionalTrendPoint } from "@/domain/admin";
import { useReducedMotion } from "@/lib/useReducedMotion";

export default function AdminTrendChart({ data }: { readonly data: readonly RegionalTrendPoint[] }) {
  const prefersReducedMotion = useReducedMotion();

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center border-2 border-dashed border-black text-center text-sm font-bold">
        Regional trend will appear when daily readings are available.
      </div>
    );
  }

  return (
    <div className="h-64 w-full sm:h-80" role="img" aria-label="Regional percent reduction by date">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
          <CartesianGrid stroke="#d6d6d0" strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
          <YAxis unit="%" tick={{ fontSize: 11 }} tickLine={false} width={48} />
          <Tooltip
            formatter={(value) => [`${Number(value).toFixed(1)}%`, "Reduction"]}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Line
            type="monotone"
            dataKey="percentReduction"
            name="Reduction"
            stroke="#171e19"
            strokeWidth={3}
            dot={{ fill: "#ffe17c", stroke: "#171e19", strokeWidth: 2, r: 3 }}
            activeDot={{ r: 5 }}
            isAnimationActive={!prefersReducedMotion}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
