# Riva-AVM v1 — Automated Valuation Model

Model ML pentru estimarea prețului de vânzare al proprietăților imobiliare din Republica Moldova.
Parte din platforma **Domaris / Riva** — lucrare de licență Chiril Gorbenco, 2026.

---

## Structura directorului

```
ml/
├── src/
│   ├── schema.py              # Schema datasetului (coloane, tipuri, valori valide)
│   ├── generate_synthetic.py  # Generator date sintetice realiste Moldova
│   ├── features.py            # Feature engineering pipeline (staterul)
│   ├── train.py               # Antrenare LightGBM + Optuna + SHAP + serializare
│   └── evaluate.py            # Evaluare model pe setul de test
├── service/
│   └── main.py                # Microserviciu FastAPI (POST /predict, GET /health)
├── models/                    # Modele serializate (generate de train.py)
│   ├── feature_pipeline_v1.pkl
│   ├── lgbm_q10_v1.pkl
│   ├── lgbm_q50_v1.pkl
│   ├── lgbm_q90_v1.pkl
│   ├── feature_cols_v1.pkl
│   └── model_card.json
├── data/                      # Date de intrare
│   └── synthetic_transactions.csv
├── requirements.txt
├── Dockerfile
└── README.md
```

---

## Cerinte

- Python 3.10+
- Toate dependențele sunt în `requirements.txt`

---

## Pornire rapidă

### 1. Creare venv și instalare

```bash
cd /Users/kirill/domaris/ml

python3 -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt
```

### 2. Generare date sintetice

```bash
python src/generate_synthetic.py
# => data/synthetic_transactions.csv  (~5000 tranzacții)
```

### 3. Antrenare model

```bash
python src/train.py
# => models/lgbm_q{10,50,90}_v1.pkl
# => models/feature_pipeline_v1.pkl
# => models/model_card.json

# Cu mai multe trial-uri Optuna (mai lent, mai bun):
python src/train.py --trials 100
```

### 4. Evaluare

```bash
python src/evaluate.py
# Raportează MAE / MAPE / RMSE / R² pe setul de test
```

### 5. Pornire microserviciu FastAPI

```bash
uvicorn service.main:app --host 0.0.0.0 --port 8001 --reload
# Documentație interactivă: http://localhost:8001/docs
```

### 6. Test endpoint predict

```bash
curl -X POST http://localhost:8001/predict \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Chisinau",
    "neighborhood": "Botanica",
    "property_type": "APARTMENT",
    "rooms": 2,
    "surface_sqm": 52.0,
    "floor": 4,
    "total_floors": 9,
    "year_built": 1987,
    "is_furnished": true,
    "amenities": ["parking", "elevator", "balcony"]
  }'
```

**Răspuns exemplu:**
```json
{
  "predicted_price": 47500,
  "price_min": 41200,
  "price_max": 54800,
  "confidence_score": 0.72,
  "model_version": "riva-avm-v1.0.0",
  "prediction_timestamp": "2026-06-25T10:30:00+00:00",
  "shap_top_features": [
    {"feature": "surface_sqm", "shap_value": 12500.0, "direction": "up"},
    {"feature": "neighborhood_encoded", "shap_value": 8200.0, "direction": "up"},
    {"feature": "building_age", "shap_value": -4100.0, "direction": "down"},
    {"feature": "floor_ratio", "shap_value": 1800.0, "direction": "up"},
    {"feature": "dist_to_center_km", "shap_value": -900.0, "direction": "down"}
  ]
}
```

### 7. Docker (opțional)

```bash
# Construire imagine (după antrenare — copiază models/ în imagine)
docker build -t riva-avm:v1 .

# Rulare container
docker run -p 8001:8001 riva-avm:v1
```

---

## Schema datelor de intrare (date reale)

Formatul exact așteptat pentru înlocuirea datelor sintetice cu date reale.

### Fișier CSV de tranzacții

Fișierul trebuie să conțină coloanele de mai jos. Coloanele marcate `*` sunt obligatorii (nu pot fi null).

