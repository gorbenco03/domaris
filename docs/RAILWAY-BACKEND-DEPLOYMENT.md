# Domaris – Deploy backend pe Railway

Acest document descrie, pas cu pas, cum faci deploy la backend-ul `@domaris/backend` pe Railway, împreună cu PostgreSQL și Redis, folosind configurația reală din acest repo.

## 1. Recomandarea pentru început

Pentru stadiul actual al proiectului, setup-ul recomandat este:

- Railway pentru backend
- Railway PostgreSQL pentru baza de date
- Railway Redis pentru cache / sesiuni / cozi ușoare
- DigitalOcean Spaces pentru fișiere
- fără Docker la primul deploy

Motivul principal este că proiectul este un monorepo cu Nx + pnpm workspaces, iar Railway poate face deploy direct din repo fără să complice build-ul cu o imagine Docker.

## 2. Ce trebuie să știi despre proiect

Backend-ul:

- se build-uiește din rădăcina monorepo-ului
- folosește `pnpm` și `nx`
- produce artefactul în `backend/dist/main.js`
- expune API-ul cu prefix global `api`

Asta înseamnă că după deploy endpoint-urile vor fi de forma:

```txt
https://<railway-domain>/api
```

Swagger va fi la:

```txt
https://<railway-domain>/api/docs
```

## 3. Pregătire înainte de deploy

Asigură-te că:

- repo-ul este pe GitHub
- Railway are acces la repo
- ai valorile reale pentru variabilele externe:
  - JWT secret
  - DigitalOcean Spaces
  - OpenAI
  - Apify
  - Apple Client ID
  - Google Client ID
- știi ce URL vei folosi pentru frontend / website, ca să setezi `APP_URL`

## 4. Modificări de production deja pregătite în cod

Codul a fost pregătit pentru production astfel:

- în production, schema DB nu mai face automat `alter`
- comportamentul DB este controlabil prin env:
  - `DB_SYNCHRONIZE`
  - `DB_SSL`
  - `DB_SSL_REJECT_UNAUTHORIZED`
- `API_URL` și `APP_URL` sunt validate explicit în production
- validarea de env include și opțiunile reale folosite la deploy

Recomandare:

- în production setează `DB_SYNCHRONIZE=false`
- rulează migrările manual când ai nevoie

## 5. Creezi proiectul în Railway

În Railway:

1. `New Project`
2. `Deploy from GitHub Repo`
3. selectezi repo-ul `domaris`

După asta, în același proiect Railway, adaugi încă 2 servicii:

- PostgreSQL
- Redis

Ordinea recomandată:

1. creezi proiectul din repo
2. adaugi PostgreSQL
3. adaugi Redis
4. configurezi serviciul backend

## 6. Configurarea serviciului backend

### 6.1 Root directory

Pentru acest repo, recomandarea este:

- nu seta `Root Directory` la `backend`
- lasă deploy-ul din rădăcina repo-ului

Motiv:

- backend-ul folosește Nx din monorepo
- există dependențe workspace
- build-ul corect pornește din root

### 6.2 Build command

Setează build command la:

```bash
corepack enable && pnpm install --frozen-lockfile && pnpm nx build @domaris/backend --configuration=production
```

### 6.3 Start command

Setează start command la:

```bash
node backend/dist/main.js
```

## 7. PostgreSQL pe Railway

Adaugă serviciul PostgreSQL în același proiect Railway.

Railway îți va genera credențiale pentru baza de date. Le vei mappa în backend la variabilele cerute de aplicație.

Backend-ul tău cere următoarele variabile pentru DB:

```env
DB_DIALECT=postgres
DB_HOST=
DB_PORT=
DB_USER=
DB_PASS=
DB_NAME=
DB_LOGGING=false
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
DB_SYNCHRONIZE=false
```

Valori recomandate pentru Railway:

```env
DB_DIALECT=postgres
DB_LOGGING=false
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
DB_SYNCHRONIZE=false
```

Iar restul le iei din serviciul PostgreSQL Railway.

## 8. Redis pe Railway

Adaugă serviciul Redis în același proiect Railway.

Variabilele necesare în backend:

```env
REDIS_HOST=
REDIS_PORT=
REDIS_PASSWORD=
```

Dacă Railway Redis îți oferă și parolă, seteaz-o. Dacă nu, o lași goală doar dacă serviciul permite conexiune fără parolă.

## 9. Variabilele de mediu pentru backend

Acestea sunt variabilele importante pentru production, conform codului actual.

### 9.1 Variabile de bază

```env
NODE_ENV=production
APP_NAME=domaris
JWT_SECRET=<genereaza-un-secret-lung>
API_URL=https://<backend-domain>/api
APP_URL=https://<frontend-domain>
```

### 9.2 Database

```env
DB_DIALECT=postgres
DB_HOST=<railway-postgres-host>
DB_PORT=<railway-postgres-port>
DB_USER=<railway-postgres-user>
DB_PASS=<railway-postgres-password>
DB_NAME=<railway-postgres-db>
DB_LOGGING=false
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
DB_SYNCHRONIZE=false
```

### 9.3 Redis

```env
REDIS_HOST=<railway-redis-host>
REDIS_PORT=<railway-redis-port>
REDIS_PASSWORD=<railway-redis-password>
```

