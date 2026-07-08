-- =============================================================================
-- REPORTING SERVICE DATABASE
-- Database: reporting_db
-- Owns: denormalized financial snapshots, report jobs, balance sheet lines
-- Populated via async events from Maintenance & Expense services (CQRS read model)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE report_jobs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id          UUID NOT NULL,
    report_type         VARCHAR(40) NOT NULL
                        CHECK (report_type IN ('MONTHLY_INCOME_EXPENSE', 'ANNUAL_BALANCE_SHEET', 'MAINTENANCE_COLLECTION')),
    period_year         SMALLINT NOT NULL,
    period_month        SMALLINT CHECK (period_month BETWEEN 1 AND 12),
    status              VARCHAR(20) NOT NULL DEFAULT 'QUEUED'
                        CHECK (status IN ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED')),
    requested_by        UUID NOT NULL,
    file_url            VARCHAR(500),
    error_message       TEXT,
    started_at          TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Monthly income-expense summary (one row per society per month)
CREATE TABLE monthly_financial_summary (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id          UUID NOT NULL,
    fiscal_year         SMALLINT NOT NULL,
    fiscal_month        SMALLINT NOT NULL CHECK (fiscal_month BETWEEN 1 AND 12),
    total_maintenance_collected NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_other_income  NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_expenses      NUMERIC(14, 2) NOT NULL DEFAULT 0,
    net_surplus_deficit NUMERIC(14, 2) GENERATED ALWAYS AS
                        (total_maintenance_collected + total_other_income - total_expenses) STORED,
    pending_maintenance NUMERIC(14, 2) NOT NULL DEFAULT 0,
    flats_billed        INTEGER NOT NULL DEFAULT 0,
    flats_paid          INTEGER NOT NULL DEFAULT 0,
    last_rebuilt_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_monthly_summary UNIQUE (society_id, fiscal_year, fiscal_month)
);

-- Expense breakdown by category for a given month
CREATE TABLE monthly_expense_breakdown (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id          UUID NOT NULL,
    fiscal_year         SMALLINT NOT NULL,
    fiscal_month        SMALLINT NOT NULL,
    category_id         UUID NOT NULL,
    category_name       VARCHAR(100) NOT NULL,         -- denormalized
    total_amount        NUMERIC(14, 2) NOT NULL DEFAULT 0,
    expense_count       INTEGER NOT NULL DEFAULT 0,
    last_rebuilt_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_monthly_expense_breakdown UNIQUE (society_id, fiscal_year, fiscal_month, category_id)
);

-- Annual balance sheet (statement of financial position)
CREATE TABLE annual_balance_sheets (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id          UUID NOT NULL,
    fiscal_year         SMALLINT NOT NULL,
    opening_balance     NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_income        NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_expenses      NUMERIC(14, 2) NOT NULL DEFAULT 0,
    closing_balance     NUMERIC(14, 2) GENERATED ALWAYS AS
                        (opening_balance + total_income - total_expenses) STORED,
    status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
                        CHECK (status IN ('DRAFT', 'FINALIZED')),
    finalized_by        UUID,
    finalized_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_annual_balance_sheet UNIQUE (society_id, fiscal_year)
);

CREATE TABLE balance_sheet_line_items (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    balance_sheet_id    UUID NOT NULL REFERENCES annual_balance_sheets(id) ON DELETE CASCADE,
    section             VARCHAR(30) NOT NULL
                        CHECK (section IN ('ASSET', 'LIABILITY', 'INCOME', 'EXPENSE')),
    line_code           VARCHAR(50) NOT NULL,          -- CASH_IN_HAND, BANK, MAINTENANCE_RECEIVABLE
    description         VARCHAR(200) NOT NULL,
    amount              NUMERIC(14, 2) NOT NULL,
    sort_order          SMALLINT NOT NULL DEFAULT 0,
    CONSTRAINT uq_balance_sheet_line UNIQUE (balance_sheet_id, line_code)
);

-- Event ingestion cursor for idempotent rebuilds
CREATE TABLE reporting_event_cursor (
    id                  BIGSERIAL PRIMARY KEY,
    event_type          VARCHAR(80) NOT NULL,
    source_service      VARCHAR(50) NOT NULL,
    last_event_id       VARCHAR(100) NOT NULL,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_event_cursor UNIQUE (event_type, source_service)
);

-- Raw event store (optional, for audit / replay)
CREATE TABLE ingested_events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id            VARCHAR(100) NOT NULL,
    event_type          VARCHAR(80) NOT NULL,
    society_id          UUID NOT NULL,
    payload             JSONB NOT NULL,
    occurred_at         TIMESTAMPTZ NOT NULL,
    ingested_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_ingested_event UNIQUE (event_id)
);

-- Indexes
CREATE INDEX idx_report_jobs_society ON report_jobs (society_id, created_at DESC);
CREATE INDEX idx_monthly_summary_society ON monthly_financial_summary (society_id, fiscal_year DESC, fiscal_month DESC);
CREATE INDEX idx_monthly_breakdown_society ON monthly_expense_breakdown (society_id, fiscal_year, fiscal_month);
CREATE INDEX idx_balance_sheets_society ON annual_balance_sheets (society_id, fiscal_year DESC);
CREATE INDEX idx_ingested_events_society ON ingested_events (society_id, occurred_at DESC);
