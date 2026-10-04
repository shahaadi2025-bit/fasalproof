# 🛰️ FasalProof: Satellite Proof for Every Farmer's Crop Insurance Claim
VORTEX 2K26 | Theme: Climate, Agriculture & Rural Innovation

## Problem
Indian farmers lose crop insurance (PMFBY) claims because they cannot prove their loss within the 72-hour window. Surveys are slow and paperwork is in English.

## Solution
Drop a pin on your field and enter the date of loss. FasalProof pulls free Sentinel-2 imagery, compares crop vegetation health (NDVI) before and after the calamity, estimates the loss %, and produces a printable claim-evidence report in English, Hindi, or Marathi.

## Impact and scalability
- Cost to farmer: ₹0. Data: free ESA/AWS open data. No API keys.
- Works for any plot in India; scales by adding states and languages.
- Reusable by banks, FPOs, NGOs and insurers for faster claim verification.

## Tech
FastAPI + rasterio (Python) | STAC search on Earth Search | HTML/JS frontend | Render + GitHub Pages (free tiers)

## Run locally
    pip install -r requirements.txt
    uvicorn main:app --reload
    # POST /analyze {"lat":18.99,"lon":75.76,"loss_date":"2025-09-20"}

## Limitations (honest)
NDVI is an indicator, not an official assessment; cloud cover can limit images; small plots are approximated by a 200 m square.

## Features
- Tap-on-satellite-map plot selection + GPS "use my location"
- Real Sentinel-2 NDVI before/after analysis with before/after scene thumbnails
- Weather corroboration (rain/heat) from free Open-Meteo archive
- Claim Strength Score (satellite + weather + 72-hour timeliness)
- Reports in English / Hindi / Marathi, printable PDF, QR code, WhatsApp share, read-aloud
- Hardened API: validation, cache, rate limit, retries, parallel reads
- Plot-level cloud masking (SCL), flood-water detection (NDWI), radar score breakdown, analyst narrative, offline-capable PWA

## Data sources (no placeholder data)
- PMFBY premium caps (2% Kharif, 1.5% Rabi food and oilseed; 5% annual commercial/horticultural), claim types, 72-hour intimation, 14-day post-harvest window, 25% prevented-sowing and mid-season caps: PMFBY operational guidelines (PIB, Ministry of Agriculture, Rajya Sabha answers).
- Crop growth-stage lengths and Kc values: FAO Irrigation & Drainage Paper 56, Tables 11 and 12 (regional averages; use local data where available).
- Not hard-coded because they vary by state and policy: sum insured (Scale of Finance), notified crops, enrolment cut-off dates. Users enter their policy values.
