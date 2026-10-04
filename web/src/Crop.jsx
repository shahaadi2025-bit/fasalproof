import {CROPS, CLS, total, meta, stage, phenology} from './crops';
const COL = ['#38bdf8', '#22c55e', '#f59e0b', '#a78bfa'], NM = ['Initial', 'Development', 'Mid-season', 'Late'];
export default function Crop({d, f}) {
  const m = meta(f), c = m.c, T = total(c), st = stage(f.cr, f.sow, f.dt), ph = phenology(d, f);
  const day = x => Math.round((new Date(x) - new Date(f.sow)) / 864e5), W = 600; let acc = 0;
  const mk = [['Loss', day(f.dt), '#f472b6'], ...(f.hv ? [['Harvest', day(f.hv), '#e2e8f0']] : [])].filter(x => f.sow && x[1] >= 0 && x[1] <= T * 1.15);
  const scenes = f.sow ? d.series.map(p => day(p.date)).filter(x => x >= 0 && x <= T * 1.15) : [];
  const late = st && st.idx === 3, interp = ph?.r == null ? '' : ph.r >= .6 ? 'The NDVI trajectory follows the crop\'s expected canopy progression.' : ph.r >= .3 ? 'Only a weak match with the expected canopy progression. Check crop type and sowing date.' : 'The NDVI trajectory does NOT follow this crop\'s expected canopy progression. Check the crop, sowing date, or plot location.';
  return (<>
    <h4 style={{margin: '0 0 8px'}}>Crop profile · {f.cr}</h4>
    <table><tbody>
      <tr><td>PMFBY class</td><td>{CLS[c.cls]} · {m.season} · farmer premium {m.premTxt}</td></tr>
      <tr><td>Stage lengths (days)</td><td>{c.st.join(' / ')} = {T} d total (initial / development / mid / late)</td></tr>
      <tr><td>FAO Kc (ini / mid / end)</td><td>{c.kc ? c.kc.join(' / ') : 'not used for paddy (standing water dominates)'}</td></tr>
      <tr><td>Data source</td><td>{c.reg}{c.proxy ? ' (proxy: use local data)' : ''}</td></tr>
    </tbody></table>
    <h4 style={{margin: '16px 0 8px'}}>Growth-stage timeline</h4>
    {f.sow ? <>
      <svg viewBox={`0 0 ${W} 76`} width="100%"><g>{c.st.map((s, i) => { const x = acc / T * W, w = s / T * W; acc += s; return <g key={i}><rect x={x} y="20" width={w} height="22" fill={COL[i]} opacity=".85"/><text x={x + 4} y="35" fontSize="10" fill="#04101c">{NM[i]}</text></g>; })}
        {scenes.map((x, i) => <line key={i} x1={Math.min(W, x / T * W)} x2={Math.min(W, x / T * W)} y1="46" y2="56" stroke="#8ea0bd"/>)}
        {mk.map(([n, x, col]) => <g key={n}><line x1={Math.min(W - 1, x / T * W)} x2={Math.min(W - 1, x / T * W)} y1="8" y2="60" stroke={col} strokeWidth="2"/><text x={Math.min(W - 40, x / T * W + 3)} y="12" fontSize="10" fill={col}>{n} (d{x})</text></g>)}
        <text x="0" y="72" fontSize="9" fill="#8ea0bd">day 0 = sowing · grey ticks = satellite scenes</text><text x={W} y="72" fontSize="9" fill="#8ea0bd" textAnchor="end">{T} d</text></g></svg>
      <p className="nt">{st ? `At the loss date: day ${st.d}, ${st.label}${st.critical ? '. This is the yield-forming stage, where damage usually costs the most yield.' : '.'}` : ''}</p>
    </> : <p className="nt">Enter the sowing date in the left panel to see the crop timeline and stage-aware checks.</p>}
    <h4 style={{margin: '16px 0 8px'}}>Senescence guard</h4>
    <p className="nt" style={{borderColor: late ? '#f59e0b' : '#22c55e'}}>{!st ? 'Needs a sowing date.' : late || st.post ? 'The loss date falls in the late/maturity phase, when NDVI falls naturally as the crop ripens. Part of the measured vegetation loss may be normal senescence, so judge the damage against the phenology-adjusted figure below.' : 'The loss date is before the maturity phase, so a sharp NDVI drop is not explained by normal ripening.'}</p>
    <h4 style={{margin: '16px 0 8px'}}>Phenology consistency (experimental)</h4>
    {ph ? <div className="m">
      <div><small>NDVI vs FAO Kc CURVE (Pearson r)</small><b>{ph.r == null ? 'n/a' : ph.r.toFixed(2)}</b><span>{ph.n} scenes inside the season</span></div>
      <div><small>PHENOLOGY-ADJUSTED LOSS</small><b>{ph.adj == null ? 'n/a' : ph.adj.toFixed(1) + '%'}</b><span>{ph.adj == null ? 'needs scenes before and after the loss' : `observed ratio ${ph.obs.toFixed(2)} vs expected ${ph.exp.toFixed(2)}`}</span></div>
    </div> : <p className="nt">{c.kc ? 'Needs a sowing date.' : 'Not applicable to paddy rice.'}</p>}
    {ph && <p className="nt" style={{marginTop: 8}}>{interp} The adjusted loss divides the observed post/pre NDVI ratio by the ratio the FAO canopy curve predicts for the same dates. Kc is a proxy for canopy development, not a measured NDVI profile, so treat this as supporting evidence.</p>}
    <p className="nt" style={{marginTop: 14}}>Stage lengths are regional averages from FAO-56 Table 11 and vary with variety, sowing date and climate. Use local agriculture-department data where you have it.</p>
  </>);
}