| Coloana | Tip | Exemplu | Note |
|---------|-----|---------|------|
| `transaction_id` * | str | `tx_a3f9bc` | UUID anonimizat — fără PII |
| `transaction_date` * | datetime | `2024-03-15` | Format ISO: YYYY-MM-DD |
| `city` * | str | `Chisinau` | Valori: Chisinau, Balti, Cahul, Ungheni, Orhei, Straseni |
| `neighborhood` * | str | `Botanica` | Cartierul (ex: Botanica, Buiucani, Ciocana, Rascani, Centru...) |
| `property_type` * | str | `APARTMENT` | Valori: APARTMENT, HOUSE, STUDIO |
| `rooms` * | int | `2` | 0 = studio |
| `surface_sqm` * | float | `52.5` | Suprafața totală în mp (10–1000) |
| `floor` | int | `4` | Poate fi null — se impută |
| `total_floors` | int | `9` | Poate fi null — se impută |
| `year_built` | int | `1987` | Poate fi null — se impută |
| `is_furnished` * | bool | `true` | Mobilat: true/false |
| `amenities_count` | int | `3` | Număr dotări (0 dacă necunoscut) |
| `amenities_list` | str | `parking\|elevator\|balcony` | Dotări pipe-separated (poate fi gol) |
| `lat` | float | `46.9898` | Latitudine GPS rotunjită la 4 zecimale |
| `lng` | float | `28.8560` | Longitudine GPS rotunjită la 4 zecimale |
| `sale_price_eur` * | float | `47000` | **TARGET** — prețul REAL de vânzare în EUR (nu cel cerut!) |
| `price_per_sqm_eur` | float | `904.76` | Calculat automat dacă lipsește |
| `data_source` * | str | `internal` | Valori: internal, partner, cadastru |
| `is_verified` * | bool | `true` | Tranzacție verificată: true/false |

### Dotări valide (`amenities_list`)

Valorile recunoscute (pipe-separated): `parking`, `elevator`, `balcony`, `garage`, `storage`, `security`, `interphone`, `gas`, `internet`

### Cartiere suportate (Chișinău)

`Botanica`, `Buiucani`, `Ciocana`, `Rascani`, `Centru`, `Telecentru`, `Durlesti`, `Sculeni`, `Cricova`, `Codru`

---

## Cum se înlocuiesc datele sintetice cu date reale

1. **Exportă tranzacțiile din PostgreSQL** (listinguri cu status `SOLD`):
   ```sql
   SELECT
     gen_random_uuid()::text AS transaction_id,
     t.closed_at::date AS transaction_date,
     l.city, l.neighborhood, l.property_type,
     l.rooms, l.surface_sqm, l.floor, l.total_floors, l.year_built,
     l.is_furnished, l.amenities_count, l.amenities_list,
     round(l.lat::numeric, 4) AS lat,
     round(l.lng::numeric, 4) AS lng,
     t.final_price_eur AS sale_price_eur,
     round(t.final_price_eur / l.surface_sqm, 2) AS price_per_sqm_eur,
     'internal' AS data_source,
     t.is_verified
   FROM listings l
   JOIN transactions t ON t.listing_id = l.id
   WHERE l.transaction_type = 'SALE'
     AND l.property_type IN ('APARTMENT', 'HOUSE', 'STUDIO')
     AND t.closed_at >= NOW() - INTERVAL '5 years'
   ORDER BY t.closed_at;
   ```

2. **Salvează ca CSV** în `data/real_transactions.csv`

3. **Rulează pipeline-ul** cu datele reale:
   ```bash
   python src/train.py --data data/real_transactions.csv --trials 100
   python src/evaluate.py --data data/real_transactions.csv
   ```

4. **Fără alte modificări de cod** — pipeline-ul este identic pentru date sintetice și reale.

---

## Ținte de performanță (conform ML-PLAN.md)

| Metrică | Țintă minimă | Țintă optimă |
|---------|-------------|--------------|
| MAPE    | < 15%       | < 10%        |
| MAE     | < 8.000 EUR | < 5.000 EUR  |
| R²      | > 0.80      | > 0.88       |

Pe date **sintetice**, modelul atinge aceste ținte deoarece datele sunt generate după o formulă — scopul datelor sintetice este testarea pipeline-ului end-to-end, nu benchmarking-ul real.

---

## Endpoint-uri API

### `GET /health`
```json
{
  "status": "ok",
  "model_version": "riva-avm-v1.0.0",
  "model_loaded": true,
  "models_dir": "/Users/kirill/domaris/ml/models"
}
```

### `POST /predict`
Input: `PropertyInput` (JSON)
Output: `PredictionOutput` cu `predicted_price`, `price_min`, `price_max`, `confidence_score`, `shap_top_features`

Documentație completă: http://localhost:8001/docs

---

## Versionare model

Schema: `riva-avm-vMAJOR.MINOR.PATCH`
- **MAJOR**: schimbare arhitecturală (features noi, algoritm nou)
- **MINOR**: reantrenare cu date noi (lunar/trimestrial)
- **PATCH**: hotfix preprocesare

Modelul activ este configurat prin variabila de mediu `ACTIVE_MODEL_VERSION`.
