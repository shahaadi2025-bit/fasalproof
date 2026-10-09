// Pure logic for the on-device AI features (testable without a browser or models).
export const LABELS = [
  {k: 'flood', t: 'a flooded crop field'}, {k: 'hail', t: 'crops damaged by hail'}, {k: 'drought', t: 'dry drought-stressed crops'},
  {k: 'pest', t: 'crop leaves damaged by pests or disease'}, {k: 'healthy', t: 'a healthy green crop field'}, {k: 'bare', t: 'a bare harvested field'}, {k: 'other', t: 'an unrelated object or person'}];
export const EXPECT = {Flood: ['flood'], Cloudburst: ['flood'], Hailstorm: ['hail'], 'Cyclone / storm': ['flood', 'hail'], 'Unseasonal rain': ['flood'], 'Drought / dry spell': ['drought'], 'Pest / disease': ['pest'], Landslide: [], 'Natural fire / lightning': []};
export const WLANG = {en: 'english', hi: 'hindi', mr: 'marathi', es: 'spanish', fr: 'french', pt: 'portuguese'};
export function photoVerdict(ev, ranked) {
  const top = ranked[0], exp = EXPECT[ev] || [];
  if (top.key === 'other') return {ok: false, why: 'The photo does not look like a farm field.'};
  if (top.key === 'healthy' || top.key === 'bare') return {ok: false, why: 'The photo looks like a healthy or harvested field, not damage.'};
  if (!exp.length) return {ok: null, why: 'No visual check is defined for this calamity type.'};
  return ranked.slice(0, 2).some(r => exp.includes(r.key)) ? {ok: true, why: `The photo is consistent with ${ev.toLowerCase()} damage (zero-shot, indicative only).`} : {ok: false, why: `The photo looks more like "${top.label}" than ${ev.toLowerCase()} damage.`};
}
