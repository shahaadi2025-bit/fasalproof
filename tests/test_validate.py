import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "validation"))
from validate import metrics

def test_perfect_classifier():
    rows = [{"expected": "damage", "loss_pct": 60.0, "reported": "55"}, {"expected": "none", "loss_pct": 3.0}]
    m = metrics(rows, 25); assert m["precision"] == 1 and m["recall"] == 1 and m["accuracy"] == 1 and m["mae_vs_reported"] == 5.0

def test_false_positive_and_miss_and_missing_data():
    rows = [{"expected": "damage", "loss_pct": 10.0}, {"expected": "none", "loss_pct": 40.0}, {"expected": "none", "loss_pct": None}]
    m = metrics(rows, 25); assert (m["tp"], m["fn"], m["fp"], m["tn"], m["n"]) == (0, 1, 1, 0, 2) and m["precision"] == 0
