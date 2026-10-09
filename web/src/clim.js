// Rainfall climatology: is the rain around the loss date unusual versus the same window in previous years?
const med = a => { const s = [...a].sort((x, y) => x - y), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
export const pctRank = (a, x) => a.length ? (a.filter(v => v < x).length + .5 * a.filter(v => v === x).length) / a.length * 100 : null;
export function climRain(daily, lossDate, half = 3, years = 10) {
  const by = new Map(daily.map(r => [r.d, r.p])), c = new Date(lossDate + 'T00:00:00Z');
  const sum = ctr => { let s = 0, n = 0; for (let k = -half; k <= half; k++) { const dd = new Date(ctr.getTime() + k * 864e5).toISOString().slice(0, 10); if (by.has(dd)) { s += by.get(dd); n++; } } return n === 2 * half + 1 ? s : null; };
  const cur = sum(c); if (cur == null) return null; const hist = [];
  for (let k = 1; k <= years; k++) { const h = new Date(c); h.setUTCFullYear(c.getUTCFullYear() - k); const v = sum(h); if (v != null) hist.push(v); }
  return hist.length >= 5 ? {cur, hist, pct: pctRank(hist, cur), med: med(hist)} : null;
}

// Rain over the N days up to and including the loss date, ranked against the same period in previous years (for drought checks).
export function trailingRain(daily, lossDate, len = 30, years = 10) {
  const by = new Map(daily.map(r => [r.d, r.p])), c = new Date(lossDate + 'T00:00:00Z');
  const sum = ctr => { let s = 0, n = 0; for (let k = 0; k < len; k++) { const dd = new Date(ctr.getTime() - k * 864e5).toISOString().slice(0, 10); if (by.has(dd)) { s += by.get(dd); n++; } } return n === len ? s : null; };
  const cur = sum(c); if (cur == null) return null; const hist = [];
  for (let k = 1; k <= years; k++) { const h = new Date(c); h.setUTCFullYear(c.getUTCFullYear() - k); const v = sum(h); if (v != null) hist.push(v); }
  return hist.length >= 5 ? {cur, hist, pct: pctRank(hist, cur), med: med(hist)} : null;
}
