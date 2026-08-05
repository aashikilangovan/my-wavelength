// Dev-only helper: fills the local SQLite DB with plausible fake listening
// data so the dashboard UI can be built/tested before real ingestion runs.
// Safe to delete once real data is flowing.
import "./load-env";
import { ensureSchema, getDb } from "../src/lib/db";

const ARTISTS = [
  { id: "a1", name: "Radiohead" },
  { id: "a2", name: "John Mayer" },
  { id: "a3", name: "Tame Impala" },
  { id: "a4", name: "Steely Dan" },
  { id: "a5", name: "Khruangbin" },
  { id: "a6", name: "Mac DeMarco" },
  { id: "a7", name: "Frank Ocean" },
  { id: "a8", name: "The Strokes" },
];

const TRACKS = [
  { id: "t1", albumId: "al1", name: "Weird Fishes", artist: 0, album: "In Rainbows", duration: 305000 },
  { id: "t2", albumId: "al2", name: "Gravity", artist: 1, album: "Continuum", duration: 255000 },
  { id: "t3", albumId: "al3", name: "Let It Happen", artist: 2, album: "Currents", duration: 467000 },
  { id: "t4", albumId: "al4", name: "Deacon Blues", artist: 3, album: "Aja", duration: 507000 },
  { id: "t5", albumId: "al5", name: "White Gloves", artist: 4, album: "Con Todo El Mundo", duration: 233000 },
  { id: "t6", albumId: "al6", name: "Chamber of Reflection", artist: 5, album: "Salad Days", duration: 209000 },
  { id: "t7", albumId: "al7", name: "Self Control", artist: 6, album: "Blonde", duration: 249000 },
  { id: "t8", albumId: "al8", name: "Reptilia", artist: 7, album: "Room on Fire", duration: 207000 },
];

function randomPast(daysBack: number): Date {
  const now = Date.now();
  const offset = Math.random() * daysBack * 24 * 60 * 60 * 1000;
  return new Date(now - offset);
}

async function main() {
  await ensureSchema();
  const db = getDb();

  for (const artist of ARTISTS) {
    await db.execute({
      sql: `INSERT OR REPLACE INTO artists (id, name, image_url, last_refreshed)
            VALUES (?, ?, ?, ?)`,
      args: [artist.id, artist.name, null, new Date().toISOString()],
    });
  }

  const playCount = 400;
  for (let i = 0; i < playCount; i++) {
    const track = TRACKS[Math.floor(Math.random() * TRACKS.length)];
    const artist = ARTISTS[track.artist];
    const playedAt = randomPast(90).toISOString();

    await db.execute({
      sql: `INSERT OR IGNORE INTO plays
              (id, track_id, track_name, artist_ids, artist_names, album_id, album_name, album_art_url, duration_ms, played_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        `${track.id}_${playedAt}`,
        track.id,
        track.name,
        JSON.stringify([artist.id]),
        JSON.stringify([artist.name]),
        track.albumId,
        track.album,
        null,
        track.duration,
        playedAt,
      ],
    });
  }

  console.log(`Seeded ${ARTISTS.length} artists and ~${playCount} plays into local.db`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
