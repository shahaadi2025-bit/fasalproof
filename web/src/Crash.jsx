import React from 'react';
export default class Crash extends React.Component {
  state = {err: null};
  static getDerivedStateFromError(err) { return {err}; }
  render() {
    if (!this.state.err) return this.props.children;
    return (<div style={{position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', background: '#05070f', color: '#e6edf7', fontFamily: 'Sora,system-ui,sans-serif', padding: 24, textAlign: 'center'}}><div>
      <h2>Something went wrong</h2><p style={{color: '#8ea0bd', maxWidth: 420, margin: '8px auto 18px'}}>The page hit an unexpected error. Your recent analyses are saved in this browser. Reload to continue.</p>
      <button onClick={() => location.reload()} style={{padding: '12px 26px', borderRadius: 30, border: 0, background: 'linear-gradient(90deg,#22d3ee,#818cf8)', fontWeight: 700, cursor: 'pointer'}}>Reload</button>
      <details style={{marginTop: 16, color: '#8ea0bd', fontSize: '.75rem'}}><summary>Technical details</summary><pre style={{whiteSpace: 'pre-wrap'}}>{String(this.state.err.stack || this.state.err).slice(0, 500)}</pre></details></div></div>);
  }
}
