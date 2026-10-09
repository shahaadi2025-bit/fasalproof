import {useState} from 'react';
const box = f => ({position: 'absolute', left: (50 - f * 50) + '%', top: (50 - f * 50) + '%', width: f * 100 + '%', height: f * 100 + '%', border: '2px solid #22d3ee', boxShadow: '0 0 0 1px rgba(0,0,0,.5)', pointerEvents: 'none'});
export default function Chips({chips}) {
  const [p, setP] = useState(50), {before: b, after: a, plot_frac: f} = chips;
  return (<>
    <h4 style={{margin: '0 0 8px'}}>🛰️ Before and after (true colour, real Sentinel-2)</h4>
    <div className="cmp" style={{height: 'auto', aspectRatio: '1 / 1', maxWidth: 420}}>
      <img src={'data:image/png;base64,' + a.png} alt={'Satellite image after the loss, ' + a.date} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', imageRendering: 'auto'}}/>
      <div style={{position: 'absolute', inset: 0, clipPath: `inset(0 ${100 - p}% 0 0)`}}><img src={'data:image/png;base64,' + b.png} alt={'Satellite image before the loss, ' + b.date} style={{width: '100%', height: '100%'}}/></div>
      <div style={box(f)}/><span className="chip a">BEFORE · {b.date}</span><span className="chip b" style={{top: 44}}>AFTER · {a.date}</span>
      <div className="cmpLine" style={{left: p + '%'}}><i>⇆</i></div>
      <input type="range" min="0" max="100" value={p} onChange={e => setP(+e.target.value)} aria-label="Slide to compare before and after"/>
    </div>
    <p className="nt" style={{marginTop: 8}}>The cyan square is your {Math.round(chips.half_m * f * 2)} m plot; the image covers {Math.round(chips.half_m * 2)} m. Clouds or haze, if present, are shown as captured. Colour stretch is indicative.</p>
  </>);
}
export function ReportImages({chips}) {
  const f = chips.plot_frac;
  return (<div className="rpimgs">{[['Before', chips.before], ['After', chips.after]].map(([n, c]) => <figure key={n}><div style={{position: 'relative'}}><img src={'data:image/png;base64,' + c.png} alt={n + ' ' + c.date}/><div style={box(f)}/></div><figcaption>{n} · {c.date}</figcaption></figure>)}</div>);
}
