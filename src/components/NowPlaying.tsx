"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EqualizerBars } from "./EqualizerBars";

interface NowPlayingData {
  isPlaying: boolean;
  track: {
    name: string;
    artists: { name: string }[];
    album: { images: { url: string }[] };
  } | null;
}

const POLL_MS = 30_000;

export function NowPlaying() {
  const [data, setData] = useState<NowPlayingData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/now-playing", { cache: "no-store" });
        const json = (await res.json()) as NowPlayingData;
        if (!cancelled) setData(json);
      } catch {
        // ignore transient failures, keep last known state
      }
    }

    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <AnimatePresence>
      {data?.isPlaying && data.track && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="flex items-center gap-3 rounded-full border border-border bg-surface py-1.5 pl-1.5 pr-4 shadow-[var(--glow-accent)]"
        >
          <div className="relative h-9 w-9 shrink-0">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-accent to-accent2 opacity-40 blur-[6px]" />
            <motion.div
              className="relative h-9 w-9 overflow-hidden rounded-full border border-border bg-background"
              animate={{ rotate: 360 }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            >
              {data.track.album.images[0]?.url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.track.album.images[0].url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
              <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-black/40" />
              <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background" />
            </motion.div>
          </div>
          <div className="flex items-center gap-2">
            <EqualizerBars />
            <div className="text-sm leading-tight">
              <p className="font-medium">{data.track.name}</p>
              <p className="text-xs text-muted">
                {data.track.artists.map((a) => a.name).join(", ")}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
