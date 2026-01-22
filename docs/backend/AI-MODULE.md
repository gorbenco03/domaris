# 🤖 AI Module API Documentation

**Versiune:** 1.0.0  
**Data:** 22 Ianuarie 2026

---

## 📋 Sumar

Modulul AI oferă funcționalități inteligente pentru platforma IMOBI:

- **Chat conversațional** - Căutare în limbaj natural
- **Generare descrieri** - Descrieri atractive pentru proprietăți
- **Analiză calitate** - Evaluare și sugestii de îmbunătățire
- **Estimare preț** - Bazată pe date de piață

**Provider:** OpenAI GPT-4o-mini (cost-effective pentru real estate)

---

## 🔌 Endpoints

### POST `/ai/chat`

**Descriere:** Conversație cu asistentul AI pentru căutare în limbaj natural.

**Autentificare:** Bearer Token (opțional - funcționează și public)

**Request Body:**

```json
{
  "message": "Caut un apartament cu 2 camere în Cluj-Napoca, maxim 400 euro pe lună",
  "conversationHistory": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "context": {
    "customInstructions": "Concentrează-te pe apartamente renovate recent",
    "userPreferences": {
      "preferredCities": ["Cluj-Napoca", "București"],
      "budgetMin": 200,
      "budgetMax": 500,
      "preferredRooms": 2,
      "mustHave": ["balcon", "centrală"],
      "dealBreakers": ["parter", "agenție"]
    },
    "tone": "friendly",
    "language": "ro",
    "maxResults": 5
  }
}
```

**Context Options (opțional):**

| Opțiune                           | Tip      | Descriere                                                             |
| --------------------------------- | -------- | --------------------------------------------------------------------- |
| `customInstructions`              | string   | Instrucțiuni speciale pentru AI (ex: "Arată doar apartamente de lux") |
| `userPreferences.preferredCities` | string[] | Orașe implicite pentru căutare dacă nu e specificat                   |
| `userPreferences.budgetMin/Max`   | number   | Buget implicit (EUR)                                                  |
| `userPreferences.preferredRooms`  | number   | Număr camere preferat                                                 |
| `userPreferences.mustHave`        | string[] | Dotări obligatorii                                                    |
| `userPreferences.dealBreakers`    | string[] | Criterii de excludere                                                 |
| `tone`                            | enum     | `professional`, `friendly`, `concise`                                 |
| `language`                        | enum     | `ro` (română), `en` (engleză)                                         |
| `maxResults`                      | number   | Limite rezultate (default: 5)                                         |

**Response:**

```json
{
  "response": "Am găsit 5 apartamente cu 2 camere în Cluj-Napoca sub 400€/lună. Printre ele se numără...",
  "properties": [
    { "id": 123, "title": "Apartament 2 camere Mărăști", "priceEur": 350, ... }
  ],
  "intent": "search",
  "searchParams": {
    "city": "Cluj-Napoca",
    "rooms": 2,
    "priceMax": 400
  }
}
```

**Intent types:**

- `search` - Căutare proprietăți
- `info` - Cerere informații
- `comparison` - Comparare proprietăți
- `general` - Conversație generală

---

### POST `/ai/generate-description`

**Descriere:** Generează descriere atractivă pentru o proprietate.

**Autentificare:** Bearer Token (necesită Level 2 - identitate verificată)

**Request Body:**

```json
{
  "propertyType": "APARTMENT",
  "transactionType": "RENT",
  "rooms": 2,
  "surface": 55,
  "city": "București",
  "neighborhood": "Tineretului",
  "floor": 3,
  "totalFloors": 8,
  "amenities": ["balcon", "centrală termică", "parcare"],
  "yearBuilt": 2018,
  "style": "professional"
}
```

**Stiluri disponibile:**

- `professional` - Ton formal, factual
- `friendly` - Ton cald, accesibil pentru familii
- `luxurious` - Ton elegant, sofisticat

**Response:**

```json
{
  "title": "Apartament modern 2 camere în Tineretului, renovat recent",
  "description": "Oferim spre închiriere un apartament exceptional...",
  "seoKeywords": ["apartament", "tineretului", "2 camere", "chirie"],
  "highlights": ["Renovat în 2023", "Metro la 5 min", "Parcare inclusă"]
}
```

---

### GET `/ai/analyze/:propertyId`

**Descriere:** Analizează calitatea unui anunț și oferă sugestii de îmbunătățire.

**Autentificare:** Bearer Token (necesită Level 2 + Owner)

**Response:**

```json
{
  "overallScore": 65,
  "priceAnalysis": {
    "isReasonable": true,
    "marketComparison": "Prețul este cu 5% sub media zonei.",
    "suggestion": null
  },
  "descriptionAnalysis": {
    "score": 60,
    "issues": [],
    "suggestions": [
      "Adaugă detalii despre renovări recente",
      "Menționează vecinătatea și facilitățile"
    ]
  },
  "photosAnalysis": {
    "count": 3,
    "suggestions": [
      "Adaugă minim 10 fotografii de calitate",
      "Include imagini cu fiecare cameră"
    ]
  },
  "recommendations": [
    {
      "priority": "high",
      "title": "Adaugă fotografii profesionale",
      "description": "Proprietățile cu 10+ fotografii primesc de 3x mai multe vizualizări.",
      "impact": "Crește vizualizările cu până la 200%"
    }
  ]
}
```

---

### POST `/ai/estimate-price`

**Descriere:** Estimează prețul unei proprietăți bazat pe date de piață.

**Autentificare:** Public

**Request Body:**

```json
{
  "city": "Cluj-Napoca",
  "neighborhood": "Mărăști",
  "propertyType": "APARTMENT",
  "rooms": 2,
  "surface": 55,
  "floor": 3,
  "yearBuilt": 2015
}
```

**Response:**

```json
{
  "estimatedPrice": 450,
  "priceRange": {
    "min": 400,
    "max": 500
  },
  "confidence": 0.85,
  "comparables": {
    "avgPrice": 445,
    "avgPricePerSqm": 9,
    "count": 15
  }
}
```

---

## ⚙️ Configurare

Pentru a activa funcționalitățile AI, adaugă în `.env`:

```bash
OPENAI_API_KEY=sk-your-api-key-here
```

**Fără API key:** Modulul returnează răspunsuri mock pentru development.

---

## 🔒 Rate Limits (Recomandate)

| Endpoint                   | Limite sugerate |
| -------------------------- | --------------- |
| `/ai/chat`                 | 20 req/min/user |
| `/ai/generate-description` | 10 req/min/user |
| `/ai/analyze/:id`          | 10 req/min/user |
| `/ai/estimate-price`       | 30 req/min/user |

---

## 📊 Costuri Estimate OpenAI

| Endpoint             | Tokens/request | Cost estimat |
| -------------------- | -------------- | ------------ |
| Chat                 | ~500-1000      | ~$0.001      |
| Generate Description | ~800-1500      | ~$0.002      |
| Analyze              | ~1000-2000     | ~$0.003      |
| Estimate Price       | N/A (doar DB)  | $0           |

---

**Document creat:** 22 Ianuarie 2026  
**Autor:** Claude AI
