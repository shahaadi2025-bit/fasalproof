// Claim kit helpers: multilingual intimation letter, calendar reminders (.ics), shareable link, CSV export, local history.
const pad = n => String(n).padStart(2, '0'), fmt = d => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
const esc = s => String(s).replace(/[\\;,]/g, m => '\\' + m).replace(/\n/g, '\\n');
export function ics(events) {
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//FasalProof//EN'];
  events.forEach((e, i) => L.push('BEGIN:VEVENT', `UID:fp-${e.start.getTime()}-${i}@fasalproof`, `DTSTAMP:${fmt(new Date())}`, `DTSTART:${fmt(e.start)}`, `DTEND:${fmt(new Date(e.start.getTime() + 36e5))}`, `SUMMARY:${esc(e.title)}`, `DESCRIPTION:${esc(e.desc)}`, 'BEGIN:VALARM', 'TRIGGER:-PT30M', 'ACTION:DISPLAY', `DESCRIPTION:${esc(e.title)}`, 'END:VALARM', 'END:VEVENT'));
  return [...L, 'END:VCALENDAR'].join('\r\n');
}
export const enc = o => btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(o))));
export const dec = s => JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(s), c => c.charCodeAt(0))));
export function toCsv(d) {
  const fc = d.forecast || []; return ['date,ndvi,ndwi,expected_ndvi,band_low,band_high', ...d.series.map((p, i) => [p.date, p.ndvi, p.ndwi, fc[i]?.exp ?? '', fc[i]?.lo ?? '', fc[i]?.hi ?? ''].join(','))].join('\n');
}
export function dl(name, text, type = 'text/plain') { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], {type: type + ';charset=utf-8'})); a.download = name; a.click(); }
export const loadHist = () => { try { return JSON.parse(localStorage.getItem('fp_hist') || '[]'); } catch { return []; } };
export const saveHist = h => { try { localStorage.setItem('fp_hist', JSON.stringify([h, ...loadHist()].slice(0, 8))); } catch {} };
export function letter(lg, {f, d, pos, I, s}) {
  const v = {nm: f.nm, vl: f.vl, se: I.c.season, cr: f.cr, ar: f.ar, dt: f.dt, ev: f.ev, l: d.loss_pct, lo: s.ci[0], hi: s.ci[1], gps: `${pos.lat.toFixed(5)}, ${pos.lon.toFixed(5)}`, today: new Date().toLocaleDateString('en-IN')};
  if (lg === 'hi') return `सेवा में,\nशाखा प्रबंधक / फसल बीमा कंपनी\n\nविषय: प्रधानमंत्री फसल बीमा योजना (PMFBY) के अंतर्गत फसल हानि की सूचना\n\nमहोदय/महोदया,\n\nमैं ${v.nm}, ${v.vl} का किसान हूँ। मैंने ${v.se} सीजन में ${v.cr} की फसल (${v.ar} एकड़) बोई थी। दिनांक ${v.dt} को ${v.ev} के कारण मेरी फसल को नुकसान हुआ है।\n\nउपग्रह विश्लेषण (Sentinel-2) के अनुसार वनस्पति में लगभग ${v.l}% की गिरावट दर्ज हुई है (95% विश्वास अंतराल ${v.lo}–${v.hi}%)। खेत का GPS स्थान: ${v.gps}। FasalProof रिपोर्ट संलग्न है।\n\nकृपया इस सूचना को दर्ज करें और नुकसान का आकलन करवाएं।\n\nभवदीय,\n${v.nm}\nदिनांक: ${v.today}`;
  if (lg === 'mr') return `प्रति,\nशाखा व्यवस्थापक / पीक विमा कंपनी\n\nविषय: प्रधानमंत्री पीक विमा योजना (PMFBY) अंतर्गत पीक नुकसानीची सूचना\n\nमहोदय/महोदया,\n\nमी ${v.nm}, ${v.vl} येथील शेतकरी आहे. मी ${v.se} हंगामात ${v.cr} पीक (${v.ar} एकर) घेतले होते. दिनांक ${v.dt} रोजी ${v.ev} मुळे माझ्या पिकाचे नुकसान झाले आहे.\n\nउपग्रह विश्लेषणानुसार (Sentinel-2) वनस्पतीत सुमारे ${v.l}% घट नोंदली गेली आहे (95% विश्वास मर्यादा ${v.lo}–${v.hi}%). शेताचे GPS स्थान: ${v.gps}. FasalProof अहवाल सोबत जोडला आहे.\n\nकृपया ही सूचना नोंदवून नुकसानीचे मूल्यांकन करावे.\n\nआपला विश्वासू,\n${v.nm}\nदिनांक: ${v.today}`;
  return `To,\nThe Branch Manager / Crop Insurance Company\n\nSubject: Intimation of crop loss under PMFBY\n\nSir/Madam,\n\nI am ${v.nm}, a farmer from ${v.vl}. I sowed ${v.cr} (${v.ar} acres) in the ${v.se} season. My crop was damaged by ${v.ev.toLowerCase()} on ${v.dt}.\n\nSatellite analysis (Sentinel-2) shows a vegetation loss of about ${v.l}% (95% interval ${v.lo}–${v.hi}%). Field GPS location: ${v.gps}. The FasalProof evidence report is attached.\n\nKindly register this intimation and arrange an assessment of the loss.\n\nYours faithfully,\n${v.nm}\nDate: ${v.today}`;
}