### 9.4 DigitalOcean Spaces

```env
DO_SPACES_ACCESS_KEY_ID=<spaces-key>
DO_SPACES_SECRET_ACCESS_KEY=<spaces-secret>
DO_SPACES_REGION=<ex: ams3>
DO_SPACES_BUCKET=<bucket-name>
```

### 9.5 AI / scraping / auth extern

```env
OPENAI_API_KEY=<openai-key>
OPENAI_MODEL=gpt-4o
APIFY_TOKEN=<apify-token>
APPLE_CLIENT_ID=<apple-client-id>
GOOGLE_CLIENT_ID=<google-client-id>
```

## 10. Cum setezi `API_URL` și `APP_URL`

### `API_URL`

Trebuie să fie URL-ul public al backend-ului tău, cu prefixul `api` inclus:

```env
API_URL=https://<backend-domain>/api
```

Exemplu:

```env
API_URL=https://domaris-backend-production.up.railway.app/api
```

### `APP_URL`

Trebuie să fie URL-ul public al frontend-ului sau website-ului care primește return-urile după plată:

```env
APP_URL=https://<frontend-domain>
```

Dacă nu ai încă frontend web live, pune temporar un URL valid pe care îl controlezi și schimbă-l ulterior.

## 11. Webhook-uri de plăți în production

Backend-ul tău expune webhook-urile:

- PAYNET: `/api/monetization/webhooks/paynet`
- MAIB: `/api/monetization/webhooks/maib`
- MPAY: `/api/monetization/webhooks/mpay`

URL-urile finale vor fi:

```txt
https://<backend-domain>/api/monetization/webhooks/paynet
https://<backend-domain>/api/monetization/webhooks/maib
https://<backend-domain>/api/monetization/webhooks/mpay
```

Aceste URL-uri trebuie configurate în dashboard-urile providerilor de plată atunci când treci pe production.

## 12. Primul deploy

După ce ai pus build/start commands și variabilele de mediu:

1. salvezi configurația în Railway
2. pornești deploy-ul
3. urmărești log-urile

Trebuie să verifici că backend-ul pornește fără erori de env validation.

Dacă deploy-ul reușește, testează:

- `https://<backend-domain>/api`
- `https://<backend-domain>/api/docs`

## 13. Migrări SQL

Repo-ul are migrări SQL în:

```txt
backend/migrations/
```

Recomandarea pentru production:

- nu te baza pe `sequelize alter`
- rulează migrările explicit, controlat

Poți rula migrările dintr-un mediu care are acces la baza Railway Postgres, folosind `psql`.

Exemplu generic:

```bash
psql "$DATABASE_URL" -f backend/migrations/<nume-fisier>.sql
```

Dacă Railway îți oferă credențiale separate, poți exporta variabilele:

```bash
export PGHOST=<host>
export PGPORT=<port>
export PGUSER=<user>
export PGPASSWORD=<password>
export PGDATABASE=<db>
psql -f backend/migrations/<nume-fisier>.sql
```

Rulează migrările în ordinea lor logică.

## 14. Cum verifici că totul e ok după deploy

Checklist minim:

- backend-ul răspunde la `/api`
- Swagger răspunde la `/api/docs`
- autentificarea funcționează
- search-ul funcționează
- conexiunea la Postgres este stabilă
- conexiunea la Redis este stabilă
- upload-ul în DO Spaces funcționează
- webhook-urile sunt accesibile public
- `API_URL` și `APP_URL` sunt corecte

## 15. Probleme frecvente

### Backend-ul nu pornește

Cauza probabilă:

- lipsește o variabilă obligatorie
- `API_URL` sau `APP_URL` nu sunt setate în production
- `DB_HOST` / `REDIS_HOST` sunt greșite

### Eroare la DB connection

Verifică:

- `DB_SSL=true`
- `DB_SSL_REJECT_UNAUTHORIZED=false`
- host/port/user/pass/db corecte

### Eroare la Redis connection

Verifică:

- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD`

### Webhook-urile nu merg

Verifică:

- `API_URL` include `/api`
- URL-ul public Railway este corect
- providerul extern trimite spre endpoint-ul corect

## 16. Despre Docker

Pentru primul deploy, recomandarea este să nu folosești Docker.

Docker devine util mai târziu, când vrei:

- build reproductibil 100%
- portabilitate spre alt provider
- orchestrare mai avansată

Dar pentru acum, Railway + build direct din repo este varianta mai simplă și mai bună.

## 17. Configurație recomandată finală

Setup recomandat pentru început:

- backend pe Railway
- PostgreSQL pe Railway
- Redis pe Railway
- DigitalOcean Spaces extern
- `DB_SYNCHRONIZE=false`
- migrări SQL rulate controlat
- webhook-uri configurate pe URL-ul Railway public

## 18. Comenzi utile de referință

Build local din root:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm nx build @domaris/backend --configuration=production
```

Test start local:

```bash
node backend/dist/main.js
```

## 19. Ce urmează după acest document

După ce ai configurat Railway:

1. faci primul deploy
2. verifici log-urile de startup
3. testezi `/api` și `/api/docs`
4. verifici DB și Redis
5. abia după aceea configurezi providerii externi de plăți pe URL-urile de production
