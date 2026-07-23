"""Apply V7 maintenance timeline columns to Neon. Safe to re-run."""
from __future__ import annotations

import re
from pathlib import Path

import psycopg

ROOT = Path(__file__).resolve().parents[1]
env_path = ROOT / "backend" / "neon.local.env"
env = {}
for line in env_path.read_text(encoding="utf-8").splitlines():
    line = line.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    k, v = line.split("=", 1)
    env[k.strip()] = v.strip()

m = re.match(r"jdbc:postgresql://([^/]+)/([^?]+)", env["DB_URL"])
if not m:
    raise SystemExit("Could not parse DB_URL")
host, db = m.group(1), m.group(2)

SQL = [
    """
    ALTER TABLE member_maintenance_defaults
        ADD COLUMN IF NOT EXISTS effective_from_year INTEGER
    """,
    """
    ALTER TABLE member_maintenance_defaults
        ADD COLUMN IF NOT EXISTS effective_from_month INTEGER
    """,
    """
    UPDATE member_maintenance_defaults
    SET effective_from_year = 2000
    WHERE effective_from_year IS NULL
    """,
    """
    UPDATE member_maintenance_defaults
    SET effective_from_month = 1
    WHERE effective_from_month IS NULL
    """,
    """
    ALTER TABLE member_maintenance_defaults
        ALTER COLUMN effective_from_year SET DEFAULT 2000
    """,
    """
    ALTER TABLE member_maintenance_defaults
        ALTER COLUMN effective_from_month SET DEFAULT 1
    """,
    """
    ALTER TABLE member_maintenance_defaults
        ALTER COLUMN effective_from_year SET NOT NULL
    """,
    """
    ALTER TABLE member_maintenance_defaults
        ALTER COLUMN effective_from_month SET NOT NULL
    """,
    """
    ALTER TABLE member_maintenance_defaults
        DROP CONSTRAINT IF EXISTS uq_member_maint_default
    """,
    """
    ALTER TABLE member_maintenance_defaults
        DROP CONSTRAINT IF EXISTS uq_member_maint_default_effective
    """,
    """
    ALTER TABLE member_maintenance_defaults
        ADD CONSTRAINT uq_member_maint_default_effective
            UNIQUE (society_id, member_id, effective_from_year, effective_from_month)
    """,
    """
    CREATE INDEX IF NOT EXISTS idx_member_maint_effective
        ON member_maintenance_defaults (
            society_id, member_id, effective_from_year DESC, effective_from_month DESC
        )
    """,
    """
    ALTER TABLE maintenance_charges
        ADD COLUMN IF NOT EXISTS transaction_reference VARCHAR(120)
    """,
]


def cols(cur):
    cur.execute(
        """
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = %s
        ORDER BY ordinal_position
        """,
        ("member_maintenance_defaults",),
    )
    return [r[0] for r in cur.fetchall()]


with psycopg.connect(
    host=host,
    dbname=db,
    user=env["DB_USER"],
    password=env["DB_PASSWORD"],
    sslmode="require",
) as conn:
    conn.autocommit = True
    with conn.cursor() as cur:
        print("BEFORE:", cols(cur))
        for stmt in SQL:
            try:
                cur.execute(stmt)
                print("OK:", " ".join(stmt.split())[:90])
            except Exception as ex:
                # Constraint may already exist with same definition
                msg = str(ex)
                if "already exists" in msg.lower():
                    print("SKIP (exists):", " ".join(stmt.split())[:70])
                else:
                    print("FAIL:", " ".join(stmt.split())[:70])
                    print(" ", msg.split("\n")[0])
        print("AFTER:", cols(cur))
        cur.execute(
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'maintenance_charges'
              AND column_name = 'transaction_reference'
            """
        )
        print("transaction_reference:", bool(cur.fetchone()))

print("DONE")
