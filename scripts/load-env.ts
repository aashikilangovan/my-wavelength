import { config } from "dotenv";

// Scripts run standalone (not via Next.js), so load .env.local explicitly —
// dotenv/config only loads .env by default.
config({ path: ".env.local" });
