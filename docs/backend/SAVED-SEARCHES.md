# 🔖 Saved Searches API Documentation

**Versiune:** 1.0.0  
**Data:** 22 Ianuarie 2026

---

## 📋 Sumar

Modulul Saved Searches permite utilizatorilor să:

- **Salveze căutări** cu parametri specifici
- **Primească alerte** când apar proprietăți noi
- **Ruleze căutări salvate** instant
- **Gestioneze multiple căutări** cu nume personalizate

---

## 🔌 Endpoints

### GET `/saved-searches`

**Descriere:** Obține toate căutările salvate ale utilizatorului curent.

**Autentificare:** Bearer Token (required)

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "name": "Apartamente Cluj sub 400€",
      "params": {
        "city": "Cluj-Napoca",
        "rooms": 2,
        "priceMax": 400
      },
      "alertsEnabled": true,
      "alertFrequency": "DAILY",
      "newMatchesCount": 3,
      "totalMatchesCount": 45,
      "createdAt": "2026-01-20T10:00:00Z",
      "updatedAt": "2026-01-22T08:00:00Z"
    }
  ],
  "total": 1
}
```

---

### GET `/saved-searches/:id`

**Descriere:** Obține detaliile unei căutări salvate.

**Autentificare:** Bearer Token (required)

**Response:** Același format ca mai sus (un singur obiect)

**Side effect:** Resetează `newMatchesCount` la 0 și actualizează `lastViewedAt`

---

### POST `/saved-searches`

**Descriere:** Creează o nouă căutare salvată.

**Autentificare:** Bearer Token (required)

**Request Body:**

```json
{
  "name": "Garsoniere București centru",
  "params": {
    "city": "București",
    "rooms": 1,
    "priceMin": 200,
    "priceMax": 400,
    "neighborhood": "Unirii"
  },
  "alertsEnabled": true,
  "alertFrequency": "DAILY"
}
```

**Alert Frequencies:**

- `INSTANT` - Notificare imediată
- `DAILY` - Rezumat zilnic
- `WEEKLY` - Rezumat săptămânal

**Response:** Căutarea creată cu `totalMatchesCount` populat

---

### PUT `/saved-searches/:id`

**Descriere:** Actualizează o căutare salvată.

**Autentificare:** Bearer Token (required)

**Request Body:**

```json
{
  "name": "Garsoniere București - update",
  "params": {
    "priceMax": 500
  },
  "alertsEnabled": false
}
```

---

### DELETE `/saved-searches/:id`

**Descriere:** Șterge o căutare salvată.

**Autentificare:** Bearer Token (required)

**Response:**

```json
{
  "success": true
}
```

---

### GET `/saved-searches/:id/run`

**Descriere:** Execută o căutare salvată și returnează rezultatele.

**Autentificare:** Bearer Token (required)

**Query Parameters:**

- `page` - Pagina (default: 1)
- `limit` - Rezultate per pagină (default: 20)

**Response:**

```json
{
  "savedSearch": {
    "id": 1,
    "name": "Apartamente Cluj",
    "...": "..."
  },
  "results": {
    "data": [...],
    "meta": {
      "total": 45,
      "page": 1,
      "limit": 20,
      "totalPages": 3,
      "hasNextPage": true
    }
  }
}
```

**Side effect:** Actualizează `lastViewedAt` și resetează `newMatchesCount`

---

### PATCH `/saved-searches/:id/alerts`

**Descriere:** Activează/dezactivează alertele pentru o căutare.

**Autentificare:** Bearer Token (required)

**Request Body:**

```json
{
  "enabled": true,
  "frequency": "INSTANT"
}
```

---

## 🔔 Cum funcționează alertele

1. **La creare:** Se salvează `totalMatchesCount` curent
2. **Cron job (TBD):** Verifică periodic noile match-uri
3. **Dacă există noi:** Incrementează `newMatchesCount`
4. **Trimite notificare:** Conform `alertFrequency`
5. **La vizualizare:** Resetează `newMatchesCount`

---

## 📁 Structura Entity

```typescript
interface SavedSearch {
  id: number;
  userId: number;
  name: string;
  params: SearchFilters;
  alertsEnabled: boolean;
  alertFrequency?: 'INSTANT' | 'DAILY' | 'WEEKLY';
  lastAlertAt?: Date;
  newMatchesCount: number;
  totalMatchesCount: number;
  lastViewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## ⚠️ Error Codes

| Status | Code         | Description                         |
| ------ | ------------ | ----------------------------------- |
| 404    | NOT_FOUND    | Căutarea nu există                  |
| 409    | CONFLICT     | Există deja o căutare cu acest nume |
| 401    | UNAUTHORIZED | Token lipsă sau invalid             |

---

**Document creat:** 22 Ianuarie 2026  
**Autor:** Claude AI
