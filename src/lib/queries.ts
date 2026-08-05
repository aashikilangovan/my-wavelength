import { getDb } from "./db";

export type TimeRangeKey = "4w" | "6m" | "all";

export const spotifyTrackUrl = (id: string) => `https://open.spotify.com/track/${id}`;
export const spotifyArtistUrl = (id: string) => `https://open.spotify.com/artist/${id}`;
export const spotifyAlbumUrl = (id: string) => `https://open.spotify.com/album/${id}`;

function cutoffIso(range: TimeRangeKey): string | null {
  const days = range === "4w" ? 28 : range === "6m" ? 182 : null;
  if (days === null) return null;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export interface OverviewStats {
  totalMinutes: number;
  uniqueTracks: number;
  uniqueArtists: number;
  streakDays: number;
}

export async function getOverviewStats(): Promise<OverviewStats> {
  const db = getDb();

  const totals = await db.execute(
    `SELECT COALESCE(SUM(duration_ms), 0) AS total_ms,
            COUNT(DISTINCT track_id) AS unique_tracks
     FROM plays`,
  );
  const totalMs = Number(totals.rows[0]?.total_ms ?? 0);
  const uniqueTracks = Number(totals.rows[0]?.unique_tracks ?? 0);

  const artistRows = await db.execute("SELECT artist_ids FROM plays");
  const artistSet = new Set<string>();
  for (const row of artistRows.rows) {
    const ids = JSON.parse(row.artist_ids as string) as string[];
    ids.forEach((id) => artistSet.add(id));
  }

  const dayRows = await db.execute(
    "SELECT DISTINCT date(played_at) AS day FROM plays ORDER BY day DESC",
  );
  const days = dayRows.rows.map((r) => r.day as string);
  let streakDays = 0;
  if (days.length > 0) {
    const cursor = new Date();
    for (const day of days) {
      const expected = cursor.toISOString().slice(0, 10);
      if (day === expected) {
        streakDays++;
        cursor.setDate(cursor.getDate() - 1);
      } else if (streakDays === 0 && day < expected) {
        // most recent listening wasn't today/yesterday chain start; stop
        break;
      } else {
        break;
      }
    }
  }

  return {
    totalMinutes: Math.round(totalMs / 60000),
    uniqueTracks,
    uniqueArtists: artistSet.size,
    streakDays,
  };
}

export interface TopTrack {
  trackId: string;
  trackName: string;
  trackUrl: string;
  artistNames: string[];
  albumArtUrl: string | null;
  playCount: number;
}

export async function getTopTracks(range: TimeRangeKey, limit = 10): Promise<TopTrack[]> {
  const db = getDb();
  const cutoff = cutoffIso(range);

  const result = await db.execute({
    sql: `SELECT track_id, track_name, artist_names, album_art_url, COUNT(*) AS play_count
          FROM plays
          ${cutoff ? "WHERE played_at >= ?" : ""}
          GROUP BY track_id
          ORDER BY play_count DESC
          LIMIT ?`,
    args: cutoff ? [cutoff, limit] : [limit],
  });

  return result.rows.map((row) => ({
    trackId: row.track_id as string,
    trackName: row.track_name as string,
    trackUrl: spotifyTrackUrl(row.track_id as string),
    artistNames: JSON.parse(row.artist_names as string) as string[],
    albumArtUrl: row.album_art_url as string | null,
    playCount: Number(row.play_count),
  }));
}

export interface TopArtist {
  artistId: string;
  artistName: string;
  artistUrl: string;
  imageUrl: string | null;
  playCount: number;
}

export async function getTopArtists(range: TimeRangeKey, limit = 10): Promise<TopArtist[]> {
  const db = getDb();
  const cutoff = cutoffIso(range);

  const plays = await db.execute({
    sql: `SELECT artist_ids, artist_names FROM plays ${cutoff ? "WHERE played_at >= ?" : ""}`,
    args: cutoff ? [cutoff] : [],
  });

  const counts = new Map<string, { name: string; count: number }>();
  for (const row of plays.rows) {
    const ids = JSON.parse(row.artist_ids as string) as string[];
    const names = JSON.parse(row.artist_names as string) as string[];
    ids.forEach((id, i) => {
      const existing = counts.get(id);
      counts.set(id, { name: names[i] ?? id, count: (existing?.count ?? 0) + 1 });
    });
  }

  const artistIds = [...counts.keys()];
  const images = new Map<string, string | null>();
  if (artistIds.length > 0) {
    const placeholders = artistIds.map(() => "?").join(",");
    const artistRows = await db.execute({
      sql: `SELECT id, image_url FROM artists WHERE id IN (${placeholders})`,
      args: artistIds,
    });
    for (const row of artistRows.rows) {
      images.set(row.id as string, row.image_url as string | null);
    }
  }

  return [...counts.entries()]
    .map(([artistId, { name, count }]) => ({
      artistId,
      artistName: name,
      artistUrl: spotifyArtistUrl(artistId),
      imageUrl: images.get(artistId) ?? null,
      playCount: count,
    }))
    .sort((a, b) => b.playCount - a.playCount)
    .slice(0, limit);
}

export interface HeatmapCell {
  dayOfWeek: number; // 0 = Sunday
  hour: number;
  count: number;
}

export async function getListeningHeatmap(): Promise<HeatmapCell[]> {
  const db = getDb();
  const rows = await db.execute("SELECT played_at FROM plays");

  const grid = new Map<string, number>();
  for (const row of rows.rows) {
    const d = new Date(row.played_at as string);
    const key = `${d.getUTCDay()}_${d.getUTCHours()}`;
    grid.set(key, (grid.get(key) ?? 0) + 1);
  }

  const cells: HeatmapCell[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      cells.push({ dayOfWeek: day, hour, count: grid.get(`${day}_${hour}`) ?? 0 });
    }
  }
  return cells;
}

