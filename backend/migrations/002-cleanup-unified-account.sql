-- ============================================================================
-- MIGRATION 002: Cleanup Unified Account Model
-- Date: 2026-01-22
-- Description: Eliminare tenant/landlord, curățare Facebook, model unificat
-- ============================================================================

-- PART 1: Actualizare Conversations (tenant/landlord → participant1/participant2)
-- ============================================================================

-- Redenumire coloane pentru neutralitate
ALTER TABLE conversations 
  RENAME COLUMN tenant_id TO participant1_id;

ALTER TABLE conversations 
  RENAME COLUMN landlord_id TO participant2_id;

-- PART 2: Curățare User.role (folosim doar verificationLevel)
-- ============================================================================

-- Setează toate role-urile la NULL
UPDATE users SET role = NULL WHERE role IS NOT NULL;

-- PART 3: Curățare Listings (elimină câmpuri Facebook)
-- ============================================================================

-- Actualizare sourceType pentru listings existente
UPDATE listings 
SET source_type = 'manual' 
WHERE source_type = 'facebook' OR source_type IS NULL;

-- Elimină câmpurile Facebook (dacă există în DB)
-- Notă: Dacă folosești Sequelize sync, acestea vor fi eliminate automat
-- Dacă nu, decomentează:

-- ALTER TABLE listings DROP COLUMN IF EXISTS external_post_id;
-- ALTER TABLE listings DROP COLUMN IF EXISTS external_group_id;
-- ALTER TABLE listings DROP COLUMN IF EXISTS source_url;
-- ALTER TABLE listings DROP COLUMN IF EXISTS parsed_owner_name;
-- ALTER TABLE listings DROP COLUMN IF EXISTS parsed_owner_profile_url;
-- ALTER TABLE listings DROP COLUMN IF EXISTS reaction_count;
-- ALTER TABLE listings DROP COLUMN IF EXISTS share_count;
-- ALTER TABLE listings DROP COLUMN IF EXISTS comment_count;
-- ALTER TABLE listings DROP COLUMN IF EXISTS scraped_at;
-- ALTER TABLE listings DROP COLUMN IF EXISTS raw_source;

-- PART 4: Ștergere tabel GroupSources (dacă există)
-- ============================================================================

DROP TABLE IF EXISTS group_sources CASCADE;

-- PART 5: Verificare Finală
-- ============================================================================

-- Verifică users
SELECT 
  COUNT(*) as total_users,
  SUM(CASE WHEN role IS NULL THEN 1 ELSE 0 END) as role_null,
  SUM(CASE WHEN verification_level >= 2 THEN 1 ELSE 0 END) as can_post_listings,
  SUM(CASE WHEN is_admin = true THEN 1 ELSE 0 END) as admins
FROM users;

-- Verifică conversations
SELECT COUNT(*) as total_conversations
FROM conversations
WHERE participant1_id IS NOT NULL AND participant2_id IS NOT NULL;

-- Verifică listings
SELECT 
  source_type,
  COUNT(*) as count
FROM listings
GROUP BY source_type;

-- ============================================================================
-- Rezultat așteptat:
-- 1. Toate users.role = NULL
-- 2. Conversations folosesc participant1_id/participant2_id
-- 3. Listings au source_type = 'manual' sau 'imported'
-- ============================================================================
