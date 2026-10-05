// Advanced analytics (pure JS, no deps): Mann-Kendall, Pettitt, EWMA, cumulative NDVI-days lost, Monte Carlo, Bayesian evidence fusion.
const erf = x => { const s = Math.sign(x); x = Math.abs(x); const t = 1 / (1 + .3275911 * x); return s * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - .284496736) * t + .254829592) * t * Math.exp(-x * x)); };
const ncdf = x => .5 * (1 + erf(x / Math.SQRT2));
export function mannKendall(y) {
  const n = y.length; if (n < 4) return null; let S = 0;
  for (let i = 0; i < n - 1; i++) for (let j = i + 1; j < n; j++) S += Math.sign(y[j] - y[i]);
  const v = n * (n - 1) * (2 * n + 5) / 18, z = S > 0 ? (S - 1) / Math.sqrt(v) : S < 0 ? (S + 1) / Math.sqrt(v) : 0;
  return {S, z, p: 2 * (1 - ncdf(Math.abs(z))), trend: z > 1.96 ? 'increasing' : z < -1.96 ? 'decreasing' : 'no significant trend'};
}
export function pettitt(y) {
  const n = y.length; if (n < 6) return null; let K = 0, k = 0;
  for (let t = 1; t < n; t++) { let U = 0; for (let i = 0; i < t; i++) for (let j = t; j < n; j++) U += Math.sign(y[j] - y[i]); if (Math.abs(U) > K) { K = Math.abs(U); k = t; } }
  return {k, p: Math.min(1, 2 * Math.exp(-6 * K * K / (n ** 3 + n ** 2)))};
}
export const ewma = (y, a = .5) => y.reduce((o, v, i) => (o.push(i ? a * v + (1 - a) * o[i - 1] : v), o), []);
export function ndviDaysLost(series, fc, ld) {
  let tot = 0;
  for (let i = 1; i < series.length; i++) {
    if (series[i].date < ld || !fc[i] || !fc[i - 1]) continue;
    const g = k => Math.max(0, fc[k].exp - series[k].ndvi), dt = (new Date(series[i].date) - new Date(series[i - 1].date)) / 864e5;
    tot += (g(i) + g(i - 1)) / 2 * dt;
  }
  return tot;
}
const rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
export function monteCarlo(loss, ci, maxClaim, n = 4000) {
  const r = rng(7), sd = Math.max(1, (ci[1] - ci[0]) / 3.92), a = [];
  for (let i = 0; i < n; i++) { const u = r() || 1e-9, v = r(), z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); a.push(Math.min(100, Math.max(0, loss + sd * z)) * maxClaim / 100); }
  a.sort((x, y) => x - y); const q = p => a[Math.floor(p * (n - 1))], lo = a[0], hi = a[n - 1], B = 12, h = Array(B).fill(0);
  a.forEach(x => h[Math.min(B - 1, Math.floor((x - lo) / (hi - lo + 1e-9) * B))]++);
  return {p10: q(.1), p50: q(.5), p90: q(.9), hist: h.map((c, i) => ({x: Math.round(lo + (i + .5) * (hi - lo) / B), c}))};
}
// Naive-Bayes style evidence fusion. Likelihood ratios are ASSUMED heuristics (not trained on claim data).
export function fuse({conf, wok, off, base, late, loss, post, bad}) {
  const f = []; let o = 1; const add = (n, lr, w) => { o *= lr; f.push({n, lr, w}); };
  add('Satellite anomaly', conf > .95 ? 4 : conf > .8 ? 2 : .5, (conf * 100).toFixed(0) + '% confidence the drop is real');
  add('Weather corroboration', wok === null ? 1 : wok ? 2.5 : .4, wok === null ? 'not applicable or unavailable' : wok ? 'weather matches the calamity' : 'weather does not match the calamity');
  add('Date consistency', off == null ? 1 : Math.abs(off) <= 10 ? 2.5 : Math.abs(off) > 30 ? .3 : 1, off == null ? 'no break detected' : `break ${off >= 0 ? '+' : ''}${off} d from claimed date`);
  add('Baseline crop presence', base >= .4 ? 1.5 : .5, 'pre-loss NDVI ' + base);
  add('Reporting timeliness', late <= 3 ? 1.3 : .8, late <= 3 ? 'within 72 h' : 'after the 72 h window');
  add('Loss magnitude', loss < 10 ? .4 : loss >= 25 ? 1.5 : 1, loss + '% vegetation loss');
  if (post) add('Growth-stage plausibility', .5, 'loss date is after crop maturity');
  if (bad) add('Date logic', .2, 'loss date is before sowing');
  return {p: o / (1 + o), f};
}

