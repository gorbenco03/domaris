# RIVA – Ghid de deploy backend (server)

Acest ghid descrie cum să pui pe server aplicația backend NestJS (RIVA / Domaris): cerințe, variabile de mediu, build, rulare, baza de date, proxy și opțional Docker.

---

## Cuprins

1. [Cerințe server](#1-cerințe-server)
2. [Servicii externe](#2-servicii-externe)
3. [Variabile de mediu (production)](#3-variabile-de-mediu-production)
4. [Baza de date PostgreSQL](#4-baza-de-date-postgresql)
5. [Migrări](#5-migrări)
6. [Build aplicație](#6-build-aplicație)
7. [Rulare pe server (PM2)](#7-rulare-pe-server-pm2)
8. [Nginx reverse proxy și SSL](#8-nginx-reverse-proxy-și-ssl)
9. [Deploy cu Docker (opțional)](#9-deploy-cu-docker-opțional)
10. [Checklist post-deploy](#10-checklist-post-deploy)

---

## 1. Cerințe server

### 1.1 Sistem și runtime

- **OS:** Linux recomandat (Ubuntu 22.04 LTS sau Debian 12).
- **Node.js:** v20 LTS (sau v22). Instalare exemplu:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y node.js
node -v   # v20.x
npm -v
```

- **pnpm** (dacă proiectul folosește pnpm în monorepo):

```bash
npm install -g pnpm
```

### 1.2 Porturi

- Aplicația ascultă pe **PORT** (default 4000). Acest port nu trebuie expus direct în internet; îl ascunzi în spatele unui reverse proxy (Nginx) care face terminare SSL.

### 1.3 Structură proiect (referință)

Conform `backend/structure.txt`:

- **Config:** `.env` (nu se comite; folosești `.example.env` ca șablon).
- **Sursă:** `src/` – `main.ts`, `app/` (auth, core, db, modules).
- **Build:** Nx/Webpack; ieșire în `backend/dist/` (sau path configurat în Nx).
- **Scripturi:** `scripts/` – list-users, migrations, etc.
- **Migrări:** `migrations/*.sql` – rulezi manual cu `psql`.

---

## 2. Servicii externe

Backend-ul depinde de:

| Serviciu | Utilizare | Alternativă |
|----------|-----------|-------------|
| **PostgreSQL** | Baza de date principală | Obligatoriu |
| **Redis** | Cache / sesiuni / rate limit (dacă e folosit) | Upstash Redis, Redis pe server |
| **AWS S3** (sau compatibil S3) | Stocare fișiere (imagini, KYC, uploads) | MinIO, DigitalOcean Spaces |
| **Email** | Trimitere email (OTP, reset parolă) | SendGrid, SMTP propriu |
| **SMS** (opțional) | OTP pe telefon | Twilio, provider local |
| **OpenAI** (opțional) | Modul AI | Cheie API OpenAI |
| **Push** | Notificări (APNs / FCM) | Configurat în backend |

Pentru production:

- **PostgreSQL:** instanță dedicată sau managed (AWS RDS, DigitalOcean, Supabase, etc.).
- **Redis:** Upstash (serverless) sau Redis pe același server / container.
- **S3:** bucket dedicat, IAM user cu acces limitat; nu pune chei în repo.

---

## 3. Variabile de mediu (production)

Creezi pe server fișierul `backend/.env` (sau `./.env` în directorul din care pornești app-ul), pe baza `.example.env`. **Nu comiți niciodată `.env` cu valori reale.**

### 3.1 Variabile obligatorii

```env
NODE_ENV=production
APP_NAME=domaris

# Server
PORT=4000

# Database (PostgreSQL)
DB_HOST=<host-postgres>
DB_PORT=5432
DB_USER=<user>
DB_PASS=<parola-securizata>
DB_NAME=domaris
DB_DIALECT=postgres
DB_LOGGING=false

# JWT (generează un secret lung și aleatoriu)
JWT_SECRET=<secret-foarte-lung-aleatoriu>

# Redis (dacă e folosit)
REDIS_HOST=<host-redis>
REDIS_PORT=6379
REDIS_PASSWORD=<parola-redis>
```

### 3.2 Variabile pentru funcționalități

```env
# AWS S3 (sau S3-compatible)
AWS_ACCESS_KEY_ID=<access-key>
AWS_SECRET_ACCESS_KEY=<secret-key>
AWS_REGION=eu-central-1
AWS_S3_BUCKET=<nume-bucket>

# OAuth (pentru login din app)
APPLE_CLIENT_ID=ro.riva.app
GOOGLE_CLIENT_ID=<google-oauth-web-client-id>

# Email (ex: SendGrid sau SMTP)
# Verifică în cod ce variabile sunt folosite (ex: SENDGRID_API_KEY, SMTP_*)

# OpenAI (dacă modulul AI e activ)
OPENAI_API_KEY=<key>
OPENAI_MODEL=gpt-4o

# Push / alte servicii conform backend
```

Generare JWT secret (exemplu):

```bash
openssl rand -base64 48
```

Păstrează acest secret doar în `.env` pe server și în orice manager de secrete folosit la deploy.

---

## 4. Baza de date PostgreSQL

### 4.1 Creare bază de date

Pe serverul PostgreSQL (sau instanța managed):

```bash
psql -U postgres -c "CREATE USER domaris WITH PASSWORD 'parola-securizata';"
psql -U postgres -c "CREATE DATABASE domaris OWNER domaris;"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE domaris TO domaris;"
```

Sau folosești un utilizator existent și doar creezi baza:

```bash
createdb -U postgres domaris
```

### 4.2 Conectare din backend

În `.env`:

- `DB_HOST` – adresa serverului PostgreSQL (ex: `localhost`, IP privat sau hostname RDS).
- `DB_PORT` – de obicei 5432.
- `DB_USER` / `DB_PASS` / `DB_NAME` – utilizatorul care are drepturi pe baza `domaris`.

Backend-ul folosește **Sequelize** cu `synchronize: true` și `sync: { alter: true }` în development; în **production** este recomandat să dezactivezi `synchronize` și să folosești doar migrări SQL controlate (vezi secțiunea 5 și `backend/docs/DATABASE_SETUP.md`).

---

## 5. Migrări

Migrările sunt fișiere SQL în `backend/migrations/`. Se rulează **manual**, în ordine, cu `psql`:

```bash
cd backend
export PGHOST=... PGPORT=5432 PGUSER=domaris PGPASSWORD=... PGDATABASE=domaris

psql -f migrations/002-cleanup-unified-account.sql
psql -f migrations/003-add-listing-views-anonymous-id.sql
psql -f migrations/004-add-audit-log-immutability-triggers.sql
psql -f migrations/005-fix-user-consents-consent-type-enum.sql
# etc. – verifică numele și ordinea fișierelor
```

Sau cu un singur utilizator:

```bash
psql -U domaris -d domaris -f migrations/002-cleanup-unified-account.sql
```

Rulezi migrările **o singură dată** per mediu (sau de fiecare dată când adaugi un fișier nou), de obicei înainte de primul start al aplicației pe acel mediu.

---

## 6. Build aplicație

Proiectul folosește **Nx**. Build-ul se face din **rădăcina monorepo-ului** (unde este `nx.json` și `package.json` cu workspaces).

### 6.1 Instalare dependențe și build

```bash
# Din rădăcina proiectului (domaris)
pnpm install
pnpm nx build @domaris/backend --configuration=production
```

Alternativ (dacă există script în root):

```bash
pnpm run build backend
```

Ieșirea este de obicei în `backend/dist/` (sau path din `backend/package.json` → `nx.targets.build.outputs`). Verifică că există fișierul principal (ex: `main.js` sau `src/main.js`).

### 6.2 Rulare locală (test)

```bash
cd backend
node dist/main.js
# sau, dacă entry e altul:
node dist/src/main.js
```

Aplicația ascultă pe `PORT` (default 4000). API: `http://localhost:4000/api`, Swagger: `http://localhost:4000/api/docs`.

---

## 7. Rulare pe server (PM2)

**PM2** gestionează procesul Node, restart la crash și loguri.

### 7.1 Instalare PM2

```bash
sudo npm install -g pm2
```

### 7.2 Pornire aplicație

Din directorul unde este `dist/` și unde există `.env` (sau unde ai setat `NODE_ENV=production` și variabilele):

```bash
cd /var/www/domaris/backend   # exemplu path deploy
pm2 start dist/main.js --name "domaris-api"
# sau, dacă entry e în subfolder:
pm2 start dist/src/main.js --name "domaris-api"
```

Sau cu un fișier **ecosystem.config.js** în root backend:

```javascript
module.exports = {
  apps: [{
    name: 'domaris-api',
    script: 'dist/main.js',   // sau dist/src/main.js
    cwd: '/var/www/domaris/backend',
    instances: 1,
    exec_mode: 'fork',
    env: { NODE_ENV: 'production' },
    error_file: '~/.pm2/logs/domaris-api-error.log',
    out_file: '~/.pm2/logs/domaris-api-out.log',
  }],
};
```

Pornire:

```bash
cd /var/www/domaris/backend
pm2 start ecosystem.config.js
```

### 7.3 Comenzi utile

```bash
pm2 status
pm2 logs domaris-api
pm2 restart domaris-api
pm2 stop domaris-api
pm2 save
pm2 startup   # pentru a porni PM2 la reboot
```

---

## 8. Nginx reverse proxy și SSL

Aplicația rulează pe `localhost:4000`. Nginx ascultă pe 80/443 și face proxy către 4000.

### 8.1 Exemplu bloc server (HTTP → redirect HTTPS)

```nginx
server {
    listen 80;
    server_name api.domaris.md;
    return 301 https://$server_name$request_uri;
}
```

### 8.2 Exemplu bloc server HTTPS

```nginx
server {
    listen 443 ssl http2;
    server_name api.domaris.md;

    ssl_certificate     /etc/letsencrypt/live/api.domaris.md/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.domaris.md/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
    }
}
```

- Înlocuiești `api.domaris.md` cu domeniul tău.
- SSL: poți folosi **Let’s Encrypt** (certbot):

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.domaris.md
```

### 8.3 Reload Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

După aceasta, aplicația este accesibilă la `https://api.domaris.md/api` și Swagger la `https://api.domaris.md/api/docs`. În app-ul mobile setezi `EXPO_PUBLIC_API_URL=https://api.domaris.md/api` și `EXPO_PUBLIC_WS_URL=wss://api.domaris.md` (dacă WebSocket merge pe același domeniu).

---

## 9. Deploy cu Docker (opțional)

Poți rula doar backend-ul în Docker sau backend + PostgreSQL + Redis într-un `docker-compose`.

### 9.1 Exemplu Dockerfile pentru backend

Fișier în `backend/Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile
COPY . .
# Ajustează comanda de build pentru monorepo (poate fi necesar COPY din root)
RUN pnpm nx build @domaris/backend --configuration=production

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "dist/main.js"]
```

Build și rulare (din directorul unde e Dockerfile):

```bash
docker build -t domaris-api .
docker run -d --name domaris-api -p 4000:4000 --env-file .env domaris-api
```

În producție, `.env` nu se copiază în imagine; se injectează prin `--env-file` sau variabile de mediu din orchestrator.

### 9.2 Exemplu docker-compose (backend + PostgreSQL + Redis)

Poți avea un `docker-compose.yml` în root sau în `backend/` care pornește:

- un serviciu `api` (imaginea backend),
- `postgres`,
- `redis`,

cu rețea comună și variabile de mediu pentru `DB_HOST=postgres`, `REDIS_HOST=redis`. Detaliile (volume, healthchecks) le poți completa după nevoi; important este ca `DB_HOST` și `REDIS_HOST` să corespundă numelor serviciilor.

---

## 10. Checklist post-deploy

- [ ] **PostgreSQL:** bază `domaris` creată, utilizator cu drepturi; migrările rulate.
- [ ] **Redis:** pornit și accesibil din backend (dacă e folosit).
- [ ] **.env production:** toate variabilele setate (DB, JWT_SECRET, S3, OAuth, etc.); JWT_SECRET unic și puternic.
- [ ] **Build:** `pnpm nx build @domaris/backend --configuration=production` reușit; `dist/` conține entry-ul.
- [ ] **PM2:** aplicația pornește cu `pm2 start`; `pm2 save` și `pm2 startup` pentru persistență la reboot.
- [ ] **Nginx:** proxy către `127.0.0.1:4000`; SSL activ; `api.domaris.md` (sau domeniul tău) rezolvat corect.
- [ ] **Firewall:** doar 80/443 deschise spre exterior; 4000 doar local.
- [ ] **Health:** `curl https://api.domaris.md/api` sau un endpoint de health (dacă există) returnează răspuns valid.
- [ ] **App mobile:** `EXPO_PUBLIC_API_URL` și `EXPO_PUBLIC_WS_URL` setate la URL-ul production al API-ului.
- [ ] **Loguri și monitorizare:** loguri PM2 / fișiere; eventual alerting la crash.

---

## Referințe rapide

| Resursă | Locație / comandă |
|--------|---------------------|
| Sursă backend | `backend/src/`, `backend/structure.txt` |
| Exemplu env | `backend/.example.env` |
| Migrări | `backend/migrations/*.sql` |
| Setup DB | `backend/docs/DATABASE_SETUP.md` |
| Build | `pnpm nx build @domaris/backend --configuration=production` |
| Rulare | `node backend/dist/main.js` sau PM2 |

---

*Document generat pentru proiectul RIVA (backend). Actualizat conform structurii din `backend/structure.txt` și configurării NestJS.*
