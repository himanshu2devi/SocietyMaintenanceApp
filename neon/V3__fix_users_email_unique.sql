-- Fix empty-string emails that break uq_users_society_email
-- (PostgreSQL allows multiple NULLs in a UNIQUE column, but not multiple '')
-- Run once in Neon SQL Editor on Societywale

UPDATE users
SET email = NULL
WHERE email IS NOT NULL AND btrim(email) = '';

-- Prefer a partial unique index so blank/null emails never collide
ALTER TABLE users DROP CONSTRAINT IF EXISTS uq_users_society_email;

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_society_email
    ON users (society_id, email)
    WHERE email IS NOT NULL AND btrim(email) <> '';
