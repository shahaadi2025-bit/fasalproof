import {useState} from 'react';
import {ComposedChart, Area, Line, XAxis, YAxis, Tooltip, Legend, ReferenceLine, ResponsiveContainer, BarChart, Bar} from 'recharts';
import {heatUrl} from './MapView';
import Claim from './Claim';
import Insights from './Insights';
import Crop from './Crop';
import {claimInfo, inr} from './crops';
const T = {
  en: {t: 'Crop Loss Evidence Report', r: ['Farmer', 'Location', 'Crop', 'Area', 'Calamity', 'Date of loss', 'GPS', 'Vegetation loss (95% CI)', 'Claim strength', 'Source'], w: 'PMFBY: report localised calamities within 72 hours via 14447, your bank or the crop insurance app. This report is supporting evidence, not an official assessment.'},
  hi: {t: 'फसल नुकसान साक्ष्य रिपोर्ट', r: ['किसान', 'स्थान', 'फसल', 'क्षेत्र', 'आपदा', 'नुकसान की तारीख', 'GPS', 'फसल नुकसान (95% CI)', 'दावे की मज़बूती', 'स्रोत'], w: 'PMFBY: स्थानीय आपदा की सूचना 72 घंटे में 14447, बैंक या फसल बीमा ऐप पर दें। यह सहायक साक्ष्य है, आधिकारिक आकलन नहीं।'},
  mr: {t: 'पीक नुकसान पुरावा अहवाल', r: ['शेतकरी', 'ठिकाण', 'पीक', 'क्षेत्र', 'आपत्ती', 'नुकसानाची तारीख', 'GPS', 'पीक नुकसान (95% CI)', 'दाव्याची ताकद', 'स्रोत'], w: 'PMFBY: स्थानिक आपत्तीची माहिती 72 तासांत 14447, बँक किंवा पीक विमा ॲपवर द्या. हा अहवाल पूरक पुरावा आहे, अधिकृत मूल्यांकन नाही.'}
};
const tip = {contentStyle: {background: '#0b1222', border: '1px solid #334155', fontSize: 12}};
export default function Results({d, wx, f, pos, cd}) {
  const [t, setT] = useState('ov'), old = !d.stats, z = d.zones || null, L = T[f.lg] || T.en;
  const s = d.stats || {ci: [d.loss_pct, d.loss_pct], z: 'n/a', confidence: 0.5, exp_post: 'n/a', break_date: null, offset: null};
  const fc = d.forecast || [];
  const late = (Date.now() - new Date(f.dt)) / 864e5, ac = +f.ar;
  const SC = Math.round(Math.min(35, d.loss_pct * .6) + 15 * s.confidence + (wx?.pts ?? 15) + (late <= 3 ? 20 : late <= 14 ? 12 : 5));
  const col = SC >= 70 ? '#22c55e' : SC >= 45 ? '#f59e0b' : '#ef4444', tier = SC >= 70 ? 'STRONG' : SC >= 45 ? 'MODERATE' : 'WEAK';
  const off = s.break_date ? `A vegetation break was detected on ${s.break_date}, ${Math.abs(s.offset)} day(s) ${s.offset >= 0 ? 'after' : 'before'} the claimed date. ` : '';
  const M = [['VEGETATION LOSS', d.loss_pct + '%', `95% CI ${s.ci[0]}–${s.ci[1]}%`], ['OBSERVED / EXPECTED', d.post_ndvi + ' / ' + s.exp_post, 'NDVI, Theil–Sen forecast'], ['ANOMALY z-SCORE', s.z, 'σ below expected'],
    ['BREAK DETECTED', s.break_date || 'n/a', s.break_date ? (s.offset >= 0 ? '+' : '') + s.offset + ' d vs claimed date' : 'needs ≥6 scenes'], ['FLOOD WATER Δ', d.water_pct + '%', 'NDWI-based'], ['SEVERE ZONES', z ? z.pct.severe + '%' : 'n/a', z ? 'k-means · ' + z.pixels + ' px' : 'too few clear pixels']];
  const rows = d.series.map((p, i) => ({date: p.date.slice(5), ndvi: p.ndvi, ndwi: p.ndwi, exp: fc[i]?.exp, band: fc[i] ? [fc[i].lo, fc[i].hi] : undefined}));
  const lx = d.series.find(p => p.date >= f.dt)?.date.slice(5);
  const v = [f.nm, f.vl, f.cr, ac + ' acres', f.ev, f.dt, pos.lat.toFixed(5) + ', ' + pos.lon.toFixed(5), `${d.loss_pct}% (${s.ci[0]}–${s.ci[1]}%) → ~${(ac * d.loss_pct / 100).toFixed(1)} acres`, SC + '/100 ' + tier, d.source + ' · ' + d.images_used + ' scenes'];
  const last = `FasalProof | ${v[0]}, ${v[1]} | ${v[2]} ${v[3]} | ${v[4]} on ${f.dt} | loss ${d.loss_pct}% (CI ${s.ci[0]}-${s.ci[1]}) | claim strength ${SC}/100 ${tier} | GPS ${v[6]}`;
  const I = claimInfo(d, f);
  const ex = [['Season / PMFBY premium', `${I.c.season} · ${I.c.premTxt}`], ['Growth stage at loss', I.st ? `${I.st.label} (day ${I.st.d})` : 'sowing date not given'], ['Intimation deadline (72 h)', I.dl.toLocaleString('en-IN')], ['Est. claim (indicative)', I.si ? `${inr(I.lo)} – ${inr(I.hi)} (point ${inr(I.est)})` : 'sum insured not given']];
  const tabs = [['ov', 'Overview'], ['sg', 'Signal'], ['dm', 'Damage map'], ['wx', 'Weather'], ['cr', 'Crop science'], ['cl', 'Claim'], ['ad', 'Advanced'], ['rp', 'Report']];
  const speak = () => { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(last.replace(/\|/g, '.')); u.lang = {en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN'}[f.lg]; speechSynthesis.speak(u); };
  return (
    <section className="pn on" id="hud">
      <div className="tb">{tabs.map(([k, n]) => <button key={k} className={t === k ? 'a' : ''} onClick={() => setT(k)}>{n}</button>)}</div>
      <div className={'pg' + (t === 'ov' ? ' a' : '')}>
        {old && <p className="nt" style={{color: '#f59e0b', marginBottom: 12}}>⚠ Your server is running an OLD backend version, so ML statistics are missing. On render.com open your service, click Manual Deploy, then "Clear build cache &amp; deploy".</p>}
        <div className="sc">
          <svg width="116" height="116" viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="9"/>
            <circle cx="50" cy="50" r="42" fill="none" stroke={col} strokeWidth="9" strokeLinecap="round" strokeDasharray="264" strokeDashoffset={264 * (1 - SC / 100)} transform="rotate(-90 50 50)"/>
            <text x="50" y="52" textAnchor="middle" fill="#fff" fontSize="24" fontWeight="700">{SC}</text><text x="50" y="66" textAnchor="middle" fill={col} fontSize="8">{tier}</text></svg>
          <p>{d.loss_pct}% vegetation loss (95% CI {s.ci[0]}–{s.ci[1]}%) after the {f.ev.toLowerCase()}. NDVI is {s.z} σ from the expected healthy value ({(s.confidence * 100).toFixed(1)}% confidence it is not natural variation). {off}{wx?.msg}</p>
        </div>
        <div className="m">{M.map(x => <div key={x[0]}><small>{x[0]}</small><b>{x[1]}</b><span>{x[2]}</span></div>)}</div>
      </div>
      <div className={'pg' + (t === 'sg' ? ' a' : '')}>
        <ResponsiveContainer width="100%" height={260}><ComposedChart data={rows}>
          <XAxis dataKey="date" stroke="#8ea0bd" fontSize={11}/><YAxis stroke="#8ea0bd" fontSize={11} domain={['auto', 'auto']}/><Tooltip {...tip}/><Legend/>
          <Area dataKey="band" stroke="none" fill="#22d3ee" fillOpacity={.15} name="95% expected band"/>
          <Line dataKey="exp" stroke="#22d3ee" strokeDasharray="6 4" dot={false} name="Expected (healthy)"/>
          <Line dataKey="ndvi" stroke="#f8fafc" strokeWidth={3} name="Observed NDVI"/><Line dataKey="ndwi" stroke="#818cf8" dot={false} name="NDWI (water)"/>
          {lx && <ReferenceLine x={lx} stroke="#f472b6" strokeDasharray="4 4"/>}</ComposedChart></ResponsiveContainer>
        <p className="nt">Solid white = satellite NDVI. Dashed band = what a healthy field was expected to show (robust regression on pre-loss scenes). Pink line = claimed loss date.</p>
      </div>
      <div className={'pg' + (t === 'dm' ? ' a' : '')}>
        {z ? <><img id="hm" className="pix" src={heatUrl(z.grid)} alt="damage zones"/>
          <div className="lg"><span><i style={{background: '#ef4444'}}/>Severe</span><span><i style={{background: '#f59e0b'}}/>Moderate</span><span><i style={{background: '#22c55e'}}/>Stable</span><span><i style={{background: '#334155'}}/>Cloud/no data</span></div>
          <p className="nt">Pixel-level change map clustered by k-means: {z.pct.severe}% severe, {z.pct.moderate}% moderate, {z.pct.stable}% stable. Centres (ΔNDVI): {z.centers.join(', ')}. Also overlaid on your field.</p></>
          : <p className="nt">Not enough cloud-free pixels in both scenes to build a damage map for this plot and date.</p>}
      </div>
      <div className={'pg' + (t === 'wx' ? ' a' : '')}>
        {wx?.days.length > 0 && <ResponsiveContainer width="100%" height={200}><BarChart data={wx.days}><XAxis dataKey="t" stroke="#8ea0bd" fontSize={10} interval={3}/><YAxis stroke="#8ea0bd" fontSize={11}/><Tooltip {...tip}/><Bar dataKey="p" fill="#22d3ee" name="Rain (mm)"/></BarChart></ResponsiveContainer>}
        <p className="nt">{wx?.msg} (Source: Open-Meteo reanalysis, free.)</p>
      </div>
      <div className={'pg' + (t === 'cr' ? ' a' : '')}><Crop d={d} f={f}/></div>
      <div className={'pg' + (t === 'cl' ? ' a' : '')}><Claim d={d} f={f}/></div>
      <div className={'pg' + (t === 'ad' ? ' a' : '')}><Insights d={d} f={f} wx={wx} cd={cd}/></div>
      <div className={'pg' + (t === 'rp' ? ' a' : '')} id="rp">
        <h3 style={{marginTop: 0}}>{L.t}</h3><table><tbody>{L.r.map((k, i) => <tr key={k}><td>{k}</td><td>{v[i]}</td></tr>)}{ex.map(([k, x]) => <tr key={k}><td>{k}</td><td>{x}</td></tr>)}</tbody></table>
        <p className="nt">{L.w}</p>
        <button className="gh" onClick={() => { setT('rp'); setTimeout(print, 150); }}>⬇ Print / PDF</button>
        <button className="gh" onClick={() => open('https://wa.me/?text=' + encodeURIComponent(last))}>WhatsApp</button>
        <button className="gh" onClick={speak}>🔊 Read aloud</button>
      </div>
    </section>
  );
}