export interface TopAlbum {
  albumId: string | null;
  albumUrl: string | null;
  albumName: string;
  artistNames: string[];
  albumArtUrl: string | null;
  playCount: number;
}

export async function getTopAlbums(limit = 8): Promise<TopAlbum[]> {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT album_id, album_name, artist_names, album_art_url, COUNT(*) AS play_count
          FROM plays
          GROUP BY COALESCE(album_id, album_name), artist_names
          ORDER BY play_count DESC
          LIMIT ?`,
    args: [limit],
  });

  return result.rows.map((row) => {
    const albumId = row.album_id as string | null;
    return {
      albumId,
      albumUrl: albumId ? spotifyAlbumUrl(albumId) : null,
      albumName: row.album_name as string,
      artistNames: JSON.parse(row.artist_names as string) as string[],
      albumArtUrl: row.album_art_url as string | null,
      playCount: Number(row.play_count),
    };
  });
}

export interface DiscoveryWeek {
  weekStart: string;
  newArtists: number;
}

export async function getDiscoveryTimeline(): Promise<DiscoveryWeek[]> {
  const db = getDb();
  const rows = await db.execute("SELECT artist_ids, played_at FROM plays ORDER BY played_at ASC");

  const firstSeen = new Map<string, string>();
  for (const row of rows.rows) {
    const ids = JSON.parse(row.artist_ids as string) as string[];
    const playedAt = row.played_at as string;
    for (const id of ids) {
      if (!firstSeen.has(id)) firstSeen.set(id, playedAt);
    }
  }

  const weekCounts = new Map<string, number>();
  for (const playedAt of firstSeen.values()) {
    const d = new Date(playedAt);
    const weekStart = new Date(d);
    weekStart.setUTCDate(d.getUTCDate() - d.getUTCDay());
    const key = weekStart.toISOString().slice(0, 10);
    weekCounts.set(key, (weekCounts.get(key) ?? 0) + 1);
  }

  return [...weekCounts.entries()]
    .map(([weekStart, newArtists]) => ({ weekStart, newArtists }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

export interface RecentPlay {
  id: string;
  trackId: string;
  trackName: string;
  trackUrl: string;
  artistNames: string[];
  albumArtUrl: string | null;
  playedAt: string;
}

export async function getRecentPlays(limit = 25): Promise<RecentPlay[]> {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT id, track_id, track_name, artist_names, album_art_url, played_at
          FROM plays ORDER BY played_at DESC LIMIT ?`,
    args: [limit],
  });

  return result.rows.map((row) => ({
    id: row.id as string,
    trackId: row.track_id as string,
    trackName: row.track_name as string,
    trackUrl: spotifyTrackUrl(row.track_id as string),
    artistNames: JSON.parse(row.artist_names as string) as string[],
    albumArtUrl: row.album_art_url as string | null,
    playedAt: row.played_at as string,
  }));
}
