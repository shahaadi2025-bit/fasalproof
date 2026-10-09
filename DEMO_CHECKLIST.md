# Demo-day checklist
**30 minutes before:** run `.\scripts\verify-live.ps1` until it says READY. Open the API URL once so the free server is awake. Keep "experimental features" OFF.
**Backup plan:** (1) the recorded 2-minute video, (2) the app's "Load last saved result" button (a real earlier run), (3) screenshots in the deck.
**Demo flow (2 min):** search a village > pick a real past event date > Run > Overview (loss %, claim strength) > Signal chart (break date) > Damage map > Claim tab (which PMFBY route, 72-hour deadline) > Claim kit (letter + reminders) > Sign report.

## Likely questions and honest answers
- **How accurate is it?** Quote the numbers from `validation/validate.py`. If you have not measured, say "we validated on N documented events: precision X, recall Y" only with real values, or say it is a decision-support tool still being validated.
- **Is this an official assessment?** No. It is supporting evidence for a claim; the insurer's assessment (crop-cutting for area claims, plot inspection for localised ones) stays official.
- **What about clouds in monsoon?** Per-pixel cloud masking and auto-widening of the window; radar (Sentinel-1) is in progress as an experimental feature.
- **Why free data?** Sentinel-2 is free and open (10 m, about 5-day revisit), so the cost per farmer is zero and it scales.
- **Where do the numbers come from?** NDVI/NDWI from Sentinel-2; Theil–Sen regression gives the expected healthy curve; a bootstrap gives the interval; premiums, claim types and the 72-hour rule come from PMFBY guidelines; stage lengths from FAO-56.
- **What are the limits?** NDVI cannot identify the crop; the plot is a square approximation; stage lengths are regional averages; sum insured is user-entered; the phenology adjustment and Bayesian score are heuristics.
- **Privacy?** No accounts; photos and AI run on-device; history stays in the browser.
- **What next?** Land-record boundaries, WhatsApp bot, state insurer integration, validation with field data.

## Live demo on a documented event (Punjab flood, Aug 2025)
1. Beforehand (about 10 minutes): `.\scripts\demo-case.ps1` writes `demo\out\punjab-2025-ajnala-ravi-flood\` (evidence_report.html, signed_bundle.json, candidates.csv, before.png, after.png). Open the report, check it, and keep it as the backup.
2. In the app: search "Ramdass" (Amritsar), set the loss date to 2025-08-27, calamity Flood, crop Rice, press Run.
3. Show: Overview (loss with range) > Damage map tab (drag the before/after slider) > Weather tab (rain vs 10-year history) > Report tab (images and weather are inside) > Print / PDF > Sign and download > verify the file from the left panel.
4. If optical scenes are limited by cloud, say so, then switch on experimental features and run the radar check.
5. Close with `EVIDENCE.md`: limitations, false positives, validation status.
