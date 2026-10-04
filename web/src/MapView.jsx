import {useEffect, useRef} from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
export const bbx = (a, o, m = 100) => { const d = m / 111320, e = d / Math.cos(a * Math.PI / 180); return [[a - d, o - e], [a + d, o + e]]; };
const C = [[239, 68, 68], [245, 158, 11], [34, 197, 94]];
export function heatUrl(grid) {
  const n = grid.length, cv = document.createElement('canvas'); cv.width = cv.height = n;
  const g = cv.getContext('2d'), im = g.createImageData(n, n);
  grid.forEach((r, y) => r.forEach((v, x) => im.data.set([...(v < 0 ? [51, 65, 85] : C[v]), v < 0 ? 90 : 235], (y * n + x) * 4)));
  g.putImageData(im, 0, 0); return cv.toDataURL();
}
export default function MapView({pos, setPos, zones, fly, size = 100}) {
  const el = useRef(), m = useRef(), box = useRef(), ov = useRef();
  useEffect(() => {
    const map = L.map(el.current, {zoomControl: false}).setView([pos.lat, pos.lon], 16);
    L.control.zoom({position: 'bottomleft'}).addTo(map);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {maxZoom: 19, attribution: 'Esri, Maxar'}).addTo(map);
    box.current = L.rectangle(bbx(pos.lat, pos.lon, size), {color: '#22d3ee', weight: 2, fill: false}).addTo(map);
    map.on('click', e => setPos({lat: e.latlng.lat, lon: e.latlng.lng})); m.current = map;
    return () => map.remove();
  }, []);
  useEffect(() => { box.current?.setBounds(bbx(pos.lat, pos.lon, size)); if (ov.current) { m.current.removeLayer(ov.current); ov.current = null; } }, [pos, size]);
  useEffect(() => { if (fly) m.current?.setView([pos.lat, pos.lon], 16); }, [fly]);
  useEffect(() => {
    if (!zones || !m.current) return;
    if (ov.current) m.current.removeLayer(ov.current);
    ov.current = L.imageOverlay(heatUrl(zones.grid), bbx(pos.lat, pos.lon, size), {opacity: .62, className: 'pix'}).addTo(m.current);
  }, [zones]);
  return <div id="map" ref={el}/>;
}
