/**
 * Seed a REMOTE database (production/staging) with the full local fixture set.
 *
 * Why this exists: the 256 MB fixture JSON under scripts/data is generated
 * locally and is gitignored, so a deployed instance can never seed itself from
 * it. This script ingests that same fixture set into a remote database over its
 * connection string — the one thing only the operator can supply.
 *
 * The connection string is read from backend/.env.seedprod (gitignored) so it
 * never has to be pasted on a command line or into a chat, and never lands in
 * shell history. Create it from .env.seedprod.example:
 *
 *   DATABASE_URL="postgresql://user:pass@host:port/db"
 *
 * Then run:
 *
 *   npm run seed:prod
 *
 * It runs the ingest in UPSERT mode (never a destructive reset), so existing
 * rows — e.g. real accounts already registered against production — are
 * preserved and updated rather than deleted.
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const envFile = path.join(__dirname, '..', '.env.seedprod');

if (!fs.existsSync(envFile)) {
  console.error('\n❌  backend/.env.seedprod not found.');
  console.error('    Create it from .env.seedprod.example and put your remote DATABASE_URL in it:');
  console.error('      DATABASE_URL="postgresql://user:pass@host:port/db"\n');
  process.exit(1);
}

const parsed = dotenv.parse(fs.readFileSync(envFile));
const databaseUrl = parsed.DATABASE_URL;

if (!databaseUrl || !/^postgres(ql)?:\/\//.test(databaseUrl)) {
  console.error('\n❌  .env.seedprod does not contain a valid postgres DATABASE_URL.\n');
  process.exit(1);
}

// Guard against seeding the local database by accident — that is what
// `npm run seed` is for. This script is only for a genuinely remote target.
if (/@(localhost|127\.0\.0\.1)[:/]/.test(databaseUrl)) {
  console.error('\n❌  DATABASE_URL points at localhost. Use `npm run seed` for the local database.\n');
  process.exit(1);
}

const host = databaseUrl.replace(/\/\/[^@]*@/, '//***@');
console.log(`\n🌱  Seeding REMOTE database via upsert (no reset): ${host}\n`);

// Run the proven ingest against the remote DB. Upsert mode leaves any existing
// rows in place. NODE_ENV is left unset so no accidental prod-only branch trips.
const result = spawnSync(
  'npx',
  ['ts-node', path.join(__dirname, 'ingest_seed.ts'), '--mode', 'upsert'],
  {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, DATABASE_URL: databaseUrl },
  }
);

process.exit(result.status ?? 1);
