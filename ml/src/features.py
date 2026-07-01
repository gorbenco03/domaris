"""
Feature engineering pipeline pentru Riva-AVM v1.
Conform ML-PLAN.md §3 (Preprocesare si feature engineering).

Pipeline-ul este staterul: se fitteaza pe TRAIN si se aplica pe VAL/TEST
pentru a evita data leakage (target encoding, zone clustering).
"""

from __future__ import annotations

import math
import warnings
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import LabelEncoder

warnings.filterwarnings("ignore")

import sys
sys.path.insert(0, str(Path(__file__).parent))
from schema import (
    AMENITY_KEYS, CITY_CENTERS, NEIGHBORHOOD_CENTROIDS,
    CHISINAU_CENTER_LAT, CHISINAU_CENTER_LNG,
)

# ---------------------------------------------------------------------------
# Constante
# ---------------------------------------------------------------------------

CURRENT_YEAR = 2026
TARGET_ENCODING_SMOOTHING_K = 10
ZONE_N_CLUSTERS = 15
OUTLIER_IQR_MULTIPLIER = 2.5

# Coloane categorice pentru one-hot encoding
OHE_COLS = ["city", "property_type"]

# Amenities binare extrase din amenities_list
AMENITY_BINARY_COLS = [f"amenity_{a}" for a in AMENITY_KEYS]


# ---------------------------------------------------------------------------
# Functii ajutatoare
# ---------------------------------------------------------------------------

def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Distanta Haversine in km intre doua puncte GPS."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _dist_to_city_center(row: pd.Series) -> float:
    lat, lng = row.get("lat"), row.get("lng")
    city = row.get("city", "Chisinau")
    if pd.isna(lat) or pd.isna(lng):
        return np.nan
    center = CITY_CENTERS.get(city, (CHISINAU_CENTER_LAT, CHISINAU_CENTER_LNG))
    return haversine_km(lat, lng, center[0], center[1])


# ---------------------------------------------------------------------------
# Clasa principala — FeaturePipeline
# ---------------------------------------------------------------------------

