-- Migration: Add ownership verification fields to listings
-- This supports per-listing ownership document upload + admin review

-- Create the enum type first
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_listings_ownership_status') THEN
        CREATE TYPE "enum_listings_ownership_status" AS ENUM ('none', 'pending', 'verified', 'rejected');
    END IF;
END$$;

-- Add ownership verification columns to listings table
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS ownership_status "enum_listings_ownership_status" NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS ownership_doc_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS ownership_doc_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS ownership_rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS ownership_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ownership_reviewed_by BIGINT REFERENCES users(id);

-- Index for admin queries (find all pending ownership reviews)
CREATE INDEX IF NOT EXISTS idx_listings_ownership_status ON listings(ownership_status)
  WHERE ownership_status = 'pending';
