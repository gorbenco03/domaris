"""
Riva-AVM v1 — Microserviciu FastAPI
POST /predict  → predicție preț imobiliar
GET  /health   → status si versiune model

Utilizare:
    uvicorn service.main:app --host 0.0.0.0 --port 8001 --reload

    # Test:
    curl -X POST http://localhost:8001/predict \\
      -H "Content-Type: application/json" \\
      -d '{"city":"Chisinau","neighborhood":"Botanica","property_type":"APARTMENT",
           "rooms":2,"surface_sqm":52,"floor":4,"total_floors":9,"year_built":1987,
           "is_furnished":true,"amenities":["parking","elevator","balcony"]}'
"""

from __future__ import annotations

import json
import math
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

import joblib
import numpy as np

# Importuri condiționale (FastAPI/Pydantic pot lipsi la antrenare)
try:
    from fastapi import FastAPI, HTTPException
    from pydantic import BaseModel, Field, field_validator
except ImportError as e:
    raise ImportError(
        "FastAPI/Pydantic nu sunt instalate. Ruleaza: pip install fastapi uvicorn pydantic"
    ) from e

# Adaugam src/ la path pentru import-uri locale
import sys
_SRC_DIR = Path(__file__).parent.parent / "src"
sys.path.insert(0, str(_SRC_DIR))
from features import FeaturePipeline, get_model_feature_cols
from schema import CITIES, PROPERTY_TYPES, AMENITY_KEYS, CITY_CENTERS, NEIGHBORHOOD_CENTROIDS

# ---------------------------------------------------------------------------
# Configurare
# ---------------------------------------------------------------------------

MODELS_DIR = Path(os.getenv("MODELS_DIR", str(Path(__file__).parent.parent / "models")))
MODEL_VERSION = "riva-avm-v1.0.0"
CURRENT_YEAR = 2026

# ---------------------------------------------------------------------------
# Incarcare modele (o singura data la startup)
# ---------------------------------------------------------------------------

_pipeline: Optional[FeaturePipeline] = None
_model_q10 = None
_model_q50 = None
_model_q90 = None
_feature_cols: Optional[list] = None
_model_card: dict = {}


def _load_models() -> bool:
    """Incarca modele din disk. Returneaza True daca au fost incarcate cu succes."""
    global _pipeline, _model_q10, _model_q50, _model_q90, _feature_cols, _model_card

    required = [
        "feature_pipeline_v1.pkl",
        "lgbm_q10_v1.pkl",
        "lgbm_q50_v1.pkl",
        "lgbm_q90_v1.pkl",
        "feature_cols_v1.pkl",
    ]
    missing = [f for f in required if not (MODELS_DIR / f).exists()]
    if missing:
        return False

    _pipeline     = FeaturePipeline.load(MODELS_DIR / "feature_pipeline_v1.pkl")
    _model_q10    = joblib.load(MODELS_DIR / "lgbm_q10_v1.pkl")
    _model_q50    = joblib.load(MODELS_DIR / "lgbm_q50_v1.pkl")
    _model_q90    = joblib.load(MODELS_DIR / "lgbm_q90_v1.pkl")
    _feature_cols = joblib.load(MODELS_DIR / "feature_cols_v1.pkl")

    card_path = MODELS_DIR / "model_card.json"
    if card_path.exists():
        with open(card_path) as f:
            _model_card = json.load(f)

    return True


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class PropertyInput(BaseModel):
    city: str = Field(..., description="Orasul proprietatii", example="Chisinau")
    neighborhood: str = Field(..., description="Cartierul/zona", example="Botanica")
    property_type: str = Field(..., description="Tipul: APARTMENT | HOUSE | STUDIO", example="APARTMENT")
    rooms: int = Field(..., ge=0, le=10, description="Numar camere (0=studio)", example=2)
    surface_sqm: float = Field(..., gt=10.0, lt=1000.0, description="Suprafata totala in mp", example=52.0)
    floor: Optional[int] = Field(None, ge=0, le=30, description="Etajul proprietatii", example=4)
    total_floors: Optional[int] = Field(None, ge=1, le=30, description="Total etaje cladire", example=9)
    year_built: Optional[int] = Field(None, ge=1900, le=2025, description="Anul constructiei", example=1987)
    is_furnished: bool = Field(False, description="Daca proprietatea e mobilata", example=True)
    amenities: List[str] = Field(default_factory=list, description="Lista dotari", example=["parking", "elevator"])
    lat: Optional[float] = Field(None, ge=45.0, le=48.5, description="Latitudine GPS", example=46.9898)
    lng: Optional[float] = Field(None, ge=26.5, le=30.5, description="Longitudine GPS", example=28.8560)

    @field_validator("property_type")
    @classmethod
    def validate_property_type(cls, v: str) -> str:
        if v not in PROPERTY_TYPES:
            raise ValueError(f"property_type trebuie sa fie unul din: {PROPERTY_TYPES}")
        return v

    @field_validator("city")
    @classmethod
    def validate_city(cls, v: str) -> str:
        # Acceptam orice oras nevid: modelul e antrenat pe numele reale (cu
        # diacritice), iar pipeline-ul trateaza orasele necunoscute prin
        # one-hot=0 + zone_cluster + codificarea cartierului. O lista rigida
        # ar respinge inutil orase reale precum „Chișinău".
        if not v or not v.strip():
            raise ValueError("city nu poate fi gol")
        return v.strip()


