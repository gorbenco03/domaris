"""
Antrenare model AVM — Riva-AVM v1.

Pasi:
  1. Incarca date (sintetice sau reale).
  2. Split temporal 70/15/15 (train/val/test).
  3. Feature engineering (fit pe train, transform pe val/test).
  4. Baseline-uri (medie/mediana zonala, LinearRegression, Ridge, RandomForest).
  5. LightGBM cu tuning Optuna (quantile q10/q50/q90).
  6. Evaluare MAE/MAPE/RMSE/R² pe val si test.
  7. SHAP feature importance.
  8. Serializare model + FeaturePipeline + model_card.json.

Utilizare:
    python src/train.py
    python src/train.py --data data/real_transactions.csv --trials 100
"""

from __future__ import annotations

import argparse
import json
import time
import warnings
from pathlib import Path

import joblib
import lightgbm as lgb
import numpy as np
import optuna
import pandas as pd
import shap
from sklearn.linear_model import Lasso, LinearRegression, Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import TimeSeriesSplit

warnings.filterwarnings("ignore")
optuna.logging.set_verbosity(optuna.logging.WARNING)

import sys
sys.path.insert(0, str(Path(__file__).parent))
from features import FeaturePipeline, get_model_feature_cols

# ---------------------------------------------------------------------------
# Constante
# ---------------------------------------------------------------------------

MODEL_VERSION = "riva-avm-v1.0.0"
MODELS_DIR = Path("models")
DATA_DIR = Path("data")
RANDOM_STATE = 42

TRAIN_FRAC = 0.70
VAL_FRAC   = 0.15
# TEST = restul (15%)

LGBM_BASE_PARAMS = {
    "objective": "regression",
    "metric":    "mae",
    "verbosity": -1,
    "random_state": RANDOM_STATE,
    "n_jobs": -1,
}

QUANTILE_ALPHAS = {"q10": 0.10, "q50": 0.50, "q90": 0.90}


# ---------------------------------------------------------------------------
# Metrici
# ---------------------------------------------------------------------------

def compute_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    mae  = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    r2   = r2_score(y_true, y_pred)
    # MAPE (evitam impartirea la zero)
    mask = y_true > 0
    mape = np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100
    return {"MAE": round(mae, 2), "MAPE": round(mape, 2), "RMSE": round(rmse, 2), "R2": round(r2, 4)}


def print_metrics(name: str, metrics: dict) -> None:
    print(f"  {name:35s} | MAE={metrics['MAE']:>9,.0f} EUR | MAPE={metrics['MAPE']:>5.1f}% | "
          f"RMSE={metrics['RMSE']:>9,.0f} | R2={metrics['R2']:.4f}")


# ---------------------------------------------------------------------------
# Baseline-uri
# ---------------------------------------------------------------------------

def baseline_zone_mean(X_train: pd.DataFrame, y_train: np.ndarray,
                       X_test: pd.DataFrame) -> np.ndarray:
    """Medie a preturilor per neighborhood din train."""
    train_df = X_train.copy()
    train_df["_y"] = y_train
    means = train_df.groupby("neighborhood")["_y"].mean()
    global_mean = float(y_train.mean())
    preds = X_test["neighborhood"].map(means).fillna(global_mean).values
    return preds


def baseline_zone_median(X_train: pd.DataFrame, y_train: np.ndarray,
                         X_test: pd.DataFrame) -> np.ndarray:
    """Mediana preturilor per neighborhood din train."""
    train_df = X_train.copy()
    train_df["_y"] = y_train
    medians = train_df.groupby("neighborhood")["_y"].median()
    global_median = float(np.median(y_train))
    preds = X_test["neighborhood"].map(medians).fillna(global_median).values
    return preds


def baseline_linear(X_train_feat: np.ndarray, y_train: np.ndarray,
                    X_test_feat: np.ndarray) -> tuple[np.ndarray, object]:
    model = LinearRegression()
    model.fit(X_train_feat, y_train)
    return model.predict(X_test_feat), model


def baseline_ridge(X_train_feat: np.ndarray, y_train: np.ndarray,
                   X_test_feat: np.ndarray) -> tuple[np.ndarray, object]:
    model = Ridge(alpha=10.0, random_state=RANDOM_STATE)
    model.fit(X_train_feat, y_train)
    return model.predict(X_test_feat), model


