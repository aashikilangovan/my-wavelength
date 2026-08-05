export function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

export function GuitarIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M15.5 2.5 21 8" />
      <path d="M17.7 4.3 15 7l2 2 2.7-2.7" />
      <path d="M15 7 6.5 15.5a3 3 0 1 0 2 2L17 9" />
      <circle cx="7.2" cy="16.8" r="3.6" />
      <path d="M5.2 15.5c.6-.6 1.7-.6 2.3 0M6 17.6c.6-.6 1.7-.6 2.3 0" />
    </svg>
  );
}

export function MusicNoteIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M9 17.5V4.5a1 1 0 0 1 1.2-.98l8 1.6A1 1 0 0 1 19 6.1v9.9a3 3 0 1 1-2-2.83V7.7l-6-1.2v9.9a3 3 0 1 1-2 1.1Z" />
    </svg>
  );
}

export function VinylIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      className={className}
    >
      <circle cx="12" cy="12" r="9.2" />
      <circle cx="12" cy="12" r="6" strokeDasharray="1.2 2.2" />
      <circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FlameIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2c1.2 2.4-1 3.6-1 6 0 1.7 1.3 3 3 3s2.6-1.2 2.6-2.6c1.9 1.7 3.4 4.4 3.4 7 0 3.7-3.1 6.6-7 6.6s-7-2.9-7-6.6C6 10.6 9.4 7 12 2Z" />
    </svg>
  );
}

export function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

export function RepeatIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

export function TrendUpIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 15l6-6 4 4 6-7" />
      <path d="M14 6h6v6" />
    </svg>
  );
}

export function TrendDownIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 9l6 6 4-4 6 7" />
      <path d="M14 18h6v-6" />
    </svg>
  );
}
