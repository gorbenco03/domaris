#!/usr/bin/env node
/**
 * Listează toți userii din baza de date (fără parolă).
 * Rulează din root: node backend/scripts/list-users.js
 * Sau din backend: node scripts/list-users.js
 */

const path = require('path');
const fs = require('fs');

// Încarcă .env din backend
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') });
}

const { Client } = require('pg');

async function listUsers() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'postgres',
    database: process.env.DB_NAME || 'domaris',
  });

  try {
    await client.connect();
    const res = await client.query(`
      SELECT id, email, phone, first_name, last_name,
             verification_level, email_verified, phone_verified, is_admin,
             has_active_subscription, created_at
      FROM users
      ORDER BY created_at DESC
    `);
    console.log(JSON.stringify(res.rows, null, 2));
    console.log('\nTotal:', res.rows.length, 'user(i)');
  } catch (err) {
    console.error('Eroare:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

listUsers();
