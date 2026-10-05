import {useState} from 'react';
import {letter, ics, enc, toCsv, dl} from './kit';
export default function Kit({d, f, pos, I, s}) {
  const [lg, setLg] = useState(f.lg), [txt, setTxt] = useState(null), [msg, setMsg] = useState('');
  const text = txt ?? letter(lg, {f, d, pos, I, s}), flash = m => { setMsg(m); setTimeout(() => setMsg(''), 2500); };
  const reminders = () => {
    const now = Date.now(), fix = t => new Date(Math.max(t, now + 10 * 6e4)), ev = [];
    if (I.route.ind && I.dl.getTime() > now) ev.push({start: fix(I.dl.getTime() - 6 * 36e5), title: 'FasalProof: crop insurance intimation closes in 6 hours', desc: 'Call 14447, inform your bank or insurer, or use the Crop Insurance app. Deadline: ' + I.dl.toLocaleString('en-IN')});
    ev.push({start: fix(now + 24 * 36e5), title: 'Check crop insurance claim registration', desc: 'Confirm your intimation was registered and note the complaint or docket number.'}, {start: fix(now + 7 * 864e5), title: 'Follow up on crop insurance claim', desc: 'Ask your bank or insurer for the assessment status. Keep your FasalProof report and photos ready.'});
    dl('fasalproof_reminders.ics', ics(ev), 'text/calendar'); flash('Calendar file downloaded');
  };
  const copy = async (t, m) => { try { await navigator.clipboard.writeText(t); flash(m); } catch { flash('Copy blocked by the browser'); } };
  return (<>
    <h4 style={{margin: '0 0 8px'}}>✉ Intimation letter</h4>
    <select value={lg} onChange={e => { setLg(e.target.value); setTxt(null); }} style={{marginBottom: 8}}><option value="en">English</option><option value="hi">हिन्दी</option><option value="mr">मराठी</option></select>
    <textarea value={text} onChange={e => setTxt(e.target.value)} rows={13} style={{width: '100%', padding: 10, background: 'rgba(255,255,255,.06)', color: 'inherit', border: '1px solid var(--b)', borderRadius: 10, font: '400 .8rem Sora', lineHeight: 1.5}}/>
    <button className="gh" onClick={() => copy(text, 'Letter copied')}>Copy</button>
    <button className="gh" onClick={() => dl('crop_loss_letter.txt', text)}>⬇ Download .txt</button>
    <button className="gh" onClick={() => open('https://wa.me/?text=' + encodeURIComponent(text))}>WhatsApp</button>
    <p className="nt" style={{marginTop: 8}}>Edit freely before sending. Hindi and Marathi wording is a standard template: have a local person check it. Attach your signed FasalProof report.</p>
    <h4 style={{margin: '18px 0 8px'}}>🧰 Tools</h4>
    <button className="gh" onClick={reminders}>📅 Add reminders to my calendar (.ics)</button>
    <button className="gh" onClick={() => copy(`${location.origin}${location.pathname}#s=${enc({f, pos})}`, 'Link copied')}>🔗 Copy shareable link</button>
    <button className="gh" onClick={() => dl('fasalproof_timeseries.csv', toCsv(d), 'text/csv')}>⬇ Time-series data (CSV)</button>
    {msg && <p className="nt" style={{marginTop: 8, borderColor: '#22c55e'}}>✔ {msg}</p>}
    <p className="nt" style={{marginTop: 8}}>The shareable link restores your inputs and map pin; it runs a fresh analysis when opened. Reminders cover the 72-hour deadline (where it applies) and two follow-ups.</p>
  </>);
}