class SHAPFeature(BaseModel):
    feature: str
    shap_value: float
    direction: str  # "up" | "down"


class PredictionOutput(BaseModel):
    predicted_price: float = Field(..., description="Pretul recomandat de vanzare (EUR)")
    price_min: float       = Field(..., description="Limita inferioara interval 80% (EUR)")
    price_max: float       = Field(..., description="Limita superioara interval 80% (EUR)")
    confidence_score: float= Field(..., ge=0.0, le=1.0, description="Scor incredere [0,1]")
    model_version: str     = Field(..., description="Versiunea modelului")
    prediction_timestamp: str = Field(..., description="Timestamp UTC al predictiei")
    shap_top_features: List[SHAPFeature] = Field(default_factory=list)


class HealthOutput(BaseModel):
    status: str
    model_version: str
    model_loaded: bool
    models_dir: str


# ---------------------------------------------------------------------------
# Functii de inferenta
# ---------------------------------------------------------------------------

def _input_to_dataframe(inp: PropertyInput):
    import pandas as pd

    amenities_str = "|".join([a for a in inp.amenities if a in AMENITY_KEYS])
    amenities_count = len([a for a in inp.amenities if a in AMENITY_KEYS])

    # Lat/lng default la centroidul cartierului
    lat, lng = inp.lat, inp.lng
    if lat is None or lng is None:
        if inp.neighborhood in NEIGHBORHOOD_CENTROIDS:
            lat, lng = NEIGHBORHOOD_CENTROIDS[inp.neighborhood]
        else:
            lat, lng = CITY_CENTERS.get(inp.city, (47.0245, 28.8324))

    row = {
        "transaction_id":    "infer_001",
        "transaction_date":  pd.Timestamp.now(),
        "city":              inp.city,
        "neighborhood":      inp.neighborhood,
        "property_type":     inp.property_type,
        "rooms":             inp.rooms,
        "surface_sqm":       inp.surface_sqm,
        "floor":             inp.floor,
        "total_floors":      inp.total_floors,
        "year_built":        inp.year_built,
        "is_furnished":      inp.is_furnished,
        "amenities_count":   amenities_count,
        "amenities_list":    amenities_str,
        "lat":               lat,
        "lng":               lng,
        "sale_price_eur":    0.0,  # placeholder pentru transform
        "price_per_sqm_eur": 0.0,
        "data_source":       "internal",
        "is_verified":       True,
    }
    return pd.DataFrame([row])


def _compute_confidence(
    price_min: float, price_rec: float, price_max: float
) -> float:
    """Scor incredere conform ML-PLAN.md §6.2."""
    if price_rec <= 0:
        return 0.0
    interval_width_pct = (price_max - price_min) / price_rec
    # Referinta 0.8: un interval 80% (q10-q90) tipic la imobiliare are o latime
    # de ~30-45% din pret; il mapam la o incredere rezonabila (~0.5-0.7), iar
    # intervalele foarte largi (proprietati atipice) coboara sub prag -> fallback CMA.
    interval_score = max(0.0, 1.0 - interval_width_pct / 0.8)
    return round(min(1.0, interval_score), 2)


