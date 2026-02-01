#!/usr/bin/env node
/**
 * Listează toate cererile de verificare KYC (nivel 2/3) cu user și documente.
 * Utilizare:
 *   pnpm list-kyc-requests
 *   pnpm list-kyc-requests -- pending   (doar în așteptare)
 *   node backend/scripts/list-kyc-requests.js [pending|approved|rejected]
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

const statusFilter = process.argv[2]; // pending | approved | rejected sau nimic = toate

async function listKycRequests() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'postgres',
    database: process.env.DB_NAME || 'domaris',
  });

  try {
    await client.connect();

    let statusWhere = '';
    const params = [];
    if (statusFilter) {
      const normalized = statusFilter.toLowerCase();
      if (normalized === 'pending') {
        statusWhere = " AND kv.status IN ('PENDING', 'IN_REVIEW') ";
      } else if (normalized === 'approved') {
        statusWhere = " AND kv.status = 'APPROVED' ";
      } else if (normalized === 'rejected') {
        statusWhere = " AND kv.status = 'REJECTED' ";
      }
    }

    const verifications = await client.query(
      `
      SELECT
        kv.id AS verification_id,
        kv.user_id,
        kv.status,
        kv.target_level,
        kv.submitted_at,
        kv.reviewed_at,
        kv.reviewed_by,
        kv.rejection_reason,
        u.email,
        u.first_name,
        u.last_name,
        u.verification_level AS user_current_level
      FROM kyc_verifications kv
      JOIN users u ON u.id = kv.user_id
      WHERE 1=1 ${statusWhere}
      ORDER BY kv.submitted_at DESC NULLS LAST, kv.id DESC
    `,
      params
    );

    const rows = verifications.rows;
    if (rows.length === 0) {
      console.log('Nicio cerere de verificare KYC' + (statusFilter ? ` (filter: ${statusFilter})` : '') + '.');
      return;
    }

    const ids = rows.map((r) => r.verification_id);
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    const docsResult = await client.query(
      `SELECT verification_id, type, status, file_url, uploaded_at
       FROM kyc_documents
       WHERE verification_id IN (${placeholders})
       ORDER BY verification_id, type`,
      ids
    );
    const docsByVerification = {};
    for (const d of docsResult.rows) {
      if (!docsByVerification[d.verification_id]) docsByVerification[d.verification_id] = [];
      docsByVerification[d.verification_id].push(d);
    }

    console.log(JSON.stringify(rows.map((r) => ({
      verification_id: r.verification_id,
      user_id: r.user_id,
      email: r.email,
      first_name: r.first_name,
      last_name: r.last_name,
      status: r.status,
      target_level: r.target_level,
      user_current_level: r.user_current_level,
      submitted_at: r.submitted_at,
      reviewed_at: r.reviewed_at,
      rejection_reason: r.rejection_reason,
      documents: (docsByVerification[r.verification_id] || []).map((d) => ({
        type: d.type,
        status: d.status,
        file_url: d.file_url,
        uploaded_at: d.uploaded_at,
      })),
    })), null, 2));
    console.log('\nTotal cereri:', rows.length);
  } catch (err) {
    console.error('Eroare:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

listKycRequests();
