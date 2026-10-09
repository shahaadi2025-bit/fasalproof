import assert from 'node:assert/strict';
import {parse, parseDate, parseArea, nextNeed} from '../src/chatParser.js';
const T = new Date(2026, 9, 7); // 7 Oct 2026
let r = parse('Flood damaged my wheat in Beed on 12 Nov 2025', T); assert.deepEqual(r, {cr: 'Wheat', ev: 'Flood', dt: '2025-11-12', place: 'Beed'});
r = parse('hailstorm hit my cotton field near Jalgaon yesterday, 5 acres', T); assert.deepEqual(r, {cr: 'Cotton', ev: 'Hailstorm', dt: '2026-10-06', place: 'Jalgaon', ar: 5});
r = parse('बीड में 12/11/2025 को बाढ़ से मेरा गेहूं खराब हो गया', T); assert.equal(r.cr, 'Wheat'); assert.equal(r.ev, 'Flood'); assert.equal(r.dt, '2025-11-12');
assert.equal(parse('पूरी फसल खराब हो गई', T).ev, undefined, 'पूरी must not mean flood');
r = parse('पुरामुळे माझा गहू खराब झाला', T); assert.equal(r.ev, 'Flood'); assert.equal(r.cr, 'Wheat');
assert.equal(parse('green gram damaged by pest', T).cr, 'Green gram (Moong)'); assert.equal(parse('the price of rice', T).cr, 'Rice');
assert.equal(parse('I grow chickpea', T).cr, 'Gram (Chickpea)'); assert.equal(parse('thunder and lightning burnt my crop', T).ev, 'Natural fire / lightning');
assert.equal(parseDate('3 days ago', T), '2026-10-04'); assert.equal(parseDate('12/11/2030', T), null, 'future dates rejected');
assert.equal(parseDate('on 15 Aug', T), '2026-08-15'); assert.equal(parseDate('on 15 Dec', T), '2025-12-15', 'future month falls back to last year');
assert.equal(parseArea('2 hectares'), 4.9); assert.equal(parseArea('3 acre'), 3); assert.equal(parse('in my field', T).place, undefined);
assert.equal(nextNeed({}), 'place'); assert.equal(nextNeed({lat: 1, cr: 'Wheat', ev: 'Flood'}), 'dt'); assert.equal(nextNeed({lat: 1, cr: 'x', ev: 'y', dt: 'z'}), null);
console.log('chat parser tests passed');
{ const T2 = new Date(2026, 9, 7);
  let r = parse('La inundación dañó mi trigo cerca de Córdoba el 12/11/2025', T2); assert.deepEqual(r, {cr: 'Wheat', ev: 'Flood', dt: '2025-11-12', place: 'Córdoba'});
  r = parse('La grêle a détruit mon blé près de Toulouse hier', T2); assert.deepEqual(r, {cr: 'Wheat', ev: 'Hailstorm', dt: '2026-10-06', place: 'Toulouse'});
  r = parse('A seca destruiu minha soja perto de Londrina há 3 dias', T2); assert.deepEqual(r, {cr: 'Soybean', ev: 'Drought / dry spell', dt: '2026-10-04', place: 'Londrina'});
  assert.equal(parse('2 hectáreas de maíz', T2).ar, 4.9); assert.equal(parse('the rice price', T2).cr, 'Rice'); assert.equal(parse('anteayer llovió', T2).dt, '2026-10-05');
  console.log('multilingual chat tests passed'); }