def _compute_shap_top5(
    model, X: np.ndarray, feature_names: list
) -> list[SHAPFeature]:
    """Calculeaza top-5 features SHAP pentru o singura predictie."""
    try:
        import shap
        explainer = shap.TreeExplainer(model)
        shap_vals = explainer.shap_values(X)[0]
        pairs = sorted(
            zip(feature_names, shap_vals.tolist()),
            key=lambda x: abs(x[1]),
            reverse=True,
        )[:5]
        return [
            SHAPFeature(
                feature=feat,
                shap_value=round(val, 2),
                direction="up" if val >= 0 else "down",
            )
            for feat, val in pairs
        ]
    except Exception:
        return []


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Riva-AVM — Automated Valuation Model",
    description="Microserviciu ML pentru estimarea pretului de vanzare al proprietatilor imobiliare din Republica Moldova.",
    version=MODEL_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)


@app.on_event("startup")
async def startup_event() -> None:
    loaded = _load_models()
    if loaded:
        ver = _model_card.get("model_version", MODEL_VERSION)
        print(f"[Riva-AVM] Modele incarcate: {ver}  (din {MODELS_DIR})")
    else:
        print(f"[Riva-AVM] ATENTIE: Modelele nu au fost gasite in {MODELS_DIR}. "
              "Ruleaza python src/train.py inainte de a porni serviciul.")


@app.get("/health", response_model=HealthOutput, tags=["Status"])
async def health() -> HealthOutput:
    return HealthOutput(
        status="ok" if _model_q50 is not None else "degraded_no_model",
        model_version=_model_card.get("model_version", MODEL_VERSION),
        model_loaded=_model_q50 is not None,
        models_dir=str(MODELS_DIR),
    )


@app.post("/predict", response_model=PredictionOutput, tags=["Predictie"])
async def predict(inp: PropertyInput) -> PredictionOutput:
    """
    Prezice pretul de vanzare al unei proprietati imobiliare.

    Returneaza pretul recomandat, intervalul de incredere [q10, q90]
    si scorul de incredere al predictiei.
    """
    if _model_q50 is None or _pipeline is None or _feature_cols is None:
        raise HTTPException(
            status_code=503,
            detail=(
                "Modelul ML nu este incarcat. "
                "Ruleaza 'python src/train.py' pentru a antrena modelul, "
                f"apoi reporneste serviciul. MODELS_DIR={MODELS_DIR}"
            ),
        )

    # Pregatire input
    df_input = _input_to_dataframe(inp)

    # Feature engineering (transform fara filtru outlieri la inferenta)
    try:
        df_transformed = _pipeline.transform(df_input, filter_outliers=False)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Eroare preprocesare: {e}")

    # Selectie features
    missing_cols = [c for c in _feature_cols if c not in df_transformed.columns]
    if missing_cols:
        # Completam cu 0 coloanele lipsa (pot fi OHE pentru categorii nevazute)
        for c in missing_cols:
            df_transformed[c] = 0

    X = df_transformed[_feature_cols].values.astype(float)

    # Predictii quantile
    price_min = float(np.maximum(_model_q10.predict(X)[0], 1000))
    price_rec = float(np.maximum(_model_q50.predict(X)[0], 1000))
    price_max = float(np.maximum(_model_q90.predict(X)[0], 1000))

    # Asigura ordinea corecta
    price_min = min(price_min, price_rec)
    price_max = max(price_max, price_rec)

    confidence = _compute_confidence(price_min, price_rec, price_max)
    shap_feats = _compute_shap_top5(_model_q50, X, _feature_cols)

    return PredictionOutput(
        predicted_price=round(price_rec, 0),
        price_min=round(price_min, 0),
        price_max=round(price_max, 0),
        confidence_score=confidence,
        model_version=_model_card.get("model_version", MODEL_VERSION),
        prediction_timestamp=datetime.now(timezone.utc).isoformat(),
        shap_top_features=shap_feats,
    )


# ---------------------------------------------------------------------------
# Rulare directa (fara uvicorn)
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("service.main:app", host="0.0.0.0", port=8001, reload=False)
