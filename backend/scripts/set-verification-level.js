#!/usr/bin/env node
/**
 * Setează verification_level pentru un user (development / admin direct în DB).
 * Utilizare:
 *   node backend/scripts/set-verification-level.js <userId> <level>
 *   pnpm set-verification-level 6 2
 *
 * level: 0 | 1 | 2 | 3
 *   0 = neverificat
 *   1 = email/phone verificat
 *   2 = KYC nivel 1 (poate contacta, viewing)
 *   3 = KYC nivel 2 (poate posta anunțuri)
 */

const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') });
}

const { Client } = require('pg');

async function setVerificationLevel(userId, level) {
  const levelNum = parseInt(level, 10);
  if (Number.isNaN(levelNum) || levelNum < 0 || levelNum > 3) {
    console.error('Eroare: level trebuie să fie 0, 1, 2 sau 3');
    process.exit(1);
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

    const check = await client.query(
      'SELECT id, email, first_name, last_name, verification_level FROM users WHERE id = $1',
      [userId]
    );
    if (check.rows.length === 0) {
      console.error('Eroare: User cu id', userId, 'nu există.');
      process.exit(1);
    }

    const prev = check.rows[0].verification_level;
    await client.query(
      'UPDATE users SET verification_level = $1, updated_at = NOW() WHERE id = $2',
      [levelNum, userId]
    );

    console.log('OK');
    console.log('User:', check.rows[0].email, `(${check.rows[0].first_name} ${check.rows[0].last_name})`);
    console.log('verification_level:', prev, '->', levelNum);
  } catch (err) {
    console.error('Eroare:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

const userId = process.argv[2];
const level = process.argv[3];
if (!userId || !level) {
  console.error('Utilizare: node set-verification-level.js <userId> <level>');
  console.error('Exemplu: node set-verification-level.js 6 2');
  process.exit(1);
}

setVerificationLevel(userId, level);
