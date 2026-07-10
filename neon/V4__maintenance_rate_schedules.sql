-- Timeline-based society maintenance rates (additive only)
-- Run once in Neon SQL Editor on Societywale

CREATE TABLE IF NOT EXISTS maintenance_rate_schedules (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id              UUID NOT NULL,
    amount                  NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    effective_from_year     INTEGER NOT NULL CHECK (effective_from_year BETWEEN 2000 AND 2100),
    effective_from_month    INTEGER NOT NULL CHECK (effective_from_month BETWEEN 1 AND 12),
    notes                   VARCHAR(500),
    created_by              UUID NOT NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_rate_society_effective
        UNIQUE (society_id, effective_from_year, effective_from_month)
);

CREATE INDEX IF NOT EXISTS idx_rate_society_effective
    ON maintenance_rate_schedules (society_id, effective_from_year DESC, effective_from_month DESC);
