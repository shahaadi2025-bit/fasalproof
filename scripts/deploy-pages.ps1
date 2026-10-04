# Publish the React build (docs/ folder) with GitHub Pages and print your link.
Set-Location (Split-Path $PSScriptRoot)
git add .
git commit -m "React frontend (built)"
git push
gh api -X PUT repos/:owner/fasalproof/pages -f "source[branch]=main" -f "source[path]=/docs" 2>$null
if ($LASTEXITCODE -ne 0) { gh api -X POST repos/:owner/fasalproof/pages -f "source[branch]=main" -f "source[path]=/docs" }
$u = gh api user -q .login
Write-Host "`nYOUR LINK (live in ~1-2 min): https://$u.github.io/fasalproof/" -ForegroundColor Green
