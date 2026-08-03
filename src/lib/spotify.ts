const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API_BASE = "https://api.spotify.com/v1";

export const SPOTIFY_SCOPES = [
  "user-read-recently-played",
  "user-read-currently-playing",
  "user-top-read",
].join(" ");

export interface SpotifyTrack {
  id: string;
  name: string;
  duration_ms: number;
  album: {
    name: string;
    images: { url: string }[];
  };
  artists: { id: string; name: string }[];
}

export interface RecentlyPlayedItem {
  track: SpotifyTrack;
  played_at: string;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  images: { url: string }[];
}

async function getAccessToken(): Promise<string> {
  const clientId = requireEnv("SPOTIFY_CLIENT_ID");
  const clientSecret = requireEnv("SPOTIFY_CLIENT_SECRET");
  const refreshToken = requireEnv("SPOTIFY_REFRESH_TOKEN");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to refresh Spotify access token: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

async function spotifyFetch<T>(endpoint: string, accessToken: string): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Spotify API error on ${endpoint}: ${res.status} ${await res.text()}`);
  }

  return res.json() as Promise<T>;
}

export async function fetchRecentlyPlayed(afterMs?: number): Promise<RecentlyPlayedItem[]> {
  const accessToken = await getAccessToken();
  const query = new URLSearchParams({ limit: "50" });
  if (afterMs) query.set("after", String(afterMs));

  const data = await spotifyFetch<{ items: RecentlyPlayedItem[] }>(
    `/me/player/recently-played?${query.toString()}`,
    accessToken,
  );
  return data.items;
}

export interface CurrentlyPlaying {
  isPlaying: boolean;
  track: SpotifyTrack | null;
  progressMs: number | null;
}

export async function fetchCurrentlyPlaying(): Promise<CurrentlyPlaying> {
  const accessToken = await getAccessToken();
  const res = await fetch(`${API_BASE}/me/player/currently-playing`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (res.status === 204) {
    return { isPlaying: false, track: null, progressMs: null };
  }
  if (!res.ok) {
    throw new Error(`Spotify API error on currently-playing: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as {
    is_playing: boolean;
    progress_ms: number | null;
    item: SpotifyTrack | null;
  };

  return { isPlaying: data.is_playing, track: data.item, progressMs: data.progress_ms };
}

export type TimeRange = "short_term" | "medium_term" | "long_term";

export async function fetchTopItems(
  type: "tracks" | "artists",
  timeRange: TimeRange,
): Promise<(SpotifyTrack | SpotifyArtist)[]> {
  const accessToken = await getAccessToken();
  const data = await spotifyFetch<{ items: (SpotifyTrack | SpotifyArtist)[] }>(
    `/me/top/${type}?time_range=${timeRange}&limit=50`,
    accessToken,
  );
  return data.items;
}

export async function fetchArtists(ids: string[]): Promise<SpotifyArtist[]> {
  if (ids.length === 0) return [];
  const accessToken = await getAccessToken();
  const results: SpotifyArtist[] = [];

  // Spotify removed the batch "Get Several Artists" endpoint in Feb 2026 —
  // only single-artist lookups work now.
  for (const id of ids) {
    const artist = await spotifyFetch<SpotifyArtist>(`/artists/${id}`, accessToken);
    results.push(artist);
  }

  return results;
}
