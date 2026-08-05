"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MonthlyActivity as MonthlyActivityPoint } from "@/lib/queries";

const MONTH_FORMAT = new Intl.DateTimeFormat("en-US", { month: "short", year: "2-digit" });

function formatMonth(month: string): string {
  const [year, m] = month.split("-").map(Number);
  return MONTH_FORMAT.format(new Date(Date.UTC(year, m - 1, 1)));
}

export function MonthlyActivity({ months }: { months: MonthlyActivityPoint[] }) {
  if (months.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5">
        <h3 className="text-sm font-medium text-muted">Minutes listened per month</h3>
        <p className="mt-6 text-center text-sm text-muted">Not enough data yet.</p>
      </div>
    );
  }

  const data = months.map((m) => ({ ...m, label: formatMonth(m.month) }));

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h3 className="text-sm font-medium text-muted">Minutes listened per month</h3>
      <div className="mt-2 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: -20, right: 10, top: 10 }} barCategoryGap={4}>
            <defs>
              <linearGradient id="monthlyFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.9} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.35} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--muted)", fontSize: 10 }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "var(--muted)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "var(--surface-hover)" }}
              contentStyle={{
                background: "var(--surface-hover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--foreground)",
                fontSize: 12,
              }}
              formatter={(value) => [`${Number(value).toLocaleString()} min`, "Listened"]}
            />
            <Bar dataKey="minutes" fill="url(#monthlyFill)" radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
