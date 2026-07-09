# Generate JWT secret for production (PowerShell)
Write-Host "JWT_SECRET=$([Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 })))" -ForegroundColor Cyan
Write-Host ""
Write-Host "Use the SAME JWT_SECRET on both Railway services (identity + core)." -ForegroundColor Yellow
