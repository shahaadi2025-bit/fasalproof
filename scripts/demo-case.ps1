# Runs the documented-event case study and writes a printable evidence report. Takes about 5-15 minutes on the free server.
# Usage: .\scripts\demo-case.ps1 [-Config demo\punjab_2025_ajnala_ravi_flood.json] [-Api https://fasalproof.onrender.com]
param([string]$Config = "demo\punjab_2025_ajnala_ravi_flood.json", [string]$Api = "https://fasalproof.onrender.com")
Set-Location (Split-Path $PSScriptRoot)
Write-Host "Waking the server..." -ForegroundColor Yellow
try { Invoke-RestMethod "$Api/health" -TimeoutSec 150 | Out-Null } catch { Write-Host "Server not answering yet; the script will retry per request." -ForegroundColor Yellow }
python demo\case_study.py $Config $Api
$slug = (Get-Content $Config -Raw | ConvertFrom-Json).slug
$f = "demo\out\$slug\evidence_report.html"
if (Test-Path $f) { Start-Process (Resolve-Path $f) }
