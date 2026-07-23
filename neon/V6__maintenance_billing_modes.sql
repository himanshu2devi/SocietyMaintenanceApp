-- SAME vs VARIABLE maintenance billing (additive only)
-- Run once in Neon SQL Editor on Societywale (optional if Hibernate ddl-auto=update)

CREATE TABLE IF NOT EXISTS society_maintenance_settings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id      UUID NOT NULL,
    billing_mode    VARCHAR(20) NOT NULL,
    configured_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    configured_by   UUID NOT NULL,
    CONSTRAINT uq_maint_settings_society UNIQUE (society_id),
    CONSTRAINT chk_maint_billing_mode CHECK (billing_mode IN ('SAME', 'VARIABLE'))
);

CREATE TABLE IF NOT EXISTS member_maintenance_defaults (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id      UUID NOT NULL,
    member_id       UUID NOT NULL,
    flat_number     VARCHAR(40) NOT NULL,
    amount          NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    updated_by      UUID NOT NULL,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_member_maint_default UNIQUE (society_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_member_maint_society
    ON member_maintenance_defaults (society_id);

CREATE INDEX IF NOT EXISTS idx_member_maint_flat
    ON member_maintenance_defaults (society_id, flat_number);
