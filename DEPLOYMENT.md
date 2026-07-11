# Deploy SocietyWale

| Layer | Platform | Notes |
|-------|----------|--------|
| Frontend | **Vercel** (keep) | `https://societywale.vercel.app` + later `societywale.in` |
| Backend ×2 | **AWS EC2 + Docker Compose** (recommended) | Always-on, no Render free-tier sleep |
| Database | **Neon** (keep) | Same `Societywale` DB — no data migration |

Render free cold-starts are slow for Spring Boot. AWS EC2 keeps both JVMs warm.

Repo layout:

```
deploy/aws/
  docker-compose.yml   # identity + core + Caddy (HTTPS)
  Caddyfile
  .env.example
  setup-ec2.sh
backend/identity-service/Dockerfile
backend/core-service/Dockerfile
frontend/                → Vercel
```

---

## A) GitHub ↔ Vercel email mismatch

Emails need not match. Connect the **GitHub account that owns the repo** inside Vercel/AWS workflows. Collaborator access is enough.

---

## B) AWS backend (step-by-step)

### B1 — Create EC2

1. AWS Console → **EC2** → **Launch instance**
2. Suggested settings (good with Free Tier / Activate credits):

| Setting | Value |
|---------|--------|
| Name | `societywale-api` |
| AMI | **Ubuntu Server 24.04 LTS** |
| Instance type | **t3.small** (2 GB) recommended for 2 Spring apps. `t3.micro` (1 GB) is too tight. |
| Key pair | Create/download `.pem` (keep safe) |
| Storage | 20–30 GB gp3 |
| Security group | Inbound: **22** (your IP), **80**, **443** from `0.0.0.0/0` |

3. After launch → **Elastic IP** → Allocate → Associate to this instance (stable public IP).

### B2 — SSH and install Docker

Windows PowerShell (path to your key):

```powershell
ssh -i "C:\path\to\your-key.pem" ubuntu@YOUR_ELASTIC_IP
```

On the server:

```bash
git clone https://github.com/YOUR_USER/SocietyMaintenanceApp.git
cd SocietyMaintenanceApp
bash deploy/aws/setup-ec2.sh
# log out and SSH back in so docker group applies
exit
ssh -i "C:\path\to\your-key.pem" ubuntu@YOUR_ELASTIC_IP
```

### B3 — Configure secrets

```bash
cd ~/SocietyMaintenanceApp/deploy/aws
cp .env.example .env
nano .env
```

Fill:

```text
DB_URL=jdbc:postgresql://ep-….neon.tech/Societywale?sslmode=require
DB_USER=neondb_owner
DB_PASSWORD=your_neon_password
JWT_SECRET=same_long_secret_as_before
APP_CORS_ORIGINS=https://societywale.vercel.app,https://societywale.in,https://www.societywale.in,http://localhost:5173
```

Use the **same Neon DB** as today — existing admins/members stay.

### B4 — DNS (GoDaddy) for API hostnames

Create **A records** pointing to the Elastic IP:

| Type | Name | Value |
|------|------|--------|
| A | `identity` | Elastic IP |
| A | `core` | Elastic IP |

So you get:
- `https://identity.societywale.in`
- `https://core.societywale.in`

Caddy auto-provisions Let’s Encrypt certificates when ports 80/443 are open and DNS points here.

Edit `deploy/aws/Caddyfile` if you use different hostnames.

### B5 — Start backends

```bash
cd ~/SocietyMaintenanceApp/deploy/aws
docker compose up -d --build
docker compose ps
docker compose logs -f --tail=100
```

First build takes several minutes (Maven).

Health checks:

```bash
curl -s https://identity.societywale.in/actuator/health
curl -s https://core.societywale.in/actuator/health
```

Expect `{"status":"UP",...}`.

### B6 — Point Vercel frontend at AWS

Vercel → Project **societywale** → **Settings** → **Environment Variables**:

```text
VITE_IDENTITY_URL=https://identity.societywale.in/api/v1
VITE_CORE_URL=https://core.societywale.in/api/v1
```

**Redeploy** frontend (env is baked at build time).

### B7 — Stop / remove Render (optional)

After AWS works, suspend/delete `societywale-identity` and `societywale-core` on Render so you don’t pay/sleep there anymore.

---

## C) Frontend domain SocietyWale.in (Vercel)

Keep frontend on Vercel:

1. Vercel → Domains → add `societywale.in` + `www`
2. GoDaddy DNS: A/CNAME exactly as Vercel shows
3. Keep `APP_CORS_ORIGINS` including `https://societywale.in` and `https://www.societywale.in`

---

## D) Cost / sizing notes

| Choice | Notes |
|--------|--------|
| **t3.small** | Best balance for 2 Spring Boot containers on credits |
| **t3.micro** | Free-tier eligible but often OOM with two JVMs — avoid |
| Neon | Stay on free; no change |
| Vercel | Stay on free Hobby |
| Data transfer | Usually small for this app |

Estimate with credits: roughly **$10–20/month** for a small always-on EC2 + Elastic IP (varies by region). Your $100–200 goes a long way.

---

## E) Updates after code changes

```bash
cd ~/SocietyMaintenanceApp
git pull
cd deploy/aws
docker compose up -d --build
```

---

## F) Troubleshooting

| Problem | Fix |
|---------|-----|
| Containers restart / OOM | Use **t3.small**; keep `mem_limit` / `JAVA_OPTS` as in compose |
| HTTPS fails | DNS A records must point to Elastic IP; SG allow 80+443 |
| CORS errors | Update `APP_CORS_ORIGINS`, then `docker compose up -d` |
| Login fails after cutover | Vercel `VITE_*` must include `/api/v1` + redeploy |
| Old Render still used | Check Vercel env is AWS URLs, not `*.onrender.com` |
| Can’t SSH | SG port 22 limited to your IP; use correct `.pem` |

---

## G) Env cheat sheet (AWS `.env`)

```text
DB_URL=jdbc:postgresql://HOST/Societywale?sslmode=require
DB_USER=neondb_owner
DB_PASSWORD=***
JWT_SECRET=***
APP_CORS_ORIGINS=https://societywale.vercel.app,https://societywale.in,https://www.societywale.in,http://localhost:5173
```

## H) Vercel env (after AWS)

```text
VITE_IDENTITY_URL=https://identity.societywale.in/api/v1
VITE_CORE_URL=https://core.societywale.in/api/v1
```

---

## Local development (unchanged)

```powershell
.\scripts\start-backend-neon.ps1 -Service identity
.\scripts\start-backend-neon.ps1 -Service core
cd frontend; npm run dev
```
