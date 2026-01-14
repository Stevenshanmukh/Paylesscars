
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Payless Cars Fresh Setup (Windows)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$ErrorActionPreference = "Stop"

# Navigate to project root (assuming script is in scripts/)
Set-Location "$PSScriptRoot\.."
$ProjectRoot = Get-Location
Write-Host "Project Root: $ProjectRoot"

# Function to check result
function CheckResult {
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error occurred! Exiting." -ForegroundColor Red
        exit 1
    }
}

Write-Host "Step 1: Killing any existing processes..." -ForegroundColor Yellow
try {
    Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
    Stop-Process -Name "python" -Force -ErrorAction SilentlyContinue
}
catch {}
Start-Sleep -Seconds 1
Write-Host "[OK] Processes killed" -ForegroundColor Green

Write-Host "Step 2: Setting up Backend..." -ForegroundColor Yellow
Set-Location "backend"

# Check Python
try {
    cmd /c "python --version" | Out-Null
}
catch {
    Write-Host "Python not found! Please install Python." -ForegroundColor Red
    exit 1
}

# Create venv
if (-not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..."
    python -m venv venv
    CheckResult
}

# Python Executable
$PythonExe = "venv\Scripts\python.exe"
$PipExe = "venv\Scripts\pip.exe"

if (-not (Test-Path $PythonExe)) {
    # Try full path
    $PythonExe = "$ProjectRoot\carnegotiate\venv\Scripts\python.exe"
    $PipExe = "$ProjectRoot\carnegotiate\venv\Scripts\pip.exe"
}

if (-not (Test-Path $PythonExe)) {
    Write-Host "Virtual environment seems broken." -ForegroundColor Red
    exit 1
}

# Install Deps
Write-Host "Installing Python dependencies..."
& $PipExe install -r requirements/development.txt --quiet
CheckResult

# Migrations
Write-Host "Running database migrations..."
& $PythonExe manage.py migrate --no-input
CheckResult

# Seed Data Note
Write-Host "NOTE: If you need test data, run: python manage.py seed_test_data" -ForegroundColor Yellow

Write-Host "[OK] Backend ready" -ForegroundColor Green

Write-Host "Step 3: Setting up Frontend..." -ForegroundColor Yellow
Set-Location "..\frontend"

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing npm dependencies..."
    cmd /c "npm install"
    CheckResult
}
else {
    Write-Host "Updating npm dependencies..."
    cmd /c "npm install"
    CheckResult
}

Write-Host "[OK] Frontend ready" -ForegroundColor Green

Write-Host ""
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "To start: .\scripts\start-app.ps1"
