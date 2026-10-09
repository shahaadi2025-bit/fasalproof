import sys, pathlib, json, threading, hashlib
from http.server import BaseHTTPRequestHandler, HTTPServer
ROOT = pathlib.Path(__file__).resolve().parents[1]; sys.path.insert(0, str(ROOT)); sys.path.insert(0, str(ROOT / "demo"))
import numpy as np
import case_study as cs
from ml import chip_b64
import sign as signer

def test_grid_is_five_points_about_step_apart():
    g = cs.grid(31.9, 74.9, 700); assert [p[0] for p in g] == ["centre", "north", "south", "east", "west"]
    assert abs((g[1][1] - g[0][1]) * 111320 - 700) < 1 and abs((g[3][2] - g[0][2]) * 111320 * np.cos(np.radians(31.9)) - 700) < 1

def test_selection_uses_pre_event_canopy_not_loss():
    c = [{"res": {"baseline_ndvi": .5, "images_used": 9, "loss_pct": 80}}, {"res": {"baseline_ndvi": .7, "images_used": 8, "loss_pct": 5}}, {"res": None}]
    assert cs.select(c)["res"]["loss_pct"] == 5 and cs.select([{"res": None}]) is None

def test_climatology_percentile_and_incomplete_window():
    d = [((__import__("datetime").date(y, 8, 27) + __import__("datetime").timedelta(days=k)).isoformat(), 30.0 if y == 2025 else 2.0) for y in range(2015, 2026) for k in range(-7, 8)]
    c = cs.clim_rain(d, "2025-08-27"); assert c["cur"] == 210 and c["pct"] == 100 and c["median"] == 14 and len(c["hist"]) == 10
    assert cs.clim_rain(d[:5], "2025-08-27") is None

def test_norm_makes_python_and_js_canonical_json_agree():
    assert cs.canon(cs.norm({"b": 14.0, "a": [1.5, 2.0], "z": "é"})) == '{"a":[1.5,2],"b":14,"z":"é"}'

class Mock(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def _send(self, code, obj): b = json.dumps(obj).encode(); self.send_response(code); self.send_header("Content-Type", "application/json"); self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_GET(self): self._send(200, {"status": "ok", "version": "4.4"})
    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        if self.path == "/sign":
            import time; ts = int(time.time()); return self._send(200, {"hash": body["hash"], "signed_at": ts, "sig": signer.sign(body["hash"], ts), "key_id": signer.KEY_ID, "ephemeral": False})
        if self.path == "/sar": return self._send(404, {"detail": "No Sentinel-1 before/after pair"})
        lat, lon, yr = body["lat"], body["lon"], body["loss_date"][:4]
        if abs(lon - MOCK["west"]) < 1e-9: return self._send(404, {"detail": "Found 14 scenes but only 3 had a clear view of your plot."})
        base = 0.62 + (lat - MOCK["lat"]) * 800
        png = chip_b64(*[np.full((24, 24), v, dtype="float32") for v in (1400, 1700, 1100)])
        self._send(200, {"loss_pct": 6.0 if yr != "2025" else 41.5, "baseline_ndvi": round(base, 3), "images_used": 11, "water_pct": 12.0, "stats": {"ci": [30.2, 52.8], "z": -4.2, "confidence": 0.998, "break_date": "2025-08-29", "offset": 2},
                         "chips": {"half_m": 300, "plot_frac": 0.333, "before": {"date": "2025-08-20", "png": png}, "after": {"date": "2025-09-06", "png": png}}})
MOCK = {}

def test_end_to_end_with_mock_api(tmp_path):
    cfg = json.loads((ROOT / "demo" / "punjab_2025_ajnala_ravi_flood.json").read_text(encoding="utf-8")); cfg.update({"lat": 31.90, "lon": 74.90, "place_queries": []})
    MOCK.update(lat=31.90, west=74.90 - 700 / (111320.0 * np.cos(np.radians(31.90))))
    srv = HTTPServer(("127.0.0.1", 0), Mock); threading.Thread(target=srv.serve_forever, daemon=True).start()
    cp = tmp_path / "cfg.json"; cp.write_text(json.dumps(cfg), encoding="utf-8")
    try: cs.main(str(cp), f"http://127.0.0.1:{srv.server_port}", outdir=str(tmp_path / "out"), points=5, delay=0)
    finally: srv.shutdown()
    out = tmp_path / "out" / cfg["slug"]; rep = (out / "evidence_report.html").read_text(encoding="utf-8")
    for needle in ["Documented event", "Before · 2025-08-20", "After · 2025-09-06", "Selection rule", "False-positive check", "Limitations", "data:image/png;base64", "41.5%", "tribuneindia.com"]: assert needle in rep, needle
    csvt = (out / "candidates.csv").read_text(encoding="utf-8"); assert "clear view" in csvt and csvt.count("\n") == 6   # header + 5 points, one failed honestly
    sel = json.loads((out / "raw_results.json").read_text(encoding="utf-8"))["selected"]; assert sel == "north"   # highest pre-event NDVI wins
    b = json.loads((out / "signed_bundle.json").read_text(encoding="utf-8")); assert hashlib.sha256(cs.canon(b["payload"]).encode()).hexdigest() == b["hash"] and signer.verify(b["hash"], b["signed_at"], b["sig"])
    tampered = dict(b["payload"], loss_pct=1); assert hashlib.sha256(cs.canon(tampered).encode()).hexdigest() != b["hash"]
    assert (out / "before.png").read_bytes().startswith(b"\x89PNG") and [c["loss"] for c in json.loads((out / "raw_results.json").read_text(encoding="utf-8"))["controls"]] == [6.0, 6.0]
