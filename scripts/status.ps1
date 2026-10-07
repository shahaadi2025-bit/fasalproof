# Plain-language progress check: shows what is DONE and what is still TO DO, with the fix for each. Usage: .\scripts\status.ps1
param([string]$Api = "https://fasalproof.onrender.com")
function Say($ok, $msg, $fix) { if ($ok) { Write-Host "[DONE]   $msg" -ForegroundColor Green } else { Write-Host "[TO DO]  $msg" -ForegroundColor Yellow; Write-Host "         -> $fix" } }
Write-Host "Checking your FasalProof setup (the free server may take a minute to wake)..." -ForegroundColor Cyan
try { $h = Invoke-RestMethod "$Api/health" -TimeoutSec 150; Say ([version]$h.version -ge [version]"4.2") "Backend version is $($h.version) (needs 4.2 or newer)" "Run .\scripts\update-all.ps1, then wait for Render to finish building" }
catch { Say $false "Backend is not answering" "Open $Api in a browser, wait about 60 seconds, then run this again" }
try { $p = Invoke-RestMethod "$Api/pubkey" -TimeoutSec 60; Say (-not $p.ephemeral) "Signing key is permanent (key id $($p.key_id))" "Render > your service > Environment > add SIGNING_KEY with a NEW key (never share it) > Save Changes" }
catch { Say $false "Report signing is not available on this server version" "Update the backend first (run .\scripts\update-all.ps1)" }
try { $c = gh api repos/:owner/fasalproof/contents/main.py -q .content; $t = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String(($c -replace '\s', ''))); Say ($t -match '"version": "4\.([2-9]|\d\d)"') "GitHub has the newest backend code" "Run .\scripts\update-all.ps1" }
catch { Say $false "Could not read your GitHub repository" "Run: gh auth login" }
try { $u = gh api user -q .login; $r = Invoke-WebRequest "https://$u.github.io/fasalproof/" -UseBasicParsing -TimeoutSec 60; Say ($r.Content -match "assets/") "Website is live: https://$u.github.io/fasalproof/" "Run .\scripts\update-all.ps1" }
catch { Say $false "Website is not reachable" "Run .\scripts\update-all.ps1, wait 2 minutes, then check again" }
Write-Host ""; Write-Host "When everything says DONE, run .\scripts\verify-live.ps1 for the full end-to-end test." -ForegroundColor Cyan
