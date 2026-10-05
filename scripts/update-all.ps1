# One-shot update: cleans stale build files, pushes to GitHub (with retries), confirms GitHub has the new code, waits for Render, verifies everything.
# Usage: .\scripts\update-all.ps1 [-DeployHook "https://api.render.com/deploy/srv-XXXX?key=YYYY"]
param([string]$DeployHook = "", [string]$Api = "https://fasalproof.onrender.com")
Set-Location (Split-Path $PSScriptRoot)
function Step($t) { Write-Host ""; Write-Host "== $t" -ForegroundColor Cyan }

Step "1. Local files are the latest version"
$line = Select-String -Path main.py -Pattern '"version": "(\d+\.\d+)"' | Select-Object -First 1
if (-not $line) { throw "main.py not found. Run this from inside the fasalproof folder." }
$v = $line.Matches[0].Groups[1].Value
if ([version]$v -lt [version]"4.2") { throw "main.py is version $v. Unzip the newest fasalproof.zip over this folder first." }
foreach ($f in "ml.py", "sign.py", "Dockerfile", "docs\index.html") { if (-not (Test-Path $f)) { throw "$f is missing. Unzip the newest fasalproof.zip first." } }
Write-Host "Local backend is version $v and all files are present." -ForegroundColor Green

Step "2. Clean stale build files and push to GitHub"
$ref = Get-Content docs\index.html -Raw
Get-ChildItem docs\assets -File -ErrorAction SilentlyContinue | Where-Object { $ref -notmatch [regex]::Escape($_.Name) } | ForEach-Object { Write-Host "  removing stale file $($_.Name)"; Remove-Item $_.FullName -Force }
git config core.autocrlf false
git config http.postBuffer 524288000
git fetch origin 2>&1 | Out-Null
$ahead = [int](git rev-list --count origin/main..HEAD 2>$null)
if ($ahead -gt 0) { Write-Host "  dropping $ahead local commit(s) that GitHub rejected (your files are kept)"; git reset --soft origin/main }
git add -A
git commit -m "update to latest version" 2>&1 | Out-Null
$pushed = $false
for ($i = 1; $i -le 4 -and -not $pushed; $i++) {
  git push -u origin HEAD 2>&1 | ForEach-Object { Write-Host $_ }
  if ($LASTEXITCODE -eq 0) { $pushed = $true } else { Write-Host "  push attempt $i failed. Retrying in 10 seconds..." -ForegroundColor Yellow; Start-Sleep -Seconds 10 }
}
if (-not $pushed) { throw "git push failed 4 times. Check your internet, then run: gh auth status. If GitHub blocks it for a 'secret', send me the file path it prints." }

Step "3. GitHub really has the new code"
$c = gh api repos/:owner/fasalproof/contents/main.py -q .content
$txt = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String(($c -replace '\s', '')))
if ($txt -notmatch [regex]::Escape("`"version`": `"$v`"")) { throw "GitHub's main.py is NOT version $v. The push did not carry the new files." }
foreach ($f in "ml.py", "sign.py") { gh api repos/:owner/fasalproof/contents/$f -q .name | Out-Null; if ($LASTEXITCODE -ne 0) { throw "$f is missing on GitHub." } }
Write-Host "GitHub has backend version $v with ml.py and sign.py." -ForegroundColor Green

Step "4. Website (GitHub Pages from /docs)"
gh api -X PUT repos/:owner/fasalproof/pages -f "source[branch]=main" -f "source[path]=/docs" 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) { gh api -X POST repos/:owner/fasalproof/pages -f "source[branch]=main" -f "source[path]=/docs" 2>$null | Out-Null }
$u = gh api user -q .login
Write-Host "Website: https://$u.github.io/fasalproof/  (live in 1-2 minutes)" -ForegroundColor Green

Step "5. Redeploy the Render backend"
if ($DeployHook) { Invoke-RestMethod -Method Post $DeployHook | Out-Null; Write-Host "Deploy triggered through your deploy hook." -ForegroundColor Green }
else { Write-Host "No deploy hook given. If Render has Auto-Deploy on, the push already started a build. Otherwise: render.com > fasalproof > Manual Deploy > 'Clear build cache & deploy'." -ForegroundColor Yellow }

Step "6. Waiting for the backend to report version $v (build takes 5-10 minutes)"
$ready = $false
for ($i = 1; $i -le 45; $i++) {
  try { $h = Invoke-RestMethod "$Api/health" -TimeoutSec 30; Write-Host ("  [{0}] server says version {1}" -f $i, $h.version); if ([version]$h.version -ge [version]$v) { $ready = $true; break } }
  catch { Write-Host ("  [{0}] server not answering yet (building or waking)" -f $i) }
  Start-Sleep -Seconds 20
}
if (-not $ready) { throw "Backend still not on version $v after 15 minutes. Open Render > your service > Logs and send me the last 30 lines. Also check Settings: Branch = main, Root Directory empty." }

Step "7. Full end-to-end verification"
.\scripts\verify-live.ps1 -Api $Api
