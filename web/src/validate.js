// Form validation: returns a list of plain-language problems (empty = OK). Limits match the server.
export function validate(f, today = new Date().toISOString().slice(0, 10)) {
  const e = [];
  if (!f.dt) e.push('Enter the date of loss.');
  else if (f.dt > today) e.push('The date of loss cannot be in the future.');
  else if (f.dt < '2017-01-01') e.push('Satellite data starts in 2017: choose a later date.');
  if (!(+f.ar > 0)) e.push('Area must be greater than zero.');
  if (f.si !== '' && +f.si < 0) e.push('Sum insured cannot be negative.');
  if (f.rules === 'OTHER') { if (f.prem !== '' && (+f.prem < 0 || +f.prem > 100)) e.push('Premium must be between 0 and 100%.'); if (f.notice !== '' && +f.notice < 0) e.push('Notice period cannot be negative.'); }
  if (f.sow && f.dt && f.sow > f.dt) e.push('The sowing date must be before the date of loss.');
  if (f.hv && f.sow && f.hv < f.sow) e.push('The harvest date must be after the sowing date.');
  if (!(+f.hs >= 30 && +f.hs <= 500)) e.push('Plot half-size must be between 30 and 500 m.');
  if (!(+f.db >= 30 && +f.db <= 120)) e.push('Days before the loss must be between 30 and 120.');
  if (!(+f.da >= 15 && +f.da <= 90)) e.push('Days after the loss must be between 15 and 90.');
  return e;
}
