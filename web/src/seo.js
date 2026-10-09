// Per-page title and description (the page is a single-page app; this keeps each view's metadata accurate).
export const PAGES = {
  landing: {title: 'FasalProof: prove your crop loss from space', desc: 'Free satellite and weather evidence for crop-insurance claims, worldwide. Compare before and after images, check local rain history, and get a claim letter and signed report.'},
  app: {title: 'Analysis tool · FasalProof', desc: 'Describe a crop loss or tap your field on the map. Get a before/after satellite comparison, weather context, the claim route and an exportable evidence report.'}
};
export const pageKey = h => /^#(\/app|s=)/.test(h) ? 'app' : 'landing';
export function applySeo(h) {
  const p = PAGES[pageKey(h)]; document.title = p.title;
  const set = (sel, v) => document.querySelector(sel)?.setAttribute('content', v);
  set('meta[name="description"]', p.desc); set('meta[property="og:title"]', p.title); set('meta[property="og:description"]', p.desc);
}