// ---- HANTS-style harmonic smoothing: least-squares harmonics; low outliers (cloud) rejected ONLY before the loss date.
function solve(A, b) {
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let i = 0; i < n; i++) { let p = i; for (let r = i + 1; r < n; r++) if (Math.abs(M[r][i]) > Math.abs(M[p][i])) p = r; [M[i], M[p]] = [M[p], M[i]];
    for (let r = i + 1; r < n; r++) { const f = M[r][i] / M[i][i]; for (let c = i; c <= n; c++) M[r][c] -= f * M[i][c]; } }
  const x = Array(n).fill(0); for (let i = n - 1; i >= 0; i--) { let s = M[i][n]; for (let c = i + 1; c < n; c++) s -= M[i][c] * x[c]; x[i] = s / M[i][i]; } return x;
}
export function hants(ts, ys, nf = 2, canReject = [], drop = .1, iters = 4, period = null) {
  const T = period || (Math.max(...ts) - Math.min(...ts) + 1), B = t => { const r = [1]; for (let k = 1; k <= nf; k++) r.push(Math.cos(2 * Math.PI * k * t / T), Math.sin(2 * Math.PI * k * t / T)); return r; };
  let keep = ys.map(() => true), fit = null;
  for (let it = 0; it < iters; it++) {
    const idx = ys.map((_, i) => i).filter(i => keep[i]); if (idx.length <= 2 * nf + 1) break;
    const X = idx.map(i => B(ts[i])), p = X[0].length;
    const A = Array.from({length: p}, (_, i) => Array.from({length: p}, (_, j) => X.reduce((s, r) => s + r[i] * r[j], 0) + (i === j ? 1e-6 : 0)));
    const c = solve(A, Array.from({length: p}, (_, i) => X.reduce((s, r, n) => s + r[i] * ys[idx[n]], 0)));
    fit = ts.map(t => B(t).reduce((s, v, i) => s + v * c[i], 0));
    keep = ys.map((y, i) => !(canReject[i] && y - fit[i] < -drop));
  }
  return fit;
}
// ---- Split-conformal check: leave-one-out Theil-Sen residuals on pre-loss scenes give a distribution-free band.
const med = a => { const s = [...a].sort((x, y) => x - y), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
function tsen(x, y) { const s = []; for (let i = 0; i < x.length; i++) for (let j = i + 1; j < x.length; j++) if (x[j] !== x[i]) s.push((y[j] - y[i]) / (x[j] - x[i])); const m = s.length ? med(s) : 0; return [m, med(y.map((v, i) => v - m * x[i]))]; }
export function conformal(series, ld, alpha = .1) {
  const day = d => (new Date(d) - new Date(ld)) / 864e5, pre = series.filter(p => p.date < ld).map(p => [day(p.date), p.ndvi]), post = series.filter(p => p.date >= ld).map(p => [day(p.date), p.ndvi]);
  if (pre.length < 5 || !post.length) return null;
  const res = pre.map((p, i) => { const o = pre.filter((_, j) => j !== i), [m, c] = tsen(o.map(x => x[0]), o.map(x => x[1])); return Math.abs(p[1] - (m * p[0] + c)); }).sort((a, b) => a - b);
  const q = res[Math.min(res.length, Math.ceil((res.length + 1) * (1 - alpha))) - 1], [m, c] = tsen(pre.map(x => x[0]), pre.map(x => x[1])), cap = Math.max(...pre.map(x => x[1])) * 1.05;
  return {q, alpha, nCal: pre.length, n: post.length, out: post.filter(p => p[1] < Math.min(cap, Math.max(.05, m * p[0] + c)) - q).length};
}
