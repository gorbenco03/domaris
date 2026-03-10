#!/usr/bin/env node
/**
 * Delete all listings (or all listings for one owner) together with related rows.
 *
 * Usage:
 *   node backend/scripts/clear-listings.js --yes
 *   node backend/scripts/clear-listings.js --owner-id=1 --yes
 *   node backend/scripts/clear-listings.js --owner-id=1 --dry-run
 */

const path = require('path');
const fs = require('fs');
const { Client } = require('pg');

const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') });
}

function printUsage() {
  console.log(`
Usage:
  node backend/scripts/clear-listings.js --yes
  node backend/scripts/clear-listings.js --owner-id=1 --yes
  node backend/scripts/clear-listings.js --owner-id=1 --dry-run

Options:
  --owner-id=ID   Delete only listings that belong to this owner
  --yes           Required for actual deletion
  --dry-run       Show what will be deleted, without deleting anything
  --help, -h      Show this help
`);
}

function normalizeArgs(argv) {
  const cleaned = argv.filter((arg) => arg !== '--');

  if (cleaned[0] && /^--\d+$/.test(cleaned[0])) {
    cleaned[0] = cleaned[0].slice(2);
  }

  return cleaned;
}

function parseArgs(argv) {
  const args = normalizeArgs(argv);
  const options = {
    ownerId: null,
    yes: false,
    dryRun: false,
    help: false,
  };

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    if (arg === '--yes') {
      options.yes = true;
      continue;
    }

    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (arg.startsWith('--owner-id=')) {
      options.ownerId = Number(arg.split('=')[1]);
      continue;
    }

    if (arg.startsWith('--owner=')) {
      options.ownerId = Number(arg.split('=')[1]);
      continue;
    }

    if (arg.startsWith('--')) {
      throw new Error(`Unknown argument: ${arg}`);
    }

    if (options.ownerId == null) {
      options.ownerId = Number(arg);
      continue;
    }

    throw new Error(`Unexpected positional argument: ${arg}`);
  }

  if (options.ownerId != null && (!Number.isInteger(options.ownerId) || options.ownerId <= 0)) {
    throw new Error('owner-id must be a positive integer.');
  }

  return options;
}

async function findListingIds(client, ownerId) {
  const query = ownerId
    ? 'SELECT id FROM listings WHERE owner_id = $1'
    : 'SELECT id FROM listings';
  const params = ownerId ? [ownerId] : [];

  const res = await client.query(query, params);
  return res.rows.map((row) => Number(row.id));
}

async function collectStats(client, listingIds) {
  const list = listingIds;

  const statsRes = await client.query(
    `
      SELECT
        (SELECT COUNT(*)::bigint FROM listings WHERE id = ANY($1::bigint[])) AS listings,
        (SELECT COUNT(*)::bigint FROM listing_images WHERE listing_id = ANY($1::bigint[])) AS listing_images,
        (SELECT COUNT(*)::bigint FROM listing_promotions WHERE listing_id = ANY($1::bigint[])) AS listing_promotions,
        (SELECT COUNT(*)::bigint FROM listing_views WHERE listing_id = ANY($1::bigint[])) AS listing_views,
        (SELECT COUNT(*)::bigint FROM favorites WHERE property_id = ANY($1::bigint[])) AS favorites,
        (SELECT COUNT(*)::bigint FROM viewings WHERE property_id = ANY($1::bigint[])) AS viewings,
        (SELECT COUNT(*)::bigint FROM reviews WHERE listing_id = ANY($1::bigint[])) AS reviews,
        (SELECT COUNT(*)::bigint FROM conversations WHERE property_id = ANY($1::bigint[])) AS conversations,
        (
          SELECT COUNT(*)::bigint
          FROM messages m
          WHERE m.conversation_id IN (
            SELECT c.id FROM conversations c WHERE c.property_id = ANY($1::bigint[])
          )
        ) AS messages,
        (SELECT COUNT(*)::bigint FROM kyc_documents WHERE property_id = ANY($1::bigint[])) AS kyc_documents
    `,
    [list],
  );

  return statsRes.rows[0];
}

function printStats(stats) {
  console.log('Will affect:');
  console.log(`  listings:           ${stats.listings}`);
  console.log(`  listing_images:     ${stats.listing_images}`);
  console.log(`  listing_promotions: ${stats.listing_promotions}`);
  console.log(`  listing_views:      ${stats.listing_views}`);
  console.log(`  favorites:          ${stats.favorites}`);
  console.log(`  viewings:           ${stats.viewings}`);
  console.log(`  reviews:            ${stats.reviews}`);
  console.log(`  conversations:      ${stats.conversations}`);
  console.log(`  messages:           ${stats.messages}`);
  console.log(`  kyc_documents link: ${stats.kyc_documents}`);
}

