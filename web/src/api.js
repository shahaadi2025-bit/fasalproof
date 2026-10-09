import {climRain, trailingRain} from './clim';
export const API = import.meta.env.VITE_API || 'https://fasalproof.onrender.com';
export async function analyze(body, signal) {
  const r = await fetch(API + '/analyze', {method: 'POST', signal, headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)});
  let j; try { j = await r.json(); } catch { throw new Error('Server returned a non-JSON reply (HTTP ' + r.status + ')'); }
  if (!r.ok) throw new Error(typeof j.detail === 'string' ? j.detail : (j.detail?.[0]?.msg || 'Server error ' + r.status));
  return j;
}
export const health = async () => { const r = await fetch(API + '/health'); return r.ok ? (await r.json()).version || '?' : null; };
export async function weather(lat, lon, ld, ev) {
  const t0 = new Date(ld), iso = x => x.toISOString().slice(0, 10), now = new Date();
  let days = [];
  try {
    const u = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${iso(new Date(t0 - 30 * 864e5))}&end_date=${iso(new Date(Math.min(t0.getTime() + 3 * 864e5, now - 5 * 864e5)))}&daily=precipitation_sum,temperature_2m_max&timezone=auto`;
    const r = await (await fetch(u)).json();
    days = r.daily.time.map((t, i) => ({t: t.slice(5), d: t, p: r.daily.precipitation_sum[i] || 0, x: r.daily.temperature_2m_max[i] || 0}));
  } catch (e) {}
  const near = days.filter(x => Math.abs(new Date(x.d) - t0) <= 3 * 864e5), r3 = near.reduce((a, x) => a + x.p, 0);
  const r30 = days.reduce((a, x) => a + x.p, 0), hot = Math.max(0, ...days.slice(-10).map(x => x.x));
  let ok = null, msg = 'Weather corroboration is not applicable to this calamity type, or data is unavailable.';
  if (days.length) {
    if (['Flood', 'Cloudburst', 'Cyclone / storm', 'Unseasonal rain', 'Landslide'].includes(ev)) { ok = r3 >= 60; msg = `Rainfall within ±3 days of the loss: ${r3.toFixed(0)} mm. ${ok ? 'Consistent with flooding.' : 'Below typical flood level.'}`; }
    else if (ev === 'Hailstorm') { const mx = Math.max(0, ...near.map(x => x.p)); ok = mx >= 20; msg = `Peak daily rain near the date: ${mx.toFixed(0)} mm. ${ok ? 'Storm activity detected.' : 'No strong storm signal.'}`; }
    else if (ev === 'Drought / dry spell') { ok = r30 < 40 || hot >= 40; msg = `30-day rainfall ${r30.toFixed(0)} mm, peak temperature ${hot.toFixed(0)}°C. ${ok ? 'Dry/hot conditions confirmed.' : 'Not clearly dry.'}`; }
  }
  let clim = null, dry = null;
  try {
    const end = iso(new Date(Math.min(t0.getTime() + 3 * 864e5, now - 5 * 864e5)));
    if (new Date(end) >= new Date(iso(new Date(t0.getTime() + 3 * 864e5)))) {
      const r2 = await (await fetch(`https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${t0.getFullYear() - 10}-01-01&end_date=${end}&daily=precipitation_sum&timezone=auto`)).json();
      const dd = r2.daily.time.map((t, i) => ({d: t, p: r2.daily.precipitation_sum[i] || 0})); clim = climRain(dd, ld); dry = trailingRain(dd, ld);
    }
  } catch (e) {}
  // Location-relative judgement (works anywhere): rank against this place's own 10-year history instead of fixed mm thresholds.
  if (clim && ['Flood', 'Cloudburst', 'Cyclone / storm', 'Unseasonal rain', 'Landslide'].includes(ev)) { ok = clim.cur >= 10 && clim.pct >= 90; msg = `Rain within ±3 days of the loss: ${clim.cur.toFixed(0)} mm, wetter than ${clim.pct.toFixed(0)}% of the same window in the last ${clim.hist.length} years (median ${clim.med.toFixed(0)} mm). ${ok ? 'Unusually heavy for this location: consistent with the claimed event.' : 'Not unusual for this location.'}`; }
  if (dry && ev === 'Drought / dry spell') { ok = dry.pct <= 15; msg = `Rain in the 30 days up to the loss date: ${dry.cur.toFixed(0)} mm, drier than ${(100 - dry.pct).toFixed(0)}% of the same period in the last ${dry.hist.length} years (median ${dry.med.toFixed(0)} mm). ${ok ? 'Unusually dry for this location: consistent with drought.' : 'Not unusually dry for this location.'}`; }
  return {days, msg, pts: ok === null ? 15 : ok ? 30 : 8, clim};
}

export async function sar(body) {
  const r = await fetch(API + '/sar', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)});
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(typeof j.detail === 'string' ? j.detail : 'Radar check failed (HTTP ' + r.status + ')'); return j;
}

// Place context for any location: country, region, elevation (free, key-less services; fails gracefully).
export async function placeInfo(lat, lon) {
  const [a, b] = await Promise.allSettled([
    fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`).then(r => r.json()),
    fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`).then(r => r.json())]);
  const g = a.status === 'fulfilled' ? a.value : {}, el = b.status === 'fulfilled' ? b.value?.elevation?.[0] : null;
  if (!g.countryCode && el == null) return null;
  return {code: g.countryCode || null, country: g.countryName || null, region: g.principalSubdivision || '', place: g.locality || g.city || '', elev: el};
}
export const roughIndia = (lat, lon) => lat >= 6 && lat <= 36 && lon >= 68 && lon <= 98;
export const climateBand = lat => { const a = Math.abs(lat); return (a < 23.44 ? 'Tropics' : a < 35 ? 'Subtropics' : a < 55 ? 'Temperate zone' : 'High latitude') + (lat >= 0 ? ', northern' : ', southern') + ' hemisphere'; };
