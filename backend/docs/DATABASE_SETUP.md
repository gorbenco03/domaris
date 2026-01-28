# Setup PostgreSQL pentru Backend

## Eroare: `role "postgres" does not exist`

Backend-ul se conectează cu utilizatorul `postgres`. Dacă acest rol nu există în PostgreSQL (comun pe macOS/Homebrew), poți fie să creezi rolul, fie să folosești utilizatorul tău.

---

### Varianta A: Creează rolul `postgres`

Conectează-te la PostgreSQL cu utilizatorul tău (de obicei = numele de user macOS):

```bash
# Pe macOS cu Homebrew, utilizatorul implicit este cel al sistemului
psql postgres
# sau
psql -d postgres -U $(whoami)
```

În consola `psql` rulează:

```sql
CREATE ROLE postgres WITH LOGIN PASSWORD 'postgres' SUPERUSER CREATEDB CREATEROLE;
```

Apoi creează baza de date (dacă nu există):

```sql
CREATE DATABASE domaris OWNER postgres;
```

Ieși: `\q`

---

### Varianta B: Folosește utilizatorul tău PostgreSQL în `.env`

Află utilizatorul cu care se conectează PostgreSQL:

```bash
psql postgres -c "SELECT current_user;"
# sau pe macOS/Homebrew, utilizatorul este de obicei:
whoami
```

În `backend/.env` schimbă:

```
DB_USER=postgres   →   DB_USER=<numele_tau>
DB_PASS=postgres   →   DB_PASS=<parola_ta_postgres>
```

Creează baza de date (dacă nu există):

```bash
createdb domaris
# sau
psql postgres -c "CREATE DATABASE domaris;"
```

---

### Verificare

```bash
# Test conexiune
psql -h localhost -U postgres -d domaris -c "SELECT 1;"
# sau cu user-ul tău:
psql -h localhost -U $(whoami) -d domaris -c "SELECT 1;"
```

După ce una dintre variante funcționează, repornește backend-ul.
