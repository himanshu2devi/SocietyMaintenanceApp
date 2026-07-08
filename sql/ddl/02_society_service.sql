-- =============================================================================
-- SOCIETY SERVICE DATABASE
-- Database: society_db
-- Owns: society profile, wings/blocks, flats, member roster (denormalized contact)
-- References auth user_id logically (no cross-DB FK)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE societies (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_code        VARCHAR(32) NOT NULL,
    name                VARCHAR(200) NOT NULL,
    address_line1       VARCHAR(255),
    address_line2       VARCHAR(255),
    city                VARCHAR(100),
    state               VARCHAR(100),
    pincode             VARCHAR(12),
    registration_no     VARCHAR(100),
    total_flats         INTEGER NOT NULL DEFAULT 0,
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                        CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_societies_code UNIQUE (society_code)
);

CREATE TABLE wings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id          UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    name                VARCHAR(50) NOT NULL,            -- A, B, Tower-1
    sort_order          SMALLINT NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_wings_society_name UNIQUE (society_id, name)
);

CREATE TABLE flats (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id          UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    wing_id             UUID REFERENCES wings(id) ON DELETE SET NULL,
    flat_number         VARCHAR(20) NOT NULL,          -- 101, A-402
    floor_number        SMALLINT,
    area_sqft           NUMERIC(10, 2),
    flat_type           VARCHAR(30),                   -- 1BHK, 2BHK, SHOP
    occupancy_status    VARCHAR(20) NOT NULL DEFAULT 'OCCUPIED'
                        CHECK (occupancy_status IN ('OCCUPIED', 'VACANT', 'RENTED')),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_flats_society_number UNIQUE (society_id, flat_number)
);

CREATE TABLE members (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id          UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    flat_id             UUID NOT NULL REFERENCES flats(id),
    user_id             UUID,                          -- from auth_db.users.id
    full_name           VARCHAR(150) NOT NULL,
    mobile              VARCHAR(20) NOT NULL,
    email               VARCHAR(255),
    member_type         VARCHAR(20) NOT NULL DEFAULT 'OWNER'
                        CHECK (member_type IN ('OWNER', 'TENANT', 'FAMILY')),
    is_primary_contact  BOOLEAN NOT NULL DEFAULT FALSE,
    move_in_date        DATE,
    move_out_date       DATE,
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                        CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_members_flat_primary UNIQUE (flat_id, is_primary_contact)
        DEFERRABLE INITIALLY DEFERRED
);

-- Only one primary contact per flat
CREATE UNIQUE INDEX uq_members_one_primary_per_flat
    ON members (flat_id)
    WHERE is_primary_contact = TRUE AND status = 'ACTIVE';

CREATE TABLE society_admins (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id          UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL,                 -- from auth_db
    designation         VARCHAR(100),                  -- Secretary, Treasurer
    term_start_date     DATE,
    term_end_date       DATE,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_society_admins_user UNIQUE (society_id, user_id)
);

-- Indexes
CREATE INDEX idx_flats_society_id ON flats (society_id);
CREATE INDEX idx_flats_wing_id ON flats (wing_id);
CREATE INDEX idx_members_society_id ON members (society_id);
CREATE INDEX idx_members_flat_id ON members (flat_id);
CREATE INDEX idx_members_user_id ON members (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_members_mobile ON members (society_id, mobile);
CREATE INDEX idx_society_admins_society ON society_admins (society_id) WHERE is_active = TRUE;
