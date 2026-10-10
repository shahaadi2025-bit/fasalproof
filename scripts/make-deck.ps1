# Adds your REAL live-run results (numbers + before/after images) to the pitch deck as a new slide.
# Run .\scripts\demo-case.ps1 first. Usage: .\scripts\make-deck.ps1 [-Case demo\out\punjab-2025-ajnala-ravi-flood]
param([string]$Case = "demo\out\punjab-2025-ajnala-ravi-flood")
Set-Location (Split-Path $PSScriptRoot)
if (-not (Test-Path "$Case\raw_results.json")) { throw "No results in $Case. Run .\scripts\demo-case.ps1 first." }
python -m pip install --quiet python-pptx
python demo\fill_deck.py submission\FasalProof_Pitch_Deck.pptx $Case submission\FasalProof_Pitch_Deck_with_live_result.pptx
Start-Process (Resolve-Path "submission\FasalProof_Pitch_Deck_with_live_result.pptx")
