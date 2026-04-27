# ============================================================
# Smart Disaster Response MIS - Start Script
# Run this EVERY TIME you want to start the project
# Usage: Right-click -> Run with PowerShell
#        OR in terminal: .\start.ps1
# ============================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Smart Disaster Response MIS" -ForegroundColor Cyan
Write-Host "  Starting up..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill any local node server.js processes that conflict with Docker
Write-Host "Step 1: Killing any local backend processes on port 5001..." -ForegroundColor Yellow
$procs = Get-NetTCPConnection -LocalPort 5001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
foreach ($pid in $procs) {
    $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
    if ($proc -and $proc.ProcessName -eq "node") {
        Write-Host "  Killing local node process PID $pid" -ForegroundColor Red
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
}
Write-Host "  Done." -ForegroundColor Green

# Step 2: Stop all existing containers cleanly
Write-Host ""
Write-Host "Step 2: Stopping existing Docker containers..." -ForegroundColor Yellow
docker-compose down 2>&1 | Out-Null
Write-Host "  Done." -ForegroundColor Green

# Step 3: Start Docker containers (force recreate to avoid stale images)
Write-Host ""
Write-Host "Step 3: Starting Docker containers (force recreate)..." -ForegroundColor Yellow
docker-compose up -d --force-recreate 2>&1
Write-Host "  Done." -ForegroundColor Green

# Step 4: Wait for backend to be ready
Write-Host ""
Write-Host "Step 4: Waiting for backend to be ready..." -ForegroundColor Yellow
$maxWait = 60
$waited = 0
do {
    Start-Sleep -Seconds 3
    $waited += 3
    try {
        $health = Invoke-WebRequest -Uri "http://127.0.0.1:5001/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($health.StatusCode -eq 200) { break }
    } catch {}
    Write-Host "  Waiting... ($waited/$maxWait seconds)" -ForegroundColor Gray
} while ($waited -lt $maxWait)

if ($waited -ge $maxWait) {
    Write-Host "  Backend took too long. Check: docker logs disaster-response-backend" -ForegroundColor Red
} else {
    Write-Host "  Backend is ready!" -ForegroundColor Green
}

# Step 5: Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SYSTEM READY" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Backend API:      http://localhost:5001" -ForegroundColor White
Write-Host "  Admin Portal:     http://localhost:3010" -ForegroundColor White
Write-Host "  Hospital Portal:  http://localhost:3011" -ForegroundColor White
Write-Host "  Citizen Portal:   http://localhost:3012" -ForegroundColor White
Write-Host "  Rescue Portal:    http://localhost:3013" -ForegroundColor White
Write-Host "  Finance Portal:   http://localhost:3014" -ForegroundColor White
Write-Host ""
Write-Host "  Login credentials:" -ForegroundColor Yellow
Write-Host "  Admin:     admin@disaster.gov / admin123" -ForegroundColor Gray
Write-Host "  Operator:  operator@disaster.gov / operator123" -ForegroundColor Gray
Write-Host "  Finance:   finance@disaster.gov / finance123" -ForegroundColor Gray
Write-Host "  Rescue:    rescue@disaster.gov / rescue123" -ForegroundColor Gray
Write-Host "  Hospital:  hospital@disaster.gov / hospital123" -ForegroundColor Gray
Write-Host "  Citizen:   citizen@disaster.gov / citizen123" -ForegroundColor Gray
Write-Host ""
Write-Host "  NOTE: Start frontend dev servers separately:" -ForegroundColor Yellow
Write-Host "  cd admin-frontend   && npm run dev" -ForegroundColor Gray
Write-Host "  cd hospital-frontend && npm run dev" -ForegroundColor Gray
Write-Host "  cd citizen-frontend  && npm run dev" -ForegroundColor Gray
Write-Host "  cd rescue-frontend   && npm run dev" -ForegroundColor Gray
Write-Host "  cd finance-frontend  && npm run dev" -ForegroundColor Gray
Write-Host ""
