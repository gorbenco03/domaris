"""
Generare dataset sintetic realist pentru piata imobiliara din Republica Moldova.
Genereaza ~5000 de tranzactii de vanzare pentru orase si cartiere reale.

Utilizare:
    python src/generate_synthetic.py
    # => data/synthetic_transactions.csv
"""

from __future__ import annotations

import argparse
import uuid
from pathlib import Path

import numpy as np
import pandas as pd

# Importam schema locala
import sys
sys.path.insert(0, str(Path(__file__).parent))
from schema import (
    AMENITY_KEYS, CITIES, NEIGHBORHOODS, CITY_CENTERS, NEIGHBORHOOD_CENTROIDS,
    DATA_SOURCES, PROPERTY_TYPES,
)

# ---------------------------------------------------------------------------
# Parametri de configurare a distributiei preturilor per oras/cartier
# ---------------------------------------------------------------------------

# Pret mediu EUR/mp per cartier (estimari orientative piata Moldova 2022-2025)
PRICE_PER_SQM_BY_NEIGHBORHOOD = {
    # Chisinau
    "Centru":     1100,
    "Buiucani":   950,
    "Botanica":   830,
    "Rascani":    780,
    "Sculeni":    720,
    "Durlesti":   750,
    "Ciocana":    680,
    "Telecentru": 710,
    "Cricova":    600,
    "Codru":      670,
    # Balti
    "Pamanteni":  420,
    "Slobozia":   380,
    # Alte orase — centru implicit
    "Dacia":      350,
}

DEFAULT_PRICE_PER_SQM_BY_CITY = {
    "Chisinau": 800,
    "Balti":    400,
    "Cahul":    350,
    "Ungheni":  330,
    "Orhei":    320,
    "Straseni": 340,
}

# Suprafata tipica per tip proprietate (medie, std)
SURFACE_PARAMS = {
    "STUDIO":    (35, 8),
    "APARTMENT": (62, 20),
    "HOUSE":     (110, 40),
}

# Camere tipice per tip
ROOMS_PARAMS = {
    "STUDIO":    (0, 0),   # studios au 0 camere separate
    "APARTMENT": (2.5, 1),
    "HOUSE":     (4, 1.5),
}

# Bonus/malus relativ la tip (fata de pret/mp de baza)
TYPE_PRICE_FACTOR = {
    "STUDIO":    1.05,  # studio mic, pret/mp mai mare
    "APARTMENT": 1.00,
    "HOUSE":     0.90,  # casele au pret/mp mai mic, dar suprafata mai mare
}

# Distributie an constructie pe era
ERA_PROBS = {
    "soviet_old":  (1955, 1975, 0.20),  # (from, to, prob)
    "soviet_late": (1975, 1991, 0.30),
    "transition":  (1991, 2005, 0.15),
    "modern":      (2005, 2018, 0.25),
    "new":         (2018, 2025, 0.10),
}

# ---------------------------------------------------------------------------
# Functii ajutatoare
# ---------------------------------------------------------------------------

RNG = np.random.default_rng(42)


def _random_year_built() -> int:
    era = RNG.choice(
        list(ERA_PROBS.keys()),
        p=[v[2] for v in ERA_PROBS.values()],
    )
    lo, hi, _ = ERA_PROBS[era]
    return int(RNG.integers(lo, hi + 1))


def _building_age_factor(year_built: int, transaction_year: int) -> float:
    """Ajustare pret bazata pe varsta cladirii."""
    age = transaction_year - year_built
    if age <= 5:
        return 1.10
    if age <= 15:
        return 1.02
    if age <= 30:
        return 0.95
    if age <= 50:
        return 0.87
    return 0.80


def _floor_factor(floor: int, total_floors: int) -> float:
    """Parter si ultimul etaj au un factor negativ."""
    if floor == 0 or floor == 1:
        return 0.93
    if floor == total_floors:
        return 0.96
    return 1.00


