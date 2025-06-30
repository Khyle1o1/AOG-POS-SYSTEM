Write-Host "Starting POS System..." -ForegroundColor Green

if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js required! Install from https://nodejs.org/" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Starting server with proper ES module support..." -ForegroundColor Yellow
Write-Host "Server will be at: http://localhost:3000" -ForegroundColor Cyan
Start-Sleep -Seconds 2

node server.cjs
