# Confirms the LIVE pipeline end to end. Usage: .\scripts\verify-live.ps1 [-Api https://fasalproof.onrender.com]
param([string]$Api = "https://fasalproof.onrender.com")
$script:pass = 0; $script:fail = 0
function Check($name, [scriptblock]$test) {
  try { $r = & $test; Write-Host ("PASS  {0}  {1}" -f $name, $r) -ForegroundColor Green; $script:pass++ }
  catch { $m = $_.Exception.Message; if ($_.ErrorDetails.Message) { $m = $_.ErrorDetails.Message }; Write-Host ("FAIL  {0}  {1}" -f $name, $m) -ForegroundColor Red; $script:fail++ }
}
Write-Host "Waking the server (free tier can take about 60 seconds)..." -ForegroundColor Yellow
Check "Backend health and version >= 4.2" { $h = Invoke-RestMethod "$Api/health" -TimeoutSec 150; if ([version]$h.version -lt [version]"4.2") { throw "version $($h.version) is OLD. On Render: Manual Deploy > Clear build cache & deploy" }; "v$($h.version)" }
Check "Signing key endpoint" { $p = Invoke-RestMethod "$Api/pubkey" -TimeoutSec 60; "key $($p.key_id), ephemeral=$($p.ephemeral) (set SIGNING_KEY if true)" }
Check "Sign, verify and tamper detection" {
  $h = "a" * 64; $j = "application/json"
  $s = Invoke-RestMethod "$Api/sign" -Method Post -ContentType $j -Body (@{hash = $h} | ConvertTo-Json) -TimeoutSec 60
  $ok = Invoke-RestMethod "$Api/verify" -Method Post -ContentType $j -Body (@{hash = $h; signed_at = $s.signed_at; sig = $s.sig} | ConvertTo-Json) -TimeoutSec 60
  $bad = Invoke-RestMethod "$Api/verify" -Method Post -ContentType $j -Body (@{hash = ("b" * 64); signed_at = $s.signed_at; sig = $s.sig} | ConvertTo-Json) -TimeoutSec 60
  if (-not $ok.valid) { throw "a valid signature was rejected" }; if ($bad.valid) { throw "a tampered hash was accepted" }; "genuine=valid, tampered=rejected"
}
$sites = @(@{n = "Punjab (Ludhiana)"; lat = 30.90; lon = 75.85; d = "2025-04-12"}, @{n = "Maharashtra (Beed)"; lat = 18.99; lon = 75.76; d = "2025-11-20"}, @{n = "Rajasthan (Jaipur)"; lat = 26.91; lon = 75.79; d = "2025-12-15"}, @{n = "USA (Iowa)"; lat = 42.00; lon = -93.50; d = "2025-08-10"}, @{n = "Brazil (Parana)"; lat = -23.30; lon = -51.20; d = "2025-07-20"})
foreach ($t in $sites) {
  Check ("Satellite analysis: " + $t.n) {
    $b = @{lat = $t.lat; lon = $t.lon; loss_date = $t.d} | ConvertTo-Json
    $r = Invoke-RestMethod "$Api/analyze" -Method Post -ContentType "application/json" -Body $b -TimeoutSec 240
    if (-not $r.stats) { throw "reply has no ML statistics (old backend)" }
    "loss $($r.loss_pct)% (CI $($r.stats.ci -join '-')), $($r.images_used) scenes, zones=$([bool]$r.zones)"
  }
}
Check "Open-Meteo weather (from this PC)" { $w = Invoke-RestMethod "https://archive-api.open-meteo.com/v1/archive?latitude=18.99&longitude=75.76&start_date=2025-01-01&end_date=2025-01-03&daily=precipitation_sum" -TimeoutSec 60; "$($w.daily.time.Count) days returned" }
Check "Website on GitHub Pages" { $u = (gh api user -q .login); $r = Invoke-WebRequest "https://$u.github.io/fasalproof/" -UseBasicParsing -TimeoutSec 60; if ($r.Content -notmatch "assets/") { throw "page loads but the app bundle is missing" }; "https://$u.github.io/fasalproof/ (HTTP $($r.StatusCode))" }
try { $s = Invoke-RestMethod "$Api/sar" -Method Post -ContentType "application/json" -Body (@{lat = 26.2; lon = 91.7; loss_date = "2024-07-10"} | ConvertTo-Json) -TimeoutSec 120; Write-Host "INFO  Radar (experimental): new flood $($s.new_flood_pct)%" -ForegroundColor Cyan }
catch { Write-Host "INFO  Radar (experimental) not working: $($_.ErrorDetails.Message). Keep experimental features switched off for the demo." -ForegroundColor Yellow }
Write-Host ""; Write-Host ("{0} passed, {1} failed" -f $script:pass, $script:fail) -ForegroundColor $(if ($script:fail) { "Red" } else { "Green" })
if (-not $script:fail) { Write-Host "READY: the live pipeline works end to end." -ForegroundColor Green }
