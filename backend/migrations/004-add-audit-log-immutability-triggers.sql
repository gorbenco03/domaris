/**
 * Migration: Add Immutability Triggers to admin_audit_logs
 *
 * Purpose: Make audit logs truly IMMUTABLE - cannot be updated or deleted
 * Compliance: GDPR Article 30, Moldova Law 133/2011
 *
 * Usage:
 *   psql -U domaris -d domaris -f migrations/004-add-audit-log-immutability-triggers.sql
 */

-- ============================================================================
-- PREVENT UPDATE
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_audit_log_update()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable and cannot be modified. Action: %, Table: %, User: %',
    TG_OP, TG_TABLE_NAME, current_user
  USING HINT = 'Audit logs must remain unchanged for compliance purposes';
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists (for re-running migration)
DROP TRIGGER IF EXISTS block_audit_update ON admin_audit_logs;

-- Create trigger on UPDATE
CREATE TRIGGER block_audit_update
  BEFORE UPDATE ON admin_audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_log_update();

-- ============================================================================
-- PREVENT DELETE
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_audit_log_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable and cannot be deleted. Action: %, Table: %, User: %',
    TG_OP, TG_TABLE_NAME, current_user
  USING HINT = 'Audit logs must be retained for compliance purposes. Use archival process instead.';
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists (for re-running migration)
DROP TRIGGER IF EXISTS block_audit_delete ON admin_audit_logs;

-- Create trigger on DELETE
CREATE TRIGGER block_audit_delete
  BEFORE DELETE ON admin_audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_log_delete();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Test that UPDATE is blocked (should fail)
-- UPDATE admin_audit_logs SET reason = 'test' WHERE id = 1;

-- Test that DELETE is blocked (should fail)
-- DELETE FROM admin_audit_logs WHERE id = 1;

-- ============================================================================
-- ROLLBACK (if needed - DANGEROUS!)
-- ============================================================================

-- Only use this if you need to remove immutability (NOT recommended)
-- DROP TRIGGER IF EXISTS block_audit_update ON admin_audit_logs;
-- DROP TRIGGER IF EXISTS block_audit_delete ON admin_audit_logs;
-- DROP FUNCTION IF EXISTS prevent_audit_log_update();
-- DROP FUNCTION IF EXISTS prevent_audit_log_delete();

COMMENT ON TABLE admin_audit_logs IS 'IMMUTABLE audit log table protected by triggers. Cannot UPDATE or DELETE records.';
COMMENT ON TRIGGER block_audit_update ON admin_audit_logs IS 'Prevents modification of audit logs for compliance';
COMMENT ON TRIGGER block_audit_delete ON admin_audit_logs IS 'Prevents deletion of audit logs for compliance';
