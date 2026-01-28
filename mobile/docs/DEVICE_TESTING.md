# Testare pe device fizic (iPhone / Android)

Pe device fizic, **`localhost` = telefonul**, nu Mac-ul. Deci request-urile către `http://localhost:4000` nu ajung la backend-ul de pe Mac.

## Ce trebuie făcut

Folosește **IP-ul Mac-ului** în rețea în loc de `localhost`.

### 1. Află IP-ul Mac-ului

În terminal (pe Mac):

```bash
ipconfig getifaddr en0
```

Sau: **System Settings → Network → Wi‑Fi → Details** – vezi adresa IP (ex. `192.168.1.10`).

### 2. Setează URL-urile în `.env.local`

În `mobile/.env.local` pune IP-ul tău (nu `localhost`):

```env
# Pentru device fizic – înlocuie 192.168.1.10 cu IP-ul tău
EXPO_PUBLIC_API_URL=http://192.168.1.10:4000/api
EXPO_PUBLIC_WS_URL=ws://192.168.1.10:4000
```

### 3. Repornește Metro

După ce modifici `.env.local`, repornește serverul Expo (variabilele se citesc la start):

```bash
# Oprește (Ctrl+C) și pornește din nou
npx expo start
```

### 4. Același Wi‑Fi

Telefonul și Mac-ul trebuie să fie pe **același rețea Wi‑Fi**.

---

## Rezumat

| Unde rulezi app-ul | EXPO_PUBLIC_API_URL |
|--------------------|----------------------|
| Simulator / emulator | `http://localhost:4000/api` |
| Device fizic | `http://<IP_MAC>:4000/api` (ex. `http://192.168.1.10:4000/api`) |

Axios / fetch folosesc `env.API_URL` din `@/config/env`, care citește `EXPO_PUBLIC_API_URL`. Dacă în `.env.local` pui IP-ul Mac-ului, pe device fizic request-urile merg corect la backend.
