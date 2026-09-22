-- SocietySimplify additive schema (safe for Neon when compute is restored)
-- DO NOT drop/rename existing production tables.
-- Physical Neon database name may remain as-is; this script only adds new tables.
-- Run once in Neon SQL Editor after compute is available.
-- Hibernate ddl-auto=update will also create these from JPA entities locally.

-- 1) Payment QR (one active config per society)
CREATE TABLE IF NOT EXISTS society_payment_qr (
    id UUID PRIMARY KEY,
    society_id UUID NOT NULL,
    upi_id VARCHAR(100),
    instruction VARCHAR(250) NOT NULL DEFAULT 'Scan to pay society maintenance',
    content_type VARCHAR(80) NOT NULL,
    image_base64 TEXT NOT NULL,
    file_name VARCHAR(200),
    updated_by UUID NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_payment_qr_society UNIQUE (society_id)
);
CREATE INDEX IF NOT EXISTS idx_payment_qr_society ON society_payment_qr (society_id);

-- 2) Society events
CREATE TABLE IF NOT EXISTS society_events (
    id UUID PRIMARY KEY,
    society_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    location VARCHAR(250),
    organizer VARCHAR(150),
    image_url VARCHAR(500),
    status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_events_society_date ON society_events (society_id, event_date DESC);

-- 3) Member announcements (moderated)
CREATE TABLE IF NOT EXISTS member_announcements (
    id UUID PRIMARY KEY,
    society_id UUID NOT NULL,
    author_user_id UUID NOT NULL,
    author_name VARCHAR(150),
    author_flat_number VARCHAR(30),
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    related_event_id UUID,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_APPROVAL',
    reviewer_user_id UUID,
    review_note VARCHAR(500),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_member_ann_society_status ON member_announcements (society_id, status, created_at DESC);

-- 4) Parking
CREATE TABLE IF NOT EXISTS parking_slots (
    id UUID PRIMARY KEY,
    society_id UUID NOT NULL,
    slot_code VARCHAR(40) NOT NULL,
    category VARCHAR(20) NOT NULL,
    building_wing VARCHAR(80),
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    notes VARCHAR(500),
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_parking_slot_society_code UNIQUE (society_id, slot_code),
    CONSTRAINT chk_parking_category CHECK (category IN ('COMMON', 'ASSIGNED')),
    CONSTRAINT chk_parking_status CHECK (status IN ('AVAILABLE', 'ASSIGNED', 'UNAVAILABLE'))
);
CREATE INDEX IF NOT EXISTS idx_parking_society ON parking_slots (society_id, category, status);

CREATE TABLE IF NOT EXISTS parking_assignments (
    id UUID PRIMARY KEY,
    society_id UUID NOT NULL,
    slot_id UUID NOT NULL,
    member_user_id UUID,
    member_name VARCHAR(150),
    flat_number VARCHAR(30),
    vehicle_number VARCHAR(40),
    vehicle_type VARCHAR(40),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    unassigned_at TIMESTAMPTZ,
    notes VARCHAR(500),
    assigned_by UUID NOT NULL
);
-- A slot keeps its full assignment history, so only the *active* row must be unique per slot.
-- (A plain UNIQUE (slot_id, active) would also cap the history at one released row.)
ALTER TABLE parking_assignments DROP CONSTRAINT IF EXISTS uq_parking_active_slot;
CREATE UNIQUE INDEX IF NOT EXISTS uq_parking_one_active_assignment
    ON parking_assignments (slot_id) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_parking_assign_society ON parking_assignments (society_id, active);
CREATE INDEX IF NOT EXISTS idx_parking_assign_member ON parking_assignments (society_id, member_user_id, active);

-- 5) Meetings
CREATE TABLE IF NOT EXISTS society_meetings (
    id UUID PRIMARY KEY,
    society_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    meeting_type VARCHAR(40) NOT NULL,
    meeting_date DATE NOT NULL,
    start_time TIME,
    location VARCHAR(250),
    agenda TEXT,
    description TEXT,
    organizer VARCHAR(150),
    status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',
    minutes TEXT,
    attachment_url VARCHAR(500),
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_meetings_society_date ON society_meetings (society_id, meeting_date DESC);

-- 6) Elections (administration + recorded results; not a secure e-voting system)
CREATE TABLE IF NOT EXISTS society_elections (
    id UUID PRIMARY KEY,
    society_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    nomination_start TIMESTAMPTZ,
    nomination_end TIMESTAMPTZ,
    voting_start TIMESTAMPTZ,
    voting_end TIMESTAMPTZ,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    result_summary TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_elections_society ON society_elections (society_id, status);

CREATE TABLE IF NOT EXISTS election_positions (
    id UUID PRIMARY KEY,
    election_id UUID NOT NULL,
    society_id UUID NOT NULL,
    title VARCHAR(120) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_election_positions ON election_positions (election_id);

CREATE TABLE IF NOT EXISTS election_candidates (
    id UUID PRIMARY KEY,
    election_id UUID NOT NULL,
    position_id UUID NOT NULL,
    society_id UUID NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    flat_number VARCHAR(30),
    profile_text TEXT,
    is_winner BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_election_candidates ON election_candidates (election_id, position_id);

-- Optional: allow PLATFORM_ADMIN in users.role (no CHECK on Hibernate side; if a CHECK exists, drop/recreate manually)
-- ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
-- ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('ADMIN','MEMBER','PLATFORM_ADMIN'));

-- PLATFORM_ADMIN accounts have no society tenant
ALTER TABLE users ALTER COLUMN society_id DROP NOT NULL;
