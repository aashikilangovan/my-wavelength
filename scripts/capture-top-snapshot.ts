// Run daily (GitHub Actions): snapshots top tracks/artists for each time
// range so "top items" trends can be shown over time, not just current.
import "./load-env";
import { ensureSchema, getDb } from "../src/lib/db";
import { fetchTopItems, type TimeRange, type SpotifyArtist, type SpotifyTrack } from "../src/lib/spotify";

const TIME_RANGES: TimeRange[] = ["short_term", "medium_term", "long_term"];

function isArtist(item: SpotifyTrack | SpotifyArtist): item is SpotifyArtist {
  return !("duration_ms" in item);
}

async function main() {
  await ensureSchema();
  const db = getDb();
  const capturedAt = new Date().toISOString();

  for (const timeRange of TIME_RANGES) {
    for (const itemType of ["tracks", "artists"] as const) {
      const items = await fetchTopItems(itemType, timeRange);

      for (let rank = 0; rank < items.length; rank++) {
        const item = items[rank];
        const imageUrl = isArtist(item)
          ? item.images[0]?.url ?? null
          : item.album.images[0]?.url ?? null;

        await db.execute({
          sql: `INSERT INTO top_snapshots
                  (captured_at, time_range, item_type, rank, item_id, item_name, image_url)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
          args: [
            capturedAt,
            timeRange,
            itemType === "tracks" ? "track" : "artist",
            rank + 1,
            item.id,
            item.name,
            imageUrl,
          ],
        });
      }

      console.log(`Captured ${items.length} ${itemType} for ${timeRange}.`);
    }
  }

  console.log("Top snapshot capture complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
