-- Spotify listening analytics schema (Turso / SQLite)

CREATE TABLE IF NOT EXISTS plays (
  id TEXT PRIMARY KEY, -- track_id + '_' + played_at, guarantees de-dupe
  track_id TEXT NOT NULL,
  track_name TEXT NOT NULL,
  artist_ids TEXT NOT NULL, -- JSON array of artist ids
  artist_names TEXT NOT NULL, -- JSON array of artist names
  album_name TEXT NOT NULL,
  album_art_url TEXT,
  duration_ms INTEGER NOT NULL,
  played_at TEXT NOT NULL -- ISO 8601 timestamp from Spotify
);

CREATE INDEX IF NOT EXISTS idx_plays_played_at ON plays (played_at);
CREATE INDEX IF NOT EXISTS idx_plays_track_id ON plays (track_id);

-- Spotify no longer exposes genres/popularity on artist objects (as of
-- Feb 2026); this table just caches artist images to avoid refetching.
CREATE TABLE IF NOT EXISTS artists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT,
  last_refreshed TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS top_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  captured_at TEXT NOT NULL,
  time_range TEXT NOT NULL, -- 'short_term' | 'medium_term' | 'long_term'
  item_type TEXT NOT NULL, -- 'track' | 'artist'
  rank INTEGER NOT NULL,
  item_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  image_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_top_snapshots_lookup
  ON top_snapshots (captured_at, time_range, item_type);
