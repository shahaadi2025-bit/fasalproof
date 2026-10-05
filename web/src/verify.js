import {API} from './api';
const sk = o => Array.isArray(o) ? o.map(sk) : o && typeof o === 'object' ? Object.fromEntries(Object.keys(o).sort().map(k => [k, sk(o[k])])) : o;
export const canon = o => JSON.stringify(sk(o));
export async function sha256(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
const post = (p, body) => fetch(API + p, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)});
export async function signReport(payload) {
  const hash = await sha256(canon(payload)), r = await post('/sign', {hash});
  if (!r.ok) throw new Error('Signing failed (HTTP ' + r.status + '). The backend must be version 4.2 or newer.');
  const s = await r.json(); return {payload, hash, signed_at: s.signed_at, sig: s.sig, key_id: s.key_id, ephemeral: s.ephemeral};
}
export async function verifyBundle(b) {
  if (!b?.payload || !b.hash || !b.sig) return {ok: false, why: 'Not a FasalProof signed report.'};
  if (await sha256(canon(b.payload)) !== b.hash) return {ok: false, why: 'The content was modified: its hash no longer matches.'};
  const r = await post('/verify', {hash: b.hash, signed_at: b.signed_at, sig: b.sig}); if (!r.ok) return {ok: false, why: 'Verification server error (HTTP ' + r.status + ').'};
  const j = await r.json(); return j.valid ? {ok: true, why: `Signature valid. This report is unmodified and was issued by this FasalProof server (key ${j.key_id}).`} : {ok: false, why: 'Signature invalid, or issued by a different key (the server key may have changed).'};
}
