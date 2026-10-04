// Indicative PMFBY facts. Farmer premium: 2% Kharif food/oilseed, 1.5% Rabi food/oilseed, 5% commercial/horticultural.
export const CROPS = {
  Soybean: {season: 'Kharif', days: 105, prem: 2}, Rice: {season: 'Kharif', days: 125, prem: 2}, Maize: {season: 'Kharif', days: 110, prem: 2},
  Cotton: {season: 'Kharif', days: 170, prem: 5}, Wheat: {season: 'Rabi', days: 125, prem: 1.5}, Gram: {season: 'Rabi', days: 110, prem: 1.5}
};
export const ELIG = {
  Flood: {ok: true, mode: 'Localised calamity (inundation)', txt: 'Covered as a localised calamity. Your plot is assessed individually after you intimate within 72 hours.'},
  Hailstorm: {ok: true, mode: 'Localised calamity (hailstorm)', txt: 'Covered as a localised calamity. Your plot is assessed individually after you intimate within 72 hours.'},
  Drought: {ok: false, mode: 'Area approach / mid-season adversity', txt: 'Usually handled at village or block level (area approach, or mid-season adversity notified by the state), not as an individual plot claim. Ask your bank or agriculture office.'},
  'Pest attack': {ok: false, mode: 'Yield-based only', txt: 'Pests and diseases are generally considered only through yield-based assessment (crop-cutting experiments), not as an individual plot claim.'}
};
const S = [[0, .1, 'Germination / emergence', false], [.1, .4, 'Vegetative growth', false], [.4, .6, 'Flowering / reproductive', true], [.6, .85, 'Grain / pod / boll filling', true], [.85, 1.02, 'Maturity / harvest-ready', false]];
export function stage(crop, sow, loss) {
  if (!sow) return null;
  const d = Math.round((new Date(loss) - new Date(sow)) / 864e5), p = d / CROPS[crop].days;
  if (d < 0) return {d, label: 'Loss date is BEFORE the sowing date. Check the dates.', bad: true};
  if (p > 1.02) return {d, label: 'After maturity (check the post-harvest loss window, about 14 days after harvest)', post: true};
  const x = S.find(s => p >= s[0] && p < s[1]) || S[4];
  return {d, label: x[2], critical: x[3]};
}
export const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
export function claimInfo(d, f) {
  const c = CROPS[f.cr] || CROPS.Soybean, ha = (+f.ar || 0) * 0.4047, si = +f.si || 0, L = d.loss_pct, ci = d.stats?.ci || [L, L];
  const dl = new Date(new Date(f.dt).getTime() + 72 * 36e5);
  return {c, ha, si, prem: si * ha * c.prem / 100, est: si * ha * L / 100, lo: si * ha * ci[0] / 100, hi: si * ha * ci[1] / 100,
    st: stage(f.cr, f.sow, f.dt), el: ELIG[f.ev], dl, open: Date.now() <= dl, lateDays: Math.max(0, Math.round((Date.now() - dl) / 864e5)), base: d.baseline_ndvi};
}
