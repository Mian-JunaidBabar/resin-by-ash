import dotenv from "dotenv";

dotenv.config({ path: ".env.local", quiet: true });

// Unit tests must never touch the development database.
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL;
