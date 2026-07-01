"""
Schema definitiei datasetului AVM (Automated Valuation Model) — Riva-AVM v1
Conform ML-PLAN.md §2.1

Coloane, tipuri Python, valori valide si rolul fiecarui camp.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

# ---------------------------------------------------------------------------
# Constante
# ---------------------------------------------------------------------------

PROPERTY_TYPES = ["APARTMENT", "HOUSE", "STUDIO"]

CITIES = ["Chisinau", "Balti", "Cahul", "Ungheni", "Orhei", "Straseni"]

NEIGHBORHOODS = {
    "Chisinau": [
        "Botanica", "Buiucani", "Ciocana", "Rascani", "Centru",
        "Telecentru", "Durlesti", "Sculeni", "Cricova", "Codru",
    ],
    "Balti": ["Centru", "Pamanteni", "Slobozia"],
    "Cahul": ["Centru", "Dacia"],
    "Ungheni": ["Centru"],
    "Orhei": ["Centru"],
    "Straseni": ["Centru"],
}

AMENITY_KEYS = ["parking", "elevator", "balcony", "garage", "storage",
                "security", "interphone", "gas", "internet"]

DATA_SOURCES = ["internal", "partner", "cadastru"]

# Centrul Chisinau (referinta pentru dist_to_center_km)
CHISINAU_CENTER_LAT = 47.0245
CHISINAU_CENTER_LNG = 28.8324

# Centre aproximative per oras (lat, lng)
CITY_CENTERS = {
    "Chisinau": (47.0245, 28.8324),
    "Balti":    (47.7617, 27.9286),
    "Cahul":    (45.9126, 28.1999),
    "Ungheni":  (47.2117, 27.8047),
    "Orhei":    (47.3847, 28.8236),
    "Straseni": (47.1450, 28.6080),
}

# Centroide aproximative per cartier Chisinau
NEIGHBORHOOD_CENTROIDS = {
    "Botanica":   (46.9898, 28.8560),
    "Buiucani":   (47.0350, 28.7900),
    "Ciocana":    (47.0100, 28.8900),
    "Rascani":    (47.0470, 28.8200),
    "Centru":     (47.0245, 28.8324),
    "Telecentru": (46.9950, 28.8700),
    "Durlesti":   (47.0600, 28.7700),
    "Sculeni":    (47.0750, 28.8000),
    "Cricova":    (47.1300, 28.8600),
    "Codru":      (46.9980, 28.7800),
    # Alte orase — centrul lor
    "Pamanteni":  (47.7700, 27.9300),
    "Slobozia":   (47.7550, 27.9200),
    "Dacia":      (45.9200, 28.2100),
}


# ---------------------------------------------------------------------------
# Schema datasetului (camp cu camp conform ML-PLAN.md §2.1)
# ---------------------------------------------------------------------------

DATASET_COLUMNS = {
    # Identificator
    "transaction_id":   {"dtype": "str",      "role": "id",      "nullable": False,
                         "description": "UUID anonimizat al tranzactiei"},
    # Feature temporal
    "transaction_date": {"dtype": "datetime64[ns]", "role": "temporal", "nullable": False,
                         "description": "Data inchiderii tranzactiei"},
    # Features categorice
    "city":             {"dtype": "str",      "role": "feature",  "nullable": False,
                         "values": CITIES,
                         "description": "Orasul proprietatii"},
    "neighborhood":     {"dtype": "str",      "role": "feature",  "nullable": False,
                         "description": "Cartierul/zona proprietatii"},
    "property_type":    {"dtype": "str",      "role": "feature",  "nullable": False,
                         "values": PROPERTY_TYPES,
                         "description": "Tipul proprietatii: APARTMENT | HOUSE | STUDIO"},
    # Features numerice
    "rooms":            {"dtype": "int",      "role": "feature",  "nullable": False,
                         "range": (0, 10),
                         "description": "Numar de camere (0 = studio)"},
    "surface_sqm":      {"dtype": "float",    "role": "feature",  "nullable": False,
                         "range": (10.0, 1000.0),
                         "description": "Suprafata totala in mp"},
    "floor":            {"dtype": "int",      "role": "feature",  "nullable": True,
                         "range": (0, 30),
                         "description": "Etajul proprietatii"},
    "total_floors":     {"dtype": "int",      "role": "feature",  "nullable": True,
                         "range": (1, 30),
                         "description": "Numarul total de etaje al cladirii"},
    "year_built":       {"dtype": "int",      "role": "feature",  "nullable": True,
                         "range": (1900, 2025),
                         "description": "Anul constructiei cladirii"},
    # Features binare
    "is_furnished":     {"dtype": "bool",     "role": "feature",  "nullable": False,
                         "description": "Daca proprietatea este mobilata"},
    # Features derivate / agregate
    "amenities_count":  {"dtype": "int",      "role": "feature",  "nullable": False,
                         "range": (0, 20),
                         "description": "Numarul total de dotari declarate"},
    "amenities_list":   {"dtype": "str",      "role": "raw",      "nullable": True,
                         "description": "Dotari pipe-separated (parking|elevator|balcony...)"},
    # Features geospatiale
    "lat":              {"dtype": "float",    "role": "feature",  "nullable": True,
                         "range": (45.0, 48.5),
                         "description": "Latitudine GPS (rotunjita la 4 zecimale)"},
    "lng":              {"dtype": "float",    "role": "feature",  "nullable": True,
                         "range": (26.5, 30.5),
                         "description": "Longitudine GPS (rotunjita la 4 zecimale)"},
    # TARGET
    "sale_price_eur":   {"dtype": "float",    "role": "target",   "nullable": False,
                         "range": (5000.0, 2_000_000.0),
                         "description": "Pretul real de vanzare in EUR — VARIABILA TINTA"},
    # Feature derivat / validare
    "price_per_sqm_eur":{"dtype": "float",   "role": "derived",  "nullable": True,
                         "range": (100.0, 5000.0),
                         "description": "Pret/mp calculat (pentru validare/EDA)"},
    # Metadate
    "data_source":      {"dtype": "str",      "role": "meta",     "nullable": False,
                         "values": DATA_SOURCES,
                         "description": "Sursa datelor: internal | partner | cadastru"},
    "is_verified":      {"dtype": "bool",     "role": "meta",     "nullable": False,
                         "description": "Tranzactie verificata de echipa"},
}

FEATURE_COLUMNS = [
    c for c, meta in DATASET_COLUMNS.items()
    if meta["role"] in ("feature", "temporal")
]

TARGET_COLUMN = "sale_price_eur"

ID_COLUMN = "transaction_id"

# Coloane excluse din modelul ML (metadate, raw, derivate-redundante)
EXCLUDE_FROM_MODEL = ["transaction_id", "data_source", "is_verified",
                      "amenities_list", "price_per_sqm_eur"]


@dataclass
class PropertyInput:
    """
    Schema de input pentru microserviciul de inferenta (FastAPI).
    Campurile optionale sunt imputate in pipeline.
    """
    city: str
    neighborhood: str
    property_type: str
    rooms: int
    surface_sqm: float
    floor: Optional[int] = None
    total_floors: Optional[int] = None
    year_built: Optional[int] = None
    is_furnished: bool = False
    amenities: list = field(default_factory=list)
    lat: Optional[float] = None
    lng: Optional[float] = None

    def validate(self) -> list[str]:
        errors = []
        if self.property_type not in PROPERTY_TYPES:
            errors.append(f"property_type '{self.property_type}' invalid. Valori: {PROPERTY_TYPES}")
        if self.city not in CITIES:
            errors.append(f"city '{self.city}' invalid. Valori: {CITIES}")
        if self.surface_sqm < 10 or self.surface_sqm > 1000:
            errors.append(f"surface_sqm={self.surface_sqm} in afara intervalului [10, 1000]")
        if self.rooms < 0 or self.rooms > 10:
            errors.append(f"rooms={self.rooms} in afara intervalului [0, 10]")
        return errors
