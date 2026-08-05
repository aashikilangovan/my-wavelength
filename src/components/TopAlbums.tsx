import type { TopAlbum } from "@/lib/queries";
import { MusicNoteIcon, VinylIcon } from "./icons";

export function TopAlbums({ albums }: { albums: TopAlbum[] }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h3 className="text-sm font-medium text-muted">Top albums</h3>
      {albums.length === 0 ? (
        <p className="mt-6 text-center text-sm text-muted">Not enough data yet.</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {albums.map((a) => {
            const card = (
              <>
                <div className="relative aspect-square overflow-hidden rounded-lg bg-background shadow-sm transition-shadow duration-300 group-hover:shadow-[var(--glow-accent)]">
                  {a.albumArtUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.albumArtUrl}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <MusicNoteIcon className="h-6 w-6 text-border" />
                    </div>
                  )}
                  {a.albumUrl && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
                      <VinylIcon className="h-6 w-6 animate-spin text-white [animation-duration:3s]" />
                    </div>
                  )}
                  <MusicNoteIcon className="hover-note pointer-events-none absolute right-1.5 top-1.5 h-3.5 w-3.5 text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium group-hover:text-accent">{a.albumName}</p>
                  <p className="truncate text-[11px] text-muted">{a.artistNames.join(", ")}</p>
                </div>
              </>
            );

            const key = `${a.albumId ?? a.albumName}-${a.artistNames.join(",")}`;

            return a.albumUrl ? (
              <a
                key={key}
                href={a.albumUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col gap-2"
              >
                {card}
              </a>
            ) : (
              <div key={key} className="group flex flex-col gap-2">
                {card}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
