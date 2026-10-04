# Push to GitHub + enable Pages. Needs: git, GitHub CLI (winget install GitHub.cli), then `gh auth login` once.
Set-Location (Split-Path $PSScriptRoot)
git init -b main
git add .
git commit -m "FasalProof: VORTEX 2K26 submission"
gh repo create fasalproof --public --source . --push
gh api -X POST repos/:owner/fasalproof/pages -f "source[branch]=main" -f "source[path]=/"
Write-Host "Repo: " (gh repo view --json url -q .url)
Write-Host "Live site in ~1 min: https://$((gh api user -q .login)).github.io/fasalproof/" -ForegroundColor Green
