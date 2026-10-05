import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
import numpy as np
from ml import flood_stats
from sign import sign, verify

def test_flood_detected_on_half_plot():
    r = np.random.default_rng(3); pre = r.uniform(.05, .15, (24, 24)); post = pre.copy(); post[:, :12] = 0.005
    s = flood_stats(pre, post); assert 45 <= s["new_flood_pct"] <= 55 and s["mean_change_db"] < 0

def test_no_flood_when_unchanged():
    r = np.random.default_rng(4); a = r.uniform(.05, .15, (24, 24)); assert flood_stats(a, a)["new_flood_pct"] == 0

def test_sign_verify_and_tamper():
    h = "a" * 64; s = sign(h, 1700000000)
    assert verify(h, 1700000000, s) and not verify("b" * 64, 1700000000, s) and not verify(h, 1700000001, s)
