// One-time, run locally: `npm run auth`
// Opens a Spotify login/consent screen for YOUR account, then prints a
// refresh token to store as a secret (SPOTIFY_REFRESH_TOKEN). Never commit
// the printed value.
import "./load-env";
import http from "node:http";
import { SPOTIFY_SCOPES } from "../src/lib/spotify";

const PORT = 8888;
const REDIRECT_URI = `http://127.0.0.1:${PORT}/callback`;

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error(
    "Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env.local before running this script.",
  );
  process.exit(1);
}

const state = Math.random().toString(36).slice(2);

const authUrl = new URL("https://accounts.spotify.com/authorize");
authUrl.searchParams.set("client_id", clientId);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
authUrl.searchParams.set("scope", SPOTIFY_SCOPES);
authUrl.searchParams.set("state", state);

const server = http.createServer(async (req, res) => {
  if (!req.url?.startsWith("/callback")) {
    res.writeHead(404).end();
    return;
  }

  const url = new URL(req.url, REDIRECT_URI);
  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");

  if (!code || returnedState !== state) {
    res.writeHead(400, { "Content-Type": "text/plain" }).end("Auth failed or state mismatch.");
    server.close();
    return;
  }

  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });

  const tokenData = (await tokenRes.json()) as {
    refresh_token?: string;
    error_description?: string;
  };

  if (!tokenData.refresh_token) {
    console.error("Failed to get refresh token:", tokenData.error_description);
    res.writeHead(500, { "Content-Type": "text/plain" }).end("Failed — check the terminal.");
    server.close();
    return;
  }

  console.log("\nSuccess! Your refresh token (store as SPOTIFY_REFRESH_TOKEN, do not commit):\n");
  console.log(tokenData.refresh_token);
  console.log();

  res
    .writeHead(200, { "Content-Type": "text/plain" })
    .end("Done! Refresh token printed to your terminal — you can close this tab.");
  server.close();
});

server.listen(PORT, () => {
  console.log(`Open this URL to authorize (waiting on http://127.0.0.1:${PORT}):\n`);
  console.log(authUrl.toString());
  console.log();
});
