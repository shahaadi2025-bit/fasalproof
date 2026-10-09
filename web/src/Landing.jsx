import {useEffect, useRef, useState} from 'react';
import {BUILD} from './version';
import {health} from './api';
const WORDS = ['flood', 'hailstorm', 'drought', 'cloudburst', 'pest attack'];
const CROPS = ['Wheat', 'Rice', 'Soybean', 'Cotton', 'Maize', 'Gram', 'Groundnut', 'Sunflower', 'Potato', 'Onion', 'Tomato', 'Bajra', 'Moong', 'Lentil', 'Sesame', 'Castor'];
const STEPS = [['Tell us what happened', 'Type it in English, हिन्दी or मराठी, or tap your field on the satellite map.', '💬'], ['Satellite compares before and after', 'Free Sentinel-2 images, cloud-masked pixel by pixel, show how the crop canopy changed.', '🛰️'], ['Weather and crop checks', 'Rainfall is ranked against 10 years of history and read against the crop\'s growth stage.', '🌦️'], ['Get your claim kit', 'The right PMFBY route and deadline, a ready letter, reminders and a signed report.', '📦']];
const FEATS = [['🛰️', 'Loss estimate with a range', 'Vegetation loss with a 95% bootstrap interval, not a single guess.'], ['🗺️', 'Damage-zone map', 'Pixel change clustered into severe, moderate and stable zones, drawn on your field.'], ['🌧️', 'Weather corroboration', 'Rain around the loss date ranked against the same window in the previous 10 years.'], ['🌾', '20 crops, crop-aware', 'FAO growth stages, season and premium class for cereals, pulses, oilseeds, cotton and vegetables.'], ['📜', 'PMFBY claim route', 'Localised, area-yield, post-harvest or mid-season: which applies, and the 72-hour deadline.'], ['✉️', 'Claim kit', 'Intimation letter in three languages, calendar reminders, shareable link and data export.'], ['🔏', 'Tamper-evident report', 'Download a signed report that anyone can verify has not been edited.'], ['🌍', 'Worldwide', 'Search any place on land from 56°S to 84°N. Rain is judged against that location\'s own 10-year history, with your currency, units and policy terms.'], ['📶', 'Installable, offline-ready', 'Works on a phone like an app and queues a request when the network drops.']];
const FAQ = [['Is it free?', 'Yes. It uses open satellite and weather data and free hosting, so there is no cost per analysis.'], ['Does it replace the official assessment?', 'No. It is supporting evidence. The insurer\'s own assessment (crop-cutting for area claims, plot inspection for localised ones) stays official.'], ['What if it is cloudy?', 'Each pixel is cloud-masked and the tool can widen its date window. A radar check (Sentinel-1) exists as an experimental feature.'], ['Does it work outside India?', 'Yes for the satellite, weather and report parts. Insurance rules: PMFBY rules apply only in India. Elsewhere you enter your own policy\'s premium and notice period, and FasalProof provides evidence only.'], ['Which languages?', 'English, हिन्दी, मराठी, Español, Français and Português for the assistant, the report and the claim letter. Crop names stay in English in the Spanish, French and Portuguese letters, and a local speaker should check the wording before you send it.'], ['How accurate is it?', 'We publish no accuracy figure until it has been measured on documented events. Every result shows its uncertainty: confidence interval and scene count.']];

