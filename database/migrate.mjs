#!/usr/bin/env node
// Minimal forward-only migration + seed runner for Simcoin.
// Tracks applied migrations in a `_migrations` table. No external deps beyond `pg`.
//
//   node database/migrate.mjs up     -> apply pending migrations/*.sql
//   node database/migrate.mjs seed   -> apply seeds/*.sql (idempotent)
//
// Reads DATABASE_URL from the environment.

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2] ?? 'up';

async function main() {
  const { default: pg } = await import('pg').catch(() => {
    console.error('Missing dependency "pg". Run `pnpm install` first.');
    process.exit(1);
  });

  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    if (cmd === 'up') await runMigrations(client);
    else if (cmd === 'seed') await runDir(client, 'seeds');
    else throw new Error(`Unknown command: ${cmd}`);
  } finally {
    await client.end();
  }
}

async function runMigrations(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);

  const dir = join(__dirname, 'migrations');
  const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();

  for (const file of files) {
    const { rowCount } = await client.query('SELECT 1 FROM _migrations WHERE name = $1', [file]);
    if (rowCount) {
      console.log(`• skip ${file} (already applied)`);
      continue;
    }
    console.log(`▶ apply ${file}`);
    await client.query('BEGIN');
    try {
      await client.query(readFileSync(join(dir, file), 'utf8'));
      await client.query('INSERT INTO _migrations(name) VALUES ($1)', [file]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
  }
  console.log('✓ migrations up to date');
}

async function runDir(client, sub) {
  const dir = join(__dirname, sub);
  const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    console.log(`▶ ${sub}/${file}`);
    await client.query(readFileSync(join(dir, file), 'utf8'));
  }
  console.log(`✓ ${sub} applied`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