# ---------------------------------------------------------------------------
# Optuna — tuning LightGBM
# ---------------------------------------------------------------------------

def optuna_objective(
    trial: optuna.Trial,
    X_tr: np.ndarray,
    y_tr: np.ndarray,
    n_splits: int = 3,
) -> float:
    params = {
        **LGBM_BASE_PARAMS,
        "num_leaves":       trial.suggest_int("num_leaves", 20, 150),
        "learning_rate":    trial.suggest_float("learning_rate", 0.01, 0.3, log=True),
        "feature_fraction": trial.suggest_float("feature_fraction", 0.5, 1.0),
        "bagging_fraction": trial.suggest_float("bagging_fraction", 0.5, 1.0),
        "bagging_freq":     trial.suggest_int("bagging_freq", 1, 10),
        "min_child_samples":trial.suggest_int("min_child_samples", 10, 80),
        "reg_alpha":        trial.suggest_float("reg_alpha", 1e-4, 10.0, log=True),
        "reg_lambda":       trial.suggest_float("reg_lambda", 1e-4, 10.0, log=True),
        "n_estimators":     500,
    }
    tscv = TimeSeriesSplit(n_splits=n_splits)
    maes = []
    for train_idx, val_idx in tscv.split(X_tr):
        Xtt, Xvv = X_tr[train_idx], X_tr[val_idx]
        ytt, yvv = y_tr[train_idx], y_tr[val_idx]
        model = lgb.LGBMRegressor(**params)
        model.fit(
            Xtt, ytt,
            eval_set=[(Xvv, yvv)],
            callbacks=[lgb.early_stopping(30, verbose=False), lgb.log_evaluation(-1)],
        )
        preds = model.predict(Xvv)
        maes.append(mean_absolute_error(yvv, preds))
    return float(np.mean(maes))


# ---------------------------------------------------------------------------
# Antrenare modele quantile
# ---------------------------------------------------------------------------

def train_quantile_models(
    best_params: dict,
    X_train: np.ndarray, y_train: np.ndarray,
    X_val: np.ndarray,   y_val: np.ndarray,
) -> dict[str, lgb.LGBMRegressor]:
    models = {}
    for qname, alpha in QUANTILE_ALPHAS.items():
        params = {
            **LGBM_BASE_PARAMS,
            **best_params,
            "objective": "quantile",
            "alpha": alpha,
            "metric": "quantile",
            "n_estimators": 1000,
        }
        model = lgb.LGBMRegressor(**params)
        model.fit(
            X_train, y_train,
            eval_set=[(X_val, y_val)],
            callbacks=[lgb.early_stopping(50, verbose=False), lgb.log_evaluation(-1)],
        )
        models[qname] = model
        print(f"  Quantile {qname} (alpha={alpha}) — best iter: {model.best_iteration_}")
    return models


# ---------------------------------------------------------------------------
# SHAP analysis
# ---------------------------------------------------------------------------

