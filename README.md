# SocietyMaintenanceApp

A secure, production-oriented **Society Management** application built as a minimal
**2-microservice** system with a **ReactJS** frontend (designed for easy React Native migration).

## Architecture (minimal, 2 services)

```
                 ┌───────────────────────────┐
  React (Vite)   │  Identity Service :8081    │  identity_db
  Tailwind ──────▶  - Society registration    │  (societies, users)
  Axios          │  - Login / JWT issuing     │
   │             │  - Member management       │
   │             └───────────────────────────┘
   │                        │  shared JWT secret
   │             ┌───────────────────────────┐
   └─────────────▶  Core Service :8082        │  core_db
                 │  - Maintenance & billing   │  (charges, expenses,
                 │  - Expenses                │   notices, rules)
                 │  - Notices & rules         │
                 │  - Financial reports       │
                 └───────────────────────────┘
```

- **Stateless JWT auth.** The Identity Service issues signed JWTs; the Core Service
  validates them with the *same* shared secret — no synchronous auth calls between services.
- **Roles:** `ADMIN` (committee) and `MEMBER` (resident), enforced via Spring Security
  method-level `@PreAuthorize`.
- **Multi-tenant:** every record is scoped by `societyId` carried inside the JWT.

## Tech stack

| Layer     | Technology                                        |
|-----------|---------------------------------------------------|
| Backend   | Java 17, Spring Boot 3.3, Spring Security, JPA     |
| Auth      | JWT (jjwt), BCrypt password hashing               |
| Database  | PostgreSQL (prod) / H2 in-memory (dev default)    |
| Frontend  | React 18, React Router 6, TailwindCSS, Axios      |

## Project layout

```
SocietyMaintenanceApp/
├── backend/
│   ├── identity-service/   # auth, society, members  (port 8081)
│   └── core-service/       # finance, notices, reports (port 8082)
├── frontend/               # React + Tailwind SPA     (port 5173)
└── sql/ddl/                # reference PostgreSQL schema
```

## Prerequisites

- **JDK 17+** and **Maven 3.9+** (or run the services from an IDE such as IntelliJ).
- **Node.js 18+** and npm for the frontend.

## Running locally

### 1. Backend (defaults to in-memory H2 — zero DB setup)

```bash
# Terminal 1
cd backend/identity-service
mvn spring-boot:run

# Terminal 2
cd backend/core-service
mvn spring-boot:run
```

Both services must share the same JWT secret. The default in `application.properties`
matches across services; override in production:

```bash
export JWT_SECRET="a-long-random-256-bit-secret-value-change-me"
```

To use PostgreSQL instead of H2, set the profile and DB env vars:

```bash
export SPRING_PROFILES_ACTIVE=postgres
export DB_URL=jdbc:postgresql://localhost:5432/identity_db   # core_db for core-service
export DB_USER=society DB_PASSWORD=society
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env      # adjust API URLs if needed
npm install
npm run dev               # http://localhost:5173
```

## Core API endpoints

### Identity Service (`:8081`)
| Method | Path                       | Role   | Purpose                         |
|--------|----------------------------|--------|---------------------------------|
| POST   | `/api/v1/auth/register`    | public | Register society + admin        |
| POST   | `/api/v1/auth/login`       | public | Login, returns JWT              |
| GET    | `/api/v1/members`          | auth   | List members                    |
| POST   | `/api/v1/members`          | ADMIN  | Add member                      |

### Core Service (`:8082`)
| Method | Path                               | Role  | Purpose                         |
|--------|------------------------------------|-------|---------------------------------|
| GET    | `/api/v1/maintenance`              | auth  | List charges                    |
| POST   | `/api/v1/maintenance/collect`      | ADMIN | Record flat-wise collection     |
| POST   | `/api/v1/maintenance/pending`      | ADMIN | Mark a flat's dues pending      |
| PATCH  | `/api/v1/maintenance/{id}/paid`    | ADMIN | Mark a charge paid              |
| GET/POST | `/api/v1/expenses`               | auth/ADMIN | List / log expenses        |
| GET/POST | `/api/v1/notices`                | auth/ADMIN | List / post notices        |
| GET/POST | `/api/v1/rules`                  | auth/ADMIN | List / add rules           |
| GET    | `/api/v1/reports/monthly`          | auth  | Monthly income-expense report   |
| GET    | `/api/v1/reports/annual`           | auth  | Annual balance sheet            |

## Frontend features

- Public pages: **Home, About Us, Contact Us**
- **Login** and **Society Registration**
- **Admin Dashboard**: Member Directory, Maintenance Tracker (Paid/Pending),
  Expense Logger, Notice Board (notices + rules)
- **Member Dashboard**: personal dues, notices, rules
- **Financial Reports**: monthly & annual tables with a **Share on WhatsApp** button
  using `https://wa.me/` deep-linking (opens the contact chooser — no number is stored)

## React Native migration notes

The frontend is intentionally structured for portability:
- All network access is isolated in `src/api/` (swap Axios base config only).
- Auth/session logic lives in `src/context/AuthContext.jsx` (reusable as-is).
- Screens are plain components with no web-only DOM logic beyond styling, so each
  maps cleanly to a React Native screen; only the presentational JSX/Tailwind needs
  replacing with React Native primitives (or NativeWind).
