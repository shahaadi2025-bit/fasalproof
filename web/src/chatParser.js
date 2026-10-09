// Rule-based conversational parser (English / Hindi / Marathi keywords). No model, no server: instant and predictable.
export const CROP_KW = {
  Wheat: ['wheat', 'गेहूं', 'गेहूँ', 'गहू'], Rice: ['rice', 'paddy', 'धान', 'चावल', 'तांदूळ', 'भात'], Maize: ['maize', 'corn', 'मक्का', 'मका'],
  Sorghum: ['sorghum', 'jowar', 'ज्वार', 'ज्वारी'], 'Millet (Bajra)': ['bajra', 'millet', 'बाजरा', 'बाजरी'], 'Green gram (Moong)': ['moong', 'green gram', 'मूंग', 'मूग'],
  Lentil: ['lentil', 'masoor', 'मसूर'], 'Gram (Chickpea)': ['chickpea', 'gram', 'chana', 'चना', 'हरभरा'], Soybean: ['soybean', 'soyabean', 'soya', 'सोयाबीन'],
  Groundnut: ['groundnut', 'peanut', 'मूंगफली', 'भुईमूग', 'शेंगदाणे'], Sunflower: ['sunflower', 'सूरजमुखी', 'सूर्यफूल'], Sesame: ['sesame', 'til', 'तिल'],
  Castor: ['castor', 'अरंडी', 'एरंडी'], Safflower: ['safflower', 'कुसुम', 'करडई'], Cotton: ['cotton', 'कपास', 'कापूस'], Potato: ['potato', 'आलू', 'बटाटा'],
  'Onion (dry)': ['onion', 'प्याज', 'कांदा'], Tomato: ['tomato', 'टमाटर', 'टोमॅटो'], Brinjal: ['brinjal', 'eggplant', 'बैंगन', 'वांगी'], Cauliflower: ['cauliflower', 'फूलगोभी', 'फुलकोबी', 'फ्लॉवर']
};
export const CAL_KW = {
  Cloudburst: ['cloudburst', 'cloud burst', 'बादल फटन', 'ढगफुटी'], Landslide: ['landslide', 'भूस्खलन', 'दरड'],
  Hailstorm: ['hail', 'hailstorm', 'ओले', 'ओला', 'ओलावृष्टि', 'ओलावृष्टी', 'गारपीट', 'गारा'], 'Unseasonal rain': ['unseasonal', 'बेमौसम', 'अवकाळी'],
  Flood: ['flood', 'flooded', 'flooding', 'inundation', 'waterlogging', 'heavy rain', 'बाढ', 'भारी बारिश', 'अतिवृष्टी', 'पूर$', 'पुरामुळे', 'पाणी भरले'],
  'Cyclone / storm': ['cyclone', 'storm', 'चक्रवात', 'तूफान', 'वादळ'], 'Natural fire / lightning': ['lightning', 'fire', 'आग', 'बिजली', 'वीज$'],
  'Drought / dry spell': ['drought', 'dry spell', 'सूखा', 'सुखा', 'दुष्काळ'], 'Pest / disease': ['pest', 'disease', 'insect', 'worm', 'कीट', 'कीड', 'रोग', 'अळी', 'इल्ली']
};
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function has(t, w) {
  const exact = w.endsWith('$'); if (exact) w = w.slice(0, -1);
  if (/[a-z]/i.test(w)) return new RegExp(`(^|[^a-z])${esc(w)}s?([^a-z]|$)`, 'i').test(t);
  return new RegExp(`(^|[\\s,.;!?()"“”'])${esc(w)}${exact ? '([\\s,.;!?()"“”\']|$)' : ''}`).test(t);
}
const find = (t, table) => Object.keys(table).find(k => table[k].some(w => has(t, w)));
const pad = n => String(n).padStart(2, '0'), isoOf = d => d.toISOString().slice(0, 10);
const MON = {jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12};
export function parseDate(t, today = new Date()) {
  const now = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())), ago = n => isoOf(new Date(now.getTime() - n * 864e5)); let out = null, m;
  if ((m = t.match(/\b(20\d\d)-(\d{1,2})-(\d{1,2})\b/))) out = `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
  else if ((m = t.match(/\b(\d{1,2})[\/.-](\d{1,2})[\/.-](20\d\d)\b/))) out = `${m[3]}-${pad(m[2])}-${pad(m[1])}`;
  if (!out) {
    let a = t.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?,?\s*(20\d\d)?/i), d, mo, y;
    if (a) { d = +a[1]; mo = MON[a[2].toLowerCase()]; y = a[3] && +a[3]; }
    else if ((a = t.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(20\d\d)?/i))) { mo = MON[a[1].toLowerCase()]; d = +a[2]; y = a[3] && +a[3]; }
    if (mo && d >= 1 && d <= 31) { let yy = y || now.getUTCFullYear(); let c = `${yy}-${pad(mo)}-${pad(d)}`; if (!y && c > isoOf(now)) c = `${yy - 1}-${pad(mo)}-${pad(d)}`; out = c; }
  }
  if (!out) {
    if (/day before yesterday|anteayer|avant-hier|anteontem|परसों|परवा/.test(t)) out = ago(2);
    else if (/\byesterday\b|\bayer\b|\bhier\b|\bontem\b|कल|काल/.test(t)) out = ago(1);
    else if (/\btoday\b|\bhoy\b|aujourd'hui|\bhoje\b|आज/.test(t)) out = ago(0);
    else if ((m = t.match(/(\d+)\s*(?:days?|दिन|दिवस)\s*(?:ago|पहले|आधी)/i))) out = ago(+m[1]);
    else if ((m = t.match(/(?:hace|há|il y a)\s*(\d+)\s*(?:días|dias|jours?)/i))) out = ago(+m[1]);
  }
  return out && out <= isoOf(now) && !isNaN(new Date(out)) ? out : null;
}
export function parseArea(t) {
  let m = t.match(/(\d+(?:\.\d+)?)\s*(?:acres?|एकड़|एकर)/i); if (m) return +m[1];
  m = t.match(/(\d+(?:\.\d+)?)\s*(?:hect[áa]reas?|hectares?|ha\b|हेक्टर|हेक्टेयर)/i); return m ? +(m[1] / 0.4047).toFixed(1) : null;
}
const STOP = new Set(['and', 'on', 'with', 'since', 'because', 'where', 'my', 'i', 'the', 'for', 'crop', 'farm', 'field', 'yesterday', 'today', 'last', 'when', 'after', 'during', 'due', 'by', 'is', 'was', 'has', 'have', 'had', 'there', 'to', 'it', 'this']);
export function parsePlace(text) {
  for (const m of text.matchAll(/(?:\b(?:in|at|near|from|village|town|of)|cerca de|près de|perto de|pueblo de|ville de|cidade de)\s+([^,.;!?\n]+)/gi)) {
    const out = []; for (const w of m[1].trim().split(/\s+/)) { if (!/^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'-]*$/.test(w) || STOP.has(w.toLowerCase()) || /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(w) && out.length) break; out.push(w); if (out.length >= 3) break; }
    const p = out.join(' '); if (p && !find(p.toLowerCase(), CROP_KW) && !find(p.toLowerCase(), CAL_KW) && !STOP.has(p.toLowerCase())) return p;
  }
  return null;
}
export function parse(text, today = new Date()) {
  const t = text.toLowerCase(), r = {cr: find(t, CROP_KW), ev: find(t, CAL_KW), dt: parseDate(t, today), ar: parseArea(t), place: parsePlace(text)};
  Object.keys(r).forEach(k => r[k] == null && delete r[k]); return r;
}
const ADDC = {Wheat: ['trigo', 'blé', 'ble'], Rice: ['arroz', 'riz'], Maize: ['maíz', 'maiz', 'maïs', 'milho'], Sorghum: ['sorgo', 'sorgho'], Soybean: ['soja'], Groundnut: ['maní', 'cacahuate', 'arachide', 'amendoim'], Sunflower: ['girasol', 'tournesol', 'girassol'], Cotton: ['algodón', 'algodão', 'coton'], Potato: ['papa', 'patata', 'pomme de terre', 'batata'], 'Onion (dry)': ['cebolla', 'oignon', 'cebola'], Tomato: ['tomate'], 'Gram (Chickpea)': ['garbanzo', 'pois chiche', 'grão-de-bico'], Lentil: ['lenteja', 'lentille', 'lentilha'], Sesame: ['sésamo', 'sésame', 'gergelim'], Cauliflower: ['coliflor', 'chou-fleur', 'couve-flor'], Brinjal: ['berenjena', 'aubergine', 'beringela'], Castor: ['ricino', 'ricin', 'mamona'], Safflower: ['cártamo', 'carthame']};
const ADDE = {Flood: ['inundación', 'inundacion', 'inundaciones', 'inondation', 'crue', 'inundação', 'inundacao', 'enchente', 'cheia'], Hailstorm: ['granizo', 'granizada', 'grêle', 'grele'], 'Drought / dry spell': ['sequía', 'sequia', 'sécheresse', 'secheresse', 'seca', 'estiagem'], 'Pest / disease': ['plaga', 'plagas', 'ravageurs', 'maladie', 'praga', 'doença', 'enfermedad'], 'Cyclone / storm': ['ciclón', 'tormenta', 'tempête', 'tempete', 'tempestade', 'huracán', 'ouragan', 'furacão'], Landslide: ['deslizamiento', 'glissement de terrain', 'deslizamento'], 'Natural fire / lightning': ['incendio', 'incendie', 'incêndio', 'rayo', 'foudre', 'raio']};
for (const k in ADDC) CROP_KW[k].push(...ADDC[k]); for (const k in ADDE) CAL_KW[k].push(...ADDE[k]);
['el', 'la', 'los', 'las', 'y', 'et', 'le', 'les', 'mon', 'ma', 'mes', 'mi', 'mis', 'meu', 'minha', 'o', 'a', 'e', 'ayer', 'hier', 'ontem', 'hoy', 'hoje', 'há', 'hace', 'il', 'ya', 'un', 'une', 'um', 'uma'].forEach(w => STOP.add(w));
export const nextNeed = F => !F.lat ? 'place' : !F.cr ? 'cr' : !F.ev ? 'ev' : !F.dt ? 'dt' : null;
export const Q = {
  en: {hi: 'Hi! Tell me about your crop loss in your own words, for example: “Flood damaged my wheat in Beed on 12/11/2025”. I will fill everything in for you.', place: 'Which village or town is your field near?', cr: 'Which crop did you grow?', ev: 'What happened to the crop?', dt: 'On what date did it happen? Day/month/year, for example 12/11/2025, or “yesterday”', done: (F, p) => `Got it: ${F.cr}, ${F.ev}, on ${F.dt}, near ${p}. Ready to run the satellite analysis?`, nf: q => `I could not find “${q}”. Try a nearby bigger town, or tap “Use my location”.`, pick: 'Which one is it?', run: '▶ Run analysis', redo: '↺ Start over', loc: '📍 Use my location', today: 'Today', yday: 'Yesterday', ph: 'Type here…', title: 'Assistant', send: 'Send', locmsg: 'Using your current location.', ctx: 'I assume 3 acres unless you tell me the area.'},
  hi: {hi: 'नमस्ते! अपनी फसल के नुकसान के बारे में अपने शब्दों में बताइए, जैसे: “बीड में 12/11/2025 को बाढ़ से मेरा गेहूं खराब हो गया”। बाकी मैं भर दूँगा।', place: 'आपका खेत किस गांव या शहर के पास है?', cr: 'आपने कौन सी फसल लगाई थी?', ev: 'फसल को क्या हुआ?', dt: 'यह कब हुआ? (जैसे 12/11/2025 या “कल”)', done: (F, p) => `समझ गया: ${F.cr}, ${F.ev}, दिनांक ${F.dt}, स्थान ${p}। सैटेलाइट विश्लेषण शुरू करें?`, nf: q => `“${q}” नहीं मिला। पास का कोई बड़ा शहर लिखें या “मेरा स्थान” दबाएँ।`, pick: 'इनमें से कौन सा है?', run: '▶ विश्लेषण शुरू करें', redo: '↺ फिर से शुरू', loc: '📍 मेरा स्थान', today: 'आज', yday: 'कल', ph: 'यहाँ लिखें…', title: 'सहायक', send: 'भेजें', locmsg: 'आपका वर्तमान स्थान इस्तेमाल हो रहा है।', ctx: 'क्षेत्र न बताने पर मैं 3 एकड़ मानूँगा।'},
  mr: {hi: 'नमस्कार! तुमच्या पिकाच्या नुकसानीबद्दल तुमच्या शब्दांत सांगा, उदा.: “बीड येथे 12/11/2025 रोजी पुरामुळे माझा गहू खराब झाला”. बाकी मी भरतो.', place: 'तुमचे शेत कोणत्या गावाजवळ किंवा शहराजवळ आहे?', cr: 'तुम्ही कोणते पीक घेतले होते?', ev: 'पिकाला काय झाले?', dt: 'हे कधी झाले? (उदा. 12/11/2025 किंवा “काल”)', done: (F, p) => `समजले: ${F.cr}, ${F.ev}, दिनांक ${F.dt}, ठिकाण ${p}. उपग्रह विश्लेषण सुरू करायचे?`, nf: q => `“${q}” सापडले नाही. जवळचे मोठे शहर लिहा किंवा “माझे स्थान” दाबा.`, pick: 'यापैकी कोणते?', run: '▶ विश्लेषण सुरू करा', redo: '↺ पुन्हा सुरू', loc: '📍 माझे स्थान', today: 'आज', yday: 'काल', ph: 'येथे लिहा…', title: 'सहाय्यक', send: 'पाठवा', locmsg: 'तुमचे सध्याचे स्थान वापरत आहे.', ctx: 'क्षेत्र न सांगितल्यास मी 3 एकर धरेन.'}
};

Q.es = {hi: '¡Hola! Cuéntame la pérdida de tu cultivo con tus palabras, por ejemplo: “La inundación dañó mi trigo cerca de Córdoba el 12/11/2025”. Yo lleno todo.', place: '¿Cerca de qué pueblo o ciudad está tu campo?', cr: '¿Qué cultivo sembraste?', ev: '¿Qué le pasó al cultivo?', dt: '¿En qué fecha ocurrió? Día/mes/año, por ejemplo 12/11/2025, o “ayer”', done: (F, p) => `Entendido: ${F.cr}, ${F.ev}, el ${F.dt}, cerca de ${p}. ¿Iniciamos el análisis satelital?`, nf: q => `No encontré “${q}”. Prueba con una ciudad cercana o toca “Usar mi ubicación”.`, pick: '¿Cuál es?', run: '▶ Iniciar análisis', redo: '↺ Empezar de nuevo', loc: '📍 Usar mi ubicación', today: 'Hoy', yday: 'Ayer', ph: 'Escribe aquí…', title: 'Asistente', send: 'Enviar', locmsg: 'Usando tu ubicación actual.', ctx: 'Supongo 3 acres si no indicas la superficie.'};
Q.fr = {hi: 'Bonjour ! Décrivez la perte de votre récolte avec vos mots, par exemple : « La grêle a détruit mon blé près de Toulouse le 12/11/2025 ». Je remplis tout.', place: 'Près de quel village ou ville se trouve votre champ ?', cr: 'Quelle culture aviez-vous plantée ?', ev: 'Que s’est-il passé ?', dt: 'À quelle date ? Jour/mois/année, par exemple 12/11/2025, ou « hier »', done: (F, p) => `Compris : ${F.cr}, ${F.ev}, le ${F.dt}, près de ${p}. Lancer l’analyse satellite ?`, nf: q => `Je n’ai pas trouvé « ${q} ». Essayez une ville proche ou touchez « Ma position ».`, pick: 'Lequel ?', run: '▶ Lancer l’analyse', redo: '↺ Recommencer', loc: '📍 Ma position', today: 'Aujourd’hui', yday: 'Hier', ph: 'Écrivez ici…', title: 'Assistant', send: 'Envoyer', locmsg: 'Utilisation de votre position.', ctx: 'Je suppose 3 acres sans indication de surface.'};
Q.pt = {hi: 'Olá! Conte a perda da sua lavoura com suas palavras, por exemplo: “A seca destruiu minha soja perto de Londrina em 12/11/2025”. Eu preencho tudo.', place: 'Perto de qual vila ou cidade fica sua área?', cr: 'Qual cultura você plantou?', ev: 'O que aconteceu com a lavoura?', dt: 'Em que data? Dia/mês/ano, por exemplo 12/11/2025, ou “ontem”', done: (F, p) => `Entendi: ${F.cr}, ${F.ev}, em ${F.dt}, perto de ${p}. Iniciar a análise de satélite?`, nf: q => `Não encontrei “${q}”. Tente uma cidade próxima ou toque em “Usar minha localização”.`, pick: 'Qual deles?', run: '▶ Iniciar análise', redo: '↺ Recomeçar', loc: '📍 Usar minha localização', today: 'Hoje', yday: 'Ontem', ph: 'Digite aqui…', title: 'Assistente', send: 'Enviar', locmsg: 'Usando sua localização atual.', ctx: 'Suponho 3 acres se você não informar a área.'};
