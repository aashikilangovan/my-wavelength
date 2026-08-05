"use client";

import { motion, useReducedMotion } from "framer-motion";

const BAR_COUNT = 4;

// Small animated equalizer-bar accent, reused next to the page title and to
// signal "live" state in the NowPlaying widget.
export function EqualizerBars({
  className,
  active = true,
}: {
  className?: string;
  active?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const animate = active && !reducedMotion;

  return (
    <div className={`flex h-4 items-end gap-[3px] ${className ?? ""}`} aria-hidden>
      {Array.from({ length: BAR_COUNT }, (_, i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full bg-gradient-to-t from-accent to-accent2"
          animate={animate ? { height: [4, 15, 7, 16, 4] } : { height: 5 }}
          transition={
            animate
              ? { duration: 0.9 + i * 0.17, repeat: Infinity, ease: "easeInOut", delay: i * 0.11 }
              : { duration: 0.2 }
          }
        />
      ))}
    </div>
  );
}
