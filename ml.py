"""FasalProof analytics: robust regression, change-point detection, bootstrap CI, k-means damage zones (numpy only)."""
import math
from datetime import date
import numpy as np

def theil_sen(x, y):
    s = [(y[j] - y[i]) / (x[j] - x[i]) for i in range(len(x)) for j in range(i + 1, len(x)) if x[j] != x[i]]
    m = float(np.median(s)) if s else 0.0
    return m, float(np.median(np.asarray(y) - m * np.asarray(x)))

def changepoint(v):
    best = (0.0, None)
    for k in range(3, len(v) - 2):
        a, b = v[:k], v[k:]
        t = abs(a.mean() - b.mean()) / (math.sqrt(np.var(a) / len(a) + np.var(b) / len(b)) + 1e-6)
        if t > best[0]: best = (t, k)
    return best

def kmeans1d(x, k=3, it=30):
    c = np.percentile(x, [10, 50, 90]).astype(float)
    for _ in range(it):
        lab = np.argmin(np.abs(x[:, None] - c[None, :]), axis=1)
        for j in range(k):
            if (lab == j).any(): c[j] = x[lab == j].mean()
    return lab, c

def ml_stats(pts, ld, bv, av):
    """pts: [(iso_date,(ndvi,...))]; counterfactual NDVI via Theil-Sen on pre-loss data."""
    xs = np.array([(date.fromisoformat(d) - ld).days for d, _ in pts], float)
    ys = np.array([x[0] for _, x in pts], float)
    pre, post = xs < 0, xs >= 0
    m, c = theil_sen(xs[pre], ys[pre]) if pre.sum() >= 3 else (0.0, float(np.median(ys[pre])))
    exp = np.clip(m * xs + c, 0.05, float(ys[pre].max()) * 1.05)
    res = ys[pre] - exp[pre]
    sigma = max(0.03, 1.4826 * float(np.median(np.abs(res - np.median(res)))))
    z = float(np.mean(ys[post] - exp[post]) / sigma)
    conf = 0.5 * math.erfc(z / math.sqrt(2))          # P(drop is not natural variation)
    rng = np.random.default_rng(42); b_, a_ = np.array(bv), np.array(av)
    boot = [1 - rng.choice(a_, len(a_)).mean() / max(np.percentile(rng.choice(b_, len(b_)), 90), 1e-3) for _ in range(1000)]
    ci = [round(max(0, float(np.percentile(boot, 2.5))) * 100, 1), round(min(1, max(0, float(np.percentile(boot, 97.5)))) * 100, 1)]
    bd, off = None, None
    if len(ys) >= 6:
        t, k = changepoint(ys)
        if k is not None: bd = pts[k][0]; off = (date.fromisoformat(bd) - ld).days
    fc = [{"date": d, "exp": round(float(e), 3), "lo": round(max(0.0, float(e) - 1.96 * sigma), 3), "hi": round(float(e) + 1.96 * sigma, 3)} for (d, _), e in zip(pts, exp)]
    return {"z": round(z, 2), "confidence": round(conf, 4), "ci": ci, "break_date": bd, "offset": off,
            "slope_per_day": round(m, 5), "sigma": round(sigma, 3), "exp_post": round(float(exp[post].mean()), 3)}, fc

def zones_from_grids(nd0, nd1):
    dl = nd1 - nd0; v = np.isfinite(dl)
    if v.sum() < 40: return None
    lab, c = kmeans1d(dl[v])
    cls = np.where(c < -0.15, 0, np.where(c < -0.05, 1, 2))
    g = np.full(dl.shape, -1, int); g[v] = cls[lab]; t = v.sum()
    pct = [round(float((g == k).sum() / t * 100), 1) for k in (0, 1, 2)]
    return {"grid": g.tolist(), "pct": {"severe": pct[0], "moderate": pct[1], "stable": pct[2]},
            "centers": [round(float(x), 3) for x in c], "pixels": int(t)}

def to_db(x): return 10 * np.log10(np.clip(x, 1e-6, None))

def flood_stats(pre_lin, post_lin, water_db=-15.0, drop_db=3.0):
    """Sentinel-1 VV change detection: open water is dark (< -15 dB); a new flood is dark AND >3 dB darker than before."""
    ok = np.isfinite(pre_lin) & np.isfinite(post_lin) & (pre_lin > 0) & (post_lin > 0)
    if ok.sum() < 30: return None
    pre, post = to_db(pre_lin[ok]), to_db(post_lin[ok]); fl = (post < water_db) & ((post - pre) < -drop_db)
    return {"pixels": int(ok.sum()), "water_post_pct": round(float((post < water_db).mean() * 100), 1),
            "new_flood_pct": round(float(fl.mean() * 100), 1), "mean_change_db": round(float((post - pre).mean()), 2)}


# ---- True-colour chips (pure numpy + zlib; no imaging library needed) ----
import struct, zlib, base64

def stretch(dn):
    """Indicative true-colour stretch for Sentinel-2 L2A digital numbers (reflectance x 10000, with the 1000 offset)."""
    return (np.clip((np.asarray(dn, dtype="float32") - 800.0) / 2600.0, 0, 1) ** 0.6 * 255).astype("uint8")

def png_bytes(rgb):
    """Encode an HxWx3 uint8 array as a PNG."""
    rgb = np.ascontiguousarray(rgb, dtype="uint8"); h, w, _ = rgb.shape
    raw = b"".join(b"\x00" + rgb[y].tobytes() for y in range(h))
    def chunk(t, d): c = struct.pack(">I", len(d)) + t + d; return c + struct.pack(">I", zlib.crc32(t + d) & 0xFFFFFFFF)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(raw, 6)) + chunk(b"IEND", b"")

def chip_b64(red, green, blue):
    return base64.b64encode(png_bytes(np.dstack([stretch(red), stretch(green), stretch(blue)]))).decode()