def _amenities_list(is_furnished: bool, rng: np.random.Generator) -> list[str]:
    amenities = []
    # Dotari cu probabilitati realiste
    probs = {
        "parking":    0.45,
        "elevator":   0.55,
        "balcony":    0.70,
        "garage":     0.15,
        "storage":    0.30,
        "security":   0.20,
        "interphone": 0.60,
        "gas":        0.80,
        "internet":   0.50,
    }
    for amenity, prob in probs.items():
        if rng.random() < prob:
            amenities.append(amenity)
    return amenities


def _get_coords(city: str, neighborhood: str) -> tuple[float, float]:
    """Returneaza coordonate cu zgomot gaussian mic fata de centroidul cartierului."""
    if neighborhood in NEIGHBORHOOD_CENTROIDS:
        base_lat, base_lng = NEIGHBORHOOD_CENTROIDS[neighborhood]
    else:
        base_lat, base_lng = CITY_CENTERS.get(city, (47.0245, 28.8324))

    # Zgomot ~0.005 grade (~500m)
    lat = round(base_lat + RNG.normal(0, 0.005), 4)
    lng = round(base_lng + RNG.normal(0, 0.006), 4)
    return lat, lng


def _transaction_date(rng: np.random.Generator) -> pd.Timestamp:
    """Data tranzactie: ultimii 5 ani cu tendinta de crestere spre prezent."""
    # Ponderile anilor: mai multe tranzactii recente
    year = rng.choice(
        [2021, 2022, 2023, 2024, 2025],
        p=[0.10, 0.15, 0.25, 0.30, 0.20],
    )
    month = rng.integers(1, 13)
    day = rng.integers(1, 29)
    return pd.Timestamp(year=int(year), month=int(month), day=int(day))


def _price_trend_factor(transaction_date: pd.Timestamp) -> float:
    """Tendinta anuala de crestere a preturilor (inflatie, piata)."""
    year = transaction_date.year
    factors = {2021: 0.85, 2022: 0.90, 2023: 0.95, 2024: 1.00, 2025: 1.05}
    return factors.get(year, 1.00)


# ---------------------------------------------------------------------------
# Generator principal
# ---------------------------------------------------------------------------

