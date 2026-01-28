# 🔌 RIVA - Documentație API CRUD pentru Backend

Acest document centralizează toate specificațiile de API din documentația de proiect RIVA. Este destinat echipei de Backend pentru implementare.

**Versiune:** 1.0.0
**Status:** Consolidat
**Data:** Ianuarie 2026
**Base URL:** `https://api.riva.ro/v1`

---

## 📋 Cuprins

1. [Standarde Generale](#standarde-generale)
2. [Modul 01: Autentificare și Securitate](#modul-01-autentificare-și-securitate)
3. [Modul 02: Identitate Profil și KYC](#modul-02-identitate-profil-și-kyc)
4. [Modul 03: Management Proprietăți (Core CRUD)](#modul-03-management-proprietăți-core-crud)
5. [Modul 04: Căutare și Descoperire](#modul-04-căutare-și-descoperire)
6. [Modul 05: Mesagerie în Timp Real](#modul-05-mesagerie-în-timp-real)
7. [Modul 06: Vizionări și Programări](#modul-06-vizionări-și-programări)
8. [Modul 07: Favorite și Liste Personalizate](#modul-07-favorite-și-liste-personalizate)
9. [Modul 08: Notificări și Dispozitive](#modul-08-notificări-și-dispozitive)
10. [Modul 09: Asistent AI Inteligent](#modul-09-asistent-ai-inteligent)
11. [Modul 10: Analytics și Insight-uri](#modul-10-analytics-și-insight-uri)
12. [Modul 11: Monetizare și Plăți](#modul-11-monetizare-și-plăți)

---

## 📌 Standarde Generale

### Format Request/Response

- **Content-Type:** `application/json`
- **Accept:** `application/json`

### Autentificare

- **Header:** `Authorization: Bearer <access_token>`
- **Tokens:** JWT pentru Access Token (exp: 15 min), Opaque pentru Refresh Token (exp: 30 zile).

### Răspuns Erori (Standard)

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {
      "field": "Specific validation error"
    }
  }
}
```

### Paginare (Standard pentru liste)

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true
  }
}
```

---

## 🔐 Modul 01: Autentificare și Securitate

### Înregistrare și Login

| Metodă   | Endpoint               | Descriere                     | Format Request                                               | Format Response                          |
| :------- | :--------------------- | :---------------------------- | :----------------------------------------------------------- | :--------------------------------------- |
| **POST** | `/auth/register`       | Înregistrare cu Email/Parolă  | `{email, password, firstName, lastName, userType, consents}` | `201: {user, message}`                   |
| **POST** | `/auth/register/phone` | Înregistrare cu Telefon (OTP) | `{phone, userType}`                                          | `200: {message: "OTP sent"}`             |
| **POST** | `/auth/login`          | Login Email/Parolă            | `{email, password, deviceInfo}`                              | `200: {accessToken, refreshToken, user}` |
| **POST** | `/auth/login/phone`    | Login cu Telefon (OTP)        | `{phone, otp, deviceInfo}`                                   | `200: {accessToken, refreshToken, user}` |
| **POST** | `/auth/logout`         | Invalidare sesiune            | -                                                            | `204: No Content`                        |
| **POST** | `/auth/refresh`        | Reîmprospătare Access Token   | `{refreshToken}`                                             | `200: {accessToken, expiresIn}`          |

### Verificare și Recuperare

| Metodă   | Endpoint                | Descriere                    | Format Request         | Format Response  |
| :------- | :---------------------- | :--------------------------- | :--------------------- | :--------------- |
| **POST** | `/auth/verify-email`    | Confirmare email via token   | `{token}`              | `200: {message}` |
| **POST** | `/auth/verify-phone`    | Validare cod OTP             | `{phone, otp}`         | `200: {message}` |
| **POST** | `/auth/forgot-password` | Solicitare link/cod resetare | `{email}`              | `200: {message}` |
| **POST** | `/auth/reset-password`  | Setare parolă nouă via token | `{token, newPassword}` | `200: {message}` |

### OAuth

| Metodă   | Endpoint             | Descriere            | Format Request              | Format Response                          |
| :------- | :------------------- | :------------------- | :-------------------------- | :--------------------------------------- |
| **POST** | `/auth/oauth/google` | Autentificare Google | `{idToken}`                 | `200: {accessToken, refreshToken, user}` |
| **POST** | `/auth/oauth/apple`  | Autentificare Apple  | `{identityToken, fullName}` | `200: {accessToken, refreshToken, user}` |

---

## 🪪 Modul 02: Identitate Profil și KYC

### Profil Utilizator

| Metodă    | Endpoint           | Descriere                    | Format Request                         | Format Response                                                             |
| :-------- | :----------------- | :--------------------------- | :------------------------------------- | :-------------------------------------------------------------------------- |
| **GET**   | `/users/me`        | Obține profilul curent       | -                                      | `200: {id, email, firstName, lastName, role, verificationLevel, ...}`       |
| **PUT**   | `/users/me`        | Actualizează date profil     | `{firstName, lastName, bio, location}` | `200: {user}`                                                               |
| **PATCH** | `/users/me/avatar` | Upload avatar (multipart)    | `file: avatar`                         | `200: {avatarUrl}`                                                          |
| **GET**   | `/users/:id`       | Profil public alt utilizator | -                                      | `200: {id, displayName, avatar, verificationLevel, rating, activeListings}` |

### KYC (Know Your Customer)

| Metodă   | Endpoint            | Descriere                            | Format Request                                    | Format Response                            |
| :------- | :------------------ | :----------------------------------- | :------------------------------------------------ | :----------------------------------------- |
| **POST** | `/kyc/verify-id`    | Start verificare document identitate | `multipart: {docType, docFront, docBack, selfie}` | `200: {verificationId, status: "pending"}` |
| **GET**  | `/kyc/status`       | Verifică statusul KYC                | -                                                 | `200: {level, status, reasons: []}`        |
| **POST** | `/kyc/property-doc` | Upload document proprietate          | `multipart: {propertyId, docType, file}`          | `200: {docId, status: "pending"}`          |

---

## 🏠 Modul 03: Management Proprietăți (Core CRUD)

### Operațiuni de Bază

| Metodă     | Endpoint          | Descriere                   | Format Request                                             | Format Response                      |
| :--------- | :---------------- | :-------------------------- | :--------------------------------------------------------- | :----------------------------------- |
| **GET**    | `/properties`     | Listare (cu filtre)         | `query: {type, priceMin, areaMin, rooms, city, ...}`       | `200: {data: [], pagination: {...}}` |
| **POST**   | `/properties`     | Creare anunț nou (Draft)    | `{title, description, location, characteristics, pricing}` | `201: {id, slug, status: "DRAFT"}`   |
| **GET**    | `/properties/:id` | Detalii complete anunț      | -                                                          | `200: {propertyData}`                |
| **PUT**    | `/properties/:id` | Actualizare totală/parțială | `{propertyData}`                                           | `200: {propertyData}`                |
| **DELETE** | `/properties/:id` | Ștergere anunț              | -                                                          | `204: No Content`                    |

### Media și Status

| Metodă    | Endpoint                 | Descriere                         | Format Request          | Format Response                     |
| :-------- | :----------------------- | :-------------------------------- | :---------------------- | :---------------------------------- |
| **POST**  | `/properties/:id/photos` | Upload poze multiple              | `multipart: {photos[]}` | `200: {photos: [{id, url, order}]}` |
| **PATCH** | `/properties/:id/status` | Schimbă status (ACTIVE/VOID/SOLD) | `{status}`              | `200: {status}`                     |
| **GET**   | `/users/me/properties`   | Proprietățile mele (Proprietar)   | -                       | `200: {data: []}`                   |

---

## 🔍 Modul 04: Căutare și Descoperire

| Metodă  | Endpoint                         | Descriere                       | Format Request           | Format Response                              |
| :------ | :------------------------------- | :------------------------------ | :----------------------- | :------------------------------------------- |
| **GET** | `/properties/search`             | Căutare full-text + filtre      | `query: {q, ...filters}` | `200: {data: []}`                            |
| **GET** | `/properties/search/suggestions` | Autocomplete căutare            | `query: {q}`             | `200: {suggestions: [{type, value, count}]}` |
| **GET** | `/properties/search/map`         | Căutare pentru hartă (clustere) | `query: {bounds, zoom}`  | `200: {clusters: [], properties: []}`        |

---

## 💬 Modul 05: Mesagerie în Timp Real

| Metodă   | Endpoint                      | Descriere                  | Format Request               | Format Response       |
| :------- | :---------------------------- | :------------------------- | :--------------------------- | :-------------------- |
| **GET**  | `/conversations`              | Lista de conversații       | -                            | `200: {data: []}`     |
| **POST** | `/conversations`              | Start conversație nouă     | `{propertyId, message}`      | `201: {conversation}` |
| **GET**  | `/conversations/:id/messages` | Lista mesaje dintr-un chat | `query: {lastId, limit}`     | `200: {data: []}`     |
| **POST** | `/conversations/:id/messages` | Trimite mesaj nou          | `{type, content, metadata?}` | `201: {message}`      |

---

## 📅 Modul 06: Vizionări și Programări

| Metodă    | Endpoint                | Descriere                           | Format Request                            | Format Response                      |
| :-------- | :---------------------- | :---------------------------------- | :---------------------------------------- | :----------------------------------- |
| **GET**   | `/viewings`             | Vizionările mele (viitoare/trecute) | `query: {role: "owner/seeker"}`           | `200: {data: []}`                    |
| **POST**  | `/viewings`             | Solicitare vizionare nouă           | `{propertyId, requestedSlots: [], notes}` | `201: {viewing}`                     |
| **PATCH** | `/viewings/:id/confirm` | Confirmare (doar proprietar)        | `{confirmedSlot, meetingPoint}`           | `200: {viewing}`                     |
| **PATCH** | `/viewings/:id/cancel`  | Anulare vizionare                   | `{reason}`                                | `200: {viewing_status: "CANCELLED"}` |

---

## ❤️ Modul 07: Favorite și Liste Personalizate

| Metodă     | Endpoint                 | Descriere                      | Format Request          | Format Response   |
| :--------- | :----------------------- | :----------------------------- | :---------------------- | :---------------- |
| **GET**    | `/favorites`             | Listează toate favoritele      | -                       | `200: {data: []}` |
| **POST**   | `/favorites`             | Adaugă proprietate la favorite | `{propertyId, listId?}` | `201: {id}`       |
| **DELETE** | `/favorites/:propertyId` | Elimină din favorite           | -                       | `204: No Content` |

---

## 🔔 Modul 08: Notificări și Dispozitive

| Metodă    | Endpoint                             | Descriere                      | Format Request                | Format Response   |
| :-------- | :----------------------------------- | :----------------------------- | :---------------------------- | :---------------- |
| **GET**   | `/notifications`                     | Lista notificări               | -                             | `200: {data: []}` |
| **PATCH** | `/notifications/:id/read`            | Marcare mesaj citit            | -                             | `200`             |
| **POST**  | `/notifications/read-all`            | Marcare toate ca citite        | -                             | `200`             |
| **POST**  | `/devices/push-token`                | Înregistrare token FCM/APNs    | `{token, platform, deviceId}` | `200`             |
| **PUT**   | `/users/me/notification-preferences` | Setări notificări (email/push) | `{push: {...}, email: {...}}` | `200`             |

---

## 🤖 Modul 09: Asistent AI Inteligent

Acest modul reprezintă **diferențiatorul cheie**. Backend-ul trebuie să integreze cu LLM (OpenAI/Anthropic).

| Metodă   | Endpoint                   | Descriere                          | Format Request               | Format Response                                   |
| :------- | :------------------------- | :--------------------------------- | :--------------------------- | :------------------------------------------------ |
| **POST** | `/ai/chat/stream`          | Conversație search AI (Streaming)  | `{message, conversationId?}` | `SseStream: {token, propertiesFound}`             |
| **GET**  | `/ai/conversations`        | Istoric conversații AI             | -                            | `200: {data: []}`                                 |
| **POST** | `/ai/analyze-property/:id` | Analiză automată anunț             | -                            | `200: {overallScore, priceAnalysis, suggestions}` |
| **POST** | `/ai/generate-description` | Generează descriere SEO            | `{propertyId, style, tone}`  | `200: {content}`                                  |
| **GET**  | `/ai/price-estimate`       | Estimare preț bazată pe date piață | `{propertyData}`             | `200: {suggestedRange, confidence}`               |

---

## 📊 Modul 10: Analytics și Insight-uri

| Metodă  | Endpoint                                | Descriere                    | Format Request    | Format Response                                          |
| :------ | :-------------------------------------- | :--------------------------- | :---------------- | :------------------------------------------------------- |
| **GET** | `/properties/:id/analytics`             | Statistici detaliate anunț   | `query: {period}` | `200: {views, contacts, chartData, ...}`                 |
| **GET** | `/properties/:id/analytics/suggestions` | Sugestii optimizare din date | -                 | `200: {recommendations: []}`                             |
| **GET** | `/properties/:id/analytics/export`      | Export PDF/CSV statistici    | -                 | `File Stream`                                            |
| **GET** | `/users/me/analytics/summary`           | Dashboard owner summary      | -                 | `200: {totalViews, totalLeads, listingsPerformance: []}` |

---

## 💳 Modul 11: Monetizare și Plăți

| Metodă   | Endpoint                  | Descriere                 | Format Request             | Format Response       |
| :------- | :------------------------ | :------------------------ | :------------------------- | :-------------------- |
| **GET**  | `/subscriptions/plans`    | Lista planuri subscripție | -                          | `200: {plans: []}`    |
| **POST** | `/subscriptions`          | Activare subscripție      | `{planId, paymentMethod}`  | `201: {subscription}` |
| **POST** | `/payments/create-intent` | Inițiere plată (Stripe)   | `{amount, currency, type}` | `201: {clientSecret}` |
| **POST** | `/properties/:id/boost`   | Cumpărare Boost/Promovare | `{boostType, duration}`    | `200: {activeUntil}`  |
| **GET**  | `/users/me/transactions`  | Istoric plăți și facturi  | -                          | `200: {data: []}`     |

---

**Note de Implementare:**

1. Toate endpoint-urile care modifică date trebuie să valideze proprietatea resursei (ex: doar owner-ul poate edita `:id`).
2. S-a ales folosirea de UUID-uri pentru toate ID-urile de resurse expuse extern.
3. Toate datele financiare/prețurile trebuie procesate în format `integer` (cenți/bani) pentru a evita erorile de rotunjire.

**Document finalizat de:** Team RIVA
**Data:** 19 Ianuarie 2026
