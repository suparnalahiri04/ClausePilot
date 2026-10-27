# ClausePilot Full-Stack Launcher
Write-Host "Starting ClausePilot Backend API on http://127.0.0.1:8000 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\backend'; python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

Write-Host "Starting ClausePilot Frontend Workspace on http://localhost:5173 ..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot\frontend"
npm run dev

