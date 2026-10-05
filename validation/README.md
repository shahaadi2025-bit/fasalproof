# Validation: measure accuracy honestly
Judges will ask "how accurate is it?". Answer with numbers from this folder, not claims.

1. Fill `events.csv` (one row per field and date). Columns: `id,name,lat,lon,loss_date,expected,reported,source,notes`
   - `expected` = `damage` (a field documented as damaged on that date) or `none` (a field with no event, e.g. the same field in a normal period).
   - `reported` = loss % reported officially (optional, enables an error figure).
   - `source` = link to the news report, agriculture-department note or panchnama that proves it.
2. Aim for at least 10 `damage` and 10 `none` rows. Use real cropland coordinates (check on the satellite map).
3. Run `.\scripts\validate.ps1`. It prints a table for thresholds 15/25/35/50% loss: precision, recall, specificity, accuracy, mean error vs reported.
4. Paste the real table into the README "Validation results" section and into your deck. Do not quote numbers you did not measure.
