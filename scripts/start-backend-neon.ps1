# Start Identity (8081) and/or Core (8082) against Neon Societywale.
# Usage:
#   .\scripts\start-backend-neon.ps1              # starts both
#   .\scripts\start-backend-neon.ps1 -Service identity
#   .\scripts\start-backend-neon.ps1 -Service core

param(
    [ValidateSet("both", "identity", "core")]
    [string]$Service = "both"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root "backend\neon.local.env"

function Import-DotEnv([string]$Path) {
    Get-Content $Path | ForEach-Object {
        $line = $_.Trim()
        if (-not $line -or $line.StartsWith("#")) { return }
        $parts = $line -split "=", 2
        if ($parts.Count -ne 2) { return }
        $name = $parts[0].Trim()
        $value = $parts[1].Trim().Trim('"').Trim("'")
        Set-Item -Path "Env:$name" -Value $value
    }
}

if (-not (Test-Path $envFile)) {
    Write-Host "Missing backend\neon.local.env" -ForegroundColor Red
    Write-Host "Copy backend\neon.local.env.example to backend\neon.local.env and set DB_PASSWORD + JWT_SECRET." -ForegroundColor Yellow
    exit 1
}

Import-DotEnv $envFile

if (-not $env:DB_PASSWORD -or $env:DB_PASSWORD -like "REPLACE*") {
    Write-Host "Set a real DB_PASSWORD in backend\neon.local.env" -ForegroundColor Red
    exit 1
}
if (-not $env:JWT_SECRET -or $env:JWT_SECRET -like "REPLACE*") {
    Write-Host "Set a real JWT_SECRET in backend\neon.local.env (same value for both services)." -ForegroundColor Red
    exit 1
}

$env:SPRING_PROFILES_ACTIVE = "prod"
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
            [System.Environment]::GetEnvironmentVariable("Path", "User")

$mvn = Get-Command mvn -ErrorAction SilentlyContinue
if (-not $mvn) {
    $fallback = "C:\tools\apache-maven-3.9.16-bin\apache-maven-3.9.16\bin\mvn.cmd"
    if (Test-Path $fallback) {
        Set-Alias mvn $fallback
    } else {
        Write-Host "mvn not found. Add Maven to PATH, then retry." -ForegroundColor Red
        exit 1
    }
}

function Start-Service([string]$Name, [string]$Dir) {
    Write-Host ""
    Write-Host "Starting $Name with Neon Societywale..." -ForegroundColor Cyan
    Write-Host "  DB_URL = $env:DB_URL"
    Set-Location $Dir
    & mvn spring-boot:run
}

$identityDir = Join-Path $root "backend\identity-service"
$coreDir = Join-Path $root "backend\core-service"

if ($Service -eq "identity") {
    Start-Service "identity-service" $identityDir
} elseif ($Service -eq "core") {
    Start-Service "core-service" $coreDir
} else {
    Write-Host "Open TWO terminals and run:" -ForegroundColor Green
    Write-Host "  .\scripts\start-backend-neon.ps1 -Service identity"
    Write-Host "  .\scripts\start-backend-neon.ps1 -Service core"
    Write-Host ""
    Write-Host "Frontend stays on http://localhost:5173 (no Neon string in Axios)." -ForegroundColor Yellow
}
