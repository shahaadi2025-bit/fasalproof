# "Is it a real site?" launch checklist: status for FasalProof
Checked automatically by `cd web && npm test` (see `web/tests/site.test.mjs`). Items 1-19 come from the checklist; the 20th was cut off in the source screenshot, so add it here when you know it.

| # | Item | Status | Where / what to do |
|---|---|---|---|
| 1 | Custom 404 page | Done | `404.html` (GitHub Pages serves it automatically) |
| 2 | CTA above the fold | Done | Two buttons in the landing hero |
| 3 | Meta title per page | Done | `src/seo.js` sets landing / tool titles; static pages have their own |
| 4 | Meta description per page | Done | `src/seo.js`; static pages have their own |
| 5 | Open Graph image | Done | `og.png` (1200x630) with alt text, width and height |
| 6 | Favicon set | Done | SVG, 32 px, Apple touch icon, 192/512 and a maskable icon (installable app) |
| 7 | robots.txt | Done | Allows all, points to the sitemap |
| 8 | sitemap.xml | Done | Home, privacy, terms |
| 9 | Alt text on every image | Done | Tested across all components |
| 10 | Mobile breakpoints | Done | 820 px, 900 px and 480 px layouts |
| 11 | Sticky mobile CTA | Done | Appears on phones after the hero |
| 12 | Loading states | Done | Branded splash, analysis overlay with timer, assistant "…" |
| 13 | Form error states | Done | Plain-language error list, Run disabled until fixed, date cannot be in the future |
| 14 | Thank-you page | **Not applicable** | There is no submission form. Add one only if you add a contact form |
| 15 | Privacy policy page | Done | `privacy.html`, written to match what the code really does. **Have it reviewed** |
| 16 | Terms page | Done | `terms.html`. **Have it reviewed** |
| 17 | Cookie banner | **Not applicable** | The app sets no cookies; storage is disclosed in the privacy page. A banner would be false theatre |
| 18 | Analytics installed | **Ready, switched off** | Create a free GoatCounter site, set `GOATCOUNTER` in `src/site.js` (cookieless, no banner needed), rebuild |
| 19 | Real contact address | **Partial** | GitHub Issues works. Add your real email as `CONTACT_EMAIL` in `src/site.js` |
| 20 | (not visible) | ? | Tell us what it is |

Extras added: canonical URL, JSON-LD (WebApplication), "Clear my data on this device" button, route-aware share previews.

## To finish items 18 and 19
1. Edit `web/src/site.js`: set `CONTACT_EMAIL` and (optionally) `GOATCOUNTER`.
2. `cd web; npm install; npm run build`, copy `web/dist/*` over `docs/`, then `.\scripts\update-all.ps1`. (Or ask for a rebuilt zip.)
3. If you enable analytics, update the "Analytics" paragraph in `docs/privacy.html` to name GoatCounter.
