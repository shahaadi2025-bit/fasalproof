# Tries several known-clear plots/dates. Usage: .\scripts\test.ps1 [-Api http://127.0.0.1:8000]
param([string]$Api = "http://127.0.0.1:8000")
$tests = @(
 @{n="Punjab (Ludhiana)"; lat=30.90; lon=75.85; d="2025-04-12"},
 @{n="Maharashtra (Beed) post-monsoon"; lat=18.99; lon=75.76; d="2025-11-20"},
 @{n="Rajasthan (Jaipur)"; lat=26.91; lon=75.79; d="2025-12-15"})
foreach ($t in $tests) {
  try {
    $b = @{lat=$t.lat; lon=$t.lon; loss_date=$t.d} | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "$Api/analyze" -Method Post -ContentType "application/json" -Body $b -TimeoutSec 180
    Write-Host "OK  $($t.n): loss $($r.loss_pct)% | water +$($r.water_pct)% | $($r.severity) | $($r.images_used) scenes | $($r.confidence)" -ForegroundColor Green
  } catch { Write-Host "--  $($t.n): $($_.ErrorDetails.Message)" -ForegroundColor Yellow }
}
