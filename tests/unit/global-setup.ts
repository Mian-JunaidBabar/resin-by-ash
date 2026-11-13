import { execFileSync } from "node:child_process";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local", quiet: true });

/** Migrate + seed the separate test database once per Vitest run. */
export default function setup() {
  const url = process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL_TEST (or DATABASE_URL) is required for unit tests");

  const env = { ...process.env, DATABASE_URL: url };
  execFileSync("npx", ["prisma", "migrate", "deploy"], { env, stdio: "pipe" });
  execFileSync("npx", ["tsx", "prisma/seed.ts"], { env, stdio: "pipe" });
}
