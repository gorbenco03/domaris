"""
Analizează rezultatele benchmark-ului AI: acuratețe intent, distribuție tier,
latență și cost estimat vs baseline "doar GPT-4o". Generează figuri (PDF) în
thesis/pics/ și un rezumat metrics.json.

Rulare:  ml/.venv/bin/python ai-benchmark/analyze.py
"""
import json
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sklearn.metrics import f1_score, accuracy_score, confusion_matrix

HERE = Path(__file__).resolve().parent
PICS = HERE.parent.parent / "thesis" / "pics"
PICS.mkdir(parents=True, exist_ok=True)

PRIMARY = "#1F4E79"
LIGHT = "#DAE8F5"
GREEN = "#2E7D32"
ORANGE = "#ED6C02"
RED = "#C62828"

# ── Model de cost (prețuri OpenAI, USD / 1M tokens; documentat în lucrare) ──────
PRICES = {  # (input, output) $/1M
    "gpt-4o": (2.50, 10.0),
    "gpt-4o-mini": (0.15, 0.60),
}
# tokeni estimați per apel (input+output), documentat ca ipoteză
TOK = {
    1: {"in": 400, "out": 150, "model": "gpt-4o-mini"},   # Tier 1: clasificator
    2: {"in": 1500, "out": 400, "model": "gpt-4o"},        # Tier 2: raționament + tools
}
BASELINE = {"in": 1500, "out": 400, "model": "gpt-4o"}      # "doar GPT-4o" pt fiecare cerere


def call_cost(n_in, n_out, model):
    pin, pout = PRICES[model]
    return (n_in * pin + n_out * pout) / 1_000_000.0


def tier_cost(tier):
    if tier == 0:
        return 0.0
    t = TOK[tier]
    return call_cost(t["in"], t["out"], t["model"])


