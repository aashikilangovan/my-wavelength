"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
          className="flex items-center gap-3 rounded-full border border-border bg-surface py-1.5 pl-1.5 pr-4"
        >
          <div className="h-8 w-8 overflow-hidden rounded-full bg-background">
            {data.track.album.images[0]?.url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.track.album.images[0].url}
                alt=""
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <motion.span
              animate={{ scaleY: [1, 1.8, 0.6, 1.4, 1] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
              className="h-3 w-1 rounded-full bg-accent"
            />
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
