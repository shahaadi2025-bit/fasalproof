"""Scores FasalProof against documented events (standard library only)."""
import csv, json, sys, time, urllib.request

def call(api, row):
    body = json.dumps({"lat": float(row["lat"]), "lon": float(row["lon"]), "loss_date": row["loss_date"]}).encode()
    req = urllib.request.Request(api + "/analyze", body, {"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=240) as r: return json.load(r)
    except Exception as e: return {"error": str(e)}

def metrics(rows, thr=25.0):
    tp = fp = tn = fn = 0; err = []
    for r in rows:
        if r.get("loss_pct") is None: continue
        hit = r["loss_pct"] >= thr
        if r["expected"] == "damage": tp += hit; fn += (not hit)
        else: fp += hit; tn += (not hit)
        if r.get("reported") not in (None, ""): err.append(abs(r["loss_pct"] - float(r["reported"])))
    d = lambda a, b: round(a / b, 3) if b else None
    return {"thr": thr, "n": tp + fp + tn + fn, "tp": tp, "fp": fp, "tn": tn, "fn": fn, "precision": d(tp, tp + fp), "recall": d(tp, tp + fn),
            "specificity": d(tn, tn + fp), "accuracy": d(tp + tn, tp + fp + tn + fn), "mae_vs_reported": round(sum(err) / len(err), 1) if err else None}

def main():
    api = sys.argv[1] if len(sys.argv) > 1 else "https://fasalproof.onrender.com"; path = sys.argv[2] if len(sys.argv) > 2 else "validation/events.csv"
    rows = [r for r in csv.DictReader(open(path, encoding="utf-8")) if r.get("lat") and r.get("expected") in ("damage", "none")]
    if not rows: print("No usable rows in", path, "- see validation/README.md"); return
    for r in rows:
        res = call(api, r); r["loss_pct"] = res.get("loss_pct"); r["status"] = "ok" if r["loss_pct"] is not None else str(res.get("error", "error"))[:80]
        print(f'{r.get("id","")}\t{r["expected"]}\tloss={r["loss_pct"]}\t{r["status"]}'); time.sleep(4)
    print("\nthreshold results (loss % at or above threshold counts as 'damage detected'):")
    for t in (15, 25, 35, 50): print(metrics(rows, t))
    skipped = sum(1 for r in rows if r["loss_pct"] is None)
    if skipped: print(f"\n{skipped} row(s) had no result (cloud cover or error). Report them as 'no data', not as correct.")
    with open("validation/results.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)

if __name__ == "__main__": main()
