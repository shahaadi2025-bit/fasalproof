import sys, pathlib, io, struct, zlib, base64
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
import numpy as np
from ml import png_bytes, stretch, chip_b64

def test_png_roundtrip():
    from PIL import Image
    a = np.random.default_rng(1).integers(0, 255, (24, 31, 3), dtype="uint8")
    im = Image.open(io.BytesIO(png_bytes(a))); assert im.size == (31, 24) and im.mode == "RGB" and np.array_equal(np.array(im), a)

def test_stretch_is_monotonic_and_bounded():
    s = stretch(np.array([0, 800, 1500, 2500, 3400, 9000])); assert s[0] == 0 and s[1] == 0 and s[-1] == 255 and all(np.diff(s.astype(int)) >= 0)

def test_chip_b64_decodes_to_png():
    b = base64.b64decode(chip_b64(*[np.full((8, 8), v, dtype="float32") for v in (1200, 1500, 900)])); assert b.startswith(b"\x89PNG")
