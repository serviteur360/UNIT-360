import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

const databasePath = fileURLToPath(
  new URL("../../database.sqlite", import.meta.url)
);

export const db = new DatabaseSync(databasePath);

db.exec("PRAGMA foreign_keys = ON");
db.exec("PRAGMA journal_mode = WAL");

console.log("UNITÉ 360 CORE : connexion SQLite établie.");
