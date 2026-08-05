"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { GuitarIcon, MusicNoteIcon } from "./icons";

interface Particle {
  id: number;
  dx: number;
  dy: number;
  rotate: number;
  size: number;
  color: string;
  glyph: "note" | "guitar";
}

interface Burst {
  id: number;
  x: number;
  y: number;
  particles: Particle[];
}

const COLOR_VARS = ["var(--accent)", "var(--accent2)", "var(--violet)"];
const BURST_LIFETIME_MS = 700;

let burstCounter = 0;

function makeBurst(x: number, y: number): Burst {
  const count = 4 + Math.floor(Math.random() * 3); // 4-6 particles
  const particles: Particle[] = Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
    const distance = 34 + Math.random() * 30;
    return {
      id: i,
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance - 10, // slight upward bias, like a little pop
      rotate: (Math.random() - 0.5) * 140,
      size: 10 + Math.random() * 8,
      color: COLOR_VARS[Math.floor(Math.random() * COLOR_VARS.length)],
      glyph: Math.random() > 0.75 ? "guitar" : "note",
    };
  });
  return { id: burstCounter++, x, y, particles };
}

// A little confetti-style burst of music notes (and the occasional guitar)
// from wherever the visitor clicks. Purely decorative — never blocks the
// real click underneath it.
export function ClickNotes() {
  const [bursts, setBursts] = useState<Burst[]>([]);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    function onClick(e: MouseEvent) {
      const burst = makeBurst(e.clientX, e.clientY);
      setBursts((prev) => [...prev, burst]);
      setTimeout(() => {
        setBursts((prev) => prev.filter((b) => b.id !== burst.id));
      }, BURST_LIFETIME_MS);
    }

    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [reducedMotion]);

  if (reducedMotion || bursts.length === 0) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <AnimatePresence>
        {bursts.map((burst) => (
          <div key={burst.id} className="absolute" style={{ left: burst.x, top: burst.y }}>
            {burst.particles.map((p) => (
              <motion.span
                key={p.id}
                className="absolute left-0 top-0"
                style={{ width: p.size, height: p.size, color: p.color }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0.4, rotate: 0 }}
                animate={{ x: p.dx, y: p.dy, opacity: 0, scale: 1, rotate: p.rotate }}
                transition={{ duration: BURST_LIFETIME_MS / 1000, ease: "easeOut" }}
              >
                {p.glyph === "guitar" ? (
                  <GuitarIcon className="h-full w-full drop-shadow-[0_0_4px_currentColor]" />
                ) : (
                  <MusicNoteIcon className="h-full w-full drop-shadow-[0_0_4px_currentColor]" />
                )}
              </motion.span>
            ))}
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
