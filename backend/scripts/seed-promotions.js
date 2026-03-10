/**
 * seed-promotions.js
 * Activează promoții de toate tipurile pe listing-uri existente.
 *
 * Usage:
 *   node scripts/seed-promotions.js
 *   node scripts/seed-promotions.js --count 20        # câte listing-uri să promovezi (default: 12)
 *   node scripts/seed-promotions.js --owner-id 2      # doar listing-urile unui user
 *   node scripts/seed-promotions.js --dry-run         # preview fără a scrie în DB
 *   node scripts/seed-promotions.js --clear           # șterge toate promoțiile active înainte
 */

import pg from 'pg';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const { Client } = pg;

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.findIndex((a) => a === `--${name}`);
  return idx !== -1 ? args[idx + 1] : null;
};
const hasFlag = (name) => args.includes(`--${name}`);

const COUNT    = parseInt(getArg('count') || '12', 10);
const OWNER_ID = getArg('owner-id') ? parseInt(getArg('owner-id'), 10) : null;
const DRY_RUN  = hasFlag('dry-run');
const CLEAR    = hasFlag('clear');

// ── DB connection ─────────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/domaris';

async function main() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  try {
    // ── Load promotion plans ──────────────────────────────────────────────────
    const { rows: plans } = await client.query(
      `SELECT id, code, search_boost_multiplier, duration_days, show_badge, show_on_homepage, is_highlighted
       FROM promotion_plans WHERE is_active = true ORDER BY display_order`,
    );

    if (plans.length === 0) {
      console.error('No active promotion plans found in DB.');
      process.exit(1);
    }

    console.log('\n📋 Promotion plans available:');
    for (const p of plans) {
      console.log(`  [${p.id}] ${p.code.padEnd(12)} multiplier=${p.search_boost_multiplier}  duration=${p.duration_days}d`);
    }

    // ── Load listings ─────────────────────────────────────────────────────────
    const listingQuery = OWNER_ID
      ? `SELECT id, title, owner_id FROM listings WHERE status = 'public' AND owner_id = $1 ORDER BY id DESC LIMIT $2`
      : `SELECT id, title, owner_id FROM listings WHERE status = 'public' ORDER BY id DESC LIMIT $1`;
    const listingParams = OWNER_ID ? [OWNER_ID, COUNT] : [COUNT];
    const { rows: listings } = await client.query(listingQuery, listingParams);

    if (listings.length === 0) {
      console.error('No public listings found.');
      process.exit(1);
    }

    console.log(`\n🏠 Found ${listings.length} listings to promote (requested ${COUNT}):`);
    for (const l of listings) {
      console.log(`  [${l.id}] ${l.title}`);
    }

    // ── Optionally clear existing active promotions ────────────────────────────
    if (CLEAR && !DRY_RUN) {
      const ids = listings.map((l) => l.id);
      const { rowCount } = await client.query(
        `DELETE FROM listing_promotions WHERE listing_id = ANY($1) AND status = 'active'`,
        [ids],
      );
      console.log(`\n🗑  Cleared ${rowCount} existing active promotions.`);
    }

    // ── Assign plans round-robin ──────────────────────────────────────────────
    // Each listing gets one plan, cycling through all plan types.
    // If you have 12 listings and 4 plans → 3 of each type.
    const assignments = listings.map((listing, idx) => ({
      listing,
      plan: plans[idx % plans.length],
    }));

    console.log('\n📝 Assignments:');
    for (const { listing, plan } of assignments) {
      console.log(`  listing ${listing.id} → ${plan.code} (${plan.duration_days}d, x${plan.search_boost_multiplier})`);
    }

    if (DRY_RUN) {
      console.log('\n⚠️  DRY RUN — nothing written to DB.');
      return;
    }

    // ── Insert promotions ─────────────────────────────────────────────────────
    await client.query('BEGIN');

    let inserted = 0;
    let skipped  = 0;
    const now = new Date();

    for (const { listing, plan } of assignments) {
      // Skip if already has an active promotion of this type
      const { rows: existing } = await client.query(
        `SELECT id FROM listing_promotions
         WHERE listing_id = $1 AND promotion_plan_id = $2 AND status = 'active'
           AND end_date > NOW()`,
        [listing.id, plan.id],
      );

      if (existing.length > 0) {
        console.log(`  ⏭  listing ${listing.id} already has active ${plan.code}, skipping.`);
        skipped++;
        continue;
      }

      const endDate = new Date(now.getTime() + plan.duration_days * 24 * 60 * 60 * 1000);

      await client.query(
        `INSERT INTO listing_promotions
           (listing_id, user_id, promotion_plan_id, status, payment_status, is_free_boost,
            search_boost_multiplier, show_badge, show_on_homepage, is_highlighted,
            amount_paid, currency, activated_at,
            start_date, end_date, created_at, updated_at)
         VALUES ($1, $2, $3, 'active', 'completed', true,
                 $4, $5, $6, $7,
                 0, 'EUR', NOW(),
                 $8, $9, NOW(), NOW())`,
        [
          listing.id,
          listing.owner_id,
          plan.id,
          plan.search_boost_multiplier,
          plan.show_badge,
          plan.show_on_homepage,
          plan.is_highlighted,
          now,
          endDate,
        ],
      );

      inserted++;
    }

    await client.query('COMMIT');

    console.log(`\n✅ Done! Inserted ${inserted} promotions, skipped ${skipped}.`);

    // ── Summary ───────────────────────────────────────────────────────────────
    const { rows: summary } = await client.query(
      `SELECT pp.code, COUNT(*) as count
       FROM listing_promotions lp
       JOIN promotion_plans pp ON pp.id = lp.promotion_plan_id
       WHERE lp.status = 'active' AND lp.end_date > NOW()
       GROUP BY pp.code ORDER BY pp.code`,
    );
    console.log('\n📊 Active promotions in DB now:');
    for (const row of summary) {
      console.log(`  ${row.code.padEnd(12)} → ${row.count} active`);
    }

  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
