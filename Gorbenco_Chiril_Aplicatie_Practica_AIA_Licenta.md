# Domaris (Riva) — Lucrare de licență · Livrabile

**Autor:** Gorbenco Chiril
**Coordonator:** Ș.l. dr. ing. Andreea Ibănescu Robu
**Program:** Automatică și Informatică Aplicată (AIA) — Ingineria Sistemelor, UPT
**Sesiunea:** iulie 2026

Platformă imobiliară *peer-to-peer* fără comision, cu asistent conversațional bazat pe
inteligență artificială, model de evaluare automată a prețurilor (AVM) și model de
încredere bazat pe verificare graduală (KYC).

---

## 1. Repository (cod sursă complet)

**Adresa:** https://github.com/gorbenco03/domaris

Depozitul conține **întregul cod sursă**, fără fișiere binare compilate (directoarele
`node_modules/`, `dist/`, `.venv/`, build-urile native și artefactele de compilare sunt
excluse prin `.gitignore`).

> Aplicația rulează **live** pe Railway:
> - **Aplicație web:** https://frontend-production-439b.up.railway.app
> - API (backend): `https://robust-purpose-production-47e9.up.railway.app/api`
> - Serviciu ML (AVM): `https://avm-production-c6e7.up.railway.app`

---

## 2. Structura codului sursă (monorepo Nx + pnpm)

```
domaris/
├── backend/            Server de aplicație — NestJS 11 (TypeScript)
│                       API REST + WebSocket (Socket.IO), 16 module de domeniu
├── frontend/           Aplicație web — Next.js 16 / React 19 (TypeScript)
├── mobile/             Aplicație mobilă nativă — Expo / React Native 0.81
├── packages/types/     Pachet de tipuri TypeScript partajate (@domaris/types)
├── ml/                 Model AVM (Python): pipeline antrenare + microserviciu
│                       FastAPI de inferență (LightGBM, regresie pe cuantile)
└── thesis/             Lucrarea scrisă (LaTeX) — nu face parte din aplicație
```

---

## 3. Cerințe (prerechizite)

| Componentă | Versiune |
|---|---|
| Node.js | ≥ 20 |
| pnpm | ≥ 10 (`corepack enable`) |
| Python | 3.11 (pentru modulul `ml/`) |
| PostgreSQL | ≥ 14 |
| Redis | ≥ 6 |

---

## 4. Pași de compilare

Din rădăcina depozitului:

```bash
corepack enable
pnpm install                 # instalează dependențele întregului monorepo

pnpm nx build @domaris/types # construiește pachetul de tipuri partajate
pnpm nx build backend        # compilează serverul (webpack, producție)
pnpm nx build frontend       # compilează aplicația web (Next.js)
```

Modulul ML (opțional, pentru serviciul de evaluare):

```bash
cd ml
python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

---

## 5. Instalare și lansare (local, mod dezvoltare)

**1. Servicii de infrastructură** — PostgreSQL și Redis pornite local (sau prin Docker).

**2. Variabile de mediu** — se creează `backend/.env` (exemplu de chei):
```
DATABASE_URL=postgres://user:parola@localhost:5432/domaris
REDIS_URL=redis://localhost:6379
JWT_SECRET=...
OPENAI_API_KEY=...
EMAIL_PROVIDER=resend
RESEND_API_KEY=...
AVM_SERVICE_URL=http://localhost:8001     # opțional, pentru modelul ML
MONETIZATION_ENABLED=true
```

**3. Lansare backend:**
```bash
pnpm nx serve backend        # API pe http://localhost:3000/api
```

**4. Lansare aplicație web:**
```bash
pnpm nx serve frontend       # web pe http://localhost:4200
```

**5. Lansare serviciu ML (AVM), opțional:**
```bash
cd ml && source .venv/bin/activate
uvicorn service.main:app --host 0.0.0.0 --port 8001
```

**6. Aplicația mobilă (Expo):**
```bash
cd mobile
pnpm install
npx expo start               # rulare în Expo Go / simulator
# build nativ distribuibil:
eas build --platform ios --profile preview
```

---

## 6. Antrenarea modelului AVM (opțional)

```bash
cd ml && source .venv/bin/activate
python src/train.py --data data/real_transactions.csv --trials 30
# produce modelele în ml/models/ (q10/q50/q90 + pipeline + feature_cols)
```

---

## 7. Livrabile

- **Cod sursă complet** — repository-ul de mai sus (backend, web, mobil, ML, tipuri partajate).
- **Aplicație funcțională** — deployată live pe Railway (web + API + serviciu ML).
- **Model AVM antrenat** pe 17.250 de tranzacții reale (MAPE 16,0%, R² 0,882).
- **Lucrarea scrisă** — `Licenta_IS_Gorbenco_Chiril.pdf`.
