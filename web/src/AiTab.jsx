import {useState} from 'react';
import {classifyPhoto, explain} from './ai';
import {photoVerdict} from './aiLogic';
const h4 = {margin: '0 0 8px'};
export default function AiTab({f, facts}) {
  const [img, setImg] = useState(null), [rk, setRk] = useState(null), [pv, setPv] = useState(null), [busy, setBusy] = useState(''), [ex, setEx] = useState(''), [err, setErr] = useState('');
  const onFile = e => { const x = e.target.files[0]; if (x) { setImg(URL.createObjectURL(x)); setRk(null); setPv(null); } };
  const photo = async () => { setErr(''); setBusy('Loading vision model…'); try { const r = await classifyPhoto(img, p => setBusy(`Downloading model ${p}%`)); setRk(r); setPv(photoVerdict(f.ev, r)); } catch (e) { setErr('Photo check failed: ' + e.message); } setBusy(''); };
  const run = async () => { setErr(''); setEx(''); setBusy('Loading language model…'); try { setEx(await explain(facts, p => setBusy(`Downloading model ${p}%`))); } catch (e) { setErr('Explanation failed: ' + e.message + '. This needs a recent browser; WebGPU makes it faster.'); } setBusy(''); };
  return (<>
    <p className="nt">These models run entirely on this device: your photos and report never leave it. Each model downloads once (about 40–400 MB) and is then cached.</p>
    {busy && <p className="nt" style={{borderColor: '#f59e0b', marginTop: 8}}>⏳ {busy}</p>}{err && <p className="nt" style={{borderColor: '#ef4444', marginTop: 8}}>{err}</p>}
    <h4 style={{...h4, marginTop: 16}}>📷 Damage photo check (CLIP, zero-shot)</h4>
    <input type="file" accept="image/*" onChange={onFile}/>
    {img && <><img src={img} alt="field" style={{width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 10, marginTop: 8}}/><button className="gh" onClick={photo} disabled={!!busy}>Analyse photo</button></>}
    {pv && <p className="nt" style={{marginTop: 8, borderColor: pv.ok ? '#22c55e' : pv.ok === false ? '#ef4444' : '#f59e0b'}}>{pv.why}</p>}
    {rk && <table style={{marginTop: 8}}><tbody>{rk.slice(0, 4).map(r => <tr key={r.key}><td>{r.label}</td><td>{(r.score * 100).toFixed(1)}%</td></tr>)}</tbody></table>}
    <p className="nt" style={{marginTop: 8}}>A general-purpose model with no farm training. Treat it as a screening aid, never as proof of damage.</p>
    <h4 style={{...h4, marginTop: 18}}>💬 Plain-language explanation (Qwen2.5-0.5B)</h4>
    <button className="gh" onClick={run} disabled={!!busy}>Explain my report</button>
    {ex && <p className="nt" style={{marginTop: 8}}>{ex}</p>}
    <p className="nt" style={{marginTop: 8}}>A very small model: it is told to use only your report's numbers, but check its wording against the figures on the Overview tab. English works best.</p>
  </>);
}
