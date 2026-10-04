import {useEffect, useState} from 'react';
import MapView from './MapView';
import Results from './Results';
import Boundary from './Boundary';
import {analyze, health, weather} from './api';
import {CROPS} from './crops';
const EX = [['Maharashtra', 18.99, 75.76, '2025-11-20', 'Flood', 'Soybean'], ['Punjab', 30.90, 75.85, '2025-04-12', 'Hailstorm', 'Wheat'], ['Rajasthan', 26.91, 75.79, '2025-12-15', 'Drought', 'Cotton']];
export default function App() {
  const [f, setF] = useState({nm: 'Ramesh Patil', vl: 'Beed, Maharashtra', cr: 'Soybean', ar: 3, ev: 'Flood', dt: '2025-11-20', lg: 'en', sow: '', si: '40000', hs: 100, db: 90, da: 45, ctrl: false});
  const [pos, setPos] = useState({lat: 18.99, lon: 75.76}), [fly, setFly] = useState(0), [q, setQ] = useState(''), [hits, setHits] = useState([]);
  const [st, setSt] = useState('idle'), [err, setErr] = useState(''), [d, setD] = useState(null), [cd, setCd] = useState(null), [wx, setWx] = useState(null), [sec, setSec] = useState(0), [api, setApi] = useState('…');
  const set = k => e => setF({...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value});
  useEffect(() => { health().then(v => setApi(v ? '● API live v' + v : '● API error')).catch(() => setApi('● API waking…')); }, []);
  useEffect(() => { if (st !== 'loading') return; const t0 = Date.now(), i = setInterval(() => setSec(Math.round((Date.now() - t0) / 1000)), 1000); return () => clearInterval(i); }, [st]);
  const go = p => { setPos({lat: p[1], lon: p[2]}); setF({...f, dt: p[3], ev: p[4], cr: p[5]}); setFly(x => x + 1); };
  async function search() {
    if (q.trim().length < 2) return; setErr('');
    try {
      const r = await (await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q.trim())}&count=6&language=en&format=json&countryCode=IN`)).json();
      setHits(r.results || []); if (!(r.results || []).length) setErr('No place found. Try a nearby town or enter coordinates.');
    } catch (e) { setErr('Location search failed. You can tap the map instead.'); }
  }
  const pick = h => { setPos({lat: h.latitude, lon: h.longitude}); setF({...f, vl: [h.name, h.admin2, h.admin1].filter(Boolean).join(', ')}); setFly(x => x + 1); setHits([]); setQ(''); };
  async function run() {
    setSt('loading'); setErr(''); setSec(0); setCd(null);
    const ac = new AbortController(), to = setTimeout(() => ac.abort(), 240000);
    try {
      const body = {lat: pos.lat, lon: pos.lon, loss_date: f.dt, days_before: +f.db, days_after: +f.da, half_size_m: +f.hs};
      const j = await analyze(body, ac.signal); let c = null;
      if (f.ctrl) { try { c = await analyze({...body, lat: pos.lat + 0.012}, ac.signal); } catch (e) { c = {error: e.message}; } }
      const w = await weather(pos.lat, pos.lon, f.dt, f.ev); setWx(w); setCd(c); setD(j); setSt('done');
    } catch (e) { setErr(e.name === 'AbortError' ? 'Timed out. The free server may be waking or busy. Wait a minute and try again.' : e.message); setSt('error'); }
    finally { clearTimeout(to); }
  }
  return (<>
    <MapView pos={pos} setPos={setPos} zones={d?.zones} fly={fly} size={+f.hs || 100}/>
    {st === 'loading' && <div className="pn on" id="ld" style={{display: 'block'}}>🛰️ Querying Sentinel-2 archive &amp; running models…<br/><small>{sec}s elapsed (first run can take 1-2 min{f.ctrl ? ', double with control field' : ''})</small><div/></div>}
    <aside className="pn" id="side">
      <div className="br">FASAL<i>PROOF</i></div><div className="tg">SATELLITE CLAIM INTELLIGENCE</div>
      <label>🔎 SEARCH LOCATION (VILLAGE / TOWN, INDIA)</label>
      <div style={{display: 'flex', gap: 6}}><input value={q} placeholder="e.g. Beed, Ludhiana" onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()}/><button className="gh" style={{margin: 0}} onClick={search}>Go</button></div>
      {hits.map(h => <button key={h.id} className="gh" style={{display: 'block', width: '100%', textAlign: 'left'}} onClick={() => pick(h)}>{h.name}, {[h.admin2, h.admin1].filter(Boolean).join(', ')}</button>)}
      <div className="r2">
        <div><label>LATITUDE</label><input type="number" step="0.00001" value={+pos.lat.toFixed(5)} onChange={e => setPos({...pos, lat: +e.target.value})} onBlur={() => setFly(x => x + 1)}/></div>
        <div><label>LONGITUDE</label><input type="number" step="0.00001" value={+pos.lon.toFixed(5)} onChange={e => setPos({...pos, lon: +e.target.value})} onBlur={() => setFly(x => x + 1)}/></div>
      </div>
      <p className="nt" style={{margin: '6px 0 0'}}>Or tap the map to move the pin.</p>
      <div className="r2">
        <div><label>FARMER</label><input value={f.nm} onChange={set('nm')}/></div><div><label>VILLAGE, DISTRICT</label><input value={f.vl} onChange={set('vl')}/></div>
        <div><label>CROP</label><select value={f.cr} onChange={set('cr')}>{Object.keys(CROPS).map(x => <option key={x}>{x}</option>)}</select></div>
        <div><label>AREA (ACRES)</label><input type="number" min=".5" step=".5" value={f.ar} onChange={set('ar')}/></div>
        <div><label>CALAMITY</label><select value={f.ev} onChange={set('ev')}>{['Flood', 'Drought', 'Hailstorm', 'Pest attack'].map(x => <option key={x}>{x}</option>)}</select></div>
        <div><label>DATE OF LOSS</label><input type="date" value={f.dt} onChange={set('dt')}/></div>
        <div><label>SOWING DATE</label><input type="date" value={f.sow} onChange={set('sow')}/></div>
        <div><label>SUM INSURED (₹/HA)</label><input type="number" min="0" step="1000" value={f.si} onChange={set('si')}/></div>
      </div>
      <p className="nt" style={{margin: '8px 0 0'}}>{CROPS[f.cr].season} crop · PMFBY farmer premium {CROPS[f.cr].prem}%. Enter your district's notified sum insured.</p>
      <details open><summary>⚙ Advanced parameters</summary>
        <div className="r2">
          <div><label>PLOT HALF-SIZE (m)</label><input type="number" min="30" max="500" step="10" value={f.hs} onChange={set('hs')}/></div>
          <div><label>DAYS BEFORE LOSS</label><input type="number" min="30" max="120" step="10" value={f.db} onChange={set('db')}/></div>
          <div><label>DAYS AFTER LOSS</label><input type="number" min="15" max="90" step="5" value={f.da} onChange={set('da')}/></div>
          <div><label>REPORT LANGUAGE</label><select value={f.lg} onChange={set('lg')}><option value="en">English</option><option value="hi">हिन्दी</option><option value="mr">मराठी</option></select></div>
        </div>
        <label style={{display: 'flex', gap: 8, alignItems: 'center', letterSpacing: 0}}><input type="checkbox" style={{width: 16}} checked={f.ctrl} onChange={set('ctrl')}/>Compare with a nearby control field (slower)</label>
      </details>
      <button id="go" disabled={st === 'loading'} onClick={run}>{st === 'loading' ? 'Analysing…' : 'Run satellite analysis'}</button>
      {err && <div id="er">⚠ {err}</div>}
      {st === 'done' && d && <div className="m" style={{marginTop: 10}}><div><small>LOSS</small><b>{d.loss_pct}%</b><span>{d.severity}</span></div><div><small>SCENES</small><b>{d.images_used}</b><span>{d.confidence} confidence</span></div></div>}
      {api.includes('v') && parseFloat(api.split('v')[1]) < 4 && <p className="nt" style={{color: '#f59e0b'}}>⚠ Old backend detected ({api}). Redeploy on Render: Manual Deploy → Clear build cache &amp; deploy.</p>}
      <label style={{marginTop: 14}}>EXAMPLE LOCATIONS</label>
      {EX.map(p => <button key={p[0]} className="gh" onClick={() => go(p)}>{p[0]}</button>)}
      <button className="gh" onClick={() => navigator.geolocation.getCurrentPosition(p => { setPos({lat: p.coords.latitude, lon: p.coords.longitude}); setFly(x => x + 1); }, () => setErr('Location permission blocked'))}>📍 My location</button>
      <p className="nt" style={{marginTop: 14}}>Theil–Sen forecast · bootstrap CI · change-point tests · k-means zones · Bayesian fusion · Monte Carlo. <span id="st">{api}</span></p>
      {d && <details><summary>Raw API response (debug)</summary><pre>{JSON.stringify({...d, zones: d.zones ? '[grid hidden]' : null, forecast: '[hidden]'}, null, 1).slice(0, 1800)}</pre></details>}
    </aside>
    {d && <Boundary key={d.images_used + f.dt}><Results d={d} wx={wx} f={f} pos={pos} cd={cd}/></Boundary>}
  </>);
}
