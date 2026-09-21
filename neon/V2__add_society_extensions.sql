-- =============================================================================
-- ADDITIVE ONLY — do not alter existing tables
-- Run once in Neon SQL Editor against database: SocietySimplify Neon DB
-- =============================================================================

CREATE TABLE IF NOT EXISTS committee_profiles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id      UUID NOT NULL,
    user_id         UUID,
    full_name       VARCHAR(150) NOT NULL,
    title           VARCHAR(40) NOT NULL
                    CHECK (title IN ('CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE_MEMBER')),
    mobile          VARCHAR(20),
    email           VARCHAR(255),
    display_order   INTEGER NOT NULL DEFAULT 0,
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_committee_society
    ON committee_profiles (society_id, active, display_order);

CREATE TABLE IF NOT EXISTS society_bank_accounts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id      UUID NOT NULL,
    account_name    VARCHAR(150) NOT NULL,
    bank_name       VARCHAR(150) NOT NULL,
    account_number  VARCHAR(40) NOT NULL,
    ifsc_code       VARCHAR(20) NOT NULL,
    branch_name     VARCHAR(150),
    upi_id          VARCHAR(100),
    is_primary      BOOLEAN NOT NULL DEFAULT FALSE,
    notes           VARCHAR(500),
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_by      UUID NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bank_society
    ON society_bank_accounts (society_id, active);

CREATE TABLE IF NOT EXISTS audit_documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id      UUID NOT NULL,
    title           VARCHAR(250) NOT NULL,
    description     VARCHAR(2000),
    period_type     VARCHAR(20) NOT NULL
                    CHECK (period_type IN ('MONTHLY', 'ANNUAL', 'OTHER')),
    period_year     INTEGER NOT NULL CHECK (period_year BETWEEN 2000 AND 2100),
    period_month    INTEGER CHECK (period_month IS NULL OR period_month BETWEEN 1 AND 12),
    document_url    VARCHAR(1000) NOT NULL,
    file_name       VARCHAR(255),
    created_by      UUID NOT NULL,
    created_by_name VARCHAR(150),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_docs_society
    ON audit_documents (society_id, period_year DESC, period_month DESC);

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
