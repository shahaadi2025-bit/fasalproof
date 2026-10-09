# Final submission checklist (deadline: 15 Oct 2026, 11:17 PM IST; portal opens 11 Oct)

## 1. Make the live system current (once)
- [ ] `.\scripts\update-all.ps1` ends with READY
- [ ] `.\scripts\status.ps1` shows 5 lines DONE (last line says v4.8)
- [ ] Open the website in a private window: animated landing page, "v4.8" in the footer
- [ ] In the tool: assistant opens, an analysis runs, the X closes the results, Reopen works

## 2. Evidence for the judges
- [ ] Fill `validation/events.csv` (10 damaged + 10 no-event fields, with source links), run `.\scripts\validate.ps1`, paste the real table into README ("Validation results")
- [ ] Pick ONE real, documented past event for the demo; note its source
- [ ] Complete `DISCLOSURE.md` (how it was built, who did what) and check the hackathon rules on tools used

## 3. Demo assets
- [ ] Record the 2-minute video (script in DEMO_CHECKLIST.md), upload to YouTube as Unlisted
- [ ] Open `submission/FasalProof_Pitch_Deck.pptx`, rehearse with the speaker notes (7 slides, about 3 minutes)
- [ ] 30 minutes before any live demo: run `.\scripts\verify-live.ps1`, then open the API URL once to wake it

## 4. The form (copy from SUBMISSION.md)
- [ ] Title, problem statement, summary, tech stack
- [ ] Website link, GitHub link, API link, video link
- [ ] Team names and roles (replace the two ADD placeholders in SUBMISSION.md first)
- [ ] Submit by 14 Oct to leave a safety day; re-open every link afterwards

## 5. Documented-event evidence (added)
- [ ] Run `.\scripts\demo-case.ps1`; fill the results table in `EVIDENCE.md` section 3 from `demo\out\...\raw_results.json`
- [ ] Copy `demo\out\punjab-2025-ajnala-ravi-flood\evidence_report.html` (print to PDF) into `submission\` and link it in the form
- [ ] Verify `signed_bundle.json` in the app (left panel, "Verify a signed report")
- [ ] Add the case-study numbers (and the false-positive warning) to the deck notes

## 6. Launch-quality items (added)
- [ ] Put your real email in `web/src/site.js` (`CONTACT_EMAIL`), or tell me and I will rebuild
- [ ] Optional: GoatCounter code in `web/src/site.js` for cookieless visit counts (then update privacy.html)
- [ ] Have someone read `privacy.html` and `terms.html`; they describe what the app does but are not legal advice
- [ ] Tell me the 20th checklist item (it was cut off in your screenshot)
