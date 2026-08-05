"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { RankTrend, TopArtist, TopTrack, TimeRangeKey } from "@/lib/queries";
import { ExternalLinkIcon, MusicNoteIcon, TrendDownIcon, TrendUpIcon, VinylIcon } from "./icons";

const RANGE_LABELS: Record<TimeRangeKey, string> = {
  "4w": "4 weeks",
  "6m": "6 months",
  all: "All time",
};

function playsLabel(count: number): string {
  return `${count} play${count === 1 ? "" : "s"}`;
}

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.035 } },
};

const rowVariants = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0 },
};

// Day-over-day rank movement, sourced from the daily top_snapshots capture.
function RankBadge({ trend }: { trend?: RankTrend }) {
  if (!trend || trend.delta === 0) return null;

  if (trend.delta === null) {
    return (
      <span className="rounded-full bg-accent2/15 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-accent2">
        NEW
      </span>
    );
  }

  const up = trend.delta > 0;
  return (
    <span className={`flex items-center gap-0.5 text-[10px] font-medium ${up ? "text-accent" : "text-accent2"}`}>
      {up ? <TrendUpIcon className="h-2.5 w-2.5" /> : <TrendDownIcon className="h-2.5 w-2.5" />}
      {Math.abs(trend.delta)}
    </span>
  );
}

export function TopItems({
  tracksByRange,
  artistsByRange,
  trackTrendsByRange,
  artistTrendsByRange,
}: {
  tracksByRange: Record<TimeRangeKey, TopTrack[]>;
  artistsByRange: Record<TimeRangeKey, TopArtist[]>;
  trackTrendsByRange: Record<TimeRangeKey, Record<string, RankTrend>>;
  artistTrendsByRange: Record<TimeRangeKey, Record<string, RankTrend>>;
}) {
  const [range, setRange] = useState<TimeRangeKey>("4w");
  const [view, setView] = useState<"tracks" | "artists">("tracks");

  const items = view === "tracks" ? tracksByRange[range] : artistsByRange[range];

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-full bg-background p-1">
          {(["tracks", "artists"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`relative rounded-full px-3 py-1 text-sm capitalize transition-colors ${
                view === v ? "text-black" : "text-muted hover:text-foreground"
              }`}
            >
              {view === v && (
                <motion.span
                  layoutId="view-pill"
                  className="absolute inset-0 rounded-full bg-accent shadow-[var(--glow-accent)]"
                  transition={{ type: "spring", bounce: 0.25, duration: 0.4 }}
                />
              )}
              <span className="relative">{v}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-full bg-background p-1">
          {(Object.keys(RANGE_LABELS) as TimeRangeKey[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`relative rounded-full px-3 py-1 text-sm transition-colors ${
                range === r ? "text-white" : "text-muted hover:text-foreground"
              }`}
            >
              {range === r && (
                <motion.span
                  layoutId="range-pill"
                  className="absolute inset-0 rounded-full bg-violet"
                  transition={{ type: "spring", bounce: 0.25, duration: 0.4 }}
                />
              )}
              <span className="relative">{RANGE_LABELS[r]}</span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.ol
          key={`${view}-${range}`}
          variants={listVariants}
          initial="hidden"
          animate="show"
          className="mt-4 flex flex-col gap-1"
        >
          {view === "tracks"
            ? tracksByRange[range].map((t, i) => (
                <motion.li key={t.trackId} variants={rowVariants}>
                  <a
                    href={t.trackUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-surface-hover"
                  >
                    <MusicNoteIcon className="hover-note pointer-events-none absolute left-7 top-0.5 h-3 w-3 text-accent" />
                    <span className="w-5 text-right text-sm text-muted">{i + 1}</span>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-background">
                      {t.albumArtUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={t.albumArtUrl} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
                      ) : (
                        <MusicNoteIcon className="h-4 w-4 text-border" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium group-hover:text-accent">{t.trackName}</p>
                      <p className="truncate text-xs text-muted">{t.artistNames.join(", ")}</p>
                    </div>
                    <RankBadge trend={trackTrendsByRange[range][t.trackId]} />
                    <span className="text-xs text-muted">{playsLabel(t.playCount)}</span>
                    <ExternalLinkIcon className="h-3.5 w-3.5 shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
                  </a>
                </motion.li>
              ))
            : artistsByRange[range].map((a, i) => (
                <motion.li key={a.artistId} variants={rowVariants}>
                  <a
                    href={a.artistUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-surface-hover"
                  >
                    <MusicNoteIcon className="hover-note pointer-events-none absolute left-7 top-0.5 h-3 w-3 text-accent" />
                    <span className="w-5 text-right text-sm text-muted">{i + 1}</span>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-background">
                      {a.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.imageUrl} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
                      ) : (
                        <VinylIcon className="h-5 w-5 text-border" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium group-hover:text-accent">{a.artistName}</p>
                    </div>
                    <RankBadge trend={artistTrendsByRange[range][a.artistId]} />
                    <span className="text-xs text-muted">{playsLabel(a.playCount)}</span>
                    <ExternalLinkIcon className="h-3.5 w-3.5 shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
                  </a>
                </motion.li>
              ))}
          {items.length === 0 && (
            <p className="py-6 text-center text-sm text-muted">Nothing here yet — check back once more listening data has been ingested.</p>
          )}
        </motion.ol>
      </AnimatePresence>
    </div>
  );
}
