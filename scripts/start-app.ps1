
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Starting Payless Cars (Windows)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$ProjectRoot = Resolve-Path "$PSScriptRoot\.."

# Cleanup existing
Write-Host "Cleaning up existing processes..." -ForegroundColor Yellow
try {
    Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
    Stop-Process -Name "python" -Force -ErrorAction SilentlyContinue
}
catch {}
Start-Sleep -Seconds 2

# Start Backend
Write-Host "Starting Backend on http://localhost:8000 ..." -ForegroundColor Cyan
$BackendBatch = "$ProjectRoot\scripts\start-backend.bat"
# Using explicit python path from venv to avoid PATH issues
$BackendContent = @"
@echo off
cd "$ProjectRoot\backend"
if exist venv\Scripts\python.exe (
    venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000
) else (
    echo "Python venv not found! Run fresh-setup.ps1"
    pause
)
"@
Set-Content -Path $BackendBatch -Value $BackendContent

# Start in new window
Start-Process "cmd.exe" -ArgumentList "/c $BackendBatch" -WindowStyle Normal

# Wait for backend
Write-Host "Waiting for backend to start..."
for ($i = 1; $i -le 15; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/health/" -Method Head -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "[OK] Backend is running" -ForegroundColor Green
            break
        }
    }
    catch {}
    Start-Sleep -Seconds 1
}

# Start Frontend
Write-Host "Starting Frontend on http://localhost:3000 ..." -ForegroundColor Cyan
$FrontendBatch = "$ProjectRoot\scripts\start-frontend.bat"
$FrontendContent = @"
@echo off
cd "$ProjectRoot\frontend"
npm run dev
"@
Set-Content -Path $FrontendBatch -Value $FrontendContent

# Start in new window
Start-Process "cmd.exe" -ArgumentList "/c $FrontendBatch" -WindowStyle Normal

# Wait for frontend
Write-Host "Waiting for frontend..."
for ($i = 1; $i -le 60; $i++) {
    try {
        $con = New-Object Net.Sockets.TcpClient("localhost", 3000)
        if ($con.Connected) {
            Write-Host "[OK] Frontend is running" -ForegroundColor Green
            $con.Close()
            break
        }
    }
    catch {}
    Start-Sleep -Seconds 1
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  Payless Cars is Running!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend: http://localhost:3000"
Write-Host "  Backend:  http://localhost:8000"
Write-Host ""
Write-Host "  NOTE: Two new CMD windows were opened."
Write-Host "  Close them to stop the app."
