"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DiscoveryWeek } from "@/lib/queries";

export function DiscoveryTimeline({ weeks }: { weeks: DiscoveryWeek[] }) {
  if (weeks.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5">
        <h3 className="text-sm font-medium text-muted">New artists over time</h3>
        <p className="mt-6 text-center text-sm text-muted">Not enough data yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h3 className="text-sm font-medium text-muted">New artists discovered per week</h3>
      <div className="mt-2 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={weeks} margin={{ left: -20, right: 10, top: 10 }}>
            <defs>
              <linearGradient id="discoveryFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--violet)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="var(--violet)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="weekStart"
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
              contentStyle={{
                background: "var(--surface-hover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--foreground)",
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="newArtists"
              stroke="var(--violet)"
              strokeWidth={2}
              fill="url(#discoveryFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
