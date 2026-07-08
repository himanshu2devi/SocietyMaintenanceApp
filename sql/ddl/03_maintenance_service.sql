-- =============================================================================
-- MAINTENANCE / BILLING SERVICE DATABASE
-- Database: maintenance_db
-- Owns: fee configuration, billing cycles, per-flat charges, payments
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE maintenance_fee_config (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id          UUID NOT NULL,
    flat_type           VARCHAR(30),                   -- NULL = default for all flats
    monthly_amount      NUMERIC(12, 2) NOT NULL CHECK (monthly_amount >= 0),
    effective_from      DATE NOT NULL,
    effective_to        DATE,
    created_by          UUID NOT NULL,                 -- admin user_id
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_fee_config_society_type_from UNIQUE (society_id, flat_type, effective_from)
);

CREATE TABLE billing_periods (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id          UUID NOT NULL,
    billing_year        SMALLINT NOT NULL CHECK (billing_year BETWEEN 2000 AND 2100),
    billing_month       SMALLINT NOT NULL CHECK (billing_month BETWEEN 1 AND 12),
    due_date            DATE NOT NULL,
    grace_days          SMALLINT NOT NULL DEFAULT 0,
    status              VARCHAR(20) NOT NULL DEFAULT 'OPEN'
                        CHECK (status IN ('OPEN', 'CLOSED', 'LOCKED')),
    generated_at        TIMESTAMPTZ,
    closed_at           TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_billing_period UNIQUE (society_id, billing_year, billing_month)
);

CREATE TABLE maintenance_charges (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id          UUID NOT NULL,
    billing_period_id   UUID NOT NULL REFERENCES billing_periods(id),
    flat_id             UUID NOT NULL,
    flat_number         VARCHAR(20) NOT NULL,          -- denormalized for reporting
    member_id           UUID,                          -- primary member at generation time
    base_amount         NUMERIC(12, 2) NOT NULL CHECK (base_amount >= 0),
    penalty_amount      NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (penalty_amount >= 0),
    adjustment_amount   NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_amount        NUMERIC(12, 2) GENERATED ALWAYS AS
                        (base_amount + penalty_amount + adjustment_amount) STORED,
    amount_paid         NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                        CHECK (status IN ('PENDING', 'PARTIALLY_PAID', 'PAID', 'WAIVED', 'CANCELLED')),
    paid_at             TIMESTAMPTZ,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_charge_period_flat UNIQUE (billing_period_id, flat_id),
    CONSTRAINT chk_amount_paid_lte_total CHECK (amount_paid <= base_amount + penalty_amount + adjustment_amount)
);

CREATE TABLE maintenance_payments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id          UUID NOT NULL,
    charge_id           UUID NOT NULL REFERENCES maintenance_charges(id),
    amount              NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_mode        VARCHAR(30) NOT NULL
                        CHECK (payment_mode IN ('CASH', 'UPI', 'NEFT', 'CHEQUE', 'ONLINE_GATEWAY')),
    payment_reference   VARCHAR(100),
    payment_date        DATE NOT NULL,
    received_by         UUID,                          -- admin user_id
    remarks             TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE maintenance_audit_log (
    id                  BIGSERIAL PRIMARY KEY,
    charge_id           UUID NOT NULL REFERENCES maintenance_charges(id),
    old_status          VARCHAR(20),
    new_status          VARCHAR(20) NOT NULL,
    changed_by          UUID NOT NULL,
    change_reason       TEXT,
    changed_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_billing_periods_society ON billing_periods (society_id, billing_year DESC, billing_month DESC);
CREATE INDEX idx_charges_society_status ON maintenance_charges (society_id, status);
CREATE INDEX idx_charges_period ON maintenance_charges (billing_period_id);
CREATE INDEX idx_charges_flat ON maintenance_charges (flat_id);
CREATE INDEX idx_charges_pending ON maintenance_charges (society_id, billing_period_id)
    WHERE status IN ('PENDING', 'PARTIALLY_PAID');
CREATE INDEX idx_payments_charge ON maintenance_payments (charge_id);
CREATE INDEX idx_payments_society_date ON maintenance_payments (society_id, payment_date DESC);
