# Run backend locally (PowerShell). Usage: .\scripts\run.ps1
Set-Location (Split-Path $PSScriptRoot)
if (-not (Test-Path .venv)) { python -m venv .venv }
.\.venv\Scripts\python.exe -m pip install -q --upgrade pip
.\.venv\Scripts\python.exe -m pip install -q -r requirements.txt
Write-Host "API on http://127.0.0.1:8000/docs" -ForegroundColor Green
.\.venv\Scripts\python.exe -m uvicorn main:app --reload
