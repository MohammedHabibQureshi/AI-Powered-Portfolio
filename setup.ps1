# PowerShell workspace setup script for Windows local developer machines
Write-Host "Initializing AI-First Portfolio platform workspaces..." -ForegroundColor Cyan

# 1. Python Environment Check
if (Get-Command python -ErrorAction SilentlyContinue) {
    Write-Host "Python detected, creating virtual environment..." -ForegroundColor Green
    if (-not (Test-Path "backend\.venv")) {
        python -m venv backend\.venv
    }
    Write-Host "Installing backend requirements..." -ForegroundColor Green
    & backend\.venv\Scripts\pip install -r backend\requirements.txt
} else {
    Write-Warning "Python 3.13+ was not found on the system path. Skip backend setup."
}

# 2. Node & PNPM Workspace Setup
if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    Write-Host "PNPM detected, installing node modules..." -ForegroundColor Green
    pnpm install
} else {
    Write-Warning "PNPM was not found. Please install Node.js and PNPM to boot up the Next.js frontend."
}

Write-Host "Setup Completed! Execute 'pnpm run dev:backend' and 'pnpm run dev:frontend' to start." -ForegroundColor Cyan