function Stars() {
  const r = useRef();
  useEffect(() => {
    const c = r.current, x = c.getContext('2d'), reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; let w, h, P = [], raf;
    const rs = () => { w = c.width = c.offsetWidth; h = c.height = c.offsetHeight; P = Array.from({length: Math.min(80, Math.floor(w / 16))}, () => ({x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25})); };
    rs(); addEventListener('resize', rs);
    const loop = () => { x.clearRect(0, 0, w, h); P.forEach((p, i) => { if (!reduce) { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > w) p.vx *= -1; if (p.y < 0 || p.y > h) p.vy *= -1; }
      x.fillStyle = 'rgba(34,211,238,.7)'; x.beginPath(); x.arc(p.x, p.y, 1.3, 0, 7); x.fill();
      for (let j = i + 1; j < P.length; j++) { const q = P[j], d = Math.hypot(p.x - q.x, p.y - q.y); if (d < 110) { x.strokeStyle = `rgba(129,140,248,${.2 * (1 - d / 110)})`; x.beginPath(); x.moveTo(p.x, p.y); x.lineTo(q.x, q.y); x.stroke(); } } }); raf = requestAnimationFrame(loop); };
    loop(); return () => { cancelAnimationFrame(raf); removeEventListener('resize', rs); };
  }, []);
  return <canvas ref={r} className="stars" aria-hidden="true"/>;
}
function Rot() { const [i, setI] = useState(0); useEffect(() => { const t = setInterval(() => setI(x => (x + 1) % WORDS.length), 2200); return () => clearInterval(t); }, []); return <span className="rot" key={i}>{WORDS[i]}</span>; }
function Count({to, suf = '', pre = ''}) {
  const [v, setV] = useState(0), r = useRef();
  useEffect(() => { const io = new IntersectionObserver(([e]) => { if (!e.isIntersecting) return; io.disconnect(); let s = null; const f = t => { s = s || t; const p = Math.min(1, (t - s) / 1400); setV(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); }, {threshold: .4}); io.observe(r.current); return () => io.disconnect(); }, [to]);
  return <b ref={r}>{pre}{Math.round(v)}{suf}</b>;
}
function Field({flood}) {
  const cells = []; for (let i = 0; i < 24; i++) { const x = (i % 6) * 66 + 4, y = Math.floor(i / 6) * 58 + 4, wet = flood && i >= 6 && i % 5 !== 0, dry = flood && !wet;
    cells.push(<rect key={i} x={x} y={y} width="60" height="52" rx="6" fill={wet ? `hsl(205 55% ${32 + (i % 4) * 4}%)` : dry ? `hsl(38 38% ${33 + (i % 3) * 3}%)` : `hsl(${98 + (i * 37) % 28} 52% ${30 + (i * 13) % 14}%)`}/>); }
  return <svg viewBox="0 0 400 240" preserveAspectRatio="none" aria-hidden="true">{cells}</svg>;
}
function Compare() {
  const [p, setP] = useState(55);
  return (<div className="cmp"><div className="cmpL"><Field flood/></div><div className="cmpL top" style={{clipPath: `inset(0 ${100 - p}% 0 0)`}}><Field/></div>
    <span className="chip a">BEFORE</span><span className="chip b">AFTER</span><div className="cmpLine" style={{left: p + '%'}}><i>⇆</i></div>
    <input type="range" min="0" max="100" value={p} onChange={e => setP(+e.target.value)} aria-label="Slide to compare before and after"/></div>);
}
function Preview() {
  const heat = []; for (let i = 0; i < 98; i++) { const c = i % 14, sev = c > 8 ? 0 : c > 5 ? 1 : 2; heat.push(<i key={i} style={{background: ['#ef4444', '#f59e0b', '#22c55e'][sev], animationDelay: i * 14 + 'ms'}}/>); }
  return (<div className="prev"><div className="pv top"><div className="ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" className="trk"/><circle cx="50" cy="50" r="40" className="arc"/></svg><b>72</b></div><p><strong>Illustration of the results screen</strong><br/>Overview, signal chart and damage map, as the tool shows them. Values here are for illustration only.</p></div>
    <svg viewBox="0 0 300 110" className="pvchart" aria-hidden="true"><path d="M0 70 C60 60 110 40 170 30 S260 40 300 45 L300 75 C260 66 200 56 170 52 S60 92 0 92 Z" fill="rgba(34,211,238,.13)"/><path className="draw" d="M0 80 C40 70 80 52 120 40 S160 28 172 30 L176 78 C200 84 240 84 300 80" fill="none" stroke="#f8fafc" strokeWidth="3"/><line x1="172" y1="6" x2="172" y2="104" stroke="#f472b6" strokeDasharray="4 4"/><text x="177" y="16" fill="#f472b6" fontSize="9">loss date</text></svg>
    <div className="heat">{heat}</div></div>);
}
export default function Landing() {
  const root = useRef(), bar = useRef();
  useEffect(() => { health().catch(() => {}); }, []); // wake the free server while the visitor reads
  useEffect(() => {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), {threshold: .15});
    root.current.querySelectorAll('.rv').forEach(e => io.observe(e));
    const sc = () => { const el = root.current; bar.current.style.width = (el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight) * 100) + '%'; };
    root.current.addEventListener('scroll', sc); return () => { io.disconnect(); root.current?.removeEventListener('scroll', sc); };
  }, []);
  const spot = e => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--mx', (e.clientX - r.left) + 'px'); e.currentTarget.style.setProperty('--my', (e.clientY - r.top) + 'px'); };
  return (
    <div className="land" ref={root}>
      <div className="lbar" ref={bar}/>
      <header className="lnavw"><div className="lw lnav"><b className="br">FASAL<i>PROOF</i></b><nav><a href="#how">How it works</a><a href="#features">Features</a><a href="#honest">Honest limits</a><a className="lbtn sm" href="#/app">Open the tool</a></nav></div></header>
      <section className="lhero"><Stars/><div className="aur a1"/><div className="aur a2"/>
        <div className="lw hgrid"><div>
          <p className="kick">SATELLITE CLAIM INTELLIGENCE · FREE · WORLDWIDE · 6 LANGUAGES</p>
          <h1>Prove your crop loss <span>from space.</span></h1>
          <p className="after">After a <Rot/>, the insurance clock starts.</p>
          <p className="sub">FasalProof compares free satellite images from before and after a disaster, checks the weather record, applies India's PMFBY claim rules (or your own policy terms anywhere else), and prepares your evidence and claim letter in minutes. Works for farms on land worldwide.</p>
          <div className="lcta"><a className="lbtn" href="#/app">Open the analysis tool</a><a className="lbtn ghost" href="#/app-chat">💬 Describe your loss in words</a></div></div>
          <div className="orbw"><svg viewBox="0 0 220 220" className="orb" aria-hidden="true"><defs><radialGradient id="eg" cx=".35" cy=".3"><stop offset="0" stopColor="#7dd3fc"/><stop offset=".6" stopColor="#1d4ed8"/><stop offset="1" stopColor="#0b1b4a"/></radialGradient><linearGradient id="bm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#22d3ee" stopOpacity=".55"/><stop offset="1" stopColor="#22d3ee" stopOpacity="0"/></linearGradient></defs>
            <circle cx="110" cy="110" r="98" fill="none" stroke="rgba(34,211,238,.3)" strokeDasharray="3 7"/><circle cx="110" cy="110" r="52" fill="url(#eg)"/><circle cx="110" cy="110" r="60" fill="none" stroke="rgba(125,211,252,.25)"/>
            <path d="M80 100q16-20 38-8t26 26q-22 12-44 4t-20-22z" fill="#34a853" opacity=".9"/><path d="M96 138q10-6 20 0t4 12q-14 4-22-2z" fill="#2e9e5b" opacity=".8"/>
            <g className="sat"><g transform="translate(206 110)"><rect x="-7" y="-5" width="14" height="10" rx="2" fill="#e2e8f0"/><rect x="-14" y="-3" width="6" height="6" fill="#22d3ee"/><rect x="8" y="-3" width="6" height="6" fill="#22d3ee"/><path d="M0 5 L-30 70 L30 70 Z" fill="url(#bm)" className="beam"/></g></g></svg></div></div>
        <div className="scrollhint" aria-hidden="true">scroll ↓</div></section>
      <div className="mq" aria-hidden="true"><div>{[...CROPS, ...CROPS].map((c, i) => <span key={i}>🌱 {c}</span>)}</div></div>
      <section className="lw lstats rv">{[[10, ' m', 'satellite resolution'], [5, ' days', 'between Sentinel-2 images'], [72, ' h', 'to report localised losses'], [0, '', 'rupees cost to the farmer', '₹']].map(([n, s, l, p]) => <div key={l}><Count to={n} suf={s} pre={p}/><span>{l}</span></div>)}</section>
      <section className="lw split rv"><div><h2>Why this exists</h2><p className="sub">Localised calamities such as hailstorm, inundation and cloudburst must be reported within <b>72 hours</b>. A phone photo alone is hard to verify, and the claim route differs by peril. FasalProof gives you a dated, location-stamped, objective comparison and tells you which route applies.</p></div>
        <div className="clock"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="50" className="ctrk"/><circle cx="60" cy="60" r="50" className="carc"/></svg><div><b>72h</b><span>reporting window</span></div></div></section>
      <section className="lw rv"><h2>See the change</h2><p className="sub">Drag the slider. An illustration of how a flood shows up when two satellite dates are compared.</p><Compare/><p className="cap">Illustration only, not real data. The tool does this with real Sentinel-2 pixels for your field.</p></section>
      <section className="lw rv" id="how"><h2>How it works</h2><div className="steps"><div className="sline"/>{STEPS.map(([t, d, i], n) => <div className="lcard" key={t} onMouseMove={spot} style={{transitionDelay: n * 90 + 'ms'}}><span className="num">{n + 1}</span><span className="ico">{i}</span><h3>{t}</h3><p>{d}</p></div>)}</div></section>
      <section className="lw rv"><h2>What the results look like</h2><Preview/></section>
      <section className="lw rv" id="features"><h2>What you get</h2><div className="lgrid g4">{FEATS.map(([i, t, d]) => <div className="lcard" key={t} onMouseMove={spot}><span className="ico">{i}</span><h3>{t}</h3><p>{d}</p></div>)}</div></section>
      <section className="lw rv" id="honest"><h2>Honest by design</h2><div className="lcard wide" onMouseMove={spot}><ul>
        <li><b>Supporting evidence, not an official assessment.</b> The insurer's assessment stays official.</li><li><b>Uncertainty is shown, not hidden:</b> confidence interval, scene count and a low-data warning on every result.</li>
        <li><b>No accuracy claim yet.</b> Validation against documented events is in progress and the measured numbers will be published.</li><li><b>Rules vary by state and season.</b> Sum insured, notified crops and cut-off dates come from your policy.</li>
        <li><b>Experimental features are labelled</b> (radar check, on-device AI) and switched off by default.</li></ul><p className="src">Data and references: Sentinel-2 (ESA / Copernicus), Earth Search, Open-Meteo, FAO Irrigation &amp; Drainage Paper 56, PMFBY operational guidelines (Ministry of Agriculture &amp; Farmers Welfare).</p></div></section>
      <section className="lw rv"><h2>Questions</h2><div className="lcard wide">{FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></section>
      <section className="lw lfinal rv"><div className="fbox"><h2>See what the satellite saw.</h2><div className="lcta" style={{justifyContent: 'center'}}><a className="lbtn" href="#/app">Open the analysis tool</a><a className="lbtn ghost" href="#/app-chat">💬 Ask the assistant</a></div></div></section>
      <footer className="lw lfoot">Built for VORTEX 2K26 · Climate, Agriculture &amp; Rural Innovation · {BUILD}</footer>
    </div>
  );
}
