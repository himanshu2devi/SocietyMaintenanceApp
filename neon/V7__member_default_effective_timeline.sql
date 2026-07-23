-- VARIABLE member amounts: effective-from timeline (additive / safe to re-run)

ALTER TABLE member_maintenance_defaults
    ADD COLUMN IF NOT EXISTS effective_from_year INTEGER;

ALTER TABLE member_maintenance_defaults
    ADD COLUMN IF NOT EXISTS effective_from_month INTEGER;

UPDATE member_maintenance_defaults
SET effective_from_year = 2000
WHERE effective_from_year IS NULL;

UPDATE member_maintenance_defaults
SET effective_from_month = 1
WHERE effective_from_month IS NULL;

ALTER TABLE member_maintenance_defaults
    ALTER COLUMN effective_from_year SET DEFAULT 2000;

ALTER TABLE member_maintenance_defaults
    ALTER COLUMN effective_from_month SET DEFAULT 1;

ALTER TABLE member_maintenance_defaults
    ALTER COLUMN effective_from_year SET NOT NULL;

ALTER TABLE member_maintenance_defaults
    ALTER COLUMN effective_from_month SET NOT NULL;

ALTER TABLE member_maintenance_defaults
    DROP CONSTRAINT IF EXISTS uq_member_maint_default;

ALTER TABLE member_maintenance_defaults
    DROP CONSTRAINT IF EXISTS uq_member_maint_default_effective;

ALTER TABLE member_maintenance_defaults
    ADD CONSTRAINT uq_member_maint_default_effective
        UNIQUE (society_id, member_id, effective_from_year, effective_from_month);

CREATE INDEX IF NOT EXISTS idx_member_maint_effective
    ON member_maintenance_defaults (society_id, member_id, effective_from_year DESC, effective_from_month DESC);

ALTER TABLE maintenance_charges
    ADD COLUMN IF NOT EXISTS transaction_reference VARCHAR(120);
