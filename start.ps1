# FXEC Campus Event Management System - PowerShell Launcher
$ErrorActionPreference = "Continue"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Launching FXEC Campus Event Management System" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# 1. Check MySQL
$mysql3306 = Get-NetTCPConnection -LocalPort 3306 -State Listen -ErrorAction SilentlyContinue
if ($mysql3306) {
    Write-Host "[1/3] MySQL Server is running on port 3306 [MySQL80 service]." -ForegroundColor Green
} else {
    $mysql3307 = Get-NetTCPConnection -LocalPort 3307 -State Listen -ErrorAction SilentlyContinue
    if (-not $mysql3307) {
        Write-Host "[1/3] Starting MySQL Server on port 3307..." -ForegroundColor Yellow
        Start-Process -FilePath "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" -ArgumentList "--datadir=`"$PSScriptRoot\mysql-data`"", "--port=3307" -WindowStyle Hidden
        Start-Sleep -Seconds 3
    } else {
        Write-Host "[1/3] MySQL Server is already running on port 3307." -ForegroundColor Green
    }
}

# 2. Start Backend API Server
Write-Host "[2/3] Starting Backend API Server on Port 5000..." -ForegroundColor Green
Start-Process cmd.exe -ArgumentList "/k cd /d `"$PSScriptRoot\server`" && npm start" -WindowStyle Normal

# 3. Start Frontend Dev Server
Write-Host "[3/3] Starting Frontend Dev Server on Port 5173..." -ForegroundColor Green
Start-Process cmd.exe -ArgumentList "/k cd /d `"$PSScriptRoot\client`" && npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "Application launched successfully!" -ForegroundColor Cyan
Write-Host "Open http://localhost:5173 in your browser." -ForegroundColor Yellow
