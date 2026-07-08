# MySQL Port Notes

PostgreSQL DDL in the parent folder is the canonical schema. When porting to MySQL 8.0+:

| PostgreSQL | MySQL |
|------------|-------|
| `UUID` + `gen_random_uuid()` | `CHAR(36)` + `UUID()` |
| `TIMESTAMPTZ` | `DATETIME(6)` with app-level UTC |
| `JSONB` | `JSON` |
| `GENERATED ALWAYS AS ... STORED` | Supported in MySQL 8.0+ |
| Partial indexes (`WHERE ...`) | Not supported; use composite indexes or generated flag columns |
| `DEFERRABLE` constraints | Remove; enforce in application layer |

Create separate databases: `auth_db`, `society_db`, `maintenance_db`, `expense_db`, `content_db`, `notification_db`, `reporting_db`.
