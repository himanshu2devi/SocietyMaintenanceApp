"""Verify maintenance-related tables/columns on Neon."""
from __future__ import annotations

import re
from pathlib import Path

import psycopg

ROOT = Path(__file__).resolve().parents[1]
env = {}
for line in (ROOT / "backend" / "neon.local.env").read_text(encoding="utf-8").splitlines():
    line = line.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    k, v = line.split("=", 1)
    env[k.strip()] = v.strip()

m = re.match(r"jdbc:postgresql://([^/]+)/([^?]+)", env["DB_URL"])
host, db = m.group(1), m.group(2)

tables = [
    "member_maintenance_defaults",
    "maintenance_rate_schedules",
    "society_maintenance_settings",
    "maintenance_charges",
]

with psycopg.connect(
    host=host, dbname=db, user=env["DB_USER"], password=env["DB_PASSWORD"], sslmode="require"
) as conn:
    with conn.cursor() as cur:
        for t in tables:
            cur.execute(
                """
                SELECT column_name FROM information_schema.columns
                WHERE table_schema='public' AND table_name=%s
                ORDER BY ordinal_position
                """,
                (t,),
            )
            cols = [r[0] for r in cur.fetchall()]
            print(f"{t}: {cols if cols else 'MISSING TABLE'}")
