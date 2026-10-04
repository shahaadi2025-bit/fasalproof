import {useEffect, useState} from 'react';
import MapView from './MapView';
import Results from './Results';
import {analyze, health, weather} from './api';
const EX = [['Maharashtra', 18.99, 75.76, '2025-11-20', 'Flood', 'Soybean'], ['Punjab', 30.90, 75.85, '2025-04-12', 'Hailstorm', 'Wheat'], ['Rajasthan', 26.91, 75.79, '2025-12-15', 'Drought', 'Cotton']];
export default function App() {
  const [f, setF] = useState({nm: 'Ramesh Patil', vl: 'Beed, Maharashtra', cr: 'Soybean', ar: 3, ev: 'Flood', dt: '2025-11-20', lg: 'en'});
  const [pos, setPos] = useState({lat: 18.99, lon: 75.76}), [fly, setFly] = useState(0);
  const [st, setSt] = useState('idle'), [err, setErr] = useState(''), [d, setD] = useState(null), [wx, setWx] = useState(null), [sec, setSec] = useState(0), [api, setApi] = useState('…');
  const set = k => e => setF({...f, [k]: e.target.value});
  useEffect(() => { health().then(ok => setApi(ok ? '● API live' : '● API error')).catch(() => setApi('● API waking…')); }, []);
  useEffect(() => { if (st !== 'loading') return; const t0 = Date.now(), i = setInterval(() => setSec(Math.round((Date.now() - t0) / 1000)), 1000); return () => clearInterval(i); }, [st]);
  const go = p => { setPos({lat: p[1], lon: p[2]}); setF({...f, dt: p[3], ev: p[4], cr: p[5]}); setFly(x => x + 1); };
  async function run() {
    setSt('loading'); setErr(''); setSec(0);
    const ac = new AbortController(), to = setTimeout(() => ac.abort(), 170000);
    try { const j = await analyze({lat: pos.lat, lon: pos.lon, loss_date: f.dt, days_before: 90}, ac.signal); const w = await weather(pos.lat, pos.lon, f.dt, f.ev); setWx(w); setD(j); setSt('done'); }
    catch (e) { setErr(e.name === 'AbortError' ? 'Timed out. The free server may be waking or busy. Wait a minute and try again.' : e.message); setSt('error'); }
    finally { clearTimeout(to); }
  }
  return (<>
    <MapView pos={pos} setPos={setPos} zones={d?.zones} fly={fly}/>
    {st === 'loading' && <div className="pn on" id="ld" style={{display: 'block'}}>🛰️ Querying Sentinel-2 archive &amp; running models…<br/><small>{sec}s elapsed (first run can take 1-2 min)</small><div/></div>}
    <aside className="pn" id="side">
      <div className="br">FASAL<i>PROOF</i></div><div className="tg">SATELLITE CLAIM INTELLIGENCE</div>
      <label>1 · TAP YOUR FIELD ON THE MAP</label><div id="gps">{pos.lat.toFixed(5)}, {pos.lon.toFixed(5)}</div>
      <div className="r2">
        <div><label>FARMER</label><input value={f.nm} onChange={set('nm')}/></div><div><label>VILLAGE, DISTRICT</label><input value={f.vl} onChange={set('vl')}/></div>
        <div><label>CROP</label><select value={f.cr} onChange={set('cr')}>{['Soybean', 'Cotton', 'Wheat', 'Rice', 'Sugarcane'].map(x => <option key={x}>{x}</option>)}</select></div>
        <div><label>AREA (ACRES)</label><input type="number" min=".5" step=".5" value={f.ar} onChange={set('ar')}/></div>
        <div><label>CALAMITY</label><select value={f.ev} onChange={set('ev')}>{['Flood', 'Drought', 'Hailstorm', 'Pest attack'].map(x => <option key={x}>{x}</option>)}</select></div>
        <div><label>DATE OF LOSS</label><input type="date" value={f.dt} onChange={set('dt')}/></div>
      </div>
      <label>REPORT LANGUAGE</label><select value={f.lg} onChange={set('lg')}><option value="en">English</option><option value="hi">हिन्दी</option><option value="mr">मराठी</option></select>
      <button id="go" disabled={st === 'loading'} onClick={run}>{st === 'loading' ? 'Analysing…' : 'Run satellite analysis'}</button>
      {st === 'error' && <div id="er">⚠ {err}</div>}
      {st === 'done' && <div id="st" style={{marginTop: 8}}>✔ Analysis complete. See results panel.</div>}
      <label style={{marginTop: 14}}>EXAMPLE LOCATIONS</label>
      {EX.map(p => <button key={p[0]} className="gh" onClick={() => go(p)}>{p[0]}</button>)}
      <button className="gh" onClick={() => navigator.geolocation.getCurrentPosition(p => { setPos({lat: p.coords.latitude, lon: p.coords.longitude}); setFly(x => x + 1); }, () => setErr('Location permission blocked'))}>📍 My location</button>
      <p className="nt" style={{marginTop: 14}}>Models: Theil–Sen counterfactual, bootstrap CI, change-point detection, k-means damage zones. <span id="st">{api}</span></p>
      {d && <details><summary>Raw API response (debug)</summary><pre>{JSON.stringify({...d, zones: d.zones ? '[grid hidden]' : null, forecast: '[hidden]'}, null, 1).slice(0, 1800)}</pre></details>}
    </aside>
    {d && <Results d={d} wx={wx} f={f} pos={pos}/>}
  </>);
}
