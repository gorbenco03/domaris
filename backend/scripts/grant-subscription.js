#!/usr/bin/env node
/**
 * Acordă sau actualizează abonamentul unui user direct în DB (dev/admin helper).
 *
 * Utilizare:
 *   node backend/scripts/grant-subscription.js <userId> <planCode> [billingCycle]
 *   pnpm grant-subscription -- 2 standard
 *   pnpm grant-subscription -- 2 premium yearly
 *
 * planCode: free | standard | premium | business (planul trebuie să fie activ)
 * billingCycle: monthly | yearly (default: monthly)
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

const VALID_BILLING_CYCLES = new Set(['monthly', 'yearly']);

function normalizeArgs(argv) {
  // Support calls like:
  // - node grant-subscription.js 2 standard
  // - node grant-subscription.js -- 2 standard
  // - pnpm grant-subscription -- 2 standard
  const cleaned = argv.filter((arg) => arg !== '--');

  if (cleaned[0] && /^--\d+$/.test(cleaned[0])) {
    cleaned[0] = cleaned[0].slice(2);
  }

  return cleaned;
}

async function grantSubscription(userIdRaw, planCodeRaw, billingCycleRaw = 'monthly') {
  const userId = parseInt(userIdRaw, 10);
  const planCode = String(planCodeRaw || '').toLowerCase();
  const billingCycle = String(billingCycleRaw || 'monthly').toLowerCase();

  if (Number.isNaN(userId) || userId <= 0) {
    console.error('Eroare: userId trebuie să fie un număr întreg pozitiv.');
    process.exit(1);
  }

  if (!planCode) {
    console.error('Eroare: planCode este obligatoriu (ex: standard, premium).');
    process.exit(1);
  }

  if (!VALID_BILLING_CYCLES.has(billingCycle)) {
    console.error('Eroare: billingCycle trebuie să fie monthly sau yearly.');
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
    await client.query('BEGIN');

    const userRes = await client.query(
      `SELECT id, email, first_name, last_name
       FROM users
       WHERE id = $1
       FOR UPDATE`,
      [userId]
    );

    if (userRes.rows.length === 0) {
      throw new Error(`User cu id ${userId} nu există.`);
    }

    const planRes = await client.query(
      `SELECT id, code, is_active
       FROM subscription_plans
       WHERE code = $1
       LIMIT 1`,
      [planCode]
    );

    if (planRes.rows.length === 0) {
      throw new Error(`Planul '${planCode}' nu există.`);
    }

    if (!planRes.rows[0].is_active) {
      throw new Error(`Planul '${planCode}' este inactiv.`);
    }

    if (planRes.rows[0].code === 'free') {
      throw new Error('Nu poți acorda explicit planul free. Folosește standard/premium/etc.');
    }

    const planId = planRes.rows[0].id;
    const now = new Date();
    const periodDays = billingCycle === 'yearly' ? 365 : 30;
    const periodEnd = new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000);

    const existingRes = await client.query(
      `SELECT id
       FROM user_subscriptions
       WHERE user_id = $1
         AND status IN ('active', 'trialing', 'past_due')
         AND deleted_at IS NULL
       ORDER BY id DESC
       LIMIT 1
       FOR UPDATE`,
      [userId]
    );

    let subscriptionId;

    if (existingRes.rows.length > 0) {
      subscriptionId = existingRes.rows[0].id;

      await client.query(
        `UPDATE user_subscriptions
         SET plan_id = $1,
             status = 'active',
             billing_cycle = $2,
             current_period_start = $3,
             current_period_end = $4,
             trial_ends_at = NULL,
             cancelled_at = NULL,
             grace_period_ends_at = NULL,
             auto_renew = true,
             boosts_reset_at = COALESCE(boosts_reset_at, $3),
             payment_provider = 'manual',
             deleted_at = NULL,
             updated_at = $3
         WHERE id = $5`,
        [planId, billingCycle, now, periodEnd, subscriptionId]
      );
    } else {
      const insertRes = await client.query(
        `INSERT INTO user_subscriptions (
          user_id,
          plan_id,
          status,
          billing_cycle,
          started_at,
          current_period_start,
          current_period_end,
          auto_renew,
          boosts_used_this_month,
          boosts_reset_at,
          payment_provider,
          metadata,
          created_at,
          updated_at
        ) VALUES (
          $1,
          $2,
          'active',
          $3,
          $4,
          $4,
          $5,
          true,
          0,
          $4,
          'manual',
          $6::jsonb,
          $4,
          $4
        ) RETURNING id`,
        [
          userId,
          planId,
          billingCycle,
          now,
          periodEnd,
          JSON.stringify({ source: 'grant-subscription-script' }),
        ]
      );

      subscriptionId = insertRes.rows[0].id;
    }

    await client.query(
      `UPDATE users
       SET has_active_subscription = true,
           subscription_expires_at = $1,
           updated_at = $2
       WHERE id = $3`,
      [periodEnd, now, userId]
    );

    await client.query('COMMIT');

    const summaryRes = await client.query(
      `SELECT us.id, us.user_id, sp.code AS plan_code, us.status, us.billing_cycle, us.current_period_end
       FROM user_subscriptions us
       JOIN subscription_plans sp ON sp.id = us.plan_id
       WHERE us.id = $1`,
      [subscriptionId]
    );

    const user = userRes.rows[0];
    const summary = summaryRes.rows[0];

    console.log('OK');
    console.log(
      'User:',
      `${user.email} (${user.first_name || ''} ${user.last_name || ''})`.trim()
    );
    console.log('Subscription ID:', summary.id);
    console.log('Plan:', summary.plan_code);
    console.log('Status:', summary.status);
    console.log('Billing cycle:', summary.billing_cycle);
    console.log('Expires at:', new Date(summary.current_period_end).toISOString());
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // ignore rollback errors
    }

    console.error('Eroare:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

const cliArgs = normalizeArgs(process.argv.slice(2));
const userId = cliArgs[0];
const planCode = cliArgs[1];
const billingCycle = cliArgs[2] || 'monthly';

if (!userId || !planCode) {
  console.error('Utilizare: node scripts/grant-subscription.js <userId> <planCode> [billingCycle]');
  console.error('Exemplu: node scripts/grant-subscription.js 2 standard');
  console.error('Exemplu: node scripts/grant-subscription.js -- 2 premium yearly');
  console.error('Exemplu: pnpm grant-subscription -- 2 premium yearly');
  process.exit(1);
}

grantSubscription(userId, planCode, billingCycle);
