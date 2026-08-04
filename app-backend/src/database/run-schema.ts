import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "./client.js";

async function run() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const sqlPath = path.join(__dirname, "schema.sql");
  const sql = await readFile(sqlPath, "utf8");
  await db.query(sql);
  console.log("Database schema applied.");
  await db.end();
}

run().catch((error) => {
  console.error("Failed to apply schema.", error);
  process.exit(1);
});
