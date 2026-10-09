# VORTEX 2K26: final submission text (copy into the form)

**Project title:** FasalProof: Satellite and Weather Evidence for Crop-Insurance Claims

**Tagline:** Prove your crop loss from space.

**Theme:** Climate, Agriculture & Rural Innovation

**Problem statement:**
After a flood, hailstorm or cloudburst, a farmer often has little more than phone photos to support an insurance claim, and under India's PMFBY a localised loss must be reported within 72 hours. Which claim route applies (individual or area-yield) is also unclear to most farmers. FasalProof turns free Sentinel-2 satellite images, local weather history and the official claim rules into dated, location-stamped evidence and a ready claim kit, in the farmer's language, at zero cost.

**Solution summary (about 150 words):**
A farmer types what happened ("Flood damaged my wheat near Beed on 12/11/2025") or taps the field on a satellite map. FasalProof compares cloud-masked Sentinel-2 images from before and after the loss and estimates the vegetation loss with a 95% confidence interval, compares the detected break date with the claimed date, and maps damage zones on the field. It judges rainfall against that location's own 10-year history, reads the loss against the crop's growth stage, and shows the right PMFBY claim route and deadline (or applies the farmer's own policy terms outside India). It then produces an intimation letter in six languages, calendar reminders, and a signed, tamper-evident report. It works for any land location worldwide and shows its uncertainty on every result.

**What is new:** satellite, weather-climatology and claim-rule evidence combined in one tool with an assistant, plus a verifiable signed report; honest uncertainty instead of a single score.

**Impact and scalability:** zero cost per analysis (open data, free hosting); any farm on land from 56°S to 84°N; claim-rule engine currently covers India's PMFBY and accepts custom policy terms elsewhere.

**Tech stack:** React, Vite, Leaflet, Recharts, FastAPI, rasterio, numpy, Sentinel-2 (Earth Search), Open-Meteo, FAO-56, Ed25519, Docker, GitHub Pages, Render, GitHub Actions.

**Links:**
- Demo (website): https://shahaadi2025-bit.github.io/fasalproof/
- Source code: https://github.com/shahaadi2025-bit/fasalproof
- API: https://fasalproof.onrender.com
- Demo video: ADD YOUR YOUTUBE LINK HERE
- Pitch deck: FasalProof_Pitch_Deck.pptx (in the repository)

**Team:** ADD YOUR NAMES AND ROLES HERE

**How it maps to the judging criteria:**
- Innovation and originality: multi-source evidence plus signed reports and an assistant.
- Technical implementation: cloud-masked NDVI/NDWI, robust regression, bootstrap, change-point, k-means, climatology percentiles, Ed25519 signing, CI-tested.
- Real-world impact: a documented pain point (72-hour window, weak evidence).
- Usability: assistant, six languages, offline queue, plain-language results.
- Scalability: open data, no per-query cost, worldwide coverage.
- Presentation and demo: landing page, 2-minute demo script (DEMO_CHECKLIST.md), pitch deck.

**Honest limits (say them first):** supporting evidence, not an official assessment; accuracy validation is in progress and no accuracy figure is claimed.
