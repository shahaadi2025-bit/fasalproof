"""Ed25519 report signing. Set SIGNING_KEY (base64 of 32 random bytes) in the host's environment so signatures survive restarts."""
import base64, os
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
_seed = os.environ.get("SIGNING_KEY")
_key = Ed25519PrivateKey.from_private_bytes(base64.b64decode(_seed)) if _seed else Ed25519PrivateKey.generate()
EPHEMERAL = not _seed
_pub = _key.public_key()
PUB_B64 = base64.b64encode(_pub.public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)).decode()
KEY_ID = PUB_B64[:12]
def sign(h, ts): return base64.b64encode(_key.sign(f"{h}|{ts}".encode())).decode()
def verify(h, ts, sig):
    try: _pub.verify(base64.b64decode(sig), f"{h}|{ts}".encode()); return True
    except (InvalidSignature, ValueError): return False
