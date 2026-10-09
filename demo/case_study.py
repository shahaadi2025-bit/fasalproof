#!/usr/bin/env python3
"""Case-study generator (standard library only).
Runs FasalProof on a documented event and writes a self-contained evidence report with the raw results.
Field selection rule (fixed in advance, independent of the outcome): among points around the documented place,
the demo field is the one with the highest PRE-event canopy (baseline NDVI), i.e. the surest cropland. Every candidate is reported."""
import base64, csv, hashlib, html, json, math, os, sys, time, urllib.parse, urllib.request
from datetime import date, datetime, timedelta, timezone

def http(url, body=None, timeout=240):
    req = urllib.request.Request(url, json.dumps(body).encode() if body is not None else None, {"Content-Type": "application/json"} if body is not None else {})
    with urllib.request.urlopen(req, timeout=timeout) as r: return json.load(r)

def geocode(q):
    try:
        r = http("https://geocoding-api.open-meteo.com/v1/search?count=3&language=en&format=json&countryCode=IN&name=" + urllib.parse.quote(q), timeout=30).get("results") or []
        return (r[0]["latitude"], r[0]["longitude"], f'{r[0]["name"]}, {r[0].get("admin2") or ""} {r[0].get("admin1") or ""}'.strip()) if r else None
    except Exception: return None

def grid(lat, lon, step_m=700):
    dlat = step_m / 111320.0; dlon = step_m / (111320.0 * math.cos(math.radians(lat)))
    return [("centre", lat, lon), ("north", lat + dlat, lon), ("south", lat - dlat, lon), ("east", lat, lon + dlon), ("west", lat, lon - dlon)]

def select(cands):
    ok = [c for c in cands if c.get("res")]
    return max(ok, key=lambda c: (c["res"]["baseline_ndvi"], c["res"]["images_used"])) if ok else None

def pct_rank(a, x): return (sum(v < x for v in a) + 0.5 * sum(v == x for v in a)) / len(a) * 100 if a else None

