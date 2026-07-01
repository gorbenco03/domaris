# Domaris (Riva)

**Platformă imobiliară peer-to-peer, fără comision, pentru Republica Moldova** — cu asistent conversațional bazat pe inteligență artificială și model propriu de evaluare automată a prețurilor.

> Lucrare de licență · Universitatea Politehnica Timișoara, Facultatea de Automatică și Calculatoare · programul *Automatică și Informatică Aplicată (Ingineria Sistemelor)*
> **Autor:** Chiril Gorbenco · **Coordonator:** Ș.l. dr. ing. Andreea Robu · 2026

---

## Ce este

Domaris este un sistem complet integrat (web + mobil + backend), nu doar o aplicație izolată. Elimină intermedierea și comisioanele de pe piața imobiliară digitală și adaugă trei mecanisme originale de valoare.

### Cele trei contribuții originale

1. **Asistent AI multi-tier** — un agent conversațional care rutează cererile pe trei niveluri de cost/complexitate (Tier 0 — reguli deterministe ~70%; Tier 1 — GPT-4o-mini ~25%; Tier 2 — GPT-4o ~5%), cu *tool-calling* real (căutare, estimare preț, programare vizionare). Obține calitatea unui model mare la un cost mediu redus de ~10×.
2. **AVM — model propriu de evaluare automată a prețurilor** — model de *machine learning* (gradient boosting / LightGBM) antrenat pe tranzacții reale, cu interval de încredere (regresie pe cuantile) și explicabilitate (SHAP). Fallback pe comparabile (CMA) când datele sunt insuficiente.
3. **Model de încredere prin verificare graduală (KYC)** — cont unificat cu niveluri de verificare 0→3 (email/telefon → identitate → proprietar), care deblochează progresiv funcții sensibile. Conform GDPR.

---

## Arhitectură

Monorepo **Nx + pnpm** cu tipuri partajate:

| Pachet | Tehnologie | Rol |
|--------|-----------|-----|
| `backend/` | NestJS · Sequelize · PostgreSQL · Redis · Socket.IO | API REST + WebSocket, 16 module, autentificare, AVM, KYC, chat real-time |
| `frontend/` | Next.js 16 · React 19 · Tailwind | Aplicația web |
| `mobile/` | Expo · React Native | Aplicația mobilă |
| `packages/types` | TypeScript | Contracte / DTO-uri partajate |
| `ml/` | Python · LightGBM · FastAPI | Pipeline de antrenare + microserviciu de inferență pentru AVM |

Servicii externe: OpenAI (asistentul AI), DigitalOcean Spaces (stocare S3), Mapbox (hărți).

---

## Rulare locală

### Cerințe
- Node.js ≥ 18, **pnpm**
- **PostgreSQL** (local sau Docker) și **Redis**
- Python 3.11 (opțional, doar pentru microserviciul ML)

### 1. Dependențe
```bash
pnpm install
```

### 2. Bază de date + Redis
```bash
docker run --name domaris-postgres -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres -e POSTGRES_DB=domaris -p 5432:5432 -d postgres
docker run --name domaris-redis -p 6379:6379 -d redis
```

### 3. Variabile de mediu
Copiază exemplele și completează cheile (cel puțin `OPENAI_API_KEY`, `JWT_SECRET`, conexiunea la DB):
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

### 4. Date de test
```bash
npm run seed-listings   # populează anunțuri Chișinău pentru demo
```

### 5. Pornire
```bash
npx nx serve backend     # API pe http://localhost:4000/api
npx nx dev frontend      # Web pe http://localhost:3000
```

Mobil (opțional): `cd mobile && npx expo start`.
Microserviciul ML (opțional, pentru AVM cu model antrenat): vezi `ml/README.md`.

---

## Model AVM (ml/)

Pipeline reproductibil de antrenare:
```bash
cd ml && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
python src/train.py --data data/real_transactions.csv   # antrenare + metrici (MAE / MAPE / R²)
python src/evaluate.py                                    # grafice acuratețe + SHAP
uvicorn service.main:app --port 8000                      # microserviciu /predict
```
Backend-ul folosește modelul via `AVM_SERVICE_URL`; dacă nu e setat, cade grațios pe estimarea prin comparabile.

---

## Note

- Piața țintă: **Republica Moldova** (monedă EUR, oraș Chișinău).
- **Monetizarea este dezactivată** în v1 (feature-flag `MONETIZATION_ENABLED` / `NEXT_PUBLIC_MONETIZATION_ENABLED`).
- Nu se comit secrete: fișierele `.env` sunt ignorate; folosiți `.env.example` ca șablon.

## Comenzi utile
- Build: `npx nx build backend` · `npx nx build frontend`
- Teste: `npx nx test backend`
- Graf dependențe: `npx nx graph`
