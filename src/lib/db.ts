import { createClient, type Client } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";

let client: Client | null = null;

// Defaults to a local SQLite file for development so the whole app can be
// built and tested before a Turso database exists. Production (Vercel /
// GitHub Actions ingestion) sets TURSO_DATABASE_URL + TURSO_AUTH_TOKEN.
export function getDb(): Client {
  if (client) return client;

  const url = process.env.TURSO_DATABASE_URL || "file:./local.db";
  const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

  client = createClient(
    url.startsWith("file:") ? { url } : { url, authToken },
  );

  return client;
}

export async function ensureSchema(): Promise<void> {
  const db = getDb();
  const schemaPath = path.join(process.cwd(), "db", "schema.sql");
  // Normalize to LF first: on a CRLF checkout (e.g. Windows with
  // core.autocrlf), a trailing \r survives the per-line comment strip below
  // (JS regex `.` doesn't match \r) and corrupts the next statement.
  const schema = fs.readFileSync(schemaPath, "utf-8").replace(/\r\n/g, "\n");

  // Strip line comments first — a semicolon inside a comment would
  // otherwise be mistaken for a statement boundary.
  const withoutComments = schema
    .split("\n")
    .map((line) => line.replace(/--.*$/, ""))
    .join("\n");

  const statements = withoutComments
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await db.execute(statement);
  }

  await runMigrations(db);
}

// Additive, idempotent migrations for columns added after the initial
// schema — safe to run against a database that already has data.
async function runMigrations(db: Client): Promise<void> {
  const columns = await db.execute("PRAGMA table_info(plays)");
  const hasAlbumId = columns.rows.some((row) => row.name === "album_id");
  if (!hasAlbumId) {
    await db.execute("ALTER TABLE plays ADD COLUMN album_id TEXT");
  }
}
