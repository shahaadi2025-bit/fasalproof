"""FasalProof backend v2: real Sentinel-2 NDVI, free, no API key. Validation, caching, rate limiting, retries, parallel reads."""
import logging, time, threading, math
from collections import defaultdict, deque
from concurrent.futures import ThreadPoolExecutor
from datetime import date, timedelta
from math import cos, radians
import numpy as np, rasterio, requests
from rasterio.warp import transform_bounds
from rasterio.windows import from_bounds
from rasterio.enums import Resampling
from ml import ml_stats, zones_from_grids
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("fasalproof")
STAC = "https://earth-search.aws.element84.com/v1/search"
app = FastAPI(title="FasalProof API", version="2.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class Query(BaseModel):
    lat: float = Field(ge=6, le=38)     # India bounds
    lon: float = Field(ge=68, le=98)
    loss_date: date
    days_before: int = Field(60, ge=30, le=120)
    days_after: int = Field(45, ge=15, le=90)
    half_size_m: int = Field(100, ge=30, le=500)
    @field_validator("loss_date")
    @classmethod
    def not_future(cls, v):
        if v > date.today(): raise ValueError("loss_date cannot be in the future")
        if v < date(2017, 1, 1): raise ValueError("Sentinel-2 data starts 2017")
        return v

_cache, _hits = {}, defaultdict(deque)
_lock = threading.Lock()
TTL, LIMIT = 3600, 20  # cache 1h; 20 req/min per IP

def rate_limit(ip):
    now = time.time()
    with _lock:
        q = _hits[ip]
        while q and now - q[0] > 60: q.popleft()
        if len(q) >= LIMIT: raise HTTPException(429, "Too many requests. Try again in a minute.")
        q.append(now)

def bbox_of(lat, lon, m):
    dlat, dlon = m / 111320, m / (111320 * cos(radians(lat)))
    return [lon - dlon, lat - dlat, lon + dlon, lat + dlat]

def scene_stats(item, bbox):
    """Plot-level stats with per-pixel cloud masking (Sentinel-2 SCL): NDVI, NDWI, water fraction."""
    try:
        a = item["assets"]
        with rasterio.Env(AWS_NO_SIGN_REQUEST="YES", GDAL_HTTP_TIMEOUT="20"):
            with rasterio.open(a["red"]["href"]) as r:
                w = from_bounds(*transform_bounds("EPSG:4326", r.crs, *bbox), transform=r.transform)
                red = r.read(1, window=w).astype("float32")
            def rd(k, res=Resampling.bilinear):
                with rasterio.open(a[k]["href"]) as s:
                    ww = from_bounds(*transform_bounds("EPSG:4326", s.crs, *bbox), transform=s.transform)
                    return s.read(1, window=ww, out_shape=red.shape, resampling=res).astype("float32")
            nir, green, scl = rd("nir"), rd("green"), rd("scl", Resampling.nearest)
        valid = np.isin(scl, [4, 5, 6]) & (red > 0) & (nir > 0)   # veg, bare soil, water; drops cloud/shadow
        if valid.size == 0 or valid.mean() < 0.5: return None
        ndvi = float(np.mean(((nir - red) / (nir + red + 1e-6))[valid]))
        ndwi_a = ((green - nir) / (green + nir + 1e-6))[valid]
        return item["properties"]["datetime"][:10], ndvi, float(np.mean(ndwi_a)), float(np.mean(ndwi_a > 0.05)), item["assets"].get("thumbnail", {}).get("href")
    except Exception as e:
        log.warning("scene skipped: %s", e); return None

def ndvi_grid(item, bbox, n=24):
    a = item["assets"]; arr = []
    with rasterio.Env(AWS_NO_SIGN_REQUEST="YES", GDAL_HTTP_TIMEOUT="20"):
        for k, rs in (("red", Resampling.bilinear), ("nir", Resampling.bilinear), ("scl", Resampling.nearest)):
            with rasterio.open(a[k]["href"]) as s:
                w = from_bounds(*transform_bounds("EPSG:4326", s.crs, *bbox), transform=s.transform)
                arr.append(s.read(1, window=w, out_shape=(n, n), resampling=rs).astype("float32"))
    red, nir, scl = arr
    ok = np.isin(scl, [4, 5, 6]) & (red > 0) & (nir > 0)
    return np.where(ok, (nir - red) / (nir + red + 1e-6), np.nan)

def damage_zones(bi, ai, bbox):
    try:
        if not bi or not ai: return None
        return zones_from_grids(ndvi_grid(bi, bbox), ndvi_grid(ai, bbox))
    except Exception as e:
        log.warning("zones failed: %s", e); return None

def stac_search(body):
    for attempt in range(3):
        try:
            r = requests.post(STAC, json=body, timeout=30)
            if r.status_code == 200: return r.json().get("features", [])
        except requests.RequestException as e: log.warning("STAC retry %s: %s", attempt, e)
        time.sleep(1.5 * (attempt + 1))
    raise HTTPException(502, "Satellite catalog unavailable. Please retry.")

@app.get("/")
@app.get("/health")
def health(): return {"status": "ok", "app": "FasalProof", "version": "2.0"}

@app.post("/analyze")
def analyze(q: Query, request: Request):
    rate_limit(request.client.host if request.client else "anon")
    key = (round(q.lat, 4), round(q.lon, 4), q.loss_date, q.days_before, q.days_after, q.half_size_m)
    if key in _cache and time.time() - _cache[key][0] < TTL: return _cache[key][1]
    bb = bbox_of(q.lat, q.lon, q.half_size_m)
    for mult in (1, 2):   # auto-widen window if too few usable scenes
        db, da = min(q.days_before * mult, 180), min(q.days_after * mult, 120)
        feats = stac_search({"collections": ["sentinel-2-l2a"], "bbox": bb, "limit": 100,
            "datetime": f"{q.loss_date - timedelta(days=db)}T00:00:00Z/{q.loss_date + timedelta(days=da)}T23:59:59Z",
            "query": {"eo:cloud_cover": {"lt": 90}}})
        with ThreadPoolExecutor(6) as ex: res = [x for x in ex.map(lambda f: scene_stats(f, bb), feats) if x]
        data = {}
        for d, v, nw, wf, th in res: data.setdefault(d, (v, nw, wf, th))
        pts = sorted(data.items())
        before = [(d, x) for d, x in pts if date.fromisoformat(d) < q.loss_date]
        after = [(d, x) for d, x in pts if date.fromisoformat(d) >= q.loss_date]
        if len(before) >= 2 and after: break
    else:
        raise HTTPException(404, f"Found {len(feats)} scenes but only {len(pts)} had a clear view of your plot. Try another date or move the pin.")
    bv, av = [x[0] for _, x in before], [x[0] for _, x in after]
    base, post = float(np.percentile(bv, 90)), float(np.mean(av))
    loss = round(min(100, max(0, (1 - post / base) * 100)), 1)
    water = round(max(0.0, max(x[2] for _, x in after) - float(np.mean([x[2] for _, x in before]))) * 100, 1)
    n = len(pts)
    fd = {}
    for f in feats: fd.setdefault(f["properties"]["datetime"][:10], f)
    stats, fc = ml_stats(pts, q.loss_date, bv, av)
    zones = damage_zones(fd.get(before[-1][0]), fd.get(after[0][0]), bb)
    out = {"forecast": fc, "stats": stats, "zones": zones, "series": [{"date": d, "ndvi": round(x[0], 3), "ndwi": round(x[1], 3)} for d, x in pts],
        "baseline_ndvi": round(base, 3), "post_ndvi": round(post, 3), "loss_pct": loss, "water_pct": water,
        "severity": "severe" if loss >= 50 else "moderate" if loss >= 25 else "low",
        "confidence": "high" if n >= 8 else "medium" if n >= 5 else "low", "images_used": n,
        "before_img": before[-1][1][3], "after_img": after[0][1][3],
        "source": "Sentinel-2 L2A via Earth Search (ESA/AWS open data), SCL cloud-masked"}
    _cache[key] = (time.time(), out)
    return out