def main():
    results = json.loads((HERE / "results.json").read_text(encoding="utf-8"))
    ok = [r for r in results if r.get("ok")]
    n = len(ok)
    print(f"Rezultate valide: {n}/{len(results)}")

    y_true = [r["expected"] for r in ok]
    y_pred = [r["predicted"] or "unclear" for r in ok]
    labels = sorted(set(y_true) | set(y_pred))

    # ── Metrici intent ──────────────────────────────────────────────────────
    acc = accuracy_score(y_true, y_pred)
    f1m = f1_score(y_true, y_pred, average="macro", labels=labels, zero_division=0)
    f1w = f1_score(y_true, y_pred, average="weighted", labels=labels, zero_division=0)
    print(f"Acuratețe intent: {acc:.3f} | F1 macro: {f1m:.3f} | F1 ponderat: {f1w:.3f}")

    # ── Distribuție tier ────────────────────────────────────────────────────
    tiers = [r["tier"] for r in ok if r["tier"] is not None]
    dist = {t: tiers.count(t) / len(tiers) * 100 for t in [0, 1, 2]}
    print(f"Distribuție tier (%): T0={dist[0]:.1f} T1={dist[1]:.1f} T2={dist[2]:.1f}")

    # ── Latență per tier ────────────────────────────────────────────────────
    lat = {t: [r["latency_ms"] for r in ok if r["tier"] == t] for t in [0, 1, 2]}
    lat_stats = {t: {
        "median": float(np.median(v)) if v else 0.0,
        "p95": float(np.percentile(v, 95)) if v else 0.0,
        "n": len(v),
    } for t, v in lat.items()}
    for t in [0, 1, 2]:
        print(f"  Tier {t}: n={lat_stats[t]['n']} median={lat_stats[t]['median']:.0f}ms p95={lat_stats[t]['p95']:.0f}ms")

    # ── Cost: sistem tiered vs baseline "doar GPT-4o" ───────────────────────
    cost_tiered = sum(tier_cost(r["tier"]) for r in ok if r["tier"] is not None)
    cost_baseline = n * call_cost(BASELINE["in"], BASELINE["out"], BASELINE["model"])
    factor = cost_baseline / cost_tiered if cost_tiered > 0 else float("inf")
    per1k_tiered = cost_tiered / n * 1000
    per1k_base = cost_baseline / n * 1000
    print(f"Cost/1000 cereri:  tiered=${per1k_tiered:.3f}  baseline=${per1k_base:.3f}  "
          f"reducere={factor:.1f}x")

    # ── FIGURA 1: distribuție tier (real vs țintă) ──────────────────────────
    fig, ax = plt.subplots(figsize=(7, 4))
    x = np.arange(3)
    goal = [70, 25, 5]
    real = [dist[0], dist[1], dist[2]]
    w = 0.38
    ax.bar(x - w/2, goal, w, label="Țintă proiectată", color=LIGHT, edgecolor=PRIMARY)
    ax.bar(x + w/2, real, w, label="Măsurat", color=PRIMARY)
    for i, v in enumerate(real):
        ax.text(i + w/2, v + 1, f"{v:.0f}%", ha="center", fontsize=9)
    ax.set_xticks(x); ax.set_xticklabels(["Tier 0\n(reguli, gratuit)", "Tier 1\n(GPT-4o-mini)", "Tier 2\n(GPT-4o)"])
    ax.set_ylabel("Procent din cereri (%)"); ax.set_ylim(0, 100)
    ax.set_title("Distribuția cererilor pe niveluri de rutare")
    ax.legend(); ax.spines[["top", "right"]].set_visible(False)
    fig.tight_layout(); fig.savefig(PICS / "ai_tier_distribution.pdf"); plt.close(fig)

    # ── FIGURA 2: cost comparativ ───────────────────────────────────────────
    fig, ax = plt.subplots(figsize=(6, 4))
    bars = ax.bar(["Router multi-tier", "Doar GPT-4o\n(baseline)"], [per1k_tiered, per1k_base],
                  color=[GREEN, RED], width=0.55)
    for b, v in zip(bars, [per1k_tiered, per1k_base]):
        ax.text(b.get_x() + b.get_width()/2, v, f"${v:.2f}", ha="center", va="bottom", fontsize=10)
    ax.set_ylabel("Cost estimat / 1000 cereri (USD)")
    ax.set_title(f"Cost: reducere de {factor:.1f}x față de baseline")
    ax.spines[["top", "right"]].set_visible(False)
    fig.tight_layout(); fig.savefig(PICS / "ai_cost_comparison.pdf"); plt.close(fig)

    # ── FIGURA 3: matrice de confuzie ───────────────────────────────────────
    cm = confusion_matrix(y_true, y_pred, labels=labels)
    fig, ax = plt.subplots(figsize=(7.5, 6.5))
    im = ax.imshow(cm, cmap="Blues")
    ax.set_xticks(range(len(labels))); ax.set_xticklabels(labels, rotation=45, ha="right", fontsize=8)
    ax.set_yticks(range(len(labels))); ax.set_yticklabels(labels, fontsize=8)
    ax.set_xlabel("Intent prezis"); ax.set_ylabel("Intent real")
    ax.set_title("Matricea de confuzie a clasificării intenției")
    thr = cm.max() / 2 if cm.max() else 0
    for i in range(len(labels)):
        for j in range(len(labels)):
            if cm[i, j]:
                ax.text(j, i, cm[i, j], ha="center", va="center",
                        color="white" if cm[i, j] > thr else "black", fontsize=8)
    fig.colorbar(im, fraction=0.046, pad=0.04)
    fig.tight_layout(); fig.savefig(PICS / "ai_confusion_matrix.pdf"); plt.close(fig)

    # ── metrics.json (pentru text/tabel în lucrare) ─────────────────────────
    metrics = {
        "n": n,
        "accuracy": round(acc, 3),
        "f1_macro": round(f1m, 3),
        "f1_weighted": round(f1w, 3),
        "tier_distribution_pct": {str(k): round(v, 1) for k, v in dist.items()},
        "latency_ms": {str(t): {"median": round(lat_stats[t]["median"]), "p95": round(lat_stats[t]["p95"]), "n": lat_stats[t]["n"]} for t in [0, 1, 2]},
        "cost_per_1000_usd": {"tiered": round(per1k_tiered, 3), "baseline_gpt4o": round(per1k_base, 3), "reduction_factor": round(factor, 1)},
        "cost_assumptions": {"tier1": TOK[1], "tier2": TOK[2], "baseline": BASELINE, "prices_usd_per_1M": PRICES},
    }
    (HERE / "metrics.json").write_text(json.dumps(metrics, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nFiguri salvate în {PICS} (ai_tier_distribution / ai_cost_comparison / ai_confusion_matrix .pdf)")
    print(f"Metrici salvate în {HERE / 'metrics.json'}")


if __name__ == "__main__":
    main()
