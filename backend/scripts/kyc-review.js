#!/usr/bin/env node
/**
 * Aprobă sau respinge o cerere KYC direct în DB (fără token admin).
 * Doar pentru development / când nu ai cont admin.
 *
 * Aprobare:
 *   pnpm kyc-review -- approve <userId>
 *   node backend/scripts/kyc-review.js approve 6
 *
 * Respingere:
 *   pnpm kyc-review -- reject <userId> "Motivul respingerii"
 *   node backend/scripts/kyc-review.js reject 6 "Document expirat"
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

async function run() {
  const action = process.argv[2]; // approve | reject
  const userId = process.argv[3];
  const reason = process.argv[4]; // obligatoriu la reject

  if (!action || !userId) {
    console.error('Utilizare:');
    console.error('  Aprobare:  node kyc-review.js approve <userId>');
    console.error('  Respingere: node kyc-review.js reject <userId> "Motivul"');
    process.exit(1);
  }

  if (action !== 'approve' && action !== 'reject') {
    console.error('Acțiune trebuie să fie: approve sau reject');
    process.exit(1);
  }

  if (action === 'reject' && !reason) {
    console.error('La respingere trebuie să dai un motiv (în ghilimele).');
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

    const userRow = await client.query(
      'SELECT id, email, first_name, last_name, verification_level FROM users WHERE id = $1',
      [userId]
    );
    if (userRow.rows.length === 0) {
      console.error('User cu id', userId, 'nu există.');
      process.exit(1);
    }

    const kvRow = await client.query(
      `SELECT id, user_id, status, target_level, submitted_at
       FROM kyc_verifications
       WHERE user_id = $1
       ORDER BY submitted_at DESC NULLS LAST
       LIMIT 1`,
      [userId]
    );
    if (kvRow.rows.length === 0) {
      console.error('Nu există cerere KYC pentru user id', userId);
      process.exit(1);
    }

    const kv = kvRow.rows[0];
    if (kv.status === 'APPROVED') {
      console.error('Cererea este deja aprobată.');
      process.exit(1);
    }
    if (kv.status === 'REJECTED') {
      console.error('Cererea este deja respinsă.');
      process.exit(1);
    }

    const now = new Date().toISOString();
    const verificationId = kv.id;
    const targetLevel = parseInt(kv.target_level, 10);

    if (action === 'approve') {
      await client.query(
        `UPDATE kyc_verifications
         SET status = 'APPROVED', reviewed_at = $1, reviewed_by = NULL, rejection_reason = NULL, updated_at = $1
         WHERE id = $2`,
        [now, verificationId]
      );
      await client.query(
        `UPDATE kyc_documents
         SET status = 'APPROVED', reviewed_at = $1, updated_at = $1
         WHERE verification_id = $2`,
        [now, verificationId]
      );
      await client.query(
        `UPDATE users
         SET verification_level = GREATEST(verification_level, $1), updated_at = $2
         WHERE id = $3`,
        [targetLevel, now, userId]
      );
      console.log('OK – Cerere KYC aprobată.');
      console.log('User:', userRow.rows[0].email, `(${userRow.rows[0].first_name} ${userRow.rows[0].last_name})`);
      console.log('Nivel setat la:', Math.max(userRow.rows[0].verification_level, targetLevel));
    } else {
      await client.query(
        `UPDATE kyc_verifications
         SET status = 'REJECTED', reviewed_at = $1, reviewed_by = NULL, rejection_reason = $2, updated_at = $1
         WHERE id = $3`,
        [now, reason, verificationId]
      );
      await client.query(
        `UPDATE kyc_documents
         SET status = 'REJECTED', reviewed_at = $1, rejection_reason = $2, updated_at = $1
         WHERE verification_id = $3`,
        [now, reason, verificationId]
      );
      console.log('OK – Cerere KYC respinsă.');
      console.log('User:', userRow.rows[0].email);
      console.log('Motiv:', reason);
    }
  } catch (err) {
    console.error('Eroare:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
