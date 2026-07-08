-- =============================================================================
-- NOTIFICATION SERVICE DATABASE
-- Database: notification_db
-- Owns: delivery channels, outbox, push/in-app notification state
-- Consumes events: NoticePublished, MaintenanceOverdue, PaymentReceived, etc.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE notification_templates (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code                VARCHAR(80) NOT NULL UNIQUE,     -- NOTICE_BROADCAST, MAINTENANCE_DUE
    channel             VARCHAR(20) NOT NULL
                        CHECK (channel IN ('IN_APP', 'EMAIL', 'SMS', 'PUSH')),
    subject_template    VARCHAR(255),
    body_template       TEXT NOT NULL,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE member_notification_preferences (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id          UUID NOT NULL,
    member_id           UUID NOT NULL,
    user_id             UUID,
    channel             VARCHAR(20) NOT NULL
                        CHECK (channel IN ('IN_APP', 'EMAIL', 'SMS', 'PUSH')),
    is_enabled          BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_member_channel_pref UNIQUE (society_id, member_id, channel)
);

CREATE TABLE notifications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id          UUID NOT NULL,
    member_id           UUID NOT NULL,
    user_id             UUID,
    source_type         VARCHAR(50) NOT NULL,          -- NOTICE, MAINTENANCE, SYSTEM
    source_id           UUID,                          -- notice_id, charge_id, etc.
    channel             VARCHAR(20) NOT NULL
                        CHECK (channel IN ('IN_APP', 'EMAIL', 'SMS', 'PUSH')),
    title               VARCHAR(250) NOT NULL,
    body                TEXT NOT NULL,
    payload             JSONB,
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                        CHECK (status IN ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED')),
    scheduled_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at             TIMESTAMPTZ,
    read_at             TIMESTAMPTZ,
    failure_reason      TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transactional outbox for reliable event publishing
CREATE TABLE notification_outbox (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_type      VARCHAR(50) NOT NULL,
    aggregate_id        UUID NOT NULL,
    event_type          VARCHAR(80) NOT NULL,
    payload             JSONB NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'NEW'
                        CHECK (status IN ('NEW', 'PROCESSING', 'PUBLISHED', 'FAILED')),
    retry_count         SMALLINT NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at        TIMESTAMPTZ
);

CREATE TABLE delivery_log (
    id                  BIGSERIAL PRIMARY KEY,
    notification_id     UUID NOT NULL REFERENCES notifications(id),
    provider            VARCHAR(50),                   -- FCM, SendGrid, Twilio
    provider_message_id VARCHAR(150),
    status              VARCHAR(20) NOT NULL,
    response_payload    JSONB,
    logged_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_member_unread ON notifications (member_id, created_at DESC)
    WHERE status IN ('SENT', 'DELIVERED') AND read_at IS NULL;
CREATE INDEX idx_notifications_society ON notifications (society_id, created_at DESC);
CREATE INDEX idx_notifications_source ON notifications (source_type, source_id);
CREATE INDEX idx_outbox_status_created ON notification_outbox (status, created_at)
    WHERE status IN ('NEW', 'FAILED');
CREATE INDEX idx_delivery_log_notification ON delivery_log (notification_id);
