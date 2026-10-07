import {useEffect, useRef, useState} from 'react';
import {parse, nextNeed, Q} from './chat';
const CROPS = ['Wheat', 'Rice', 'Soybean', 'Cotton', 'Maize', 'Gram (Chickpea)'], EVS = ['Flood', 'Hailstorm', 'Drought / dry spell', 'Pest / disease', 'Cyclone / storm'];
const iso = n => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
export default function Chat({lang, onClose, onApply}) {
  const q = Q[lang] || Q.en, [msgs, setMsgs] = useState([{r: 'bot', t: q.hi, chips: [{l: q.loc, k: 'loc'}]}]), [F, setF] = useState({}), [txt, setTxt] = useState(''), [busy, setBusy] = useState(false), end = useRef();
  useEffect(() => { end.current?.scrollIntoView({block: 'end'}); }, [msgs]);
  const say = (r, t, chips) => setMsgs(m => [...m, {r, t, chips}]);
  async function advance(G, typed) {
    if (G.place && !G.lat) {
      setBusy(true);
      try {
        const res = (await (await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(G.place)}&count=5&language=en&format=json&countryCode=IN`)).json()).results || [];
        if (!res.length) { say('bot', q.nf(G.place)); setBusy(false); return setF({...G, place: undefined}); }
        if (res.length > 1) { setBusy(false); setF(G); return say('bot', q.pick, res.map(h => ({l: [h.name, h.admin2, h.admin1].filter(Boolean).join(', '), k: 'pick', h}))); }
        G = {...G, lat: res[0].latitude, lon: res[0].longitude, vl: [res[0].name, res[0].admin2, res[0].admin1].filter(Boolean).join(', ')};
      } catch { say('bot', q.nf(G.place)); setBusy(false); return setF({...G, place: undefined}); }
      setBusy(false);
    }
    setF(G); const need = nextNeed(G);
    if (need === 'place') return say('bot', q.place, [{l: q.loc, k: 'loc'}]);
    if (need === 'cr') return say('bot', q.cr, CROPS.map(c => ({l: c, k: 'cr', v: c})));
    if (need === 'ev') return say('bot', q.ev, EVS.map(c => ({l: c, k: 'ev', v: c})));
    if (need === 'dt') return say('bot', q.dt, [{l: q.today, k: 'dt', v: iso(0)}, {l: q.yday, k: 'dt', v: iso(1)}]);
    say('bot', q.done(G, G.vl) + ' ' + q.ctx, [{l: q.run, k: 'run'}, {l: q.redo, k: 'redo'}]);
  }
  async function send(text) {
    text = text.trim(); if (!text || busy) return; say('me', text); setTxt('');
    const p = parse(text); let G = {...F, ...p}; const recognised = Object.keys(p).length > 0;
    if (!G.lat && !G.place && !recognised && nextNeed(G) === 'place') G.place = text.replace(/[.!?]+$/, '');
    if (p.place && p.place !== F.place) G = {...G, lat: undefined, lon: undefined};
    await advance(G, text);
  }
  const chip = c => {
    if (c.k === 'run') return onApply(F);
    if (c.k === 'redo') { setF({}); return setMsgs([{r: 'bot', t: q.hi, chips: [{l: q.loc, k: 'loc'}]}]); }
    say('me', c.l);
    if (c.k === 'loc') return navigator.geolocation.getCurrentPosition(p => advance({...F, lat: p.coords.latitude, lon: p.coords.longitude, vl: 'My location'}), () => say('bot', q.place));
    if (c.k === 'pick') return advance({...F, lat: c.h.latitude, lon: c.h.longitude, vl: c.l});
    advance({...F, [c.k]: c.v});
  };
  return (
    <div className="pn" id="chat" role="dialog" aria-label={q.title}>
      <div className="ch"><b>💬 {q.title}</b><button className="x" onClick={onClose} aria-label="Close assistant">✕</button></div>
      <div className="cm">{msgs.map((m, i) => <div key={i} className={'bub ' + m.r}><p>{m.t}</p>{m.chips && i === msgs.length - 1 && <div>{m.chips.map((c, j) => <button key={j} className="gh" onClick={() => chip(c)}>{c.l}</button>)}</div>}</div>)}{busy && <div className="bub bot"><p>…</p></div>}<div ref={end}/></div>
      <div className="ci"><input value={txt} placeholder={q.ph} onChange={e => setTxt(e.target.value)} onKeyDown={e => e.key === 'Enter' && send(txt)}/><button className="gh" style={{margin: 0}} onClick={() => send(txt)}>{q.send}</button></div>
    </div>
  );
}
