import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
import numpy as np
from datetime import date, timedelta
from ml import ml_stats, zones_from_grids, theil_sen, kmeans1d

LD = date(2025, 9, 20)

def make_series(drop=True, seed=1):
    r = np.random.default_rng(seed); pts = []
    for dd in range(-60, 46, 6):
        v = 0.45 + 0.002 * dd + r.normal(0, .02) if (dd < 0 or not drop) else 0.2 + r.normal(0, .02)
        pts.append(((LD + timedelta(days=dd)).isoformat(), (round(float(v), 3), 0, 0, 0)))
    return pts

def split(pts):
    bv = [x[0] for d, x in pts if d < LD.isoformat()]; av = [x[0] for d, x in pts if d >= LD.isoformat()]
    return bv, av

def test_theil_sen_recovers_slope():
    x = np.arange(20, dtype=float); y = 0.5 * x + 2
    m, c = theil_sen(x, y); assert abs(m - 0.5) < 1e-9 and abs(c - 2) < 1e-9

def test_drop_detected_with_high_confidence():
    pts = make_series(True); s, fc = ml_stats(pts, LD, *split(pts))
    assert s["confidence"] > 0.99 and s["z"] < -5 and abs(s["offset"]) <= 6 and len(fc) == len(pts)

def test_no_drop_low_confidence():
    pts = make_series(False); s, _ = ml_stats(pts, LD, *split(pts))
    assert s["confidence"] < 0.9

def test_zones_split_damaged_half():
    r = np.random.default_rng(2); a = r.normal(.6, .03, (24, 24)); b = a.copy(); b[:, :12] -= .4
    z = zones_from_grids(a, b); assert 45 <= z["pct"]["severe"] <= 55

def test_kmeans_orders_clusters():
    x = np.concatenate([np.full(30, -.5), np.full(30, 0.0), np.full(30, .3)]); _, c = kmeans1d(x)
    assert c[0] < c[1] < c[2]
