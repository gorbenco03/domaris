#!/usr/bin/env node
/**
 * Șterge COMPLET baza de date (dev only) prin resetarea schemei public.
 *
 * Usage:
 *   node backend/scripts/wipe-db.js --yes
 *   # sau din backend/
 *   node scripts/wipe-db.js --yes
 */

const path = require('path');
const fs = require('fs');
const readline = require('readline');
const { Client } = require('pg');

const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') });
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

async function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise((resolve) => rl.question(question, resolve));
  rl.close();
  return String(answer || '').trim();
}

async function wipeDb() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (nodeEnv !== 'development') {
    console.error(`Refuz să rulez wipe-db pe NODE_ENV=${nodeEnv}. Setează NODE_ENV=development.`);
    process.exit(1);
  }

  const host = process.env.DB_HOST || 'localhost';
  const port = Number(process.env.DB_PORT) || 5432;
  const user = process.env.DB_USER || 'postgres';
  const password = process.env.DB_PASS || 'postgres';
  const database = process.env.DB_NAME || 'domaris';

  if (!hasFlag('--yes')) {
    console.log('Acest script ȘTERGE TOT din baza de date (DROP SCHEMA public CASCADE).');
    console.log(`Target: ${user}@${host}:${port}/${database} (NODE_ENV=${nodeEnv})`);
    console.log('Rulează cu --yes ca să confirmi.');
    process.exit(1);
  }

  const typed = await prompt(`Scrie exact numele DB ca să continui (${database}): `);
  if (typed !== database) {
    console.error('Confirmare eșuată. Nimic nu a fost șters.');
    process.exit(1);
  }

  const client = new Client({ host, port, user, password, database });

  try {
    await client.connect();
    await client.query('BEGIN');

    // Reset complet: șterge toate tabelele, view-urile, funcțiile etc. din schema public.
    await client.query('DROP SCHEMA IF EXISTS public CASCADE;');
    await client.query('CREATE SCHEMA public;');

    // Reacordă permisiuni uzuale (default pentru Postgres)
    await client.query('GRANT ALL ON SCHEMA public TO public;');

    await client.query('COMMIT');

    console.log('✅ DB wiped successfully. Schema public a fost recreată.');
    console.log('Next: rulează migrations / sync (ex: pornește backend-ul ca să recreeze tabelele).');
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {
      // ignore
    }
    console.error('❌ Wipe failed:', err?.message || err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

wipeDb();
