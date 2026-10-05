import assert from 'node:assert/strict';
import {hants, conformal, mannKendall} from '../src/analytics.js';
const ts = Array.from({length: 20}, (_, i) => i * 5), ys = ts.map(t => .5 + .3 * Math.sin(2 * Math.PI * t / 100));
const f = hants(ts, ys, 2, ys.map(() => false), .1, 4, 100); assert.ok(Math.max(...f.map((v, i) => Math.abs(v - ys[i]))) < 1e-3, 'hants recovers a clean harmonic');
const noisy = ys.map((y, i) => i === 5 ? y - .5 : y), f2 = hants(ts, noisy, 2, noisy.map((_, i) => i < 15), .1, 4, 100); assert.ok(Math.abs(f2[5] - ys[5]) < .1, 'hants rejects a cloud dip');
const mk = d => new Date(new Date('2025-01-01').getTime() + d * 864e5).toISOString().slice(0, 10), S = [];
for (let d = 0; d < 60; d += 6) S.push({date: mk(d), ndvi: .5 + .001 * d}); for (let d = 60; d <= 100; d += 8) S.push({date: mk(d), ndvi: .15});
const c = conformal(S, mk(60)); assert.ok(c && c.out === c.n, 'conformal flags the drop');
assert.equal(mannKendall([1, 2, 3, 4, 5, 6]).trend, 'increasing'); console.log('analytics tests passed');