async function clearListings(client, listingIds) {
  const ids = listingIds;

  const viewingsRes = await client.query(
    'SELECT id FROM viewings WHERE property_id = ANY($1::bigint[])',
    [ids],
  );
  const viewingIds = viewingsRes.rows.map((row) => Number(row.id));

  const conversationsRes = await client.query(
    'SELECT id FROM conversations WHERE property_id = ANY($1::bigint[])',
    [ids],
  );
  const conversationIds = conversationsRes.rows.map((row) => Number(row.id));

  const deleted = {
    reviews: 0,
    listingViews: 0,
    listingImages: 0,
    listingPromotions: 0,
    favorites: 0,
    viewings: 0,
    messages: 0,
    conversations: 0,
    kycDocumentsUnlinked: 0,
    listings: 0,
  };

  if (viewingIds.length > 0) {
    const reviewsByViewing = await client.query(
      'DELETE FROM reviews WHERE viewing_id = ANY($1::bigint[])',
      [viewingIds],
    );
    deleted.reviews += reviewsByViewing.rowCount || 0;
  }

  const reviewsByListing = await client.query(
    'DELETE FROM reviews WHERE listing_id = ANY($1::bigint[])',
    [ids],
  );
  deleted.reviews += reviewsByListing.rowCount || 0;

  const listingViewsDelete = await client.query(
    'DELETE FROM listing_views WHERE listing_id = ANY($1::bigint[])',
    [ids],
  );
  deleted.listingViews = listingViewsDelete.rowCount || 0;

  const listingImagesDelete = await client.query(
    'DELETE FROM listing_images WHERE listing_id = ANY($1::bigint[])',
    [ids],
  );
  deleted.listingImages = listingImagesDelete.rowCount || 0;

  const listingPromotionsDelete = await client.query(
    'DELETE FROM listing_promotions WHERE listing_id = ANY($1::bigint[])',
    [ids],
  );
  deleted.listingPromotions = listingPromotionsDelete.rowCount || 0;

  const favoritesDelete = await client.query(
    'DELETE FROM favorites WHERE property_id = ANY($1::bigint[])',
    [ids],
  );
  deleted.favorites = favoritesDelete.rowCount || 0;

  const viewingsDelete = await client.query(
    'DELETE FROM viewings WHERE property_id = ANY($1::bigint[])',
    [ids],
  );
  deleted.viewings = viewingsDelete.rowCount || 0;

  if (conversationIds.length > 0) {
    const messagesDelete = await client.query(
      'DELETE FROM messages WHERE conversation_id = ANY($1::bigint[])',
      [conversationIds],
    );
    deleted.messages = messagesDelete.rowCount || 0;
  }

  const conversationsDelete = await client.query(
    'DELETE FROM conversations WHERE property_id = ANY($1::bigint[])',
    [ids],
  );
  deleted.conversations = conversationsDelete.rowCount || 0;

  const kycDocumentsUnlink = await client.query(
    'UPDATE kyc_documents SET property_id = NULL WHERE property_id = ANY($1::bigint[])',
    [ids],
  );
  deleted.kycDocumentsUnlinked = kycDocumentsUnlink.rowCount || 0;

  const listingsDelete = await client.query(
    'DELETE FROM listings WHERE id = ANY($1::bigint[])',
    [ids],
  );
  deleted.listings = listingsDelete.rowCount || 0;

  return deleted;
}

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`Argument error: ${error.message}`);
    printUsage();
    process.exit(1);
  }

  if (options.help) {
    printUsage();
    return;
  }

  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'postgres',
    database: process.env.DB_NAME || 'domaris',
  });

  try {
    await client.connect();

    const listingIds = await findListingIds(client, options.ownerId);

    if (listingIds.length === 0) {
      console.log('No listings found for the given filter.');
      return;
    }

    console.log(`Found ${listingIds.length} listing(s).`);
    const stats = await collectStats(client, listingIds);
    printStats(stats);

    if (options.dryRun) {
      console.log('Dry run complete. No data was deleted.');
      return;
    }

    if (!options.yes) {
      console.error('Refusing to delete without --yes.');
      process.exit(1);
    }

    await client.query('BEGIN');
    const deleted = await clearListings(client, listingIds);
    await client.query('COMMIT');

    console.log('Deletion completed.');
    console.log(`  listings:           ${deleted.listings}`);
    console.log(`  listing_images:     ${deleted.listingImages}`);
    console.log(`  listing_promotions: ${deleted.listingPromotions}`);
    console.log(`  listing_views:      ${deleted.listingViews}`);
    console.log(`  favorites:          ${deleted.favorites}`);
    console.log(`  viewings:           ${deleted.viewings}`);
    console.log(`  reviews:            ${deleted.reviews}`);
    console.log(`  conversations:      ${deleted.conversations}`);
    console.log(`  messages:           ${deleted.messages}`);
    console.log(`  kyc_documents unlinked: ${deleted.kycDocumentsUnlinked}`);
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // ignore rollback errors
    }

    console.error('Clear listings failed:', error.message || error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
