# SocietySimplify feature upgrade — operator notes

## After Neon compute is restored

1. Run SQL once in Neon SQL Editor (identity + core share Neon; tables land in the same DB the services use):
   `sql/migrations/2026-09-22_society_simplify_modules.sql`
2. Redeploy identity-service and core-service (AWS) so JPA entities and new endpoints are live.
3. Redeploy frontend (Vercel) so `/platform` and new admin/member tabs ship.
4. Seed platform owner (one-time), then clear the password env vars:
   - `PLATFORM_ADMIN_EMAIL`
   - `PLATFORM_ADMIN_PASSWORD`
   - optional `PLATFORM_ADMIN_NAME`, `PLATFORM_ADMIN_MOBILE`
5. Sign in at `/login` → redirects to `/platform`.
6. Smoke-test: Payment QR, Events, Member posts, Parking, Meetings, Elections, Call button, society A/B isolation.

## Notes

- Elections record administration/results only — no electronic voting endpoints.
- QR images are stored as validated base64 in Postgres (no separate object store yet).
- Physical Neon database name may remain historical; only public brand is SocietySimplify.
