"""
Benchmark pentru asistentul AI multi-tier Domaris.
Trimite un set de interogări etichetate la /ai/agent/chat și înregistrează
intent-ul prezis, tier-ul de rutare și latența. Ritmat pentru rate-limit (20/min).

Rulare:  ml/.venv/bin/python ai-benchmark/run.py
Ieșire:  ai-benchmark/results.json
"""
import json
import time
import urllib.request
import urllib.error
from pathlib import Path

API = "http://localhost:4000/api/ai/agent/chat"
HERE = Path(__file__).resolve().parent
QUERIES = json.loads((HERE / "queries.json").read_text(encoding="utf-8"))
PACE_S = 4.5  # ~13 req/min, marjă sub throttle (20/min) chiar și pt cereri Tier 0 rapide
MAX_RETRIES = 3
RETRY_WAIT_S = 25  # la 429, așteaptă resetarea ferestrei


def _one_call(message: str):
    body = json.dumps({"message": message}).encode("utf-8")
    req = urllib.request.Request(API, data=body, headers={"Content-Type": "application/json"})
    t0 = time.time()
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    latency_ms = (time.time() - t0) * 1000.0
    intent = data.get("intent") or {}
    return {
        "predicted": intent.get("type"),
        "tier": intent.get("tier"),
        "confidence": intent.get("confidence"),
        "tools": data.get("toolsUsed") or [],
        "n_properties": len(data.get("properties") or []),
        "latency_ms": round(latency_ms, 1),
    }


def call(message: str):
    """Apel cu retry pe 429 (rate-limit)."""
    for attempt in range(MAX_RETRIES):
        try:
            return _one_call(message)
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_WAIT_S)
                continue
            raise


def main():
    results = []
    n = len(QUERIES)
    for i, item in enumerate(QUERIES, 1):
        q, expected = item["q"], item["intent"]
        try:
            r = call(q)
            r.update({"q": q, "expected": expected, "ok": True})
            print(f"[{i:>3}/{n}] tier={r['tier']} {expected:>11} -> {r['predicted']:<11} "
                  f"{r['latency_ms']:>7.0f}ms  {q[:40]}")
        except Exception as e:  # noqa: BLE001
            r = {"q": q, "expected": expected, "ok": False, "error": str(e)}
            print(f"[{i:>3}/{n}] EROARE {expected}: {e}  ({q[:40]})")
        results.append(r)
        if i < n:
            time.sleep(PACE_S)

    out = HERE / "results.json"
    out.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    ok = sum(1 for r in results if r.get("ok"))
    print(f"\nSalvat {ok}/{n} rezultate în {out}")


if __name__ == "__main__":
    main()
