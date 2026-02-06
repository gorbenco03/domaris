# Configurare DigitalOcean Spaces pentru backend

Backend-ul folosește **DigitalOcean Spaces** (storage S3-compatibil) pentru upload de imagini (anunțuri) și documente (KYC). Ai nevoie de:

- **DO_SPACES_ACCESS_KEY_ID** – Access Key (Spaces key) din DigitalOcean
- **DO_SPACES_SECRET_ACCESS_KEY** – Secret Key (se obține o singură dată la crearea cheii)
- **DO_SPACES_REGION** – regiunea Space-ului (ex: `ams3`, `nyc3`, `sfo3`)
- **DO_SPACES_BUCKET** – numele bucket-ului (Space)

---

## 1. Cont DigitalOcean

- Dacă nu ai cont: [digitalocean.com](https://www.digitalocean.com) → Sign up.
- Autentificare: [cloud.digitalocean.com](https://cloud.digitalocean.com).

---

## 2. Creare Space (bucket)

1. În DigitalOcean → **Spaces Object Storage** → **Create Space**.
2. **Datacenter region:** alege o regiune (ex. **Amsterdam 3** → `ams3`, **New York 3** → `nyc3`, **San Francisco 3** → `sfo3`). Notează codul regiunii – îl folosești în `.env` la `DO_SPACES_REGION`.
3. **Enable CDN:** opțional (pentru cache și performanță).
4. **Space name:** un nume unic (ex: `domaris-uploads-prod`).
5. **File listing:** poți lăsa **Public** dacă vrei acces direct la fișiere prin URL, sau **Restricted** și folosești doar signed URLs (backend-ul poate seta `ACL: 'public-read'` la upload dacă Space-ul permite).

Notează **numele Space-ului** – îl pui în `.env` la `DO_SPACES_BUCKET`.

---

## 3. Creare API key (Spaces)

1. **API** → **Spaces Keys** (sau **Spaces** → **Manage Keys**).
2. **Generate New Key**.
3. **Key name:** ex. `domaris-backend-spaces`.
4. Copiază **Access Key** și **Secret Key** – Secret Key se afișează o singură dată.

---

## 4. Setare în backend

În `backend/.env` (nu comiți acest fișier):

```env
DO_SPACES_ACCESS_KEY_ID=your-access-key
DO_SPACES_SECRET_ACCESS_KEY=your-secret-key
DO_SPACES_REGION=ams3
DO_SPACES_BUCKET=domaris-uploads-prod
```

- Înlocuiești cu **Access Key** și **Secret Key** de la pasul 3.
- **DO_SPACES_BUCKET** = numele Space-ului creat la pasul 2.
- **DO_SPACES_REGION** = codul regiunii (ex. `ams3`, `nyc3`, `sfo3`).

Repornești backend-ul după ce salvezi `.env`.

---

## 5. Verificare rapidă

- Upload de imagine la un anunț din app (sau prin API) ar trebui să scrie în Spaces și URL-ul să fie de forma:  
  `https://<DO_SPACES_BUCKET>.<DO_SPACES_REGION>.digitaloceanspaces.com/...`
- Dacă primești erori de autentificare, verifici: nume bucket, regiune, și că cheile sunt pentru Spaces (nu API token general).

---

## 6. Siguranță

- **Nu** pune niciodată `DO_SPACES_SECRET_ACCESS_KEY` în cod sau în repo (doar în `.env` / variabile de mediu pe server).
- În producție folosești variabile de mediu pe server sau un secret manager, nu fișier `.env` comis.
- Poți restricționa key-ul doar la Spaces (nu la alte resurse DO) dacă platforma oferă această opțiune.

---

*Backend folosește aceste variabile în `S3Module` / `S3Service` și în `listing.service.ts` (upload imagini anunțuri) și KYC (documente). API-ul este S3-compatibil, deci se folosește același SDK AWS cu endpoint-ul DigitalOcean.*
