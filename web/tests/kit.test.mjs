import assert from 'node:assert/strict';
import {ics, enc, dec, toCsv, letter} from '../src/kit.js';
import {climRain, pctRank} from '../src/clim.js';
const e = ics([{start: new Date('2026-10-10T06:00:00Z'), title: 'A, B; C', desc: 'line1\nline2'}]);
assert.ok(e.includes('BEGIN:VEVENT') && e.includes('DTSTART:20261010T060000Z') && e.includes('A\\, B\\; C') && e.includes('line1\\nline2') && e.includes('BEGIN:VALARM'));
const o = {f: {nm: 'रमेश पाटिल', vl: 'बीड'}, pos: {lat: 18.99, lon: 75.76}}; assert.deepEqual(dec(enc(o)), o);
const d = {series: [{date: '2025-01-01', ndvi: .5, ndwi: -.3}], forecast: [{exp: .5, lo: .4, hi: .6}]}; assert.equal(toCsv(d).split('\n')[1], '2025-01-01,0.5,-0.3,0.5,0.4,0.6');
const a = {f: {nm: 'Ramesh', vl: 'Beed', cr: 'Wheat', ar: 3, dt: '2025-12-01', ev: 'Hailstorm'}, d: {loss_pct: 42}, pos: {lat: 1, lon: 2}, I: {c: {season: 'Rabi'}}, s: {ci: [35, 49]}};
for (const lg of ['en', 'hi', 'mr']) { const t = letter(lg, a); assert.ok(t.includes('Ramesh') && t.includes('42%') && t.includes('35–49%') && !t.includes('undefined'), lg); }
assert.equal(pctRank([1, 2, 3, 4], 5), 100); assert.equal(pctRank([1, 2, 3, 4], 0), 0);
const daily = []; for (let y = 2015; y <= 2025; y++) for (let k = -5; k <= 5; k++) { const dt = new Date(Date.UTC(y, 7, 15) + k * 864e5).toISOString().slice(0, 10); daily.push({d: dt, p: y === 2025 ? 30 : 2}); }
const c = climRain(daily, '2025-08-15'); assert.ok(c && c.cur === 210 && c.pct === 100 && c.hist.length === 10 && c.med === 14, JSON.stringify(c));
assert.equal(climRain(daily.slice(0, 5), '2025-08-15'), null); console.log('kit + climatology tests passed');
