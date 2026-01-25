-- ============================================================================
-- MIGRATION 003: Add anonymous_id to listing_views
-- Date: 2026-01-24
-- Description: Track guest views per device for 24h dedupe
-- ============================================================================

ALTER TABLE listing_views
  ADD COLUMN IF NOT EXISTS anonymous_id VARCHAR(64);

-- Indexes for recent view dedupe queries (24h window)
CREATE INDEX IF NOT EXISTS idx_listing_views_listing_viewer_created_at
  ON listing_views (listing_id, viewer_id, created_at);

CREATE INDEX IF NOT EXISTS idx_listing_views_listing_anonymous_created_at
  ON listing_views (listing_id, anonymous_id, created_at);
