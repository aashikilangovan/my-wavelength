import type { RecentPlay } from "@/lib/queries";
import { ExternalLinkIcon, MusicNoteIcon } from "./icons";

const FRESH_MINUTES = 10;

function minutesAgo(iso: string): number {
  return Math.round((Date.now() - new Date(iso).getTime()) / 60000);
}

function timeAgo(iso: string): string {
  const minutes = minutesAgo(iso);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function RecentlyPlayed({ plays }: { plays: RecentPlay[] }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h3 className="text-sm font-medium text-muted">Recently played</h3>
      <ul className="mt-3 flex max-h-96 flex-col gap-1 overflow-y-auto">
        {plays.map((p) => (
          <li key={p.id}>
            <a
              href={p.trackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-surface-hover"
            >
              <MusicNoteIcon className="hover-note pointer-events-none absolute left-6 top-0.5 h-3 w-3 text-accent2" />
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-background">
                {p.albumArtUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.albumArtUrl} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
                ) : (
                  <MusicNoteIcon className="h-3.5 w-3.5 text-border" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm group-hover:text-accent">{p.trackName}</p>
                <p className="truncate text-xs text-muted">{p.artistNames.join(", ")}</p>
              </div>
              <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted">
                {minutesAgo(p.playedAt) < FRESH_MINUTES && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                  </span>
                )}
                {timeAgo(p.playedAt)}
              </span>
              <ExternalLinkIcon className="h-3.5 w-3.5 shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
            </a>
          </li>
        ))}
        {plays.length === 0 && <p className="py-6 text-center text-sm text-muted">Nothing played yet.</p>}
      </ul>
    </div>
  );
}
