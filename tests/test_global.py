import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
import pytest
from pydantic import ValidationError
main = pytest.importorskip("main")

@pytest.mark.parametrize("lat,lon", [(42.0, -93.5), (-23.3, -51.2), (-33.9, 151.2), (51.5, -0.1), (-1.3, 36.8), (35.7, 139.7)])
def test_worldwide_points_accepted(lat, lon):
    assert main.Query(lat=lat, lon=lon, loss_date="2025-01-10").lat == lat

@pytest.mark.parametrize("lat,lon", [(-70, 0), (89, 0), (10, 181), (10, -181)])
def test_outside_coverage_rejected(lat, lon):
    with pytest.raises(ValidationError): main.Query(lat=lat, lon=lon, loss_date="2025-01-10")
