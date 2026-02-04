-- Migration: Add extended profile fields to users table
-- Date: 2026-02-04
-- Purpose: Sprint 1 - Profile editing and notification settings

-- Add address fields
ALTER TABLE users
ADD COLUMN address TEXT,
ADD COLUMN city VARCHAR(100),
ADD COLUMN country VARCHAR(100),
ADD COLUMN postal_code VARCHAR(20);

-- Add social links (JSONB)
ALTER TABLE users
ADD COLUMN social_links JSONB DEFAULT '{}';

-- Add notification quiet hours
ALTER TABLE users
ADD COLUMN notification_quiet_hours_start TIME DEFAULT '22:00:00',
ADD COLUMN notification_quiet_hours_end TIME DEFAULT '08:00:00';

-- Create index on city for location-based searches
CREATE INDEX idx_users_city ON users(city) WHERE city IS NOT NULL;

-- Update existing notification preferences to include quiet hours
UPDATE users
SET notification_preferences = jsonb_set(
  jsonb_set(
    notification_preferences,
    '{quietHoursEnabled}',
    'false'::jsonb
  ),
  '{quietHoursStart}',
    '"22:00"'::jsonb
)
WHERE notification_preferences IS NOT NULL;
