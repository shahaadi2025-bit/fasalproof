import React, {useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import Landing from './Landing';
import Crash from './Crash';
import './styles.css';
function Root() {
  const [h, setH] = useState(location.hash);
  useEffect(() => { const f = () => setH(location.hash); addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []);
  return /^#(\/app|s=)/.test(h) ? <App/> : <Landing/>;
}
createRoot(document.getElementById('root')).render(<Crash><Root/></Crash>);
if ('serviceWorker' in navigator) addEventListener('load', () => {
  const had = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('./sw.js').then(r => r.update()).catch(() => {});
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (had && !window.__reloaded) { window.__reloaded = 1; location.reload(); } });
});
