"""
Evaluare model Riva-AVM v1 pe setul de test.

Incarca modelul serializat si raporteaza metricile MAE/MAPE/RMSE/R²
pe setul de test, alaturi de analiza intervalelor de incredere.

Utilizare:
    python src/evaluate.py
    python src/evaluate.py --data data/real_transactions.csv --models models/
"""

from __future__ import annotations

import argparse
import json
import warnings
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")

import sys
sys.path.insert(0, str(Path(__file__).parent))
from features import FeaturePipeline, get_model_feature_cols
from train import (
    TRAIN_FRAC, VAL_FRAC,
    compute_metrics, print_metrics,
)

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluare Riva-AVM v1")
    parser.add_argument("--data",   default="data/synthetic_transactions.csv")
    parser.add_argument("--models", default="models",
                        help="Director cu modelele serializate")
    args = parser.parse_args()

    models_dir = Path(args.models)

    # -----------------------------------------------------------------------
    # 1. Verifica existenta modelelor
    # -----------------------------------------------------------------------
    required = [
        "feature_pipeline_v1.pkl",
        "lgbm_q10_v1.pkl",
        "lgbm_q50_v1.pkl",
        "lgbm_q90_v1.pkl",
        "feature_cols_v1.pkl",
    ]
    missing = [f for f in required if not (models_dir / f).exists()]
    if missing:
        print(f"EROARE: Lipsesc fisierele de model:\n  {missing}")
        print("Ruleaza mai intai: python src/train.py")
        return

    # -----------------------------------------------------------------------
    # 2. Incarcare modele
    # -----------------------------------------------------------------------
    print("\n[1/4] Incarc modele...")
    pipeline   = FeaturePipeline.load(models_dir / "feature_pipeline_v1.pkl")
    model_q10  = joblib.load(models_dir / "lgbm_q10_v1.pkl")
    model_q50  = joblib.load(models_dir / "lgbm_q50_v1.pkl")
    model_q90  = joblib.load(models_dir / "lgbm_q90_v1.pkl")
    feature_cols = joblib.load(models_dir / "feature_cols_v1.pkl")
    print(f"  Modele incarcate din: {models_dir}")

    # Incarca model_card daca exista
    card_path = models_dir / "model_card.json"
    if card_path.exists():
        with open(card_path) as f:
            card = json.load(f)
        print(f"  Model version: {card.get('model_version', '?')}")
        print(f"  Antrenat la:   {card.get('trained_at', '?')}")

    # -----------------------------------------------------------------------
    # 3. Incarcare date si extragere set de test
    # -----------------------------------------------------------------------
    print(f"\n[2/4] Incarc date: {args.data}")
    df = pd.read_csv(args.data, parse_dates=["transaction_date"])
    df = df[df["is_verified"] | (df["data_source"] == "cadastru")].copy()
    df = df.sort_values("transaction_date").reset_index(drop=True)

    n = len(df)
    n_train = int(n * TRAIN_FRAC)
    n_val   = int(n * VAL_FRAC)
    df_test = df.iloc[n_train + n_val:].copy()
    print(f"  Test set: {len(df_test)} randuri  "
          f"({df_test['transaction_date'].min().date()} — {df_test['transaction_date'].max().date()})")

    # -----------------------------------------------------------------------
    # 4. Feature engineering (transform only)
    # -----------------------------------------------------------------------
    print("\n[3/4] Feature engineering...")
    df_test_t = pipeline.transform(df_test)
    X_test = df_test_t[feature_cols].values.astype(float)
    y_test = df_test_t["sale_price_eur"].values.astype(float)

    # -----------------------------------------------------------------------
    # 5. Predictii si evaluare
    # -----------------------------------------------------------------------
    print("\n[4/4] Evaluare...")

    preds_q10 = model_q10.predict(X_test)
    preds_q50 = model_q50.predict(X_test)
    preds_q90 = model_q90.predict(X_test)

    # Clip la valori pozitive
    preds_q10 = np.maximum(preds_q10, 1000)
    preds_q50 = np.maximum(preds_q50, 1000)
    preds_q90 = np.maximum(preds_q90, 1000)

    m = compute_metrics(y_test, preds_q50)

    print("\n" + "=" * 65)
    print("  RIVA-AVM v1 — METRICI PE SETUL DE TEST")
    print("=" * 65)
    print(f"  MAE  (eroare absoluta medie)    : {m['MAE']:>10,.0f} EUR")
    print(f"  MAPE (eroare procentuala medie) : {m['MAPE']:>10.1f} %")
    print(f"  RMSE (root mean sq. error)      : {m['RMSE']:>10,.0f} EUR")
    print(f"  R²   (coef. determinare)        : {m['R2']:>10.4f}")

    # Coverage intervale
    in_interval = ((y_test >= preds_q10) & (y_test <= preds_q90)).mean()
    mean_interval_width = (preds_q90 - preds_q10).mean()
    mean_interval_pct   = ((preds_q90 - preds_q10) / preds_q50).mean() * 100

    print("\n  Intervale de incredere (q10—q90):")
    print(f"  Coverage empiric                : {in_interval * 100:.1f}%  (tinta: ≥80%)")
    print(f"  Latime medie interval           : {mean_interval_width:>10,.0f} EUR")
    print(f"  Latime medie interval (%)       : {mean_interval_pct:>10.1f}%")

    # Benchmark vs. tinte din ML-PLAN.md
    print("\n  Comparatie cu tintele din ML-PLAN.md:")
    checks = [
        ("MAPE < 15% (minim)",   m["MAPE"] < 15,  f"{m['MAPE']:.1f}%"),
        ("MAPE < 10% (optim)",   m["MAPE"] < 10,  f"{m['MAPE']:.1f}%"),
        ("MAE  < 8000 EUR (min)",m["MAE"]  < 8000, f"{m['MAE']:,.0f}"),
        ("MAE  < 5000 EUR (opt)",m["MAE"]  < 5000, f"{m['MAE']:,.0f}"),
        ("R² > 0.80 (minim)",    m["R2"]   > 0.80, f"{m['R2']:.4f}"),
        ("R² > 0.88 (optim)",    m["R2"]   > 0.88, f"{m['R2']:.4f}"),
    ]
    for label, ok, val in checks:
        status = "OK" if ok else "NU"
        print(f"    [{status}] {label:35s}  valoare: {val}")

    # Distributia erorilor per oras
    print("\n  Eroare medie per oras (MAPE %):")
    df_eval = df_test_t.copy()
    df_eval["pred_q50"] = preds_q50
    df_eval["abs_pct_err"] = np.abs(df_eval["sale_price_eur"] - df_eval["pred_q50"]) / df_eval["sale_price_eur"] * 100
    city_mape = df_eval.groupby("city")["abs_pct_err"].mean().round(1)
    for city, mape_val in city_mape.items():
        print(f"    {city:15s}: {mape_val:.1f}%")

    # Distributia erorilor per property_type
    print("\n  Eroare medie per tip proprietate (MAPE %):")
    type_mape = df_eval.groupby("property_type")["abs_pct_err"].mean().round(1)
    for ptype, mape_val in type_mape.items():
        print(f"    {ptype:15s}: {mape_val:.1f}%")

    print("\n" + "=" * 65)

    # Citeste model_card si afiseaza top SHAP
    if card_path.exists():
        top_shap = card.get("shap_top10_features", {})
        if top_shap:
            print("\n  Top-10 Features (SHAP — din model_card.json):")
            for feat, val in list(top_shap.items())[:10]:
                print(f"    {feat:35s}  {val:>8.1f}")

    print("\n  Evaluare completa.")


if __name__ == "__main__":
    main()
