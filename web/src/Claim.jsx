import {useState} from 'react';
import {claimInfo, inr} from './crops';
const DOCS = ['Aadhaar and the bank passbook linked to the policy', 'Policy copy / premium receipt (application number)', 'Land record (7/12 extract, Khasra or Khatauni as per your state)', 'Sowing certificate or sowing declaration', 'Geo-tagged, dated photos of the damaged field', 'This FasalProof report (satellite and weather evidence)'];
const h4 = {margin: '16px 0 8px'};
export default function Claim({d, f}) {
  const i = claimInfo(d, f), r = i.route, [ck, setCk] = useState({});
  return (<>
    <h4 style={{margin: '0 0 8px'}}>1 · Which PMFBY claim route applies?</h4>
    <p className="nt" style={{borderColor: r.ok ? '#22c55e' : '#f59e0b'}}><b>{r.title}.</b> {r.txt}</p>
    <h4 style={h4}>2 · Intimation deadline</h4>
    {r.ind ? <p className="nt" style={{borderColor: i.open ? '#22c55e' : '#ef4444'}}>{i.open ? `72-hour window is OPEN until ${i.dl.toLocaleString('en-IN')}. Call 14447, inform your bank or insurer, or use the Crop Insurance app / pmfby.gov.in.` : `The 72-hour window ended ${i.lateDays} day(s) ago (${i.dl.toLocaleString('en-IN')}). File immediately and state the reason for the delay.`}</p>
      : <p className="nt">Area-yield claims are settled from crop-cutting experiments at insurance-unit level, so there is no individual 72-hour intimation. Still tell your bank or agriculture office about the damage and keep evidence.</p>}
    <h4 style={h4}>3 · Crop checks</h4>
    <div className="m">
      <div><small>SEASON · CLASS</small><b>{i.c.season}</b><span>{i.c.premTxt}</span></div>
      <div><small>GROWTH STAGE AT LOSS</small><b style={{fontSize: '1rem'}}>{i.st ? `Day ${i.st.d}` : 'n/a'}</b><span>{i.st ? i.st.label + (i.st.critical ? ' (yield-forming)' : '') : 'Add the sowing date in the left panel'}</span></div>
      <div><small>PRE-LOSS VEGETATION (NDVI)</small><b>{i.base}</b><span>{i.base >= 0.4 ? 'Dense canopy present' : 'Low (rule of thumb: sparse canopy). Add sowing proof'}</span></div>
      <div><small>PLOT AREA</small><b>{i.ha.toFixed(2)} ha</b><span>{f.ar} acres</span></div>
    </div>
    <h4 style={h4}>4 · Indicative amounts</h4>
    {i.si > 0 ? <div className="m">
      <div><small>PREMIUM YOU PAY</small><b>{inr(i.prem)}</b><span>{i.c.prem}% × {inr(i.si)}/ha × {i.ha.toFixed(2)} ha</span></div>
      <div><small>ESTIMATED CLAIM</small><b>{inr(i.est)}</b><span>Range {inr(i.lo)} – {inr(i.hi)} (95% CI of satellite loss)</span></div>
    </div> : <p className="nt">Enter your notified sum insured (₹ per hectare) in the left panel. It is set per crop and district by your state (Scale of Finance), so use your policy value.</p>}
    <p className="nt" style={{marginTop: 8}}>Estimate = sum insured × area × satellite loss %. Real payouts follow the assessed loss and policy terms: for area-yield claims, the unit's shortfall in yield against threshold yield.</p>
    <h4 style={h4}>5 · Document checklist</h4>
    {DOCS.map(x => <label key={x} style={{display: 'flex', gap: 8, alignItems: 'center', fontSize: '.82rem', color: 'inherit', letterSpacing: 0, margin: '6px 0', fontFamily: 'inherit'}}>
      <input type="checkbox" style={{width: 16}} checked={!!ck[x]} onChange={() => setCk({...ck, [x]: !ck[x]})}/>{x}</label>)}
    <p className="nt" style={{marginTop: 12}}>Rules follow the national PMFBY operational guidelines. Notified crops, cut-off dates and sum insured vary by state and season. Confirm on pmfby.gov.in, with 14447, your bank, or your agriculture office.</p>
  </>);
}
