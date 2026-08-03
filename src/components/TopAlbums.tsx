import type { TopAlbum } from "@/lib/queries";

export function TopAlbums({ albums }: { albums: TopAlbum[] }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h3 className="text-sm font-medium text-muted">Top albums</h3>
      {albums.length === 0 ? (
        <p className="mt-6 text-center text-sm text-muted">Not enough data yet.</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {albums.map((a) => (
            <div key={`${a.albumName}-${a.artistNames.join(",")}`} className="flex flex-col gap-2">
              <div className="aspect-square overflow-hidden rounded-lg bg-background">
                {a.albumArtUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.albumArtUrl} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">{a.albumName}</p>
                <p className="truncate text-[11px] text-muted">{a.artistNames.join(", ")}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
