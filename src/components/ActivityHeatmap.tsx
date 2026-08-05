import { Fragment } from "react";
import type { HeatmapCell } from "@/lib/queries";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function intensity(count: number, max: number): string {
  if (max === 0 || count === 0) return "var(--surface-hover)";
  const t = count / max;
  // interpolate surface-hover -> accent
  return `color-mix(in srgb, var(--accent) ${Math.round(t * 100)}%, var(--surface-hover))`;
}

export function ActivityHeatmap({ cells }: { cells: HeatmapCell[] }) {
  const max = Math.max(1, ...cells.map((c) => c.count));

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h3 className="text-sm font-medium text-muted">Listening activity</h3>
      <p className="mb-4 text-xs text-muted">By day of week and hour (UTC)</p>

      <div className="overflow-x-auto">
        <div className="grid min-w-[640px] grid-cols-[auto_repeat(24,1fr)] gap-1">
          <div />
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} className="text-center text-[10px] text-muted">
              {h % 3 === 0 ? h : ""}
            </div>
          ))}
          {DAYS.map((day, dayIndex) => (
            <Fragment key={day}>
              <div className="pr-2 text-xs text-muted self-center">{day}</div>
              {Array.from({ length: 24 }, (_, hour) => {
                const cell = cells.find((c) => c.dayOfWeek === dayIndex && c.hour === hour);
                const count = cell?.count ?? 0;
                return (
                  <div
                    key={`${day}-${hour}`}
                    title={`${day} ${hour}:00 — ${count} play${count === 1 ? "" : "s"}`}
                    className="aspect-square rounded-[3px] transition-transform duration-150 hover:scale-125"
                    style={{ background: intensity(count, max) }}
                  />
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
