import {useState} from 'react';
import {claimInfo, inr} from './crops';
const DOCS = ['Aadhaar and the bank passbook linked to the policy', 'Policy copy / premium receipt (application number)', 'Land record (7/12 extract, Khasra or Khatauni as per your state)', 'Sowing certificate or sowing declaration', 'Geo-tagged, dated photos of the damaged field', 'This FasalProof report (satellite and weather evidence)'];
export default function Claim({d, f}) {
  const i = claimInfo(d, f), [ck, setCk] = useState({});
  return (<>
    <h4 style={{margin: '0 0 8px'}}>1 · Is this peril covered?</h4>
    <p className="nt" style={{borderColor: i.el.ok ? '#22c55e' : '#f59e0b'}}><b>{i.el.mode}.</b> {i.el.txt}</p>
    <h4 style={{margin: '16px 0 8px'}}>2 · Intimation deadline (72 hours)</h4>
    <p className="nt" style={{borderColor: i.open ? '#22c55e' : '#ef4444'}}>
      {i.open ? `Window is OPEN until ${i.dl.toLocaleString('en-IN')}. Call 14447, inform your bank, or use the crop insurance app now.` : `The 72-hour window ended ${i.lateDays} day(s) ago (${i.dl.toLocaleString('en-IN')}). File immediately and state the reason for the delay.`}</p>
    <h4 style={{margin: '16px 0 8px'}}>3 · Crop checks</h4>
    <div className="m">
      <div><small>SEASON · FARMER PREMIUM</small><b>{i.c.season}</b><span>{i.c.prem}% of sum insured (PMFBY)</span></div>
      <div><small>GROWTH STAGE AT LOSS</small><b style={{fontSize: '1rem'}}>{i.st ? `Day ${i.st.d}` : 'n/a'}</b><span>{i.st ? i.st.label + (i.st.critical ? ' (critical yield stage)' : '') : 'Add the sowing date in the left panel'}</span></div>
      <div><small>PRE-LOSS VEGETATION (NDVI)</small><b>{i.base}</b><span>{i.base >= 0.4 ? 'Crop presence supported by satellite' : 'Low: add sowing proof, crop may be thin or late'}</span></div>
      <div><small>PLOT AREA</small><b>{i.ha.toFixed(2)} ha</b><span>{f.ar} acres</span></div>
    </div>
    <h4 style={{margin: '16px 0 8px'}}>4 · Indicative amounts</h4>
    {i.si > 0 ? <div className="m">
      <div><small>PREMIUM YOU PAY</small><b>{inr(i.prem)}</b><span>{i.c.prem}% × {inr(i.si)}/ha × {i.ha.toFixed(2)} ha</span></div>
      <div><small>ESTIMATED CLAIM</small><b>{inr(i.est)}</b><span>Range {inr(i.lo)} – {inr(i.hi)} (95% CI of satellite loss)</span></div>
    </div> : <p className="nt">Enter your notified sum insured (₹ per hectare) in the left panel.</p>}
    <p className="nt" style={{marginTop: 8}}>Estimate = sum insured × area × satellite loss %. The real payout depends on the officially assessed loss and the policy terms.</p>
    <h4 style={{margin: '16px 0 8px'}}>5 · Document checklist</h4>
    {DOCS.map(x => <label key={x} style={{display: 'flex', gap: 8, alignItems: 'center', fontSize: '.82rem', color: 'inherit', letterSpacing: 0, margin: '6px 0', fontFamily: 'inherit'}}>
      <input type="checkbox" style={{width: 16}} checked={!!ck[x]} onChange={() => setCk({...ck, [x]: !ck[x]})}/>{x}</label>)}
    <p className="nt" style={{marginTop: 12}}>Rules, cut-off dates and sum insured vary by state and season, and your crop must be notified in your district. Always confirm with 14447, your bank, or your agriculture office.</p>
  </>);
}
