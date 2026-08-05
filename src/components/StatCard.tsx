"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

function useCountUp(target: number, durationMs = 900): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frame: number;
    const start = performance.now();

    function tick(now: number) {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setValue(eased * target);
      if (t < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return value;
}

const GLOW_CLASS = {
  accent: "bg-accent/15",
  accent2: "bg-accent2/15",
  violet: "bg-violet/15",
} as const;

const ICON_CLASS = {
  accent: "text-accent",
  accent2: "text-accent2",
  violet: "text-violet",
} as const;

export function StatCard({
  label,
  value,
  suffix = "",
  hint,
  decimals = 0,
  icon,
  accent = "accent",
}: {
  label: string;
  value: number;
  suffix?: string;
  hint?: string;
  decimals?: number;
  icon?: ReactNode;
  accent?: keyof typeof GLOW_CLASS;
}) {
  const animated = useCountUp(value);
  const display = decimals > 0 ? animated.toFixed(decimals) : Math.round(animated).toLocaleString();

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 transition-transform hover:-translate-y-0.5">
      <div
        className={`pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full ${GLOW_CLASS[accent]} blur-2xl opacity-60 transition-opacity group-hover:opacity-100`}
      />
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{label}</p>
        {icon && <span className={`h-4 w-4 shrink-0 ${ICON_CLASS[accent]}`}>{icon}</span>}
      </div>
      <p className="mt-2 font-display text-3xl font-semibold tracking-tight">
        {display}
        {suffix}
      </p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
