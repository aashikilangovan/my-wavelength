"use client";

import { motion, useReducedMotion } from "framer-motion";

interface Note {
  id: number;
  left: number; // %
  topPercent: number; // starting vertical position, % of viewport height
  size: number;
  duration: number;
  drift: number;
  glyph: "single" | "double";
  color: string;
}

const COLOR_VARS = ["var(--accent)", "var(--accent2)", "var(--violet)"];
const NOTE_COUNT = 9;

// Deterministic pseudo-random in [0, 1), seeded by index — keeps notes fully
// static across server/client renders (no window access, no hydration
// mismatch), so no effect/state is needed to defer them past mount.
function seeded(seed: number): number {
  const x = Math.sin(seed * 999.7) * 10000;
  return x - Math.floor(x);
}

// Each note starts at its own random point along the rise (rather than all
// stacked at the bottom on mount) so the drift reads as continuous ambient
// motion immediately, not a synchronized launch every time the page loads.
function buildNote(i: number): Note {
  return {
    id: i,
    left: seeded(i + 1) * 100,
    topPercent: -20 + seeded(i + 7) * 140,
    size: 14 + seeded(i + 11) * 20,
    duration: 22 + seeded(i + 23) * 16,
    drift: (seeded(i + 51) - 0.5) * 80,
    glyph: seeded(i + 67) > 0.5 ? "single" : "double",
    color: COLOR_VARS[i % COLOR_VARS.length],
  };
}

const NOTES: Note[] = Array.from({ length: NOTE_COUNT }, (_, i) => buildNote(i));

function NoteGlyph({ variant, className }: { variant: "single" | "double"; className?: string }) {
  return variant === "single" ? (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M9 17.5V4.5a1 1 0 0 1 1.2-.98l8 1.6A1 1 0 0 1 19 6.1v9.9a3 3 0 1 1-2-2.83V7.7l-6-1.2v9.9a3 3 0 1 1-2 1.1Z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M10 17.5V5.2a1 1 0 0 1 1.28-.96l7 2A1 1 0 0 1 19 7.2v7.9a3 3 0 1 1-2-2.83V8.6l-5-1.43v9.3a3 3 0 1 1-2 1.03Z" />
    </svg>
  );
}

// Purely decorative, ambient music-note drift behind the page content.
// Nothing renders if the visitor prefers reduced motion.
export function FloatingNotes() {
  const reducedMotion = useReducedMotion();
  if (reducedMotion) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      {NOTES.map((n) => (
        <motion.div
          key={n.id}
          className="absolute"
          style={{
            left: `${n.left}%`,
            top: `${n.topPercent}%`,
            width: n.size,
            height: n.size,
            color: n.color,
          }}
          initial={{ y: "0vh", x: 0, opacity: 0 }}
          animate={{ y: "-160vh", x: [0, n.drift, 0], opacity: [0, 0.28, 0.28, 0] }}
          transition={{
            duration: n.duration,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <NoteGlyph variant={n.glyph} className="h-full w-full drop-shadow-[0_0_6px_currentColor]" />
        </motion.div>
      ))}
    </div>
  );
}
