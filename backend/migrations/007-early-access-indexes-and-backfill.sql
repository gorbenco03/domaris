-- ============================================================================
-- MIGRATION 007: Early Access Backfill + Performance Indexes
-- Date: 2026-02-17
-- Purpose:
--   1) Backfill posted_at/public_from for existing listings
--   2) Auto-publish stale early_access rows (where publish time already passed)
--   3) Add indexes for early-access cron + visibility queries (list/map/search)
-- ============================================================================

-- 1) Ensure posted_at exists for legacy rows
UPDATE listings
SET posted_at = COALESCE(posted_at, created_at, NOW())
WHERE posted_at IS NULL;

-- 2) Backfill public_from for early_access rows that don't have it
UPDATE listings
SET public_from = COALESCE(
  public_from,
  posted_at + INTERVAL '12 hours',
  created_at + INTERVAL '12 hours',
  NOW() + INTERVAL '12 hours'
)
WHERE status = 'early_access'
  AND public_from IS NULL;

-- 3) Auto-publish rows where early-access window is already finished
UPDATE listings
SET status = 'public'
WHERE status = 'early_access'
  AND COALESCE(public_from, posted_at + INTERVAL '12 hours', created_at + INTERVAL '12 hours') <= NOW();

-- 4) Index for cron job: status='early_access' AND public_from <= now()
CREATE INDEX IF NOT EXISTS idx_listings_early_access_public_from
  ON listings (public_from)
  WHERE status = 'early_access' AND deleted_at IS NULL;

-- 5) General index for visibility filters used in list/search endpoints
CREATE INDEX IF NOT EXISTS idx_listings_status_public_from
  ON listings (status, public_from)
  WHERE deleted_at IS NULL;

-- 6) Map-search oriented index (status + bounds fields)
CREATE INDEX IF NOT EXISTS idx_listings_status_lat_lng
  ON listings (status, lat, lng)
  WHERE deleted_at IS NULL AND lat IS NOT NULL AND lng IS NOT NULL;

-- Optional verification (manual):
-- SELECT status, COUNT(*) FROM listings GROUP BY status;
-- SELECT COUNT(*) FROM listings WHERE status='early_access' AND public_from IS NULL;