class FeaturePipeline:
    """
    Pipeline de preprocesare si feature engineering.
    Staterul: .fit() pe date de antrenare, .transform() pe orice split.
    """

    def __init__(self, zone_n_clusters: int = ZONE_N_CLUSTERS) -> None:
        self.zone_n_clusters = zone_n_clusters
        self._fitted = False

        # State invatat din date de antrenare
        self._floor_medians: dict = {}
        self._total_floors_medians: dict = {}
        self._year_built_medians: dict = {}
        self._neighborhood_target_enc: dict = {}
        self._global_price_per_sqm_mean: float = 800.0
        self._zone_kmeans: Optional[KMeans] = None
        self._ohe_categories: dict = {}

    # ------------------------------------------------------------------
    # FIT
    # ------------------------------------------------------------------

    def fit(self, df: pd.DataFrame) -> "FeaturePipeline":
        """Invata parametrii de preprocesare din setul de antrenare."""
        df = df.copy()

        # 1. Calculeaza price_per_sqm pe train (necesar pentru target encoding)
        df = self._compute_price_per_sqm(df)

        # 2. Mediana pentru imputare valori lipsa
        self._floor_medians = (
            df.groupby(["property_type", "city"])["floor"]
            .median()
            .fillna(3)
            .to_dict()
        )
        self._total_floors_medians = (
            df.groupby(["city"])["total_floors"]
            .median()
            .fillna(5)
            .to_dict()
        )
        self._year_built_medians = (
            df.groupby(["neighborhood", "property_type"])["year_built"]
            .median()
            .fillna(1990)
            .to_dict()
        )

        # 3. Target encoding pentru neighborhood (cu Bayesian smoothing)
        self._global_price_per_sqm_mean = df["price_per_sqm_eur"].mean()
        neighborhood_stats = df.groupby("neighborhood")["price_per_sqm_eur"].agg(["mean", "count"])
        k = TARGET_ENCODING_SMOOTHING_K
        global_mean = self._global_price_per_sqm_mean
        self._neighborhood_target_enc = {
            nbhd: (row["count"] * row["mean"] + k * global_mean) / (row["count"] + k)
            for nbhd, row in neighborhood_stats.iterrows()
        }

        # 4. OHE categories (din train)
        for col in OHE_COLS:
            self._ohe_categories[col] = sorted(df[col].dropna().unique().tolist())

        # 5. Zone cluster K-Means pe (lat, lng)
        coord_df = df[["lat", "lng"]].dropna()
        if len(coord_df) >= self.zone_n_clusters:
            self._zone_kmeans = KMeans(
                n_clusters=self.zone_n_clusters, random_state=42, n_init=10
            )
            self._zone_kmeans.fit(coord_df.values)

        self._fitted = True
        return self

    # ------------------------------------------------------------------
    # TRANSFORM
    # ------------------------------------------------------------------

    def transform(self, df: pd.DataFrame, filter_outliers: bool = True) -> pd.DataFrame:
        if not self._fitted:
            raise RuntimeError("FeaturePipeline must be .fit() before .transform()")

        df = df.copy()

        # 1. price_per_sqm (necesar pentru outlier filter si EDA, nu ca feature de model)
        df = self._compute_price_per_sqm(df)

        # 2. Filtrare outlieri (sarim la inferenta, cand sale_price_eur e placeholder)
        if filter_outliers and df["sale_price_eur"].gt(0).any():
            df = self._filter_outliers(df)

        # 3. Imputare valori lipsa
        df = self._impute_missing(df)

        # 4. Amenity binary features
        df = self._extract_amenity_features(df)

        # 5. Features derivate
        df = self._derive_features(df)

        # 6. Target encoding pentru neighborhood
        df["neighborhood_encoded"] = df["neighborhood"].map(
            self._neighborhood_target_enc
        ).fillna(self._global_price_per_sqm_mean)

        # 7. Zone cluster
        df = self._add_zone_cluster(df)

        # 8. One-Hot Encoding pentru city si property_type
        df = self._one_hot_encode(df)

        # 9. Selectie si ordonare coloane finale pentru model
        df = self._select_model_features(df)

        return df

    def fit_transform(self, df: pd.DataFrame) -> pd.DataFrame:
        return self.fit(df).transform(df)

    # ------------------------------------------------------------------
    # Metode private
    # ------------------------------------------------------------------

    def _compute_price_per_sqm(self, df: pd.DataFrame) -> pd.DataFrame:
        mask = df["sale_price_eur"].notna() & df["surface_sqm"].notna() & (df["surface_sqm"] > 0)
        # Construim o serie float64 curata si o atribuim integral, ca sa nu incercam
        # sa scriem valori float intr-o coloana int64 (CSV-urile reale pot avea
        # price_per_sqm_eur ca intregi -> pandas 2.x ridica LossySetitemError).
        ppsqm = pd.Series(index=df.index, dtype="float64")
        ppsqm.loc[mask] = (
            df.loc[mask, "sale_price_eur"] / df.loc[mask, "surface_sqm"]
        )
        df["price_per_sqm_eur"] = ppsqm
        return df

    def _filter_outliers(self, df: pd.DataFrame) -> pd.DataFrame:
        """Filtreaza outlieri conform ML-PLAN.md §2.2 si §3.2."""
        n_before = len(df)

        # Filtre absolute
        df = df[df["sale_price_eur"].notna()]
        df = df[(df["surface_sqm"] >= 10) & (df["surface_sqm"] <= 1000)]

        # Filtre IQR per (city, property_type)
        filtered_parts = []
        for (city, ptype), group in df.groupby(["city", "property_type"]):
            q1 = group["price_per_sqm_eur"].quantile(0.25)
            q3 = group["price_per_sqm_eur"].quantile(0.75)
            iqr = q3 - q1
            lo = max(100, q1 - OUTLIER_IQR_MULTIPLIER * iqr)
            hi = min(5000, q3 + OUTLIER_IQR_MULTIPLIER * iqr)
            mask = (group["price_per_sqm_eur"] >= lo) & (group["price_per_sqm_eur"] <= hi)
            filtered_parts.append(group[mask])

        df = pd.concat(filtered_parts, ignore_index=True)
        n_after = len(df)
        if n_before > n_after:
            print(f"  [Outlier filter] Eliminate {n_before - n_after} randuri ({n_before} -> {n_after})")
        return df

    def _impute_missing(self, df: pd.DataFrame) -> pd.DataFrame:
        """Imputare valori lipsa conform ML-PLAN.md §3.2."""

        # floor — medianas per (property_type, city)
        for (ptype, city), median_val in self._floor_medians.items():
            mask = df["floor"].isna() & (df["property_type"] == ptype) & (df["city"] == city)
            df.loc[mask, "floor"] = int(median_val)
        df["floor"] = df["floor"].fillna(3).astype(int)

        # total_floors — medianas per city
        for city, median_val in self._total_floors_medians.items():
            mask = df["total_floors"].isna() & (df["city"] == city)
            df.loc[mask, "total_floors"] = int(median_val)
        df["total_floors"] = df["total_floors"].fillna(5).astype(int)

        # Asigura floor <= total_floors
        df["floor"] = df[["floor", "total_floors"]].apply(
            lambda r: min(r["floor"], r["total_floors"]), axis=1
        )

        # year_built — mediana per (neighborhood, property_type)
        for (nbhd, ptype), median_val in self._year_built_medians.items():
            mask = df["year_built"].isna() & (df["neighborhood"] == nbhd) & (df["property_type"] == ptype)
            df.loc[mask, "year_built"] = int(median_val)
        df["year_built"] = df["year_built"].fillna(1985).astype(int)

        # is_furnished — False (conservator)
        df["is_furnished"] = df["is_furnished"].fillna(False).astype(bool)

        # amenities_count — 0
        df["amenities_count"] = df["amenities_count"].fillna(0).astype(int)

        # lat/lng — centroidul cartierului
        lat_miss = df["lat"].isna()
        lng_miss = df["lng"].isna()
        for idx in df[lat_miss | lng_miss].index:
            nbhd = df.at[idx, "neighborhood"]
            city = df.at[idx, "city"]
            if nbhd in NEIGHBORHOOD_CENTROIDS:
                base = NEIGHBORHOOD_CENTROIDS[nbhd]
            else:
                base = CITY_CENTERS.get(city, (CHISINAU_CENTER_LAT, CHISINAU_CENTER_LNG))
            if pd.isna(df.at[idx, "lat"]):
                df.at[idx, "lat"] = base[0]
            if pd.isna(df.at[idx, "lng"]):
                df.at[idx, "lng"] = base[1]

        return df

    def _extract_amenity_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Extrage coloane binare din amenities_list."""
        for amenity in AMENITY_KEYS:
            col = f"amenity_{amenity}"
            if "amenities_list" in df.columns:
                df[col] = df["amenities_list"].fillna("").str.contains(amenity).astype(int)
            else:
                df[col] = 0
        return df

    def _derive_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Features derivate conform ML-PLAN.md §3.4."""

        # Varsta cladirii
        df["building_age"] = CURRENT_YEAR - df["year_built"].astype(int)
        df["building_age"] = df["building_age"].clip(0, 120)

        # Pozitie relativa etaj
        df["floor_ratio"] = df["floor"] / df["total_floors"].replace(0, 1)
        df["is_ground_floor"] = ((df["floor"] == 0) | (df["floor"] == 1)).astype(int)
        df["is_top_floor"] = (df["floor"] == df["total_floors"]).astype(int)

        # Distanta la centrul orasului
        df["dist_to_center_km"] = df.apply(_dist_to_city_center, axis=1)
        df["dist_to_center_km"] = df["dist_to_center_km"].fillna(
            df["dist_to_center_km"].median()
        )

        # Features temporale
        if "transaction_date" in df.columns:
            df["transaction_month"] = pd.to_datetime(df["transaction_date"]).dt.month
            df["transaction_year"]  = pd.to_datetime(df["transaction_date"]).dt.year
        else:
            df["transaction_month"] = 6
            df["transaction_year"]  = CURRENT_YEAR

        return df

    def _add_zone_cluster(self, df: pd.DataFrame) -> pd.DataFrame:
        """Asigneaza micro-zone geospatiale cu KMeans."""
        if self._zone_kmeans is not None:
            coords = df[["lat", "lng"]].values
            # Inlocuim NaN cu valori valide inainte de predict
            has_coords = ~(pd.isna(df["lat"]) | pd.isna(df["lng"]))
            clusters = np.zeros(len(df), dtype=int)
            if has_coords.any():
                clusters[has_coords] = self._zone_kmeans.predict(coords[has_coords])
            df["zone_cluster"] = clusters
        else:
            df["zone_cluster"] = 0
        return df

    def _one_hot_encode(self, df: pd.DataFrame) -> pd.DataFrame:
        """One-hot encoding pentru city si property_type."""
        for col in OHE_COLS:
            categories = self._ohe_categories.get(col, df[col].dropna().unique().tolist())
            for cat in categories:
                safe_cat = cat.lower().replace(" ", "_")
                df[f"{col}_{safe_cat}"] = (df[col] == cat).astype(int)
        return df

    def _select_model_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Pastreaza doar coloanele relevante pentru model + target + metadate necesare."""
        keep = [
            # Identitate si target (pentru split si evaluare)
            "transaction_id", "transaction_date", "sale_price_eur",
            # Features numerice brute
            "rooms", "surface_sqm", "floor", "total_floors",
            "amenities_count", "lat", "lng",
            # Features derivate
            "building_age", "floor_ratio", "is_ground_floor", "is_top_floor",
            "dist_to_center_km", "neighborhood_encoded", "zone_cluster",
            "transaction_month", "transaction_year",
            # Amenity binary
            *AMENITY_BINARY_COLS,
            # One-hot encoded
            *[c for c in df.columns if c.startswith("city_") or c.startswith("property_type_")],
            # Meta (filtru calitate)
            "is_furnished",
            # Diagnostic
            "city", "neighborhood", "property_type",
        ]
        # Pastram doar ce exista
        keep = [c for c in keep if c in df.columns]
        return df[keep]

    # ------------------------------------------------------------------
    # Serializare
    # ------------------------------------------------------------------

    def save(self, path: str | Path) -> None:
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self, path)
        print(f"  FeaturePipeline salvat: {path}")

    @classmethod
    def load(cls, path: str | Path) -> "FeaturePipeline":
        return joblib.load(path)


# ---------------------------------------------------------------------------
# Functii utilitare de nivel inalt
# ---------------------------------------------------------------------------

MODEL_FEATURE_COLS: list[str] = []  # completat dupa fit


def get_model_feature_cols(df_transformed: pd.DataFrame) -> list[str]:
    """Returneaza coloanele de features (excluse target, id, meta)."""
    exclude = {
        "transaction_id", "transaction_date", "sale_price_eur",
        "city", "neighborhood", "property_type",
    }
    return [c for c in df_transformed.columns if c not in exclude]
