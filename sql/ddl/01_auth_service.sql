-- =============================================================================
-- AUTH SERVICE DATABASE
-- Database: auth_db
-- Owns: credentials, sessions, roles (identity & access only)
-- Cross-service references: user_id is published to other services via events/API
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Societies register here only as a tenant anchor for admin bootstrap.
-- Canonical society profile lives in society_db.
-- ---------------------------------------------------------------------------
CREATE TABLE tenant_registry (
    society_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_code        VARCHAR(32) NOT NULL,          -- short unique code, e.g. GREENVILLE-A
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                        CHECK (status IN ('ACTIVE', 'SUSPENDED', 'DELETED')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tenant_registry_code UNIQUE (society_code)
);

CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id          UUID NOT NULL REFERENCES tenant_registry(society_id),
    email               VARCHAR(255),
    mobile              VARCHAR(20) NOT NULL,
    password_hash       VARCHAR(255) NOT NULL,
    full_name           VARCHAR(150) NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                        CHECK (status IN ('ACTIVE', 'INACTIVE', 'LOCKED', 'PENDING_VERIFICATION')),
    email_verified      BOOLEAN NOT NULL DEFAULT FALSE,
    mobile_verified     BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at       TIMESTAMPTZ,
    failed_login_count  SMALLINT NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_users_society_mobile UNIQUE (society_id, mobile),
    CONSTRAINT uq_users_society_email UNIQUE (society_id, email)
);

CREATE TABLE roles (
    id                  SMALLSERIAL PRIMARY KEY,
    code                VARCHAR(50) NOT NULL UNIQUE,     -- SUPER_ADMIN, SOCIETY_ADMIN, MEMBER
    description         VARCHAR(255)
);

INSERT INTO roles (code, description) VALUES
    ('SUPER_ADMIN', 'Platform operator'),
    ('SOCIETY_ADMIN', 'Society committee administrator'),
    ('MEMBER', 'Flat owner / resident member')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE user_roles (
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id             SMALLINT NOT NULL REFERENCES roles(id),
    assigned_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by         UUID REFERENCES users(id),
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE refresh_tokens (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash          VARCHAR(255) NOT NULL,
    expires_at          TIMESTAMPTZ NOT NULL,
    revoked_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    device_info         VARCHAR(255)
);

CREATE TABLE password_reset_tokens (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash          VARCHAR(255) NOT NULL,
    expires_at          TIMESTAMPTZ NOT NULL,
    used_at             TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_society_id ON users (society_id);
CREATE INDEX idx_users_status ON users (status);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens (expires_at) WHERE revoked_at IS NULL;
