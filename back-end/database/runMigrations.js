import fs from 'fs/promises';
import path from 'path';
import mysql from 'mysql2/promise';
import { fileURLToPath } from 'url';
import {
  DATABASE_URL,
  DATABASE_PORT,
  DATABASE_USER,
  DATABASE_PASSWORD,
  DATABASE_NAME,
} from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDir = path.join(__dirname, 'migrations');
const seedersDir = path.join(__dirname, 'seeders');

const connectionConfig = {
  host: DATABASE_URL,
  port: DATABASE_PORT ? Number(DATABASE_PORT) : undefined,
  user: DATABASE_USER,
  password: DATABASE_PASSWORD,
  database: DATABASE_NAME,
  multipleStatements: true,
};

async function ensureMigrationsTable(conn) {
  await conn.execute(
    `CREATE TABLE IF NOT EXISTS migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at DATETIME NOT NULL
    )`
  );
}

async function runDirectory(dirPath, prefix = '') {
  try {
    const entries = await fs.readdir(dirPath);
    const files = entries.filter((f) => f.endsWith('.sql')).sort();
    if (!files.length) return [];
    return files.map((f) => ({ name: prefix + f, path: path.join(dirPath, f) }));
  } catch (err) {
    return [];
  }
}

async function applyFiles(files, conn) {
  for (const file of files) {
    const name = file.name;
    const [rows] = await conn.execute('SELECT 1 FROM migrations WHERE name = ? LIMIT 1', [name]);
    if (rows && rows.length) {
      console.log(`Skipping already applied: ${name}`);
      continue;
    }

    console.log(`Applying: ${name}`);
    const sql = await fs.readFile(file.path, 'utf8');
    try {
      await conn.beginTransaction();
      await conn.query(sql);
      await conn.execute('INSERT INTO migrations (name, applied_at) VALUES (?, NOW())', [name]);
      await conn.commit();
      console.log(`Applied: ${name}`);
    } catch (err) {
      await conn.rollback();
      console.error(`Failed to apply ${name}:`, err.message || err);
      throw err;
    }
  }
}

async function main() {
  console.log('Running migrations...');
  const conn = await mysql.createConnection(connectionConfig);
  try {
    await ensureMigrationsTable(conn);

    const migrationFiles = await runDirectory(migrationsDir);
    await applyFiles(migrationFiles, conn);

    // run seeders (prefix names with seed: to avoid collisions)
    const seederFiles = await runDirectory(seedersDir);
    const seeded = seederFiles.map((s) => ({ name: `seed:${s.name}`, path: s.path }));
    await applyFiles(seeded, conn);

    console.log('All migrations and seeders applied.');
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error('Migration runner failed:', err);
  process.exit(1);
});
