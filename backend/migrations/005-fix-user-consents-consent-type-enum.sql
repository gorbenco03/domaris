/**
 * Migration: Fix user_consents.consentType enum (Sequelize sync generates invalid SQL)
 *
 * Run this ONCE if backend fails with "syntax error at or near USING" on user_consents.
 *
 * Usage:
 *   psql -U postgres -d domaris -f backend/migrations/005-fix-user-consents-consent-type-enum.sql
 *   (adjust -U and -d to your DB_USER / DB_NAME from .env)
 */

-- Create enum type if not exists (GDPR consent types)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_user_consents_consentType') THEN
    CREATE TYPE "public"."enum_user_consents_consentType" AS ENUM (
      'TERMS', 'PRIVACY', 'GDPR', 'MARKETING', 'ANALYTICS'
    );
  END IF;
END
$$;

-- Only alter column if table exists (e.g. created by Sequelize sync earlier)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_consents') THEN
    -- Change column type with proper USING (cast existing values to text then to new enum)
    ALTER TABLE "user_consents"
      ALTER COLUMN "consentType" TYPE "public"."enum_user_consents_consentType"
      USING ("consentType"::text::"public"."enum_user_consents_consentType");
  END IF;
END
$$;
