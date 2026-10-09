import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validate} from '../src/validate.js';
import {PAGES, pageKey} from '../src/seo.js';
const rd = p => fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8'), ex = p => fs.existsSync(new URL('../' + p, import.meta.url));
const png = p => { const b = fs.readFileSync(new URL('../' + p, import.meta.url)); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
// ---- validation unit tests
const ok = {dt: '2025-08-27', ar: 3, si: '40000', rules: 'IN', sow: '', hv: '', hs: 100, db: 90, da: 45, prem: '', notice: ''};
assert.deepEqual(validate(ok, '2026-10-09'), []);
assert.ok(validate({...ok, dt: '2027-01-01'}, '2026-10-09')[0].includes('future')); assert.ok(validate({...ok, dt: ''})[0].includes('Enter')); assert.ok(validate({...ok, dt: '2016-05-01'})[0].includes('2017'));
assert.equal(validate({...ok, ar: 0}).length, 1); assert.equal(validate({...ok, si: '-5'}).length, 1); assert.equal(validate({...ok, rules: 'OTHER', prem: '150'}).length, 1);
assert.equal(validate({...ok, sow: '2025-09-01'}).length, 1); assert.equal(validate({...ok, hs: 10}).length, 1); assert.equal(validate({...ok, db: 5, da: 200}).length, 2);
assert.equal(pageKey('#/app'), 'app'); assert.equal(pageKey('#s=abc'), 'app'); assert.equal(pageKey(''), 'landing'); assert.notEqual(PAGES.landing.title, PAGES.app.title);
// ---- launch checklist (each line is checked against the files, not assumed)
const html = rd('index.html'), land = rd('src/Landing.jsx'), css = rd('src/styles.css'), app = rd('src/App.jsx'), main = rd('src/main.jsx'), site = rd('src/site.js'), priv = rd('public/privacy.html'), terms = rd('public/terms.html'), srcs = ['App', 'Results', 'Chips', 'Landing', 'Claim', 'Kit', 'Crop', 'Insights', 'AiTab', 'Chat', 'MapView'].map(n => rd('src/' + n + '.jsx'));
const sm = rd('public/sitemap.xml'), urls = [...sm.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
const C = [
  ['1  Custom 404 page', ex('public/404.html') && rd('public/404.html').includes('href="./"')],
  ['2  CTA above the fold', land.indexOf('className="lcta"') > 0 && land.indexOf('className="lcta"') < land.indexOf('lstats')],
  ['3  Meta title per page', /<title>/.test(html) && Object.keys(PAGES).length >= 2 && main.includes('applySeo')],
  ['4  Meta description per page', /name="description"/.test(html) && PAGES.landing.desc !== PAGES.app.desc],
  ['5  Open Graph image', html.includes('og:image"') && html.includes('og:image:alt') && png('public/og.png').join('x') === '1200x630'],
  ['6  Favicon set', ['favicon-32.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'maskable-512.png', 'icon.svg'].every(f => ex('public/' + f)) && html.includes('apple-touch-icon') && png('public/apple-touch-icon.png').join('x') === '180x180'],
  ['7  robots.txt', ex('public/robots.txt') && rd('public/robots.txt').includes('Sitemap:')],
  ['8  sitemap.xml', urls.length >= 3 && urls.every(u => u.startsWith('https://shahaadi2025-bit.github.io/fasalproof/'))],
  ['9  Alt text on every image', srcs.every(s => [...s.matchAll(/<img\b[^>]*>/g)].every(m => /\balt=/.test(m[0])))],
  ['10 Mobile breakpoints', (css.match(/@media\(max-width/g) || []).length >= 3 && html.includes('width=device-width')],
  ['11 Sticky mobile CTA', land.includes('className="stk"') && /@media\(max-width:820px\)\{\.stk\{display:block/.test(css)],
  ['12 Loading states', html.includes('class="splash"') && app.includes('id="ld"') && app.includes("'Analysing…'")],
  ['13 Form error states', app.includes('id="verr"') && app.includes('errs.length > 0')],
  ['14 Thank-you page', 'N/A: the app has no submission form (feedback goes to GitHub Issues). Add one if you add a contact form.'],
  ['15 Privacy policy page', ex('public/privacy.html') && ['Browser storage', 'Open-Meteo', 'No accounts', 'Clear my data', 'sets no cookies'].every(k => priv.includes(k)) && land.includes('privacy.html')],
  ['16 Terms page', ex('public/terms.html') && terms.includes('not an official assessment') && land.includes('terms.html')],
  ['17 Cookie banner', 'N/A: the app sets no cookies (stated in the privacy page). A banner would only be needed if you enable non-essential cookies.'],
  ['18 Analytics installed', main.includes('GOATCOUNTER') && /GOATCOUNTER = ''/.test(site) ? 'READY, switched off: create a free GoatCounter site and set GOATCOUNTER in src/site.js' : site.includes("GOATCOUNTER = '") ? true : false],
  ['19 Real contact address', land.includes('id="contact"') && site.includes('ISSUES') ? (/CONTACT_EMAIL = ''/.test(site) ? 'PARTIAL: GitHub Issues works; add your real email in src/site.js' : true) : false]
];
let bad = 0;
for (const [n, v] of C) { const st = v === true ? 'PASS' : typeof v === 'string' ? (v.startsWith('N/A') ? 'N/A ' : v.startsWith('READY') || v.startsWith('PARTIAL') ? 'TODO' : 'FAIL') : 'FAIL'; if (st === 'FAIL') bad++; console.log(st, n, typeof v === 'string' ? '- ' + v : ''); }
assert.equal(bad, 0, bad + ' checklist item(s) failed');
console.log('site tests passed');
