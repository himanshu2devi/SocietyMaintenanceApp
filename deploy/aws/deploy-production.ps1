# Deploy latest SocietySimplify to production (backend EC2 + notes for Vercel frontend).
# Prerequisites: satara-key.pem in repo root (gitignored), SSH port 22 open for YOUR IP in AWS SG.
#
# Usage:
#   .\deploy\aws\deploy-production.ps1
#
# Frontend (Vercel): after git push, ensure Vercel deploys commit on main — NOT "Redeploy" of an old
# deployment. Use Vercel → Deployments → Create Deployment → branch main, or set up VERCEL_DEPLOY_HOOK
# in GitHub Actions secrets (see .github/workflows/vercel-production.yml).
$ErrorActionPreference = "Stop"
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$key = Join-Path $root "satara-key.pem"
$hostIp = "43.205.184.92"

if (-not (Test-Path $key)) {
    Write-Host "Missing $key — copy your EC2 .pem to the repo root (never commit it)." -ForegroundColor Red
    exit 1
}

icacls $key /inheritance:r | Out-Null
icacls $key /grant:r "$($env:USERNAME):(R)" | Out-Null

$remote = @'
set -e
cd ~/SocietyMaintenanceApp
git fetch origin
git pull --ff-only origin main
cd deploy/aws
if grep -q '^OPENAI_API_KEY=' .env 2>/dev/null; then echo 'OPENAI_API_KEY present'; else echo 'WARNING: add OPENAI_API_KEY to deploy/aws/.env on server'; fi
docker compose up -d --build identity core caddy
docker compose ps
curl -sf http://127.0.0.1/identity/actuator/health || true
curl -sf http://127.0.0.1/core/actuator/health || true
curl -sf http://127.0.0.1/core/api/v1/assistant/status || true
echo DEPLOY_DONE
'@

Write-Host "Deploying to ubuntu@${hostIp} ..." -ForegroundColor Cyan
ssh -i $key -o StrictHostKeyChecking=accept-new ubuntu@$hostIp $remote
