import type { RecentPlay } from "@/lib/queries";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
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
          <li key={p.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-surface-hover">
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-md bg-background">
              {p.albumArtUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.albumArtUrl} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{p.trackName}</p>
              <p className="truncate text-xs text-muted">{p.artistNames.join(", ")}</p>
            </div>
            <span className="shrink-0 text-xs text-muted">{timeAgo(p.playedAt)}</span>
          </li>
        ))}
        {plays.length === 0 && <p className="py-6 text-center text-sm text-muted">Nothing played yet.</p>}
      </ul>
    </div>
  );
}
