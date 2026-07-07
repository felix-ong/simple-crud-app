import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let cached: NeonHttpDatabase<typeof schema> | null = null;

/**
 * Lazily-initialized Drizzle client over the Neon HTTP driver.
 *
 * It's a function (not a top-level const) so importing this module never
 * touches DATABASE_URL — that keeps `next build` working without a database
 * connection. The client is created on first query and reused thereafter.
 */
export function db(): NeonHttpDatabase<typeof schema> {
  if (!cached) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL is not set. Copy .env.example to .env.local and paste your Neon connection string."
      );
    }
    cached = drizzle(neon(url), { schema });
  }
  return cached;
}
