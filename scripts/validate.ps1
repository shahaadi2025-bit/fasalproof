# Scores the pipeline against documented events. Usage: .\scripts\validate.ps1 [-Api URL] [-Events validation\events.csv]
param([string]$Api = "https://fasalproof.onrender.com", [string]$Events = "validation\events.csv")
Set-Location (Split-Path $PSScriptRoot)
python validation\validate.py $Api $Events
