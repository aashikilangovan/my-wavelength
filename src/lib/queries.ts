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
  longestStreakDays: number;
  loopFactor: number;
}

function daysBetween(a: string, b: string): number {
  const ms = new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime();
  return Math.round(ms / 86_400_000);
}

export async function getOverviewStats(): Promise<OverviewStats> {
  const db = getDb();

  const totals = await db.execute(
    `SELECT COALESCE(SUM(duration_ms), 0) AS total_ms,
            COUNT(*) AS total_plays,
            COUNT(DISTINCT track_id) AS unique_tracks
     FROM plays`,
  );
  const totalMs = Number(totals.rows[0]?.total_ms ?? 0);
  const totalPlays = Number(totals.rows[0]?.total_plays ?? 0);
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

  // Longest-ever streak: walk the distinct days ascending, counting runs of
  // calendar-consecutive days.
  let longestStreakDays = 0;
  let currentRun = 0;
  const ascendingDays = [...days].reverse();
  for (let i = 0; i < ascendingDays.length; i++) {
    if (i === 0 || daysBetween(ascendingDays[i - 1], ascendingDays[i]) === 1) {
      currentRun++;
    } else {
      currentRun = 1;
    }
    longestStreakDays = Math.max(longestStreakDays, currentRun);
  }

  return {
    totalMinutes: Math.round(totalMs / 60000),
    uniqueTracks,
    uniqueArtists: artistSet.size,
    streakDays,
    longestStreakDays,
    loopFactor: uniqueTracks > 0 ? totalPlays / uniqueTracks : 0,
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

const RANGE_TO_SNAPSHOT: Record<TimeRangeKey, "short_term" | "medium_term" | "long_term"> = {
  "4w": "short_term",
  "6m": "medium_term",
  all: "long_term",
};

export interface RankTrend {
  /** Ranks moved up by this many spots since the previous daily snapshot; null = new entry. */
  delta: number | null;
}

// Surfaces day-over-day rank movement from `top_snapshots`, which the daily
// capture-top-snapshot workflow has been writing all along but nothing read
// until now. Spotify's own short/medium/long_term windows line up with our
// 4w/6m/all-time ranges, so we reuse that mapping.
export async function getRankTrends(
  itemType: "track" | "artist",
  range: TimeRangeKey,
): Promise<Map<string, RankTrend>> {
  const db = getDb();
  const timeRange = RANGE_TO_SNAPSHOT[range];

  const capturedRows = await db.execute({
    sql: `SELECT DISTINCT captured_at FROM top_snapshots
          WHERE item_type = ? AND time_range = ?
          ORDER BY captured_at DESC LIMIT 2`,
    args: [itemType, timeRange],
  });
  const capturedAts = capturedRows.rows.map((r) => r.captured_at as string);
  if (capturedAts.length < 2) return new Map();
  const [latest, previous] = capturedAts;

  const rows = await db.execute({
    sql: `SELECT captured_at, item_id, rank FROM top_snapshots
          WHERE item_type = ? AND time_range = ? AND captured_at IN (?, ?)`,
    args: [itemType, timeRange, latest, previous],
  });

  const latestRanks = new Map<string, number>();
  const previousRanks = new Map<string, number>();
  for (const row of rows.rows) {
    const bucket = row.captured_at === latest ? latestRanks : previousRanks;
    bucket.set(row.item_id as string, Number(row.rank));
  }

  const trends = new Map<string, RankTrend>();
  for (const [itemId, rank] of latestRanks) {
    const prevRank = previousRanks.get(itemId);
    trends.set(itemId, { delta: prevRank === undefined ? null : prevRank - rank });
  }
  return trends;
}

export interface MonthlyActivity {
  month: string; // YYYY-MM
  minutes: number;
}

export async function getMonthlyActivity(): Promise<MonthlyActivity[]> {
  const db = getDb();
  const result = await db.execute(
    `SELECT strftime('%Y-%m', played_at) AS month, SUM(duration_ms) AS total_ms
     FROM plays
     GROUP BY month
     ORDER BY month ASC`,
  );

  return result.rows.map((row) => ({
    month: row.month as string,
    minutes: Math.round(Number(row.total_ms) / 60000),
  }));
}

export interface HeatmapCell {
  dayOfWeek: number; // 0 = Sunday
  hour: number;
  count: number;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function getPeakListeningSlot(cells: HeatmapCell[]): { label: string; count: number } | null {
  let best: HeatmapCell | null = null;
  for (const cell of cells) {
    if (cell.count > 0 && (!best || cell.count > best.count)) best = cell;
  }
  if (!best) return null;
  const hour12 = ((best.hour + 11) % 12) + 1;
  const ampm = best.hour < 12 ? "am" : "pm";
  return { label: `${DAY_LABELS[best.dayOfWeek]} ${hour12}${ampm}`, count: best.count };
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
