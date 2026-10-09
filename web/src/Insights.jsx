import {useState} from 'react';
import {sar as sarApi} from './api';
import {BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend} from 'recharts';
import {mannKendall, pettitt, ewma, ndviDaysLost, monteCarlo, fuse, hants, conformal} from './analytics';
import {claimInfo, inr} from './crops';
const tip = {contentStyle: {background: '#0b1222', border: '1px solid #334155', fontSize: 12}};
const h4 = {margin: '16px 0 8px'};
export default function Insights({d, f, wx, cd, pos}) {
  const [sr, setSr] = useState(null), [sl, setSl] = useState(false), [se, setSe] = useState('');
  const runSar = async () => { setSl(true); setSe(''); try { setSr(await sarApi({lat: pos.lat, lon: pos.lon, loss_date: f.dt, half_size_m: +f.hs})); } catch (e) { setSe(e.message); } setSl(false); };
  const I = claimInfo(d, f), s = d.stats, ys = d.series.map(p => p.ndvi);
  const pre = d.series.filter(p => p.date < f.dt).map(p => p.ndvi), post = d.series.filter(p => p.date >= f.dt).map(p => p.ndvi);
  const mk1 = mannKendall(pre), mk2 = mannKendall(post), pt = pettitt(ys), lost = d.forecast ? ndviDaysLost(d.series, d.forecast, f.dt) : null;
  const sm = ewma(ys), t0 = new Date(d.series[0].date), hf = hants(d.series.map(p => (new Date(p.date) - t0) / 864e5), ys, 2, d.series.map(p => p.date < f.dt)), cf = conformal(d.series, f.dt);
  const rows = d.series.map((p, i) => ({date: p.date.slice(5), Observed: p.ndvi, 'EWMA smoothed': +sm[i].toFixed(3), 'HANTS-style fit': hf ? +hf[i].toFixed(3) : undefined}));
  const mc = I.si ? monteCarlo(d.loss_pct, s?.ci || [d.loss_pct, d.loss_pct], I.si * I.ha) : null;
  const late = (Date.now() - new Date(f.dt)) / 864e5, wok = wx?.pts === 30 ? true : wx?.pts === 8 ? false : null;
  const fu = fuse({conf: s?.confidence ?? .5, wok, off: s?.offset, base: d.baseline_ndvi, late: late * 72 / (I.hrs || 72), loss: d.loss_pct, post: I.st?.post, bad: I.st?.bad});
  const col = fu.p >= .75 ? '#22c55e' : fu.p >= .5 ? '#f59e0b' : '#ef4444', ok = cd && !cd.error;
  return (<>
    <h4 style={{margin: 0}}>Bayesian evidence fusion</h4>
    <div className="sc" style={{marginTop: 8}}><div style={{font: '700 2.2rem JetBrains Mono', color: col}}>{(fu.p * 100).toFixed(0)}%</div>
      <p>Posterior probability that the claim is consistent with a genuine loss, combining six evidence streams. Likelihood ratios are heuristic assumptions, not trained on claim data.</p></div>
    <table><tbody>{fu.f.map(x => <tr key={x.n}><td>{x.n}</td><td>×{x.lr} · {x.w}</td></tr>)}</tbody></table>
    <h4 style={h4}>Non-parametric time-series tests</h4>
    <table><tbody>
      <tr><td>Mann–Kendall (pre-loss)</td><td>{mk1 ? `${mk1.trend} (z=${mk1.z.toFixed(2)}, p=${mk1.p.toFixed(3)})` : 'need ≥4 scenes'}</td></tr>
      <tr><td>Mann–Kendall (post-loss)</td><td>{mk2 ? `${mk2.trend} (z=${mk2.z.toFixed(2)}, p=${mk2.p.toFixed(3)})` : 'need ≥4 scenes'}</td></tr>
      <tr><td>Pettitt change-point</td><td>{pt ? `break at ${d.series[pt.k].date} (p=${pt.p.toFixed(4)})` : 'need ≥6 scenes'}</td></tr>
      <tr><td>Conformal band (90%)</td><td>{cf ? `${cf.out} of ${cf.n} post-loss scenes fall below the band (±${cf.q.toFixed(3)} NDVI, ${cf.nCal} calibration scenes)` : 'need ≥5 pre-loss scenes'}</td></tr>
      <tr><td>Cumulative NDVI-days lost</td><td>{lost == null ? 'needs new backend' : lost.toFixed(2) + ' (area between expected and observed)'}</td></tr>
    </tbody></table>
    <div style={{height: 190, marginTop: 10}}><ResponsiveContainer><LineChart data={rows}><XAxis dataKey="date" stroke="#8ea0bd" fontSize={11}/><YAxis stroke="#8ea0bd" fontSize={11}/><Tooltip {...tip}/><Legend/>
      <Line dataKey="Observed" stroke="#f8fafc" strokeWidth={2}/><Line dataKey="EWMA smoothed" stroke="#f472b6" strokeWidth={2} dot={false}/><Line dataKey="HANTS-style fit" stroke="#22d3ee" strokeWidth={2} strokeDasharray="5 3" dot={false}/></LineChart></ResponsiveContainer></div>
    <h4 style={h4}>Monte Carlo claim simulation (4,000 draws)</h4>
    {mc ? <><div className="m"><div><small>P10 (CONSERVATIVE)</small><b>{inr(mc.p10)}</b></div><div><small>P50 (MEDIAN)</small><b>{inr(mc.p50)}</b></div><div><small>P90 (OPTIMISTIC)</small><b>{inr(mc.p90)}</b></div><div><small>PREMIUM PAID</small><b>{inr(I.prem)}</b></div></div>
      <div style={{height: 150, marginTop: 10}}><ResponsiveContainer><BarChart data={mc.hist}><XAxis dataKey="x" stroke="#8ea0bd" fontSize={10}/><YAxis hide/><Tooltip {...tip}/><Bar dataKey="c" fill="#22d3ee" name="draws"/></BarChart></ResponsiveContainer></div></>
      : <p className="nt">Enter a sum insured to simulate payouts.</p>}
    <h4 style={h4}>Difference-in-differences vs. nearby control field</h4>
    {ok ? <p className="nt">Your plot: {d.loss_pct}% loss. Control plot (~1.3 km north): {cd.loss_pct}%. Net effect attributable to the local event: <b>{(d.loss_pct - cd.loss_pct).toFixed(1)} percentage points</b>. This assumes the control plot was not itself damaged.</p>
      : <p className="nt">{cd?.error ? 'Control analysis failed: ' + cd.error : 'Turn on “Compare with a nearby control field” under Advanced parameters, then re-run.'}</p>}
      <h4 style={h4}>Radar flood check (Sentinel-1, sees through clouds)</h4>
    <button className="gh" onClick={runSar} disabled={sl}>{sl ? 'Querying radar…' : '📡 Run radar check'}</button>
    {se && <p className="nt" style={{borderColor: '#ef4444', marginTop: 8}}>{se}</p>}
    {sr && <><div className="m" style={{marginTop: 8}}><div><small>NEW FLOOD (RADAR)</small><b>{sr.new_flood_pct}%</b><span>dark and 3 dB darker than before</span></div><div><small>OPEN WATER AFTER</small><b>{sr.water_post_pct}%</b><span>VV below −15 dB</span></div></div>
      <p className="nt" style={{marginTop: 8}}>Scenes {sr.pre_date} → {sr.post_date} (orbit {sr.orbit}), mean change {sr.mean_change_db} dB. Optical water change: {d.water_pct}%. {Math.abs(sr.new_flood_pct - d.water_pct) <= 15 ? 'Radar and optical agree.' : 'Radar and optical disagree: radar is more reliable under cloud.'} Thresholds are standard literature values, not calibrated for your plot.</p></>}
    <p className="nt" style={{marginTop: 8}}>{sr ? '' : 'Compares one radar scene before and after the loss from the same orbit. Works through monsoon cloud, which optical imagery cannot.'}</p>
  </>);
}
