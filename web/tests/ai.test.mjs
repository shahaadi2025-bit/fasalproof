import assert from 'node:assert/strict';
import {photoVerdict, LABELS, EXPECT} from '../src/aiLogic.js';
const r = (...k) => k.map(x => ({key: x, label: LABELS.find(l => l.k === x).t, score: .5}));
assert.equal(photoVerdict('Flood', r('flood', 'healthy')).ok, true);
assert.equal(photoVerdict('Flood', r('healthy', 'flood')).ok, false);
assert.equal(photoVerdict('Hailstorm', r('flood', 'drought')).ok, false);
assert.equal(photoVerdict('Landslide', r('flood')).ok, null);
assert.equal(photoVerdict('Drought / dry spell', r('other')).ok, false);
assert.ok(Object.keys(EXPECT).length >= 9); console.log('ai logic tests passed');