def clim_rain(daily, loss_date, half=3, years=10):
    by = dict(daily); c = date.fromisoformat(loss_date)
    def tot(ctr):
        vals = [by.get((ctr + timedelta(days=k)).isoformat()) for k in range(-half, half + 1)]
        return None if any(v is None for v in vals) else sum(vals)
    cur = tot(c)
    if cur is None: return None
    hist = []
    for k in range(1, years + 1):
        try: v = tot(c.replace(year=c.year - k))
        except ValueError: v = None
        if v is not None: hist.append(v)
    s = sorted(hist)
    return {"cur": cur, "hist": hist, "pct": pct_rank(hist, cur), "median": s[len(s) // 2]} if len(hist) >= 5 else None

def weather(lat, lon, loss_date):
    try:
        y = int(loss_date[:4]); end = min(date.fromisoformat(loss_date) + timedelta(days=3), date.today() - timedelta(days=5)).isoformat()
        d = http(f"https://archive-api.open-meteo.com/v1/archive?latitude={lat}&longitude={lon}&start_date={y - 10}-01-01&end_date={end}&daily=precipitation_sum&timezone=auto", timeout=60)["daily"]
        daily = [(t, v or 0.0) for t, v in zip(d["time"], d["precipitation_sum"])]
        return {"clim": clim_rain(daily, loss_date), "window": [(t, v) for t, v in daily if abs((date.fromisoformat(t) - date.fromisoformat(loss_date)).days) <= 7]}
    except Exception as e: return {"error": str(e)[:120]}

def norm(o):
    if isinstance(o, float): return int(o) if o.is_integer() else round(o, 3)
    if isinstance(o, dict): return {k: norm(v) for k, v in o.items()}
    if isinstance(o, list): return [norm(v) for v in o]
    return o

def canon(o): return json.dumps(o, sort_keys=True, separators=(",", ":"), ensure_ascii=False)

def sign(api, payload):
    h = hashlib.sha256(canon(payload).encode()).hexdigest()
    try: s = http(api + "/sign", {"hash": h}, 60); return {"payload": payload, "hash": h, "signed_at": s["signed_at"], "sig": s["sig"], "key_id": s["key_id"], "ephemeral": s.get("ephemeral")}
    except Exception as e: return {"payload": payload, "hash": h, "error": str(e)[:100]}

LIMITS = ["Supporting evidence, not an official assessment.", "NDVI cannot identify the crop; the plot is a square approximation around a point.", "Monsoon cloud can leave few usable scenes; each pixel is cloud-masked and the scene count is shown.",
          "Apparent loss of roughly 10-20% appears on sites with no documented event (natural variation and crop ripening), so small values must not be read as damage.", "One field is an illustration, not a validation: see the controls and validation table."]

def report_html(cfg, pick, cands, wx, sar, controls, signed):
    e = html.escape; r = pick["res"]; st = r.get("stats") or {}; ch = r.get("chips")
    img = lambda c, n: f'<figure><img src="data:image/png;base64,{c["png"]}" alt="{n}"><figcaption>{n} · {e(c["date"])}</figcaption></figure>'
    rows = "".join(f'<tr><td>{e(c["name"])}</td><td>{c["lat"]:.5f}, {c["lon"]:.5f}</td><td>{e(str(c["res"]["baseline_ndvi"])) if c.get("res") else "-"}</td><td>{c["res"]["loss_pct"] if c.get("res") else "-"}</td><td>{e(c.get("err", "ok") if not c.get("res") else "ok")}</td></tr>' for c in cands)
    clim = (wx or {}).get("clim")
    wtxt = (f'Rain within 3 days of {e(cfg["loss_date"])}: <b>{clim["cur"]:.0f} mm</b>, wetter than <b>{clim["pct"]:.0f}%</b> of the same window in the previous {len(clim["hist"])} years (median {clim["median"]:.0f} mm).' if clim else "Weather context unavailable for this run.")
    crow = "".join(f'<tr><td>{e(c["label"])}</td><td>{c["loss"]}</td><td>{c["scenes"]}</td></tr>' for c in controls) or '<tr><td colspan="3">not run</td></tr>'
    sarx = (f'New flood area by radar: <b>{sar["new_flood_pct"]}%</b>, open water after: {sar["water_post_pct"]}% (scenes {e(sar["pre_date"])} to {e(sar["post_date"])}). Experimental.' if sar and "new_flood_pct" in sar else "Radar check not available for this run (experimental).")
    src = "".join(f'<li><a href="{e(s["url"])}">{e(s["label"])}</a></li>' for s in cfg["sources"])
    sg = (f'<p><b>Report ID</b> {signed["hash"][:16]} · signed with key {e(str(signed["key_id"]))}. Verify the .json bundle in the app (Verify a signed report).</p>' if signed.get("sig") else "<p>Signing unavailable for this run.</p>")
    return f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Evidence report: {e(cfg['title'])}</title><style>body{{font:15px/1.5 system-ui,Segoe UI,Arial;max-width:860px;margin:24px auto;padding:0 16px;color:#111}}h1{{font-size:1.5rem}}h2{{font-size:1.1rem;margin-top:24px;border-bottom:1px solid #ccc}}table{{border-collapse:collapse;width:100%;font-size:.88rem}}td,th{{border:1px solid #ccc;padding:5px 8px;text-align:left}}.imgs{{display:flex;gap:10px}}figure{{flex:1;margin:0;font-size:.8rem;color:#444}}img{{width:100%}}.k{{display:flex;gap:10px;flex-wrap:wrap}}.k div{{flex:1;min-width:120px;border:1px solid #ccc;padding:8px;border-radius:6px}}.k b{{display:block;font-size:1.3rem}}small{{color:#555}}</style></head><body>
<h1>FasalProof evidence report</h1><p><b>{e(cfg['title'])}</b><br>Calamity: {e(cfg['calamity'])} · Crop: {e(cfg['crop'])} · Documented onset: {e(cfg['loss_date'])}<br><small>Generated {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}</small></p>
<h2>1. Documented event</h2><ul>{src}</ul>
<h2>2. Result for the selected field ({e(pick['name'])}: {pick['lat']:.5f}, {pick['lon']:.5f})</h2><div class="k"><div><small>VEGETATION LOSS</small><b>{r['loss_pct']}%</b><small>95% CI {st.get('ci', ['-', '-'])[0]}-{st.get('ci', ['-', '-'])[1]}%</small></div><div><small>ANOMALY z</small><b>{st.get('z', '-')}</b><small>confidence {st.get('confidence', '-')}</small></div><div><small>BREAK DATE</small><b style="font-size:1rem">{e(str(st.get('break_date')))}</b><small>offset {st.get('offset')} d</small></div><div><small>WATER CHANGE (optical)</small><b>{r.get('water_pct', '-')}%</b><small>{r['images_used']} scenes</small></div></div>
<h2>3. Before and after (true colour)</h2>{('<div class="imgs">' + img(ch['before'], 'Before') + img(ch['after'], 'After') + '</div><small>Image covers about ' + str(int(ch['half_m'] * 2)) + ' m; the selected plot is the central ' + str(int(ch['half_m'] * ch['plot_frac'] * 2)) + ' m square. Colour stretch is indicative; clouds, if any, are shown as captured.</small>') if ch else '<p>Images unavailable for this run.</p>'}
<h2>4. Weather context</h2><p>{wtxt}</p><p>{sarx}</p>
<h2>5. Selection rule and all candidate points</h2><p><small>The demo field is the candidate with the highest pre-event canopy (baseline NDVI), a rule fixed before looking at losses. All candidates are listed.</small></p><table><tr><th>Point</th><th>Lat, Lon</th><th>Baseline NDVI</th><th>Loss %</th><th>Status</th></tr>{rows}</table>
<h2>6. False-positive check (same point, earlier seasons)</h2><p><small>{e(cfg.get('controls_note', ''))}</small></p><table><tr><th>Season</th><th>Apparent loss %</th><th>Scenes</th></tr>{crow}</table>
<h2>7. Limitations</h2><ul>{''.join('<li>' + e(x) + '</li>' for x in LIMITS)}</ul><h2>8. Integrity</h2>{sg}</body></html>"""

def analyse(api, lat, lon, loss_date):
    try: return http(api + "/analyze", {"lat": lat, "lon": lon, "loss_date": loss_date}), None
    except Exception as e:
        msg = str(e)
        try: msg = json.loads(e.read().decode()).get("detail", msg)  # HTTPError body
        except Exception: pass
        return None, str(msg)[:140]

def main(cfg_path, api="https://fasalproof.onrender.com", outdir="demo/out", points=5, delay=4):
    cfg = json.load(open(cfg_path, encoding="utf-8")); out = os.path.join(outdir, cfg["slug"]); os.makedirs(out, exist_ok=True)
    loc = next((g for g in (geocode(q) for q in cfg["place_queries"]) if g), None) or ((cfg["lat"], cfg["lon"], "configured") if "lat" in cfg else None)
    if not loc: sys.exit("Could not resolve the place. Add lat/lon to the config.")
    print("Place:", loc); cands = []
    for name, la, lo in grid(loc[0], loc[1], cfg.get("grid_step_m", 700))[:points]:
        res, err = analyse(api, la, lo, cfg["loss_date"]); cands.append({"name": name, "lat": la, "lon": lo, "res": res, "err": err}); print(f"  {name:7s} loss={res['loss_pct'] if res else '-'} {err or ''}"); time.sleep(delay)
    pick = select(cands)
    if not pick: sys.exit("No candidate produced a usable result (cloud cover or an API error). See the messages above; try another loss_date window.")
    wx = weather(pick["lat"], pick["lon"], cfg["loss_date"])
    try: sar = http(api + "/sar", {"lat": pick["lat"], "lon": pick["lon"], "loss_date": cfg["loss_date"]}, 200)
    except Exception as e: sar = {"error": str(e)[:100]}
    controls = []
    for yb in cfg.get("controls_years_back", []):
        d0 = date.fromisoformat(cfg["loss_date"]); cd = d0.replace(year=d0.year - yb).isoformat(); r, err = analyse(api, pick["lat"], pick["lon"], cd); time.sleep(delay)
        controls.append({"label": cd, "loss": r["loss_pct"] if r else (err or "n/a"), "scenes": r["images_used"] if r else "-"})
    r = pick["res"]; st = r.get("stats") or {}
    payload = norm({"app": "FasalProof", "case": cfg["slug"], "calamity": cfg["calamity"], "crop": cfg["crop"], "loss_date": cfg["loss_date"], "lat": round(pick["lat"], 5), "lon": round(pick["lon"], 5), "loss_pct": r["loss_pct"], "loss_ci": st.get("ci"), "scenes": r["images_used"], "scene_before": (r.get("chips") or {}).get("before", {}).get("date"), "scene_after": (r.get("chips") or {}).get("after", {}).get("date"), "controls": [{"season": c["label"], "loss": c["loss"]} for c in controls]})
    signed = sign(api, payload)
    open(os.path.join(out, "evidence_report.html"), "w", encoding="utf-8").write(report_html(cfg, pick, cands, wx, sar, controls, signed))
    json.dump(signed, open(os.path.join(out, "signed_bundle.json"), "w", encoding="utf-8"), indent=2, ensure_ascii=False)
    with open(os.path.join(out, "candidates.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f); w.writerow(["point", "lat", "lon", "baseline_ndvi", "loss_pct", "scenes", "status"]); [w.writerow([c["name"], c["lat"], c["lon"], c["res"]["baseline_ndvi"] if c["res"] else "", c["res"]["loss_pct"] if c["res"] else "", c["res"]["images_used"] if c["res"] else "", c["err"] or "ok"]) for c in cands]
    ch = r.get("chips") or {}
    for k in ("before", "after"):
        if k in ch: open(os.path.join(out, f"{k}.png"), "wb").write(base64.b64decode(ch[k]["png"]))
    json.dump({"selected": pick["name"], "result": {k: v for k, v in r.items() if k not in ("chips", "zones", "forecast")}, "weather": wx, "radar": sar, "controls": controls}, open(os.path.join(out, "raw_results.json"), "w", encoding="utf-8"), indent=1, default=str)
    print("\nWrote", out, "\n  open evidence_report.html in a browser and Print > Save as PDF")

if __name__ == "__main__":
    a = sys.argv[1:]; main(a[0] if a else "demo/punjab_2025_ajnala_ravi_flood.json", a[1] if len(a) > 1 else "https://fasalproof.onrender.com")
