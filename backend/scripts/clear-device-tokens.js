#!/usr/bin/env node
/**
 * Șterge DOAR device tokens (tabela devices) - dev only.
 *
 * Usage:
 *   node backend/scripts/clear-device-tokens.js --yes
 *   # sau din backend/
 *   node scripts/clear-device-tokens.js --yes
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

async function clearDeviceTokens() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (nodeEnv !== 'development') {
    console.error(`Refuz să rulez clear-device-tokens pe NODE_ENV=${nodeEnv}. Setează NODE_ENV=development.`);
    process.exit(1);
  }

  const host = process.env.DB_HOST || 'localhost';
  const port = Number(process.env.DB_PORT) || 5432;
  const user = process.env.DB_USER || 'postgres';
  const password = process.env.DB_PASS || 'postgres';
  const database = process.env.DB_NAME || 'domaris';

  if (!hasFlag('--yes')) {
    console.log('Acest script ȘTERGE toate device tokens din tabela devices (dev only).');
    console.log(`Target: ${user}@${host}:${port}/${database} (NODE_ENV=${nodeEnv})`);
    console.log('Rulează cu --yes ca să confirmi.');
    process.exit(1);
  }

  const typed = await prompt('Scrie exact DELETE_DEVICES ca să continui: ');
  if (typed !== 'DELETE_DEVICES') {
    console.error('Confirmare eșuată. Nimic nu a fost șters.');
    process.exit(1);
  }

  const client = new Client({ host, port, user, password, database });

  try {
    await client.connect();

    const before = await client.query('SELECT COUNT(*)::int AS count FROM devices WHERE deleted_at IS NULL;');

    await client.query('BEGIN');
    await client.query('DELETE FROM devices;');
    await client.query('COMMIT');

    const after = await client.query('SELECT COUNT(*)::int AS count FROM devices WHERE deleted_at IS NULL;');

    console.log(`✅ Cleared devices table. Before: ${before.rows[0].count}, After: ${after.rows[0].count}`);
    console.log('Next: deschide app pe fiecare device (logat pe contul corect) ca să reînregistrezi token-ul.');
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {
      // ignore
    }
    console.error('❌ Clear failed:', err?.message || err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

clearDeviceTokens();
