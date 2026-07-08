-- =============================================================================
-- EXPENSE SERVICE DATABASE
-- Database: expense_db
-- Owns: expense categories, society expenses, receipts/attachments metadata
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE expense_categories (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id          UUID NOT NULL,
    name                VARCHAR(100) NOT NULL,
    description         VARCHAR(255),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_expense_category UNIQUE (society_id, name)
);

-- Seed common categories per society via application layer
-- Examples: Security, Housekeeping, Repairs, Utilities, Admin, Miscellaneous

CREATE TABLE expenses (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id          UUID NOT NULL,
    category_id         UUID NOT NULL REFERENCES expense_categories(id),
    title               VARCHAR(200) NOT NULL,
    description         TEXT,
    expense_date        DATE NOT NULL,
    amount              NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    payment_mode        VARCHAR(30) NOT NULL
                        CHECK (payment_mode IN ('CASH', 'UPI', 'NEFT', 'CHEQUE', 'ONLINE')),
    vendor_name         VARCHAR(150),
    invoice_number      VARCHAR(100),
    recorded_by         UUID NOT NULL,                 -- admin user_id
    approved_by         UUID,
    approval_status     VARCHAR(20) NOT NULL DEFAULT 'APPROVED'
                        CHECK (approval_status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED')),
    fiscal_year         SMALLINT GENERATED ALWAYS AS
                        (EXTRACT(YEAR FROM expense_date)::SMALLINT) STORED,
    fiscal_month        SMALLINT GENERATED ALWAYS AS
                        (EXTRACT(MONTH FROM expense_date)::SMALLINT) STORED,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE expense_attachments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id          UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    file_name           VARCHAR(255) NOT NULL,
    file_url            VARCHAR(500) NOT NULL,         -- S3 / object storage URL
    mime_type           VARCHAR(100),
    file_size_bytes     BIGINT,
    uploaded_by         UUID NOT NULL,
    uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE expense_audit_log (
    id                  BIGSERIAL PRIMARY KEY,
    expense_id          UUID NOT NULL REFERENCES expenses(id),
    action              VARCHAR(30) NOT NULL,            -- CREATE, UPDATE, APPROVE, REJECT, DELETE
    performed_by        UUID NOT NULL,
    payload             JSONB,
    performed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_expense_categories_society ON expense_categories (society_id) WHERE is_active = TRUE;
CREATE INDEX idx_expenses_society_date ON expenses (society_id, expense_date DESC);
CREATE INDEX idx_expenses_society_month ON expenses (society_id, fiscal_year, fiscal_month);
CREATE INDEX idx_expenses_category ON expenses (category_id);
CREATE INDEX idx_expenses_approval ON expenses (society_id, approval_status);
CREATE INDEX idx_expense_attachments_expense ON expense_attachments (expense_id);
