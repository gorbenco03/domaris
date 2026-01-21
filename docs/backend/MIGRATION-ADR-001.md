# 🔄 Database Migration: ADR-001 Unified Account Model

## Migration Script

Run this SQL script to migrate the database to the new unified account model:

```sql
-- ============================================================================
-- ADR-001: Migration to Unified Account Model
-- Date: 2026-01-21
-- ============================================================================

-- 1. Add new columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP;

-- 2. Update verification_level based on existing data
-- If user has role 'admin', set is_admin to true
UPDATE users SET is_admin = TRUE WHERE role = 'admin';

-- 3. Set email_verified based on Google/Apple OAuth (assumed verified)
UPDATE users SET email_verified = TRUE WHERE google_id IS NOT NULL OR apple_id IS NOT NULL;

-- 4. Set default verification_level to 1 for verified emails
UPDATE users SET verification_level = 1 WHERE email_verified = TRUE AND verification_level = 0;

-- 5. Make role column nullable for gradual migration
ALTER TABLE users ALTER COLUMN role DROP NOT NULL;

-- 6. Update notification_preferences default value
UPDATE users
SET notification_preferences = jsonb_set(
  COALESCE(notification_preferences, '{}'::jsonb),
  '{sms}',
  'false'::jsonb
)
WHERE notification_preferences IS NOT NULL AND NOT notification_preferences ? 'sms';

-- ============================================================================
-- Listing table updates (if needed)
-- ============================================================================

-- Add transactionType if not exists
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(10) DEFAULT 'RENT',
ADD COLUMN IF NOT EXISTS property_type VARCHAR(20) DEFAULT 'APARTMENT';

-- Migrate old status values to new
UPDATE listings SET status = 'DRAFT' WHERE status = 'new';
UPDATE listings SET status = 'PENDING_REVIEW' WHERE status = 'early_access';
UPDATE listings SET status = 'ACTIVE' WHERE status = 'public';
UPDATE listings SET status = 'RENTED' WHERE status = 'rented';
UPDATE listings SET status = 'HIDDEN' WHERE status = 'hidden';
UPDATE listings SET status = 'EXPIRED' WHERE status = 'expired';

-- ============================================================================
-- Verification
-- ============================================================================

-- Verify migration
SELECT
  COUNT(*) as total_users,
  SUM(CASE WHEN is_admin THEN 1 ELSE 0 END) as admins,
  SUM(CASE WHEN email_verified THEN 1 ELSE 0 END) as email_verified,
  SUM(CASE WHEN phone_verified THEN 1 ELSE 0 END) as phone_verified,
  SUM(CASE WHEN verification_level = 0 THEN 1 ELSE 0 END) as level_0,
  SUM(CASE WHEN verification_level = 1 THEN 1 ELSE 0 END) as level_1,
  SUM(CASE WHEN verification_level = 2 THEN 1 ELSE 0 END) as level_2,
  SUM(CASE WHEN verification_level = 3 THEN 1 ELSE 0 END) as level_3
FROM users;
```

## Rollback Script (if needed)

```sql
-- Rollback ADR-001 changes
ALTER TABLE users
DROP COLUMN IF EXISTS is_admin,
DROP COLUMN IF EXISTS email_verified,
DROP COLUMN IF EXISTS phone_verified,
DROP COLUMN IF EXISTS reviews_count,
DROP COLUMN IF EXISTS last_active_at;

ALTER TABLE users ALTER COLUMN role SET NOT NULL;
```

## Notes

1. **Sequelize Auto-Sync**: If `synchronize: true` is enabled in development, the columns will be created automatically. This script is for production migrations.

2. **Data Preservation**: The old `role` column is kept for now (made nullable) to allow gradual migration. It can be dropped after all services are updated.

3. **Verification Level Logic**:
   - 0 = New account (default)
   - 1 = Email/Phone verified (set by OAuth or manual verification)
   - 2 = Identity verified (set by admin after KYC review)
   - 3 = Property owner verified (set by admin after document review)