def run_shap_analysis(
    model: lgb.LGBMRegressor,
    X_test: np.ndarray,
    feature_names: list[str],
    n_samples: int = 300,
) -> dict:
    print("\n[SHAP] Calculez feature importance...")
    sample_size = min(n_samples, len(X_test))
    X_sample = X_test[:sample_size]

    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_sample)

    mean_abs_shap = np.abs(shap_values).mean(axis=0)
    importance = sorted(
        zip(feature_names, mean_abs_shap.tolist()),
        key=lambda x: x[1],
        reverse=True,
    )

    print("  Top-10 features by mean |SHAP|:")
    for feat, val in importance[:10]:
        bar = "=" * int(val / max(mean_abs_shap) * 30)
        print(f"    {feat:35s} {val:>8.1f} |{bar}")

    return {feat: round(val, 2) for feat, val in importance}


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description="Antrenare Riva-AVM v1")
    parser.add_argument("--data",   default="data/synthetic_transactions.csv",
                        help="Calea catre CSV-ul de tranzactii")
    parser.add_argument("--trials", type=int, default=30,
                        help="Numar de trial-uri Optuna (implicit 30 pentru viteza)")
    parser.add_argument("--output-dir", default="models",
                        help="Director pentru modele serializate")
    args = parser.parse_args()

    MODELS_DIR_RUN = Path(args.output_dir)
    MODELS_DIR_RUN.mkdir(parents=True, exist_ok=True)

    t0 = time.time()

    # -----------------------------------------------------------------------
    # 1. Incarcare date
    # -----------------------------------------------------------------------
    print(f"\n[1/8] Incarc date: {args.data}")
    df = pd.read_csv(args.data, parse_dates=["transaction_date"])
    print(f"  {len(df)} randuri incarcate")

    # Filtru calitate: excludem neconfirmate (conform ML-PLAN.md §2.2)
    df = df[df["is_verified"] | (df["data_source"] == "cadastru")].copy()
    print(f"  {len(df)} randuri dupa filtru is_verified")

    # -----------------------------------------------------------------------
    # 2. Split temporal 70/15/15
    # -----------------------------------------------------------------------
    print("\n[2/8] Split temporal 70/15/15...")
    df = df.sort_values("transaction_date").reset_index(drop=True)
    n = len(df)
    n_train = int(n * TRAIN_FRAC)
    n_val   = int(n * VAL_FRAC)

    df_train = df.iloc[:n_train].copy()
    df_val   = df.iloc[n_train : n_train + n_val].copy()
    df_test  = df.iloc[n_train + n_val :].copy()

    print(f"  Train: {len(df_train):>5}  ({df_train['transaction_date'].min().date()} — {df_train['transaction_date'].max().date()})")
    print(f"  Val:   {len(df_val):>5}  ({df_val['transaction_date'].min().date()}   — {df_val['transaction_date'].max().date()})")
    print(f"  Test:  {len(df_test):>5}  ({df_test['transaction_date'].min().date()}  — {df_test['transaction_date'].max().date()})")

    # -----------------------------------------------------------------------
    # 3. Feature engineering
    # -----------------------------------------------------------------------
    print("\n[3/8] Feature engineering (fit pe train)...")
    pipeline = FeaturePipeline(zone_n_clusters=15)

    df_train_t = pipeline.fit_transform(df_train)
    df_val_t   = pipeline.transform(df_val)
    df_test_t  = pipeline.transform(df_test)

    feature_cols = get_model_feature_cols(df_train_t)
    print(f"  Features totale: {len(feature_cols)}")

    # Pastreaza si coloanele de diagnostic pentru baseline-uri
    raw_train_meta = df_train_t[["neighborhood"]].copy()
    raw_val_meta   = df_val_t[["neighborhood"]].copy()
    raw_test_meta  = df_test_t[["neighborhood"]].copy()

    X_train = df_train_t[feature_cols].values.astype(float)
    y_train = df_train_t["sale_price_eur"].values.astype(float)
    X_val   = df_val_t[feature_cols].values.astype(float)
    y_val   = df_val_t["sale_price_eur"].values.astype(float)
    X_test  = df_test_t[feature_cols].values.astype(float)
    y_test  = df_test_t["sale_price_eur"].values.astype(float)

    # -----------------------------------------------------------------------
    # 4. Baseline-uri
    # -----------------------------------------------------------------------
    print("\n[4/8] Baseline-uri...")
    print(f"  {'Model':35s} | {'MAE':>9} EUR | {'MAPE':>5} | {'RMSE':>9} | R2")
    print("  " + "-" * 80)

    baseline_results = {}

    # Medie si mediana zonala
    for name, fn in [("ZoneMean", baseline_zone_mean), ("ZoneMedian", baseline_zone_median)]:
        for split_name, X_meta, y_true in [
            ("val",  raw_val_meta,  y_val),
            ("test", raw_test_meta, y_test),
        ]:
            preds = fn(raw_train_meta.assign(_y=y_train) if False else
                       df_train_t[["neighborhood"]], y_train, X_meta)
            m = compute_metrics(y_true, preds)
            print_metrics(f"{name} [{split_name}]", m)
            baseline_results[f"{name}_{split_name}"] = m

    # Liniar
    for name, fn in [("LinearRegression", baseline_linear), ("Ridge(alpha=10)", baseline_ridge)]:
        preds_val,  _ = fn(X_train, y_train, X_val)
        preds_test, _ = fn(X_train, y_train, X_test)
        for split_name, y_true, preds in [("val", y_val, preds_val), ("test", y_test, preds_test)]:
            m = compute_metrics(y_true, preds)
            print_metrics(f"{name} [{split_name}]", m)
            baseline_results[f"{name}_{split_name}"] = m

    # -----------------------------------------------------------------------
    # 5. Tuning Optuna
    # -----------------------------------------------------------------------
    print(f"\n[5/8] Optuna tuning ({args.trials} trials)...")
    study = optuna.create_study(direction="minimize", sampler=optuna.samplers.TPESampler(seed=RANDOM_STATE))
    study.optimize(
        lambda trial: optuna_objective(trial, X_train, y_train, n_splits=3),
        n_trials=args.trials,
        show_progress_bar=False,
    )
    best_params = study.best_params
    print(f"  Best MAE (CV): {study.best_value:,.0f} EUR")
    print(f"  Best params: {best_params}")

    # -----------------------------------------------------------------------
    # 6. Antrenare modele quantile
    # -----------------------------------------------------------------------
    print("\n[6/8] Antrenare LightGBM (q10, q50, q90)...")
    quantile_models = train_quantile_models(best_params, X_train, y_train, X_val, y_val)

    # -----------------------------------------------------------------------
    # 7. Evaluare
    # -----------------------------------------------------------------------
    print("\n[7/8] Evaluare finala...")
    print(f"  {'Model':35s} | {'MAE':>9} EUR | {'MAPE':>5} | {'RMSE':>9} | R2")
    print("  " + "-" * 80)

    lgbm_metrics = {}
    for split_name, X_s, y_s in [("val", X_val, y_val), ("test", X_test, y_test)]:
        preds_q50 = quantile_models["q50"].predict(X_s)
        m = compute_metrics(y_s, preds_q50)
        print_metrics(f"LightGBM q50 [{split_name}]", m)
        lgbm_metrics[split_name] = m

    # Coverage intervalului de incredere pe test
    preds_q10 = quantile_models["q10"].predict(X_test)
    preds_q90 = quantile_models["q90"].predict(X_test)
    in_interval = ((y_test >= preds_q10) & (y_test <= preds_q90)).mean()
    print(f"\n  Coverage 80% interval (q10-q90) pe test: {in_interval * 100:.1f}% (tinta: ≥80%)")

    # -----------------------------------------------------------------------
    # SHAP
    # -----------------------------------------------------------------------
    shap_importance = run_shap_analysis(
        quantile_models["q50"], X_test, feature_cols
    )

    # -----------------------------------------------------------------------
    # 8. Serializare
    # -----------------------------------------------------------------------
    print("\n[8/8] Serializare modele...")

    pipeline.save(MODELS_DIR_RUN / "feature_pipeline_v1.pkl")

    for qname, model in quantile_models.items():
        path = MODELS_DIR_RUN / f"lgbm_{qname}_v1.pkl"
        joblib.dump(model, path)
        print(f"  Salvat: {path}")

    # feature_names
    joblib.dump(feature_cols, MODELS_DIR_RUN / "feature_cols_v1.pkl")

    # model_card.json
    model_card = {
        "model_version": MODEL_VERSION,
        "trained_at": pd.Timestamp.now().isoformat(),
        "train_samples": len(X_train),
        "val_samples":   len(X_val),
        "test_samples":  len(X_test),
        "feature_count": len(feature_cols),
        "features": feature_cols,
        "optuna_trials": args.trials,
        "best_optuna_params": best_params,
        "metrics_val":  lgbm_metrics.get("val", {}),
        "metrics_test": lgbm_metrics.get("test", {}),
        "baseline_metrics": baseline_results,
        "ci_coverage_80pct_test": round(float(in_interval) * 100, 1),
        "shap_top10_features": dict(list(shap_importance.items())[:10]),
    }

    card_path = MODELS_DIR_RUN / "model_card.json"
    with open(card_path, "w", encoding="utf-8") as f:
        json.dump(model_card, f, indent=2, ensure_ascii=False)
    print(f"  Salvat: {card_path}")

    elapsed = time.time() - t0
    print(f"\n✓ Antrenare completa in {elapsed:.1f}s")
    print(f"\n--- REZULTATE FINALE PE TEST ---")
    print(f"  MAE  : {lgbm_metrics['test']['MAE']:>9,.0f} EUR")
    print(f"  MAPE : {lgbm_metrics['test']['MAPE']:>9.1f}%")
    print(f"  RMSE : {lgbm_metrics['test']['RMSE']:>9,.0f} EUR")
    print(f"  R²   : {lgbm_metrics['test']['R2']:>9.4f}")
    print(f"  Coverage 80% CI: {in_interval * 100:.1f}%")


if __name__ == "__main__":
    main()
