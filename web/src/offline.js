const S = 'queue';
const open = () => new Promise((res, rej) => { const r = indexedDB.open('fasalproof', 1); r.onupgradeneeded = () => r.result.createObjectStore(S, {keyPath: 'id'}); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const tx = async (m, f) => { const db = await open(); return new Promise((res, rej) => { const t = db.transaction(S, m), r = f(t.objectStore(S)); t.oncomplete = () => res(r.result); t.onerror = () => rej(t.error); }); };
export const qPut = job => tx('readwrite', s => s.put(job));
export const qAll = () => tx('readonly', s => s.getAll());
export const qClear = () => tx('readwrite', s => s.clear());
