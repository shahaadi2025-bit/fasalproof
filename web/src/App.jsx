import {useEffect, useState} from 'react';
import MapView from './MapView';
import Results from './Results';
import Boundary from './Boundary';
import {analyze, health, weather, placeInfo, roughIndia, climateBand} from './api';
import {CROPS, CAL, meta, CURS, CC2CUR, setSym} from './crops';
import {qPut, qAll, qClear} from './offline';
import {verifyBundle} from './verify';
import Chat from './Chat';
import {BUILD} from './version';
import {record, transcribe} from './ai';
import {WLANG} from './aiLogic';
import {dec, loadHist, saveHist} from './kitHelpers';
const INIT = (() => { try { const m = location.hash.match(/#s=(.+)/); return m ? dec(m[1]) : null; } catch { return null; } })();
const EX = [['Maharashtra', 18.99, 75.76, '2025-11-20', 'Flood', 'Soybean'], ['Punjab', 30.90, 75.85, '2025-04-12', 'Hailstorm', 'Wheat'], ['Rajasthan', 26.91, 75.79, '2025-12-15', 'Drought / dry spell', 'Cotton']];
const transient = e => e instanceof TypeError || /unavailable|non-JSON|waking|HTTP 5/i.test(e.message);
async function withRetry(fn, n = 2) { for (let i = 0; ; i++) { try { return await fn(); } catch (e) { if (i >= n || e.name === 'AbortError' || !transient(e)) throw e; await new Promise(r => setTimeout(r, 4000 * (i + 1))); } } }
export default function App() {
  const [f, setF] = useState({...{nm: 'Ramesh Patil', vl: 'Beed, Maharashtra', cr: 'Soybean', ar: 3, ev: 'Flood', dt: '2025-11-20', lg: 'en', sow: '', hv: '', si: '40000', rules: 'IN', cur: 'INR', unit: 'ac', prem: '', notice: '', hs: 100, db: 90, da: 45, ctrl: false}, ...(INIT?.f || {})});
  const [pos, setPos] = useState(INIT?.pos || {lat: 18.99, lon: 75.76}), [fly, setFly] = useState(0), [q, setQ] = useState(''), [hits, setHits] = useState([]);
  const [st, setSt] = useState('idle'), [err, setErr] = useState(''), [d, setD] = useState(null), [cd, setCd] = useState(null), [wx, setWx] = useState(null), [sec, setSec] = useState(0), [api, setApi] = useState('…');
  const [info, setInfo] = useState(null), [cc, setCc] = useState('ALL'), [open, setOpen] = useState(true), [chat, setChat] = useState(() => /chat/.test(location.hash)), [exp, setExp] = useState(() => localStorage.getItem('fp_exp') === '1'), [last, setLast] = useState(() => { try { return JSON.parse(localStorage.getItem('fp_last')); } catch { return null; } }), [hist, setHist] = useState(loadHist()), [mi, setMi] = useState(''), [vr, setVr] = useState(null), [auto, setAuto] = useState(0), [oq, setOq] = useState(0);
  const onVerify = async e => { const file = e.target.files[0]; if (!file) return; try { setVr(await verifyBundle(JSON.parse(await file.text()))); } catch (x) { setVr({ok: false, why: 'Could not verify: ' + x.message}); } };
  useEffect(() => { qAll().then(a => setOq(a.length)).catch(() => {}); const on = async () => { try { const a = await qAll(); if (!a.length) return; const j = a[a.length - 1]; await qClear(); setOq(0); setF(j.f); setPos(j.pos); setFly(x => x + 1); setTimeout(() => setAuto(x => x + 1), 80); } catch (x) {} }; addEventListener('online', on); if (navigator.onLine) on(); return () => removeEventListener('online', on); }, []);
  useEffect(() => { if (auto) run(); }, [auto]);
  useEffect(() => { const k = e => { if (e.key === 'Escape') { setOpen(false); setChat(false); } }; addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, []);
  useEffect(() => { const t = setTimeout(async () => { const i = await placeInfo(pos.lat, pos.lon); setInfo(i); setF(p => { const inIn = i?.code ? i.code === 'IN' : roughIndia(pos.lat, pos.lon), q = {...p}; if (!p.rulesSet && (i?.code || !inIn)) q.rules = inIn ? 'IN' : 'OTHER'; if (!p.curSet && i?.code && CC2CUR[i.code]) q.cur = CC2CUR[i.code]; return q; }); }, 700); return () => clearTimeout(t); }, [pos.lat, pos.lon]);
  const applyChat = G => { setPos({lat: G.lat, lon: G.lon}); setF(p => ({...p, cr: G.cr, ev: G.ev, dt: G.dt, vl: G.vl || p.vl, ...(G.ar ? {ar: G.ar} : {})})); setFly(x => x + 1); setChat(false); setOpen(true); setTimeout(() => setAuto(x => x + 1), 120); };
  setSym(CURS[f.cur] || '¤');
  const set = k => e => setF({...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value});
  useEffect(() => { health().then(v => setApi(v ? '● API live v' + v : '● API error')).catch(() => setApi('● API waking…')); }, []);
  useEffect(() => { if (st !== 'loading') return; const t0 = Date.now(), i = setInterval(() => setSec(Math.round((Date.now() - t0) / 1000)), 1000); return () => clearInterval(i); }, [st]);
  const go = p => { setPos({lat: p[1], lon: p[2]}); setF({...f, dt: p[3], ev: p[4], cr: p[5]}); setFly(x => x + 1); };
  async function search(text) {
    const name = (typeof text === 'string' ? text : q).trim();
    if (name.length < 2) return; setErr('');
    try {
      const r = await (await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=6&language=en&format=json${cc !== 'ALL' ? '&countryCode=' + cc : ''}`)).json();
      setHits(r.results || []); if (!(r.results || []).length) setErr('No place found. Try a nearby town or enter coordinates.');
    } catch (e) { setErr('Location search failed. You can tap the map instead.'); }
  }
  const mic = async () => { try { setMi('Listening 5s…'); const au = await record(5); setMi('Loading AI…'); const t = await transcribe(au, WLANG[f.lg] || 'english', p => setMi('Model ' + p + '%')); setMi(''); if (t) { setQ(t); await search(t); } } catch (e) { setMi(''); setErr('Voice input failed: ' + e.message); } };
  const pick = h => { setPos({lat: h.latitude, lon: h.longitude}); setF({...f, vl: [h.name, h.admin2, h.admin1, h.country].filter(Boolean).join(', ')}); setFly(x => x + 1); setHits([]); setQ(''); };
  async function run() {
    if (!navigator.onLine) { await qPut({id: Date.now(), f, pos}); setOq(1); setErr('You are offline. The request is saved and will run automatically when you are back online.'); setSt('error'); return; }
    setSt('loading'); setErr(''); setSec(0); setCd(null);
    const ac = new AbortController(), to = setTimeout(() => ac.abort(), 240000);
    try {
      const body = {lat: pos.lat, lon: pos.lon, loss_date: f.dt, days_before: +f.db, days_after: +f.da, half_size_m: +f.hs};
      const j = await withRetry(() => analyze(body, ac.signal)); let c = null;
      if (f.ctrl) { try { c = await analyze({...body, lat: pos.lat + 0.012}, ac.signal); } catch (e) { c = {error: e.message}; } }
      const w = await weather(pos.lat, pos.lon, f.dt, f.ev); setWx(w); setCd(c); setD(j); setSt('done'); setOpen(true); saveHist({f, pos, loss: j.loss_pct, at: Date.now()}); setHist(loadHist()); try { localStorage.setItem('fp_last', JSON.stringify({f, pos, d: j, wx: w, cd: c, at: Date.now()})); setLast(JSON.parse(localStorage.getItem('fp_last'))); } catch {}
    } catch (e) { setErr(e.name === 'AbortError' ? 'Timed out. The free server may be waking or busy. Wait a minute and try again.' : e.message); setSt('error'); }
    finally { clearTimeout(to); }
  }
  return (<>
    <MapView pos={pos} setPos={setPos} zones={open ? d?.zones : null} fly={fly} size={+f.hs || 100}/>
    {st === 'loading' && <div className="pn on" id="ld" style={{display: 'block'}}>🛰️ Querying Sentinel-2 archive &amp; running models…<br/><small>{sec}s elapsed (first run can take 1-2 min{f.ctrl ? ', double with control field' : ''})</small><div/></div>}
    <aside className="pn" id="side">
      <div className="br">FASAL<i>PROOF</i><a className="home" href="#/">← Home</a></div><div className="tg">SATELLITE CLAIM INTELLIGENCE</div>
      <label>🔎 SEARCH ANY PLACE IN THE WORLD</label>
      <select value={cc} onChange={e => setCc(e.target.value)} style={{marginBottom: 6}}><option value="ALL">Search worldwide</option><option value="IN">India only</option><option value="US">USA only</option><option value="BR">Brazil only</option><option value="KE">Kenya only</option><option value="AU">Australia only</option></select>
      <div style={{display: 'flex', gap: 6}}><input value={q} placeholder="e.g. Beed, Ludhiana" onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()}/><button className="gh" style={{margin: 0}} onClick={search}>Go</button>{exp && <button className="gh" style={{margin: 0}} title="Speak the place name (on-device Whisper)" disabled={!!mi} onClick={mic}>{mi || '🎤'}</button>}</div>
      {hits.map(h => <button key={h.id} className="gh" style={{display: 'block', width: '100%', textAlign: 'left'}} onClick={() => pick(h)}>{h.name}, {[h.admin2, h.admin1, h.country].filter(Boolean).join(', ')}</button>)}
      <div className="r2">
        <div><label>LATITUDE</label><input type="number" step="0.00001" value={+pos.lat.toFixed(5)} onChange={e => setPos({...pos, lat: +e.target.value})} onBlur={() => setFly(x => x + 1)}/></div>
        <div><label>LONGITUDE</label><input type="number" step="0.00001" value={+pos.lon.toFixed(5)} onChange={e => setPos({...pos, lon: +e.target.value})} onBlur={() => setFly(x => x + 1)}/></div>
      </div>
      <p className="nt" style={{margin: '6px 0 0'}}>Or tap the map to move the pin.</p>
      <p className="nt" style={{margin: '6px 0 0'}}>📍 {[info?.place, info?.region, info?.country].filter(Boolean).join(', ') || 'Place details unavailable'} · {info?.elev != null ? Math.round(info.elev) + ' m · ' : ''}{climateBand(pos.lat)}</p>
      <div className="r2">
        <div><label>FARMER</label><input value={f.nm} onChange={set('nm')}/></div><div><label>VILLAGE, DISTRICT</label><input value={f.vl} onChange={set('vl')}/></div>
        <div><label>CROP</label><select value={f.cr} onChange={set('cr')}>{Object.keys(CROPS).map(x => <option key={x}>{x}</option>)}</select></div>
        <div><label>AREA ({f.unit === 'ha' ? 'HECTARES' : 'ACRES'})</label><input type="number" min=".1" step=".1" value={f.unit === 'ha' ? +(f.ar * 0.4047).toFixed(2) : f.ar} onChange={e => setF({...f, ar: f.unit === 'ha' ? +e.target.value / 0.4047 : e.target.value})}/></div>
        <div><label>CALAMITY</label><select value={f.ev} onChange={set('ev')}>{CAL.map(x => <option key={x}>{x}</option>)}</select></div>
        <div><label>DATE OF LOSS</label><input type="date" value={f.dt} onChange={set('dt')}/></div>
        <div><label>SOWING DATE</label><input type="date" value={f.sow} onChange={set('sow')}/></div>
        <div><label>HARVEST DATE (IF HARVESTED)</label><input type="date" value={f.hv} onChange={set('hv')}/></div>
        <div><label>SUM INSURED ({CURS[f.cur] || '¤'}/HA)</label><input type="number" min="0" step="1000" value={f.si} onChange={set('si')}/></div>
      </div>
      <div className="r2" style={{marginTop: 8}}>
        <div><label>INSURANCE RULES</label><select value={f.rules} onChange={e => setF({...f, rules: e.target.value, rulesSet: true})}><option value="IN">India (PMFBY)</option><option value="OTHER">Other country (my policy)</option></select></div>
        <div><label>CURRENCY</label><select value={f.cur} onChange={e => setF({...f, cur: e.target.value, curSet: true})}>{Object.keys(CURS).map(c => <option key={c}>{c}</option>)}</select></div>
        <div><label>AREA UNIT</label><select value={f.unit} onChange={set('unit')}><option value="ac">Acres</option><option value="ha">Hectares</option></select></div>
        {f.rules === 'OTHER' && <><div><label>PREMIUM (% OF SUM INSURED)</label><input type="number" min="0" step="0.1" value={f.prem} onChange={set('prem')}/></div><div><label>NOTICE PERIOD (HOURS)</label><input type="number" min="0" step="1" value={f.notice} onChange={set('notice')}/></div></>}
      </div>
      <p className="nt" style={{margin: '8px 0 0'}}>{f.rules === 'OTHER' ? 'Other country: enter the premium and notice period from your own policy. FasalProof gives satellite and weather evidence only.' : meta(f).season + ' · ' + meta(f).premTxt + '. Enter the sum insured from your policy.'}{info?.code && info.code !== 'IN' && f.rules === 'IN' ? ' ⚠ This location is in ' + info.country + ': PMFBY applies only in India.' : ''}</p>
      <details open><summary>⚙ Advanced parameters</summary>
        <div className="r2">
          <div><label>PLOT HALF-SIZE (m)</label><input type="number" min="30" max="500" step="10" value={f.hs} onChange={set('hs')}/></div>
          <div><label>DAYS BEFORE LOSS</label><input type="number" min="30" max="120" step="10" value={f.db} onChange={set('db')}/></div>
          <div><label>DAYS AFTER LOSS</label><input type="number" min="15" max="90" step="5" value={f.da} onChange={set('da')}/></div>
          <div><label>REPORT LANGUAGE</label><select value={f.lg} onChange={set('lg')}><option value="en">English</option><option value="hi">हिन्दी</option><option value="mr">मराठी</option><option value="es">Español</option><option value="fr">Français</option><option value="pt">Português</option></select></div>
        </div>
        <label style={{display: 'flex', gap: 8, alignItems: 'center', letterSpacing: 0}}><input type="checkbox" style={{width: 16}} checked={f.ctrl} onChange={set('ctrl')}/>Compare with a nearby control field (slower)</label>
        <label style={{display: 'flex', gap: 8, alignItems: 'center', letterSpacing: 0, marginTop: 6}}><input type="checkbox" style={{width: 16}} checked={exp} onChange={e => { setExp(e.target.checked); localStorage.setItem('fp_exp', e.target.checked ? '1' : '0'); }}/>Show experimental features ⚗ (radar, on-device AI, voice)</label>
      </details>
      {oq > 0 && <p className="nt" style={{borderColor: '#f59e0b'}}>⏳ {oq} analysis waiting for a connection.</p>}
      <details><summary>🔍 Verify a signed report</summary><input type="file" accept=".json" onChange={onVerify}/>{vr && <p className="nt" style={{marginTop: 8, borderColor: vr.ok ? '#22c55e' : '#ef4444'}}>{vr.ok ? '✔ ' : '✖ '}{vr.why}</p>}</details>
      <button id="go" disabled={st === 'loading'} onClick={run}>{st === 'loading' ? 'Analysing…' : 'Run satellite analysis'}</button>
      {err && <div id="er">⚠ {err}</div>}
      {st === 'error' && /clear view|Not enough/i.test(err) && <button className="gh" onClick={() => { setF({...f, db: 120, da: 90, hs: 200}); setTimeout(() => setAuto(x => x + 1), 60); }}>↻ Retry with a wider window</button>}
      {st === 'done' && d && <div className="m" style={{marginTop: 10}}><div><small>LOSS</small><b>{d.loss_pct}%</b><span>{d.severity}</span></div><div><small>SCENES</small><b>{d.images_used}</b><span>{d.confidence} confidence</span></div></div>}
      {d && !open && <button className="gh" onClick={() => setOpen(true)}>▶ Reopen results</button>}
      {api.includes('v') && parseFloat(api.split('v')[1]) < 4 && <p className="nt" style={{color: '#f59e0b'}}>⚠ Old backend detected ({api}). Redeploy on Render: Manual Deploy → Clear build cache &amp; deploy.</p>}
      {hist.length > 0 && <details><summary>🕘 Recent analyses</summary>{hist.map(h => <button key={h.at} className="gh" style={{display: 'block', width: '100%', textAlign: 'left'}} onClick={() => { setF(h.f); setPos(h.pos); setFly(x => x + 1); }}>{h.f.nm} · {h.f.cr} · {h.f.ev} · {h.loss}% · {new Date(h.at).toLocaleDateString('en-IN')}</button>)}</details>}
      {last && st !== 'loading' && <button className="gh" style={{display: 'block', width: '100%', textAlign: 'left'}} onClick={() => { setF(last.f); setPos(last.pos); setD(last.d); setWx(last.wx); setCd(last.cd); setSt('done'); setOpen(true); setFly(x => x + 1); }}>📂 Load last saved result ({new Date(last.at).toLocaleString('en-IN')})</button>}
      <label style={{marginTop: 14}}>EXAMPLE LOCATIONS</label>
      {EX.map(p => <button key={p[0]} className="gh" onClick={() => go(p)}>{p[0]}</button>)}
      <button className="gh" onClick={() => navigator.geolocation.getCurrentPosition(p => { setPos({lat: p.coords.latitude, lon: p.coords.longitude}); setFly(x => x + 1); }, () => setErr('Location permission blocked'))}>📍 My location</button>
      <details><summary>ℹ About, data credits &amp; limits</summary><p className="nt" style={{marginTop: 8}}>Data: Sentinel-2 (ESA / Copernicus, free and open) via Earth Search; Esri World Imagery basemap; Open-Meteo weather (CC BY 4.0); FAO-56 crop tables; PMFBY operational guidelines. Built and tested by the FasalProof team. Build {BUILD}. Results are supporting evidence, not an official crop-loss assessment, and have not yet been validated against a large set of field records.</p></details>
      <p className="nt" style={{marginTop: 14}}>Theil–Sen forecast · bootstrap CI · change-point tests · k-means zones · Bayesian fusion · Monte Carlo. <span id="st">{api}</span></p>
      {d && <details><summary>Raw API response (debug)</summary><pre>{JSON.stringify({...d, zones: d.zones ? '[grid hidden]' : null, forecast: '[hidden]'}, null, 1).slice(0, 1800)}</pre></details>}
    </aside>
    {!chat && <button id="chatbtn" onClick={() => setChat(true)}>💬 {({en: 'Ask the assistant', hi: 'सहायक से पूछें', mr: 'सहाय्यकाला विचारा'})[f.lg] || 'Ask the assistant'}</button>}
    {chat && <Chat lang={f.lg} cc={cc} onClose={() => setChat(false)} onApply={applyChat}/>}
    {d && open && <Boundary key={d.images_used + f.dt}><Results d={d} wx={wx} f={f} pos={pos} cd={cd} exp={exp} onClose={() => setOpen(false)}/></Boundary>}
  </>);
}
