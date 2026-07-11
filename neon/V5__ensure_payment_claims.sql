-- Ensure payment_claims exists (safe to re-run). Hibernate ddl-auto=update usually creates this too.
CREATE TABLE IF NOT EXISTS payment_claims (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id          UUID NOT NULL,
    charge_id           UUID NOT NULL,
    member_id           UUID NOT NULL,
    member_name         VARCHAR(150),
    flat_number         VARCHAR(20) NOT NULL,
    amount              NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_mode        VARCHAR(30),
    reference_number    VARCHAR(100),
    notes               VARCHAR(500),
    status              VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED'
                        CHECK (status IN ('SUBMITTED', 'APPROVED', 'REJECTED')),
    reviewed_by         UUID,
    reviewed_at         TIMESTAMPTZ,
    review_notes        VARCHAR(500),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_claims_society_status
    ON payment_claims (society_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_claims_member
    ON payment_claims (society_id, member_id, created_at DESC);
