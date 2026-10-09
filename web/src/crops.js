// SOURCES. Growth-stage lengths (initial, development, mid, late; days) = FAO Irrigation & Drainage Paper 56, Table 11.
// Kc (ini, mid, end) = FAO-56 Table 12 (ranges -> midpoint). Premium caps, claim types and time limits = PMFBY operational guidelines
// (PIB / Ministry of Agriculture / Rajya Sabha answers). Stage lengths are regional averages: use local data where available.
const C = (cls, st, kc, reg, proxy = false) => ({cls, st, kc, reg, proxy});
export const CROPS = {
  Wheat: C('food', [15, 25, 50, 30], [.3, 1.15, .3], 'FAO-56 T11: Central India (Nov)'),
  Rice: C('food', [30, 30, 60, 30], null, 'FAO-56 T11: Tropics'),
  Maize: C('food', [20, 35, 40, 30], [.3, 1.2, .35], 'FAO-56 T11: India (Oct) / Nigeria (Jun)'),
  Sorghum: C('food', [20, 35, 40, 30], [.3, 1.05, .55], 'FAO-56 T11: USA / Pakistan / Med.'),
  'Millet (Bajra)': C('food', [15, 25, 40, 25], [.3, 1, .3], 'FAO-56 T11: Pakistan (Jun)'),
  'Green gram (Moong)': C('food', [20, 30, 30, 20], [.4, 1.05, .35], 'FAO-56 T11: Mediterranean (Mar)'),
  Lentil: C('food', [25, 35, 70, 40], [.4, 1.1, .3], 'FAO-56 T11: Arid region (Oct/Nov)'),
  'Gram (Chickpea)': C('food', [15, 25, 35, 20], [.4, 1, .35], 'PROXY: stage lengths of dry beans (Pakistan); Kc of chick pea', true),
  Soybean: C('oil', [15, 15, 40, 15], [.4, 1.15, .5], 'FAO-56 T11: Tropics (Dec)'),
  Groundnut: C('oil', [25, 35, 45, 25], [.4, 1.15, .6], 'FAO-56 T11: Dry West Africa'),
  Sunflower: C('oil', [25, 35, 45, 25], [.35, 1.075, .35], 'FAO-56 T11: Mediterranean / California'),
  Sesame: C('oil', [20, 30, 40, 20], [.35, 1.1, .25], 'FAO-56 T11: China (Jun)'),
  Castor: C('oil', [25, 40, 65, 50], [.35, 1.15, .55], 'FAO-56 T11: Semi-arid (Mar)'),
  Safflower: C('oil', [35, 55, 60, 40], [.35, 1.075, .25], 'FAO-56 T11: Arid region (Oct/Nov)'),
  Cotton: C('comm', [30, 50, 60, 55], [.35, 1.15, .6], 'FAO-56 T11: Egypt / Pakistan / California'),
  Sugarcane: C('comm', [35, 60, 190, 120], [.4, 1.25, .75], 'FAO-56 T11: Low latitudes (virgin cane)'),
  Potato: C('hort', [25, 30, 45, 30], [.5, 1.15, .75], 'FAO-56 T11: (Semi) arid, Nov planting'),
  'Onion (dry)': C('hort', [15, 25, 70, 40], [.7, 1.05, .75], 'FAO-56 T11: Mediterranean (Apr)'),
  Tomato: C('hort', [30, 40, 40, 25], [.6, 1.15, .8], 'FAO-56 T11: Arid region (Jan)'),
  Brinjal: C('hort', [30, 40, 40, 20], [.6, 1.05, .9], 'FAO-56 T11: Arid region (Oct)'),
  Cauliflower: C('hort', [35, 50, 40, 15], [.7, 1.05, .95], 'FAO-56 T11: California desert (Sep)')
};
export const CLS = {food: 'Food grain / pulse', oil: 'Oilseed', comm: 'Annual commercial', hort: 'Annual horticultural'};
export const total = c => c.st.reduce((a, b) => a + b, 0);
Object.values(CROPS).forEach(c => { c.days = total(c); });
export const CAL = ['Flood', 'Hailstorm', 'Cloudburst', 'Landslide', 'Natural fire / lightning', 'Cyclone / storm', 'Unseasonal rain', 'Drought / dry spell', 'Pest / disease'];
export const seasonOf = d => { const m = new Date(d).getMonth() + 1; return m >= 6 && m <= 10 ? 'Kharif' : (m >= 11 || m <= 3) ? 'Rabi' : 'Summer / Zaid'; };
export function meta(f) {
  if (f.rules === 'OTHER') { const c = CROPS[f.cr] || CROPS.Wheat, p = f.prem === '' || f.prem == null ? null : +f.prem; return {c, season: 'Your local season', prem: p, premTxt: p == null ? 'enter the rate from your policy' : p + '% of sum insured (from your policy)'}; }
  const c = CROPS[f.cr] || CROPS.Wheat, s = seasonOf(f.sow || f.dt);
  const p = (c.cls === 'comm' || c.cls === 'hort') ? 5 : s === 'Kharif' ? 2 : s === 'Rabi' ? 1.5 : null;
  return {c, season: s, prem: p, premTxt: p == null ? 'state-notified (summer crops)' : p + '% of sum insured (max, or actuarial rate if lower)'};
}
const KEYS = ['Initial (establishment)', 'Development (canopy growth)', 'Mid-season (full cover, flowering, yield formation)', 'Late season (maturity, senescence)'];
export function stage(crop, sow, loss) {
  if (!sow) return null; const c = CROPS[crop], T = total(c), d = Math.round((new Date(loss) - new Date(sow)) / 864e5);
  if (d < 0) return {d, label: 'Loss date is BEFORE the sowing date. Check the dates.', bad: true, left: null};
  if (d > T) return {d, label: `After the typical season length (${T} d): crop is mature or harvested`, post: true, left: 0};
  let a = 0; for (let i = 0; i < 4; i++) { a += c.st[i]; if (d <= a) return {d, label: KEYS[i], idx: i, critical: i === 2, left: T - d}; }
}
export const kc = (c, d) => { if (!c.kc || d < 0) return null; const [a, b, m, l] = c.st, [k0, k1, k2] = c.kc;
  if (d <= a) return k0; if (d <= a + b) return k0 + (d - a) / b * (k1 - k0); if (d <= a + b + m) return k1; return k1 + Math.min(1, (d - a - b - m) / l) * (k2 - k1); };
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
function pearson(x, y) { const mx = mean(x), my = mean(y); let n = 0, dx = 0, dy = 0; x.forEach((v, i) => { n += (v - mx) * (y[i] - my); dx += (v - mx) ** 2; dy += (y[i] - my) ** 2; }); return dx && dy ? n / Math.sqrt(dx * dy) : null; }
// Experimental: compares the observed NDVI trajectory with the crop's FAO Kc canopy curve (a proxy for canopy development).
export function phenology(d, f) {
  const c = CROPS[f.cr]; if (!f.sow || !c?.kc) return null; const T = total(c);
  const pts = d.series.map(p => ({date: p.date, n: p.ndvi, d: Math.round((new Date(p.date) - new Date(f.sow)) / 864e5)})).filter(p => p.d >= 0 && p.d <= T);
  const pre = pts.filter(p => p.date < f.dt), post = pts.filter(p => p.date >= f.dt);
  const r = pts.length >= 4 ? pearson(pts.map(p => p.n), pts.map(p => kc(c, p.d))) : null; let adj = null, obs = null, exp = null;
  if (pre.length && post.length) { obs = mean(post.map(p => p.n)) / Math.max(...pre.map(p => p.n)); exp = mean(post.map(p => kc(c, p.d))) / Math.max(...pre.map(p => kc(c, p.d))); adj = Math.max(0, Math.min(100, (1 - obs / exp) * 100)); }
  return {r, n: pts.length, adj, obs, exp};
}
// Claim route per PMFBY guidelines (localised / post-harvest / area-yield / mid-season adversity).
export function routeFor(f, st) {
  if (f.rules === 'OTHER') { const h = +f.notice || 0; return {ind: h > 0, ok: null, hrs: h, title: 'Check your national scheme and policy', txt: 'Claim routes, covered perils and notice periods differ by country and by policy. FasalProof provides objective satellite and weather evidence only; it does not apply any country-specific rules. ' + (h > 0 ? `The notice period you entered (${h} hours) is used for the deadline.` : 'Enter the notice period from your policy to get a deadline.'), noDl: 'Notice periods differ by country and policy. Check yours and report the loss to your insurer as early as possible.'}; }
  const ev = f.ev, since = f.hv ? (new Date(f.dt) - new Date(f.hv)) / 864e5 : null, inPost = since !== null && since >= 0 && since <= 14, nearHarvest = st && st.left != null && st.left <= 15 && !st.post;
  const mid = nearHarvest ? 'Mid-season adversity advance is NOT invoked within 15 days before normal harvest.' : 'Mid-season adversity: if the state notifies expected yield below 50%, an on-account payment of up to 25% of sum insured can be released.';
  if (['Hailstorm', 'Cyclone / storm', 'Unseasonal rain'].includes(ev) && inPost) return {ind: true, ok: true, title: 'Post-harvest loss (individual farm)', txt: `Harvested ${Math.round(since)} day(s) before the loss. Covered up to 14 days after harvest for crop left cut and spread to dry. Intimate within 72 hours.`};
  if (ev === 'Unseasonal rain') return {ind: true, ok: false, title: 'Post-harvest peril', txt: 'Unseasonal rain is covered as a post-harvest peril (up to 14 days after harvest, crop cut and spread). Enter the harvest date to check your window.'};
  if (['Hailstorm', 'Cloudburst', 'Landslide', 'Natural fire / lightning'].includes(ev)) return {ind: true, ok: true, title: 'Localised calamity (individual farm)', txt: 'Covered when it affects isolated farms in a notified area. Assessed plot by plot. Intimate within 72 hours.'};
  if (ev === 'Flood') return {ind: true, ok: true, title: 'Inundation: localised, or area-yield if widespread', txt: `Inundation of isolated farms is an individual (localised) claim: intimate within 72 hours. A flood over most of the notified unit is assessed through area-yield (crop-cutting) instead. ${mid}`};
  if (ev === 'Cyclone / storm') return {ind: false, ok: true, title: 'Standing crop: area-yield approach', txt: 'Storm and cyclone losses to a standing crop are assessed on the area-yield approach (crop-cutting experiments). Individual claims apply only post-harvest (enter the harvest date).'};
  if (ev === 'Drought / dry spell') return {ind: false, ok: true, title: 'Area-yield approach (not an individual plot claim)', txt: `Drought and dry spells are settled at insurance-unit level from crop-cutting yields. ${mid}`};
  return {ind: false, ok: true, title: 'Area-yield approach (not an individual plot claim)', txt: 'Widespread pest and disease losses are covered through area-yield assessment, not as an individual plot claim.'};
}
export const CURS = {INR: '₹', USD: '$', EUR: '€', GBP: '£', BRL: 'R$', MXN: 'MX$', ARS: 'AR$', AUD: 'A$', CAD: 'C$', ZAR: 'R', KES: 'KSh', NGN: '₦', ETB: 'Br', PKR: 'Rs', BDT: '৳', IDR: 'Rp', PHP: '₱', VND: '₫', CNY: '¥', TRY: '₺'};
export const CC2CUR = {IN: 'INR', US: 'USD', GB: 'GBP', BR: 'BRL', MX: 'MXN', AR: 'ARS', AU: 'AUD', CA: 'CAD', ZA: 'ZAR', KE: 'KES', NG: 'NGN', ET: 'ETB', PK: 'PKR', BD: 'BDT', ID: 'IDR', PH: 'PHP', VN: 'VND', CN: 'CNY', TR: 'TRY', DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR', PT: 'EUR', IE: 'EUR', GR: 'EUR', PL: 'EUR'};
let SYM = '₹'; export const setSym = s => { SYM = s; };
export const inr = n => SYM + Math.round(n).toLocaleString(SYM === '₹' ? 'en-IN' : undefined);
export const areaTxt = f => f.unit === 'ha' ? `${(f.ar * 0.4047).toFixed(2)} ha` : `${f.ar} acres`;
export function claimInfo(d, f) {
  const m = meta(f), ha = (+f.ar || 0) * 0.4047, si = +f.si || 0, L = d.loss_pct, ci = d.stats?.ci || [L, L], st = stage(f.cr, f.sow, f.dt);
  const hrs = f.rules === 'OTHER' ? (+f.notice || 0) : 72, dl = new Date(new Date(f.dt).getTime() + hrs * 36e5), p = m.prem || 0;
  return {c: {...m.c, season: m.season, prem: p, premTxt: m.premTxt}, ha, si, prem: si * ha * p / 100, est: si * ha * L / 100, lo: si * ha * ci[0] / 100, hi: si * ha * ci[1] / 100,
    st, route: routeFor(f, st), hrs, dl, open: Date.now() <= dl, lateDays: Math.max(0, Math.round((Date.now() - dl) / 864e5)), base: d.baseline_ndvi};
}
