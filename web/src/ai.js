// On-device AI via transformers.js (ONNX Runtime Web), loaded from a public CDN only when an AI feature is used (keeps the repo small).
// Models download once from Hugging Face, are cached by the browser, and run locally.
import {LABELS} from './aiLogic';
let tf; const cache = {};
async function get(task, model, opts, onP) {
  const k = task + model; if (cache[k]) return cache[k];
  tf = tf || await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.0'); tf.env.allowLocalModels = false;
  return (cache[k] = await tf.pipeline(task, model, {progress_callback: p => { if (p.status === 'progress') onP?.(Math.round(p.progress)); }, ...opts}));
}
export async function classifyPhoto(url, onP) {
  const c = await get('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32', {}, onP);
  const out = await c(url, LABELS.map(l => l.t), {hypothesis_template: '{}'});
  return out.map(o => ({...o, key: LABELS.find(l => l.t === o.label).k})).sort((a, b) => b.score - a.score);
}
export async function record(sec = 5) {
  const s = await navigator.mediaDevices.getUserMedia({audio: true}), mr = new MediaRecorder(s), ch = [];
  mr.ondataavailable = e => ch.push(e.data); const done = new Promise(r => { mr.onstop = r; });
  mr.start(); await new Promise(r => setTimeout(r, sec * 1000)); mr.stop(); await done; s.getTracks().forEach(t => t.stop());
  const buf = await new Blob(ch).arrayBuffer(), a = await new AudioContext({sampleRate: 16000}).decodeAudioData(buf); return a.getChannelData(0);
}
export async function transcribe(audio, lang, onP) {
  const w = await get('automatic-speech-recognition', 'Xenova/whisper-tiny', {}, onP);
  return (await w(audio, {language: lang, task: 'transcribe'})).text.trim();
}
export async function explain(facts, onP) {
  const g = await get('text-generation', 'onnx-community/Qwen2.5-0.5B-Instruct', {dtype: 'q4', device: navigator.gpu ? 'webgpu' : 'wasm'}, onP);
  const out = await g([{role: 'system', content: 'You explain crop insurance evidence to a farmer in 4 short, simple sentences. Use ONLY the facts given. Never invent numbers, amounts or legal advice.'}, {role: 'user', content: facts}], {max_new_tokens: 200, do_sample: false});
  return out[0].generated_text.at(-1).content.trim();
}
