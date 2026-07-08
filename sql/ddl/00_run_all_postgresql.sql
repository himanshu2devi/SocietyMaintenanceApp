-- =============================================================================
-- Master runner for PostgreSQL (execute each file against its own database)
-- Usage:
--   createdb auth_db && psql -d auth_db -f 01_auth_service.sql
--   createdb society_db && psql -d society_db -f 02_society_service.sql
--   ... and so on
-- =============================================================================

\echo 'Run each DDL file against its dedicated database. See file headers for details.'
