# 🔌 Contracte API

**Versiune:** 1.0.0  
**Data:** Ianuarie 2026  
**Base URL:** `https://api.riva.ro/v1`

---

## 📋 Cuprins

1. [Convenții Generale](#convenții-generale)
2. [Autentificare](#autentificare-api)
3. [Utilizatori](#utilizatori-api)
4. [Proprietăți](#proprietăți-api)
5. [Căutare](#căutare-api)
6. [Mesagerie](#mesagerie-api)
7. [Vizionări](#vizionări-api)
8. [Favorite](#favorite-api)
9. [Notificări](#notificări-api)

---

## 📌 Convenții Generale

### Format Request/Response

```
Content-Type: application/json
Accept: application/json
```

### Autentificare

```
Authorization: Bearer <access_token>
```

### Paginare

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Răspuns Erori

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": "Email format invalid",
      "password": "Minimum 8 characters required"
    }
  }
}
```

### Coduri HTTP

| Cod | Utilizare           |
| --- | ------------------- |
| 200 | Success             |
| 201 | Created             |
| 204 | No Content (delete) |
| 400 | Bad Request         |
| 401 | Unauthorized        |
| 403 | Forbidden           |
| 404 | Not Found           |
| 422 | Validation Error    |
| 429 | Rate Limited        |
| 500 | Server Error        |

---

## 🔐 Autentificare API

### POST /auth/register

Înregistrare utilizator nou.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "Ion",
  "lastName": "Popescu",
  "userType": "OWNER",
  "consents": {
    "terms": true,
    "privacy": true,
    "marketing": false
  }
}
```

**Response 201:**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "Ion",
    "lastName": "Popescu",
    "emailVerified": false,
    "verificationLevel": 0
  },
  "message": "Verification email sent"
}
```

### POST /auth/login

Autentificare utilizator.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "deviceInfo": {
    "platform": "ios",
    "deviceId": "device-uuid"
  }
}
```

**Response 200:**

```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIs...",
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2g...",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "Ion",
    "lastName": "Popescu",
    "avatar": "https://...",
    "role": "OWNER",
    "verificationLevel": 2
  }
}
```

### POST /auth/refresh

Reîmprospătare access token.

**Request:**

```json
{
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2g..."
}
```

**Response 200:**

```json
{
  "accessToken": "new-access-token",
  "expiresIn": 900
}
```

### POST /auth/logout

Delogare și invalidare token.

**Response 204:** No content

### POST /auth/forgot-password

Solicită resetare parolă.

**Request:**

```json
{
  "email": "user@example.com"
}
```

**Response 200:**

```json
{
  "message": "Reset link sent if email exists"
}
```

---

## 👤 Utilizatori API

### GET /users/me

Obține profilul curent.

**Response 200:**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "Ion",
  "lastName": "Popescu",
  "displayName": "Ion P.",
  "avatar": "https://...",
  "bio": "Proprietar de apartamente...",
  "location": {
    "city": "București",
    "county": "București"
  },
  "role": "OWNER",
  "verificationLevel": 2,
  "rating": {
    "average": 4.8,
    "count": 23
  },
  "createdAt": "2026-01-01T00:00:00Z"
}
```

### PUT /users/me

Actualizează profilul.

**Request:**

```json
{
  "firstName": "Ion",
  "lastName": "Popescu",
  "displayName": "Ion P.",
  "bio": "Proprietar cu experiență",
  "location": {
    "city": "București",
    "county": "București"
  }
}
```

### PATCH /users/me/avatar

Upload avatar.

**Request:** `multipart/form-data`

- `avatar`: File (JPG, PNG, max 5MB)

**Response 200:**

```json
{
  "avatarUrl": "https://cdn.riva.ro/avatars/uuid.jpg"
}
```

### GET /users/:id

Obține profilul public al unui utilizator.

**Response 200:**

```json
{
  "id": "uuid",
  "displayName": "Ion P.",
  "avatar": "https://...",
  "verificationLevel": 2,
  "rating": {
    "average": 4.8,
    "count": 23
  },
  "memberSince": "2026-01-01",
  "activeListings": 5
}
```

---

## 🏠 Proprietăți API

### GET /properties

Listează proprietăți (cu filtre).

**Query Parameters:**

- `page`, `perPage` - Paginare
- `transactionType` - SALE, RENT
- `propertyType` - APARTMENT, HOUSE, etc.
- `city`, `county` - Locație
- `priceMin`, `priceMax` - Range preț
- `areaMin`, `areaMax` - Range suprafață
- `rooms` - Număr camere
- `sort` - price_asc, price_desc, date_newest

**Response 200:**

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Apartament 3 camere",
      "slug": "apartament-3-camere-drumul-taberei",
      "transactionType": "SALE",
      "propertyType": "APARTMENT",
      "location": {
        "city": "București",
        "neighborhood": "Drumul Taberei"
      },
      "characteristics": {
        "totalArea": 75,
        "rooms": 3,
        "floor": 4
      },
      "pricing": {
        "price": 95000,
        "currency": "EUR",
        "pricePerSqm": 1267
      },
      "media": {
        "primaryPhoto": "https://..."
      },
      "owner": {
        "id": "uuid",
        "displayName": "Ion P.",
        "verificationLevel": 2
      },
      "stats": {
        "favorites": 12
      },
      "createdAt": "2026-01-15T00:00:00Z"
    }
  ],
  "pagination": {...}
}
```

### POST /properties

Creează proprietate nouă.

**Request:**

```json
{
  "title": "Apartament 3 camere modern",
  "description": "Apartament renovat complet...",
  "transactionType": "SALE",
  "propertyType": "APARTMENT",
  "location": {
    "county": "București",
    "city": "București",
    "neighborhood": "Drumul Taberei",
    "street": "Str. Brașov",
    "coordinates": {
      "lat": 44.4141,
      "lng": 26.0463,
      "accuracy": "APPROXIMATE"
    }
  },
  "characteristics": {
    "totalArea": 75,
    "rooms": 3,
    "bedrooms": 2,
    "bathrooms": 1,
    "floor": 4,
    "totalFloors": 10,
    "yearBuilt": 2008,
    "amenities": ["AIR_CONDITIONING", "FURNISHED"]
  },
  "pricing": {
    "price": 95000,
    "currency": "EUR",
    "negotiable": true
  }
}
```

**Response 201:**

```json
{
  "id": "uuid",
  "slug": "apartament-3-camere-drumul-taberei",
  "status": "DRAFT"
}
```

### GET /properties/:id

Detalii proprietate.

### PUT /properties/:id

Actualizează proprietate.

### DELETE /properties/:id

Șterge proprietate.

### POST /properties/:id/photos

Upload fotografii.

**Request:** `multipart/form-data`

- `photos[]`: Multiple files

**Response 200:**

```json
{
  "photos": [
    {
      "id": "uuid",
      "url": "https://...",
      "thumbnailUrl": "https://...",
      "order": 1
    }
  ]
}
```

### PATCH /properties/:id/status

Schimbă status proprietate.

**Request:**

```json
{
  "status": "ACTIVE"
}
```

---

## 🔍 Căutare API

### GET /properties/search

Căutare avansată.

**Query:** Aceleași ca GET /properties + full-text `q`

### GET /properties/search/suggestions

Sugestii autocomplete.

**Query:** `q=buc`

**Response 200:**

```json
{
  "suggestions": [
    { "type": "city", "value": "București", "count": 1523 },
    { "type": "neighborhood", "value": "Drumul Taberei", "count": 234 }
  ]
}
```

### GET /properties/search/map

Căutare pentru hartă (clustere).

**Query:** `bounds=44.3,25.9,44.5,26.2&zoom=12`

**Response 200:**

```json
{
  "clusters": [
    { "lat": 44.42, "lng": 26.05, "count": 12 },
    { "lat": 44.44, "lng": 26.1, "count": 8 }
  ],
  "properties": [{ "id": "uuid", "lat": 44.41, "lng": 26.04, "price": 95000 }]
}
```

---

## 💬 Mesagerie API

### GET /conversations

Listează conversațiile.

### POST /conversations

Inițiază conversație nouă.

**Request:**

```json
{
  "propertyId": "uuid",
  "message": "Bună ziua, sunt interesat..."
}
```

### GET /conversations/:id/messages

Listează mesajele unei conversații.

### POST /conversations/:id/messages

Trimite mesaj.

**Request:**

```json
{
  "type": "text",
  "content": "Când putem programa o vizionare?"
}
```

---

## 📅 Vizionări API

### GET /viewings

Listează vizionările.

### POST /viewings

Solicită vizionare.

**Request:**

```json
{
  "propertyId": "uuid",
  "requestedSlots": [
    { "date": "2026-01-22", "startTime": "10:00", "endTime": "10:30" },
    { "date": "2026-01-22", "startTime": "15:00", "endTime": "15:30" }
  ],
  "notes": "Sunt flexibil cu orele"
}
```

### PATCH /viewings/:id/confirm

Confirmă vizionare (proprietar).

**Request:**

```json
{
  "confirmedSlot": {
    "date": "2026-01-22",
    "startTime": "10:00",
    "endTime": "10:30"
  },
  "meetingPoint": "În fața blocului"
}
```

### PATCH /viewings/:id/cancel

Anulează vizionare.

---

## ❤️ Favorite API

### GET /favorites

Listează favorite.

### POST /favorites

Adaugă la favorite.

**Request:**

```json
{
  "propertyId": "uuid",
  "listId": "uuid"
}
```

### DELETE /favorites/:propertyId

Șterge din favorite.

---

## 🔔 Notificări API

### GET /notifications

Listează notificări.

### PATCH /notifications/:id/read

Marchează ca citită.

### POST /notifications/read-all

Marchează toate ca citite.

---

## 📝 Note

> **Acest document este un draft.** Se va actualiza după primirea specificațiilor backend-ului de la echipa de web development.

---

**Document Status:** Draft  
**Ultima actualizare:** Ianuarie 2026
