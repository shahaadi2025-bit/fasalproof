# Re-create the zip. Usage: .\scripts\zip.ps1
Set-Location (Split-Path $PSScriptRoot)
$z = "..\fasalproof.zip"; if (Test-Path $z) { Remove-Item $z }
Compress-Archive -Path (Get-ChildItem -Exclude .venv,__pycache__) -DestinationPath $z
Write-Host "Created $z"
