# Deploy SocietyHub — Vercel + Railway + Neon

One **GitHub monorepo**. No separate repos needed.

```
SocietyMaintenanceApp/          ← single GitHub repo
├── frontend/                   → Vercel
├── backend/identity-service/   → Railway service #1
├── backend/core-service/       → Railway service #2
└── neon/init.sql               → run once in Neon
```

| Layer | Platform | Cost |
|-------|----------|------|
| Frontend | **Vercel** | Free |
| Backend (2 services) | **Railway** | Trial / hobby credits |
| Database | **Neon PostgreSQL** | Free |
| Auth | **JWT in identity-service** | Built-in (no extra service) |

---

## Before you start

- [ ] GitHub account
- [ ] [Vercel](https://vercel.com) account (login with GitHub)
- [ ] [Railway](https://railway.app) account (login with GitHub)
- [ ] [Neon](https://neon.tech) account
- [ ] Project pushed to GitHub

Generate JWT secret (Windows PowerShell):

```powershell
cd C:\Z_Business\society-app\SocietyMaintenanceApp
.\scripts\generate-secrets.ps1
```

Save the `JWT_SECRET` — use the **same value** on both Railway services.

---

## STEP 1 — Push code to GitHub

```powershell
cd C:\Z_Business\society-app\SocietyMaintenanceApp
git init
git add .
git commit -m "SocietyHub MVP - Vercel Railway Neon"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/SocietyMaintenanceApp.git
git push -u origin main
```

---

## STEP 2 — Neon PostgreSQL (database)

1. Go to [console.neon.tech](https://console.neon.tech) → **New Project**
   - Name: `societyhub`
   - Region: pick closest to you (e.g. AWS Asia Pacific)

2. Open **SQL Editor** → paste and run `neon/init.sql`:

```sql
CREATE DATABASE identity_db;
CREATE DATABASE core_db;
```

3. **Dashboard** → **Connection details** for each database.

Build two JDBC URLs (note `/identity_db` and `/core_db`):

```
jdbc:postgresql://ep-xxxx.region.aws.neon.tech/identity_db?sslmode=require
jdbc:postgresql://ep-xxxx.region.aws.neon.tech/core_db?sslmode=require
```

Save:

| Key | Example |
|-----|---------|
| `DB_USER` | `neondb_owner` |
| `DB_PASSWORD` | (from Neon) |
| `IDENTITY_DB_URL` | jdbc URL ending in `/identity_db?sslmode=require` |
| `CORE_DB_URL` | jdbc URL ending in `/core_db?sslmode=require` |

---

## STEP 3 — Railway: Identity Service

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select `SocietyMaintenanceApp`
3. Open the new service → **Settings**:

| Setting | Value |
|---------|-------|
| Service name | `identity-service` |
| Root Directory | `backend/identity-service` |

4. **Variables** tab → add:

| Variable | Value |
|----------|-------|
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `JWT_SECRET` | (from generate-secrets.ps1) |
| `DB_URL` | Neon JDBC URL for **identity_db** |
| `DB_USER` | Neon username |
| `DB_PASSWORD` | Neon password |
| `APP_CORS_ORIGINS` | `http://localhost:5173` (update after Vercel deploy) |

5. **Settings** → **Networking** → **Generate Domain**

Copy URL, e.g.:

```
https://identity-service-production-a1b2.up.railway.app
```

6. Wait for deploy to finish (green). Test:

```
https://YOUR-IDENTITY-URL.up.railway.app/actuator/health
```

Should return `{"status":"UP"}`.

---

## STEP 4 — Railway: Core Service

Same Railway project → **+ Create** → **GitHub Repo** → select same repo again.

| Setting | Value |
|---------|-------|
| Service name | `core-service` |
| Root Directory | `backend/core-service` |

**Variables:**

| Variable | Value |
|----------|-------|
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `JWT_SECRET` | **Same as identity-service** |
| `DB_URL` | Neon JDBC URL for **core_db** |
| `DB_USER` | Neon username |
| `DB_PASSWORD` | Neon password |
| `APP_CORS_ORIGINS` | `http://localhost:5173` (update after Vercel) |

**Networking** → **Generate Domain**:

```
https://core-service-production-c3d4.up.railway.app
```

Test:

```
https://YOUR-CORE-URL.up.railway.app/actuator/health
```

---

## STEP 5 — Vercel: Frontend

1. [vercel.com](https://vercel.com) → **Add New Project** → import `SocietyMaintenanceApp`

| Setting | Value |
|---------|-------|
| Framework Preset | Vite |
| Root Directory | `frontend` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

2. **Environment Variables** (Production):

| Name | Value |
|------|-------|
| `VITE_IDENTITY_URL` | `https://YOUR-IDENTITY-URL.up.railway.app/api/v1` |
| `VITE_CORE_URL` | `https://YOUR-CORE-URL.up.railway.app/api/v1` |

No trailing slash.

3. Click **Deploy**

4. Copy your Vercel URL:

```
https://society-maintenance-app.vercel.app
```

---

## STEP 6 — Fix CORS (both Railway services)

Go to **identity-service** and **core-service** on Railway → **Variables**:

Update:

```
APP_CORS_ORIGINS=https://society-maintenance-app.vercel.app,http://localhost:5173
```

Use your exact Vercel URL. Railway redeploys automatically.

---

## STEP 7 — Test live

Open your Vercel URL:

1. **Register Society** — creates admin account
2. **Login**
3. **Add member**
4. **Maintenance** — mark paid/pending
5. **Expenses** — add expense
6. **Notices** — post announcement
7. **Reports** — generate monthly report

### Troubleshooting

| Problem | Fix |
|---------|-----|
| CORS error in browser (F12) | `APP_CORS_ORIGINS` must exactly match Vercel URL |
| 502 / app not loading on Railway | Check deploy logs; verify `DB_URL`, `DB_USER`, `DB_PASSWORD` |
| Login works locally but not live | `JWT_SECRET` must match on both Railway services |
| Blank page on Vercel | Check build logs; verify env vars set before deploy |
| API 404 | `VITE_*_URL` must include `/api/v1` at the end |
| Railway build fails | Open logs; ensure Root Directory is correct |
| DB connection error | JDBC URL must end with `?sslmode=require` for Neon |

### Redeploy after code changes

- **Frontend:** push to GitHub → Vercel auto-deploys
- **Backend:** push to GitHub → Railway auto-deploys both services

---

## Environment variable cheat sheet

### Identity Service (Railway)

```
SPRING_PROFILES_ACTIVE=prod
JWT_SECRET=<same-on-both-services>
DB_URL=jdbc:postgresql://ep-xxx.neon.tech/identity_db?sslmode=require
DB_USER=neondb_owner
DB_PASSWORD=<neon-password>
APP_CORS_ORIGINS=https://your-app.vercel.app,http://localhost:5173
```

### Core Service (Railway)

```
SPRING_PROFILES_ACTIVE=prod
JWT_SECRET=<same-on-both-services>
DB_URL=jdbc:postgresql://ep-xxx.neon.tech/core_db?sslmode=require
DB_USER=neondb_owner
DB_PASSWORD=<neon-password>
APP_CORS_ORIGINS=https://your-app.vercel.app,http://localhost:5173
```

### Frontend (Vercel)

```
VITE_IDENTITY_URL=https://identity-xxx.up.railway.app/api/v1
VITE_CORE_URL=https://core-xxx.up.railway.app/api/v1
```

---

## Local development (unchanged)

```powershell
# Terminal 1
cd backend/identity-service
mvn spring-boot:run

# Terminal 2
cd backend/core-service
mvn spring-boot:run

# Terminal 3
cd frontend
copy .env.example .env
npm install
npm run dev
```

Open http://localhost:5173
