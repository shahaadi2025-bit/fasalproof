# Evidence pack for the judges

Everything below separates what is **documented**, what is **measured**, and what is **not yet measured**. Fill the marked blanks from your own run; do not quote numbers you did not produce.

## 1. The documented event (live-demo case)
**Ravi river flood, Ajnala and Ramdass belt, Amritsar district, Punjab (India), from 27 August 2025.** Crop: paddy (rice, Kharif).

| Fact | Source |
|---|---|
| Standing crops on nearly 23,000 ha destroyed in Ajnala since 27 August, when the Ravi first entered villages | The Tribune, "23,000 hectares submerged, 50 houses collapse in Ajnala" |
| Ghonewal and Machhiwala worst hit after a breach in the Dhussi Bandh | The Tribune, "Ravi river in spate: 20 villages affected" |
| Floodwater reached about 10 km from the Ravi bank | The Tribune, "Ravi spreads 10 km beyond bank" |
| About 20 breaches, nearly 190 villages inundated in Ajnala and Lopoke | The Tribune e-paper, September 2025 |
| Paddy on 3,47,601 acres impacted across five districts including Amritsar | The Tribune, "3.47L acres of paddy submerged in 5 dists" |
| Flood escalated in late August and peaked in early September | SPHERE India situation report, 1 Sep 2025 |

URLs are in `demo/punjab_2025_ajnala_ravi_flood.json` and appear in the generated report. Context only, not our validation: independent agencies also mapped this flood season with Sentinel-1 radar and Sentinel-2 imagery (for example FAO's assessment for the Pakistan side of Punjab).

## 2. How the demo field is chosen (fixed in advance)
Five points around the documented place (centre, and 700 m north, south, east, west). **The demo field is the point with the highest pre-event canopy (baseline NDVI)**, a proxy for "this is cropland", chosen without looking at losses. All five are reported in `candidates.csv`, including any that failed for cloud cover. This prevents picking the most dramatic result.

## 3. Result of the live run (fill from `demo/out/punjab-2025-ajnala-ravi-flood/raw_results.json`)
| Item | Your run |
|---|---|
| Selected point and coordinates | |
| Vegetation loss % (95% CI) | |
| Detected break date vs documented onset (27 Aug) | |
| Scenes used, before / after dates | |
| Rain within 3 days of the onset vs 10-year history (percentile) | |
| Radar new-flood % (experimental) | |
| All candidates (loss % range) | |
**If the loss is small or the run fails, report that.** Monsoon cloud can leave few usable optical scenes; that is a stated limitation, and the radar check exists for exactly this case.

## 4. Data limitations (say these first)
- Sentinel-2 is optical: monsoon cloud and haze reduce usable scenes; each pixel is cloud-masked and the scene count is shown.
- 10 m pixels; the plot is a square around a point, not a surveyed boundary.
- NDVI cannot identify the crop; senescence (ripening) also lowers NDVI, which is why the tool has a ripening guard.
- Flooded paddy can look different from flooded dryland crops; water, silt and crop stage all change the signal.
- Weather comes from reanalysis (Open-Meteo), not a gauge at the field.
- Crop stage lengths are FAO regional averages, not local varieties.
- The tool gives evidence only; it does not decide eligibility or compensation.

## 5. False positives
- **Preliminary, real observations (your `verify-live` run on arbitrary dates, not verified as event-free):** Ludhiana 12 Apr 2025 reported 19.3% (CI 8.6-30.9), Beed 20 Nov 2025 14.1% (CI 6.8-20.4), Jaipur 15 Dec 2025 13.7% (CI 2.2-19.9). n = 3, so this is a warning, not a rate.
- **Interpretation:** apparent losses of roughly 10-20% occur without a documented event (natural variation and ripening). Values below about 25% should not be read as damage; the confidence interval spans zero in these cases.
- **Case-study controls:** the generator re-runs the selected point for the same dates one and two years earlier (assumed non-event seasons; verify that no flood hit the point). Record those numbers in section 3's table.
- **Mitigations in the tool:** confidence intervals, anomaly z-score against a robust expected curve, break-date check, scene-count warning, ripening guard.

## 6. Validation status
**Not yet measured at scale.** `validation/events.csv` and `scripts/validate.ps1` score the tool on documented damaged fields and no-event fields (precision, recall, specificity, error against reported loss). Target before any accuracy claim: at least 10 damaged and 10 no-event rows with source links. Until then the tool presents itself as decision support under validation, and no accuracy figure appears anywhere in the product or deck.

## 7. Why this is more than a conventional dashboard
| A conventional monitoring dashboard | FasalProof |
|---|---|
| Aggregates by district or region | Starts from one farmer's plot and one loss date |
| Answers "how is the season going?" | Answers "was this field damaged, by how much, and how sure are we?" |
| Leaves interpretation to the viewer | Compares against a robust expected curve, 10-year local rain history and the crop's growth stage |
| Output is a view | Output is a claim kit: the claim route and deadline, a letter in six languages, calendar reminders |
| Charts can be edited or screenshotted | Reports are signed (Ed25519) and verifiable |
| Built for analysts | Built for a farmer: assistant, local languages, offline queue |

## 8. Likely questions
- **How accurate is it?** Not yet measured at scale; here is the documented case, its controls and the false-positive warning. The validation plan and script are in the repository.
- **Why trust one field?** We do not. One field illustrates; the selection rule is fixed in advance and every candidate is shown.
- **What if it is cloudy?** Per-pixel cloud masking, window widening, scene-count warnings, and an experimental radar check.
- **Is this an official assessment?** No. It supports a claim; the insurer's assessment stays official.
