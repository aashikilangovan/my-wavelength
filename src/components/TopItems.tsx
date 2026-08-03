"use client";

import { useState } from "react";
import type { TopArtist, TopTrack, TimeRangeKey } from "@/lib/queries";

const RANGE_LABELS: Record<TimeRangeKey, string> = {
  "4w": "4 weeks",
  "6m": "6 months",
  all: "All time",
};

function playsLabel(count: number): string {
  return `${count} play${count === 1 ? "" : "s"}`;
}

export function TopItems({
  tracksByRange,
  artistsByRange,
}: {
  tracksByRange: Record<TimeRangeKey, TopTrack[]>;
  artistsByRange: Record<TimeRangeKey, TopArtist[]>;
}) {
  const [range, setRange] = useState<TimeRangeKey>("4w");
  const [view, setView] = useState<"tracks" | "artists">("tracks");

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-full bg-background p-1">
          {(["tracks", "artists"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-full px-3 py-1 text-sm capitalize transition-colors ${
                view === v ? "bg-accent text-black" : "text-muted hover:text-foreground"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-full bg-background p-1">
          {(Object.keys(RANGE_LABELS) as TimeRangeKey[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-full px-3 py-1 text-sm transition-colors ${
                range === r ? "bg-violet text-white" : "text-muted hover:text-foreground"
              }`}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      <ol className="mt-4 flex flex-col gap-1">
        {view === "tracks"
          ? tracksByRange[range].map((t, i) => (
              <li
                key={t.trackId}
                className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-surface-hover"
              >
                <span className="w-5 text-right text-sm text-muted">{i + 1}</span>
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-background">
                  {t.albumArtUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.albumArtUrl} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.trackName}</p>
                  <p className="truncate text-xs text-muted">{t.artistNames.join(", ")}</p>
                </div>
                <span className="text-xs text-muted">{playsLabel(t.playCount)}</span>
              </li>
            ))
          : artistsByRange[range].map((a, i) => (
              <li
                key={a.artistId}
                className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-surface-hover"
              >
                <span className="w-5 text-right text-sm text-muted">{i + 1}</span>
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-background">
                  {a.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.imageUrl} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.artistName}</p>
                </div>
                <span className="text-xs text-muted">{playsLabel(a.playCount)}</span>
              </li>
            ))}
        {(view === "tracks" ? tracksByRange[range] : artistsByRange[range]).length === 0 && (
          <p className="py-6 text-center text-sm text-muted">Nothing here yet — check back once more listening data has been ingested.</p>
        )}
      </ol>
    </div>
  );
}
