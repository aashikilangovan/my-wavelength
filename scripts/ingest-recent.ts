// Run on a schedule (GitHub Actions): pulls recently-played tracks and
// upserts any new plays, resolving genres for artists we haven't seen yet.
import "./load-env";
import { ensureSchema, getDb } from "../src/lib/db";
import { fetchArtists, fetchRecentlyPlayed } from "../src/lib/spotify";

async function main() {
  await ensureSchema();
  const db = getDb();

  const latest = await db.execute(
    "SELECT played_at FROM plays ORDER BY played_at DESC LIMIT 1",
  );
  const afterMs = latest.rows[0]
    ? new Date(latest.rows[0].played_at as string).getTime()
    : undefined;

  const items = await fetchRecentlyPlayed(afterMs);
  console.log(`Fetched ${items.length} recently-played item(s).`);

  const knownArtists = await db.execute("SELECT id FROM artists");
  const knownArtistIds = new Set(knownArtists.rows.map((r) => r.id as string));

  const newArtistIds = new Set<string>();

  for (const item of items) {
    const { track, played_at } = item;
    const id = `${track.id}_${played_at}`;
    const artistIds = track.artists.map((a) => a.id);
    const artistNames = track.artists.map((a) => a.name);

    await db.execute({
      sql: `INSERT OR IGNORE INTO plays
              (id, track_id, track_name, artist_ids, artist_names, album_name, album_art_url, duration_ms, played_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        track.id,
        track.name,
        JSON.stringify(artistIds),
        JSON.stringify(artistNames),
        track.album.name,
        track.album.images[0]?.url ?? null,
        track.duration_ms,
        played_at,
      ],
    });

    for (const artistId of artistIds) {
      if (!knownArtistIds.has(artistId)) newArtistIds.add(artistId);
    }
  }

  if (newArtistIds.size > 0) {
    const artists = await fetchArtists([...newArtistIds]);
    for (const artist of artists) {
      await db.execute({
        sql: `INSERT OR REPLACE INTO artists (id, name, image_url, last_refreshed)
              VALUES (?, ?, ?, ?)`,
        args: [artist.id, artist.name, artist.images[0]?.url ?? null, new Date().toISOString()],
      });
    }
    console.log(`Resolved ${artists.length} new artist(s).`);
  }

  console.log("Ingestion complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
