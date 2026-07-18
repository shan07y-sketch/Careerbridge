/**
 * This file exists only because Prisma's CLI (`prisma db seed` / `prisma migrate reset`)
 * looks for a `prisma.seed` entry in package.json pointing at a script, and
 * conventionally that script lives here.
 *
 * CareerBridge's actual seeding pipeline is a two-stage process and does NOT
 * run through this file:
 *   1. `npm run seed:generate` - Python generator (backend/scripts/generate_seed_json.py,
 *      backed by backend/seed_engine.py + backend/careerbridge_seed_engine/) produces
 *      deterministic, realistic JSON fixtures under backend/scripts/data/*.json.
 *   2. `npm run seed:ingest` (aliased as `npm run seed`) - reset_seed.ts (optional,
 *      gated by ALLOW_SEED_RESET) truncates seed-managed tables, then ingest_seed.ts
 *      upserts the generated JSON into Postgres via Prisma Client, followed by
 *      validate_seed.ts to assert row counts and FK integrity.
 *
 * Rationale: the data-generation logic (realistic names, internally consistent
 * student/company/job graphs, deterministic Faker seeding) is significantly
 * easier to express and maintain in Python, while ingestion needs the real
 * Prisma Client/TypeScript types. Keeping generation and ingestion as separate
 * stages also lets you regenerate the JSON fixtures without touching the DB,
 * or re-ingest the same fixtures repeatedly for fast, deterministic resets.
 *
 * If you landed here via `npx prisma db seed`, run the real pipeline instead:
 *
 *   npm run seed:generate   # (re)generate scripts/data/*.json
 *   npm run seed            # reset (if ALLOW_SEED_RESET=true) + ingest + validate
 *
 * This stub deliberately fails loudly instead of silently no-op'ing, so
 * nobody mistakes a successful `prisma db seed` run for a populated database.
 */

console.error('\n[CareerBridge] `prisma db seed` is not the seeding entry point.');
console.error('Run the real pipeline instead:');
console.error('  npm run seed:generate   # Python generator -> scripts/data/*.json');
console.error('  npm run seed            # ingest (+ optional reset) + validate\n');
console.error('See backend/prisma/seed.ts for the full explanation.\n');
process.exit(1);
