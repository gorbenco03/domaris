"""
Simulare Riva-AVM: predictie pe tranzactii reale (real vs estimat) + scenarii what-if.
Ruleaza: .venv/bin/python src/simulate.py
"""
import sys
from pathlib import Path
import pandas as pd
import joblib

sys.path.insert(0, str(Path(__file__).resolve().parent))
from features import FeaturePipeline  # noqa: E402

ML = Path(__file__).resolve().parent.parent
MODELS = ML / "models"

pipe = FeaturePipeline.load(MODELS / "feature_pipeline_v1.pkl")
q10 = joblib.load(MODELS / "lgbm_q10_v1.pkl")
q50 = joblib.load(MODELS / "lgbm_q50_v1.pkl")
q90 = joblib.load(MODELS / "lgbm_q90_v1.pkl")
feat_cols = joblib.load(MODELS / "feature_cols_v1.pkl")


def predict(row: dict):
    df = pd.DataFrame([{**row}])
    if "sale_price_eur" not in df.columns:
        df["sale_price_eur"] = 0.0
    if "price_per_sqm_eur" not in df.columns:
        df["price_per_sqm_eur"] = 0.0
    t = pipe.transform(df, filter_outliers=False)
    for c in feat_cols:
        if c not in t.columns:
            t[c] = 0
    X = t[feat_cols]
    return float(q10.predict(X)[0]), float(q50.predict(X)[0]), float(q90.predict(X)[0])


def full_row(**kw):
    base = {
        "transaction_id": "sim", "transaction_date": "2026-01-15",
        "floor": 3, "total_floors": 9, "year_built": 2010, "is_furnished": True,
        "amenities_count": 3, "amenities_list": "parking|elevator|balcony",
        "lat": 46.99, "lng": 28.86, "sale_price_eur": 0.0, "price_per_sqm_eur": 0.0,
        "data_source": "internal", "is_verified": True,
    }
    base.update(kw)
    return base


print("=" * 78)
print("  SIMULARE 1 — PRET REAL vs ESTIMAT (8 tranzactii reale recente)")
print("=" * 78)
data = pd.read_csv(ML / "data" / "real_transactions.csv")
valid = {"Chisinau", "Balti", "Cahul", "Ungheni", "Orhei"}
sample = data[data.city.isin(valid)].sort_values("transaction_date").tail(8)

errs, in_ci = [], 0
for _, r in sample.iterrows():
    lo, mid, hi = predict(r.to_dict())
    actual = float(r["sale_price_eur"])
    err = abs(mid - actual) / actual * 100
    errs.append(err)
    ci = lo <= actual <= hi
    in_ci += ci
    print(f"  {r.city:9} {r.property_type:9} {int(r.rooms)}cam {int(r.surface_sqm):>3}mp | "
          f"REAL {int(actual):>7,}E | EST {int(mid):>7,}E  [{int(lo):>6,}-{int(hi):>6,}] | "
          f"eroare {err:4.1f}% | in interval: {'DA' if ci else 'nu'}")
print(f"\n  MAPE pe esantion: {sum(errs)/len(errs):.1f}%   |   acoperire interval: {in_ci}/{len(sample)}")

print()
print("=" * 78)
print("  SIMULARE 2 — WHAT-IF: apartament Chisinau/Botanica, 2 camere, variem suprafata")
print("=" * 78)
for s in [40, 55, 70, 90]:
    lo, mid, hi = predict(full_row(city="Chisinau", neighborhood="Botanica",
                                   property_type="APARTMENT", rooms=2, surface_sqm=s))
    print(f"  {s:>3} mp  ->  {int(mid):>7,} E   interval [{int(lo):>6,} - {int(hi):>6,}]")

print()
print("=" * 78)
print("  SIMULARE 3 — WHAT-IF: acelasi apartament (55mp), variem orasul")
print("=" * 78)
for city, nb in [("Chisinau", "Botanica"), ("Balti", "Centru"),
                 ("Cahul", "Centru"), ("Orhei", "Centru")]:
    lo, mid, hi = predict(full_row(city=city, neighborhood=nb,
                                   property_type="APARTMENT", rooms=2, surface_sqm=55))
    print(f"  {city:9} ({nb:8}) ->  {int(mid):>7,} E   interval [{int(lo):>6,} - {int(hi):>6,}]")
