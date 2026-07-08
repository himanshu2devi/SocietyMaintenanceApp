-- =============================================================================
-- CONTENT SERVICE DATABASE (Notices & Rules)
-- Database: content_db
-- Owns: notices, society rules, read/delivery tracking
-- Publishes NoticePublished events to Notification Service
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE notices (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id          UUID NOT NULL,
    title               VARCHAR(250) NOT NULL,
    body                TEXT NOT NULL,
    priority            VARCHAR(20) NOT NULL DEFAULT 'NORMAL'
                        CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    target_audience     VARCHAR(30) NOT NULL DEFAULT 'ALL_MEMBERS'
                        CHECK (target_audience IN ('ALL_MEMBERS', 'OWNERS_ONLY', 'SPECIFIC_WINGS', 'SPECIFIC_FLATS')),
    target_filter       JSONB,                         -- {"wing_ids":[], "flat_ids":[]}
    status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
                        CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    published_at        TIMESTAMPTZ,
    expires_at          TIMESTAMPTZ,
    created_by          UUID NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notice_reads (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notice_id           UUID NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
    society_id          UUID NOT NULL,
    member_id           UUID NOT NULL,
    user_id             UUID,
    read_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_notice_read UNIQUE (notice_id, member_id)
);

CREATE TABLE society_rules (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id          UUID NOT NULL,
    category            VARCHAR(100) NOT NULL,         -- Parking, Pets, Noise, etc.
    title               VARCHAR(250) NOT NULL,
    rule_text           TEXT NOT NULL,
    sort_order          SMALLINT NOT NULL DEFAULT 0,
    version             INTEGER NOT NULL DEFAULT 1,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    effective_from      DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by          UUID NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rule_amendments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id             UUID NOT NULL REFERENCES society_rules(id) ON DELETE CASCADE,
    previous_text       TEXT NOT NULL,
    new_text            TEXT NOT NULL,
    amended_by          UUID NOT NULL,
    amended_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    amendment_reason    TEXT
);

-- Indexes
CREATE INDEX idx_notices_society_published ON notices (society_id, published_at DESC)
    WHERE status = 'PUBLISHED';
CREATE INDEX idx_notices_society_status ON notices (society_id, status);
CREATE INDEX idx_notice_reads_member ON notice_reads (member_id, read_at DESC);
CREATE INDEX idx_notice_reads_notice ON notice_reads (notice_id);
CREATE INDEX idx_society_rules_society ON society_rules (society_id, category, sort_order)
    WHERE is_active = TRUE;
