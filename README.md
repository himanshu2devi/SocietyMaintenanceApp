# SocietyMaintenanceApp

Society Management MVP — **2 Spring Boot microservices** + **React** frontend.

## Production stack

| Layer | Platform |
|-------|----------|
| Frontend | [Vercel](https://vercel.com) |
| Identity + Core API | [Railway](https://railway.app) |
| PostgreSQL | [Neon](https://neon.tech) |
| Auth | JWT in `identity-service` |

**Deploy guide:** see **[DEPLOYMENT.md](DEPLOYMENT.md)** for step-by-step instructions.

## Architecture

```
Vercel (React)
    ├── Railway identity-service  →  Neon identity_db
    └── Railway core-service      →  Neon core_db
              ↑ shared JWT_SECRET
```

## Project layout (monorepo — one GitHub repo)

```
SocietyMaintenanceApp/
├── frontend/                 → Vercel (root directory: frontend)
├── backend/
│   ├── identity-service/     → Railway service #1
│   └── core-service/         → Railway service #2
├── neon/init.sql             → run once in Neon SQL editor
├── scripts/generate-secrets.ps1
└── DEPLOYMENT.md
```

## Local development

**Prerequisites:** JDK 17+, Maven 3.9+, Node 18+

```bash
# Backend (uses in-memory H2 by default)
cd backend/identity-service && mvn spring-boot:run
cd backend/core-service && mvn spring-boot:run

# Frontend
cd frontend
cp .env.example .env
npm install && npm run dev
```

Open http://localhost:5173

## Features

- Society registration & JWT login (ADMIN / MEMBER roles)
- Member directory, maintenance tracking, expense logging
- Notices & rules, financial reports, WhatsApp share

## API overview

**Identity** (`:8081`): `/api/v1/auth/*`, `/api/v1/members`  
**Core** (`:8082`): `/api/v1/maintenance`, `/api/v1/expenses`, `/api/v1/notices`, `/api/v1/rules`, `/api/v1/reports`