def generate_transactions(n: int = 5000, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    records = []

    # Distributia ponderate a oraselor
    city_weights = {
        "Chisinau": 0.65,
        "Balti":    0.15,
        "Cahul":    0.05,
        "Ungheni":  0.05,
        "Orhei":    0.05,
        "Straseni": 0.05,
    }
    cities_list = list(city_weights.keys())
    cities_prob = list(city_weights.values())

    for _ in range(n):
        # 1. Oras si cartier
        city = str(rng.choice(cities_list, p=cities_prob))
        neighborhoods = NEIGHBORHOODS.get(city, ["Centru"])
        neighborhood = str(rng.choice(neighborhoods))

        # 2. Tip proprietate
        prop_probs = [0.70, 0.20, 0.10]  # APARTMENT, HOUSE, STUDIO
        property_type = str(rng.choice(PROPERTY_TYPES, p=prop_probs))

        # 3. Suprafata
        mean_s, std_s = SURFACE_PARAMS[property_type]
        surface_sqm = float(max(12, rng.normal(mean_s, std_s)))
        surface_sqm = round(min(surface_sqm, 600), 1)

        # 4. Camere
        if property_type == "STUDIO":
            rooms = 0
        else:
            mean_r, std_r = ROOMS_PARAMS[property_type]
            rooms = int(max(1, round(rng.normal(mean_r, std_r))))
            rooms = min(rooms, 8)

        # 5. Etaj si total etaje
        if property_type == "HOUSE":
            floor = int(rng.choice([0, 1], p=[0.6, 0.4]))
            total_floors = int(rng.choice([1, 2, 3], p=[0.5, 0.40, 0.10]))
        else:
            total_floors = int(rng.choice([4, 5, 9, 10, 12, 16], p=[0.10, 0.15, 0.30, 0.20, 0.15, 0.10]))
            floor = int(rng.integers(0, total_floors + 1))

        # 6. An constructie
        year_built = _random_year_built()

        # 7. Dotari
        is_furnished = bool(rng.random() < 0.55)
        amenities = _amenities_list(is_furnished, rng)
        amenities_count = len(amenities)
        amenities_list_str = "|".join(amenities) if amenities else ""

        # 8. Coordonate
        lat, lng = _get_coords(city, neighborhood)

        # 9. Data tranzactie
        transaction_date = _transaction_date(rng)

        # 10. Calcul pret
        base_price_per_sqm = PRICE_PER_SQM_BY_NEIGHBORHOOD.get(
            neighborhood,
            DEFAULT_PRICE_PER_SQM_BY_CITY.get(city, 500),
        )

        # Factori de ajustare
        age_factor   = _building_age_factor(year_built, transaction_date.year)
        floor_factor = _floor_factor(floor, total_floors)
        type_factor  = TYPE_PRICE_FACTOR[property_type]
        trend_factor = _price_trend_factor(transaction_date)
        furn_factor  = 1.05 if is_furnished else 1.00
        amenity_factor = 1.0 + 0.01 * min(amenities_count, 5)

        price_per_sqm = (
            base_price_per_sqm
            * age_factor
            * floor_factor
            * type_factor
            * trend_factor
            * furn_factor
            * amenity_factor
        )

        # Zgomot de piata (~10% std)
        noise = rng.normal(1.0, 0.10)
        price_per_sqm = max(150, price_per_sqm * noise)

        sale_price_eur = round(price_per_sqm * surface_sqm, 0)

        # Filtre de calitate conform ML-PLAN.md §2.2
        ppsm = sale_price_eur / surface_sqm
        if ppsm < 100 or ppsm > 5000:
            continue
        if surface_sqm < 10 or surface_sqm > 1000:
            continue

        # Metadate
        data_source = str(rng.choice(
            DATA_SOURCES,
            p=[0.60, 0.30, 0.10],
        ))
        is_verified = bool(rng.random() < 0.85)

        records.append({
            "transaction_id":    str(uuid.uuid4())[:13].replace("-", "tx"),
            "transaction_date":  transaction_date,
            "city":              city,
            "neighborhood":      neighborhood,
            "property_type":     property_type,
            "rooms":             rooms,
            "surface_sqm":       surface_sqm,
            "floor":             floor if rng.random() > 0.05 else None,
            "total_floors":      total_floors if rng.random() > 0.05 else None,
            "year_built":        year_built if rng.random() > 0.08 else None,
            "is_furnished":      is_furnished,
            "amenities_count":   amenities_count,
            "amenities_list":    amenities_list_str,
            "lat":               lat if rng.random() > 0.03 else None,
            "lng":               lng if rng.random() > 0.03 else None,
            "sale_price_eur":    sale_price_eur,
            "price_per_sqm_eur": round(ppsm, 2),
            "data_source":       data_source,
            "is_verified":       is_verified,
        })

    df = pd.DataFrame(records)
    df["transaction_date"] = pd.to_datetime(df["transaction_date"])
    df = df.sort_values("transaction_date").reset_index(drop=True)
    return df


def main() -> None:
    parser = argparse.ArgumentParser(description="Genereaza dataset sintetic AVM Moldova")
    parser.add_argument("--n", type=int, default=5000, help="Numarul de tranzactii")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--out", type=str, default="data/synthetic_transactions.csv")
    args = parser.parse_args()

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"Generez {args.n} tranzactii sintetice...")
    df = generate_transactions(n=args.n, seed=args.seed)

    df.to_csv(out_path, index=False)
    print(f"Salvat: {out_path}  ({len(df)} randuri)")

    # Statistici sumare
    print("\n--- Sumar dataset ---")
    print(f"Tranzactii totale: {len(df)}")
    print(f"Interval date: {df['transaction_date'].min().date()} — {df['transaction_date'].max().date()}")
    print(f"\nDistributie orase:\n{df['city'].value_counts()}")
    print(f"\nPret median EUR: {df['sale_price_eur'].median():,.0f}")
    print(f"Pret/mp median: {df['price_per_sqm_eur'].median():,.0f}")
    print(f"Suprafata medie: {df['surface_sqm'].mean():.1f} mp")
    print(f"\nValori lipsa:\n{df.isnull().sum()[df.isnull().sum() > 0]}")


if __name__ == "__main__":
    main()
