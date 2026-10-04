export const API = import.meta.env.VITE_API || 'https://fasalproof.onrender.com';
export async function analyze(body, signal) {
  const r = await fetch(API + '/analyze', {method: 'POST', signal, headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)});
  let j; try { j = await r.json(); } catch { throw new Error('Server returned a non-JSON reply (HTTP ' + r.status + ')'); }
  if (!r.ok) throw new Error(typeof j.detail === 'string' ? j.detail : (j.detail?.[0]?.msg || 'Server error ' + r.status));
  return j;
}
export const health = async () => (await fetch(API + '/health')).ok;
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
    if (ev === 'Flood') { ok = r3 >= 60; msg = `Rainfall within ±3 days of the loss: ${r3.toFixed(0)} mm. ${ok ? 'Consistent with flooding.' : 'Below typical flood level.'}`; }
    else if (ev === 'Hailstorm') { const mx = Math.max(0, ...near.map(x => x.p)); ok = mx >= 20; msg = `Peak daily rain near the date: ${mx.toFixed(0)} mm. ${ok ? 'Storm activity detected.' : 'No strong storm signal.'}`; }
    else if (ev === 'Drought') { ok = r30 < 40 || hot >= 40; msg = `30-day rainfall ${r30.toFixed(0)} mm, peak temperature ${hot.toFixed(0)}°C. ${ok ? 'Dry/hot conditions confirmed.' : 'Not clearly dry.'}`; }
  }
  return {days, msg, pts: ok === null ? 15 : ok ? 30 : 8};
}
