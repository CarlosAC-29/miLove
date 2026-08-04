import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "./client.js";

type Direction = "up" | "down";

const direction = (process.argv[2] as Direction | undefined) ?? "up";
if (direction !== "up" && direction !== "down") {
  throw new Error("Invalid migration direction. Use 'up' or 'down'.");
}

async function ensureMigrationsTable() {
  await db.query(`
    create table if not exists schema_migrations (
      id bigserial primary key,
      name text not null unique,
      executed_at timestamptz not null default now()
    )
  `);
}

async function getExecutedMigrations(): Promise<Set<string>> {
  const result = await db.query<{ name: string }>("select name from schema_migrations");
  return new Set(result.rows.map((row) => row.name));
}

async function runUp(migrationsDir: string) {
  const files = (await readdir(migrationsDir))
    .filter((file) => file.endsWith(".up.sql"))
    .sort((a, b) => a.localeCompare(b));

  const executed = await getExecutedMigrations();
  for (const file of files) {
    if (executed.has(file)) continue;
    const sql = await readFile(path.join(migrationsDir, file), "utf8");
    await db.query("begin");
    try {
      await db.query(sql);
      await db.query("insert into schema_migrations (name) values ($1)", [file]);
      await db.query("commit");
      console.log(`Applied migration: ${file}`);
    } catch (error) {
      await db.query("rollback");
      throw error;
    }
  }
}

async function runDown(migrationsDir: string) {
  const result = await db.query<{ name: string }>(
    "select name from schema_migrations order by id desc limit 1",
  );
  const last = result.rows[0]?.name;
  if (!last) {
    console.log("No migrations to rollback.");
    return;
  }

  const downFile = last.replace(".up.sql", ".down.sql");
  const downPath = path.join(migrationsDir, downFile);
  const sql = await readFile(downPath, "utf8");

  await db.query("begin");
  try {
    await db.query(sql);
    await db.query("delete from schema_migrations where name = $1", [last]);
    await db.query("commit");
    console.log(`Rolled back migration: ${last}`);
  } catch (error) {
    await db.query("rollback");
    throw error;
  }
}

async function run() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const migrationsDir = path.join(__dirname, "migrations");

  await ensureMigrationsTable();

  if (direction === "up") {
    await runUp(migrationsDir);
  } else {
    await runDown(migrationsDir);
  }

  await db.end();
}

run().catch(async (error) => {
  console.error("Migration failed.", error);
  await db.end();
  process.exit(1);
});
