import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { schema } from "./schema";
import { config } from "dotenv";

config({ path: "../../.env.local" });

const sqlite = new Database(process.env.DB_FILE_NAME!, { create: true });

sqlite.exec("PRAGMA journal_mode = WAL;");

export const db = drizzle({ client: sqlite, schema });

