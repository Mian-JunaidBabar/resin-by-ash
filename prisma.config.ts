import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

// Local development reads .env.local; CI and production provide real env vars.
dotenv.config({ path: ".env.local", quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
