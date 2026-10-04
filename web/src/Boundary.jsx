import React from 'react';
export default class Boundary extends React.Component {
  state = {err: null};
  static getDerivedStateFromError(err) { return {err}; }
  render() {
    if (!this.state.err) return this.props.children;
    return <section className="pn on" id="hud"><div className="pg a"><h3 style={{marginTop: 0}}>Display error</h3>
      <p className="nt">The analysis data arrived, but drawing it failed. Please send this message to your developer:</p>
      <pre>{String(this.state.err.stack || this.state.err).slice(0, 900)}</pre></div></section>;
  }
}
