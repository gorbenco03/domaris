# 📱 GHID DE SINCRONIZARE MOBILE ↔ BACKEND

**Data:** 22 Ianuarie 2026  
**Versiune:** 1.0.0  
**Destinat:** Echipa Mobile (React Native)

---

## 📋 CUPRINS

1. [Status Backend](#-status-backend)
2. [Setup Development](#-setup-development)
3. [Endpoint-uri Noi](#-endpoint-uri-noi-de-implementat-în-mobile)
4. [Modele de Date](#-modele-de-date)
5. [Exemple de Integrare](#-exemple-de-integrare)
6. [Checklist MVP](#-checklist-mvp)

---

## ✅ STATUS BACKEND

### Toate funcționalitățile P0 sunt GATA!

| Feature                | Status     | Endpoint Base            | Documentație                      |
| ---------------------- | ---------- | ------------------------ | --------------------------------- |
| 🔐 Autentificare       | ✅ Complet | `/auth/*`                | docs/backend/MIGRATION-ADR-001.md |
| 👤 User Profile        | ✅ Complet | `/users/*`               | -                                 |
| 🏠 Proprietăți         | ✅ Complet | `/properties/*`          | -                                 |
| 🔍 Căutare             | ✅ Complet | `/search/*`              | -                                 |
| ❤️ Favorite            | ✅ Complet | `/favorites/*`           | -                                 |
| 💬 Mesagerie           | ✅ Complet | `/conversations/*`       | -                                 |
| 📅 Vizionări           | ✅ Complet | `/viewings/*`            | -                                 |
| 🔔 Notificări          | ✅ Complet | `/notifications/*`       | -                                 |
| 🔖 **Căutări Salvate** | ✅ **NOU** | `/saved-searches/*`      | docs/backend/SAVED-SEARCHES.md    |
| 🤖 **AI Assistant**    | ✅ **NOU** | `/ai/*`                  | docs/backend/AI-MODULE.md         |
| 📸 **Upload Imagini**  | ✅ **NOU** | `/properties/:id/photos` | -                                 |

---

## 🛠 SETUP DEVELOPMENT

### 1. Clonare și Instalare

```bash
git clone <repo>
cd domaris
pnpm install
```

### 2. Configurare Environment

Creează fișierul `backend/.env`:

```env
# === DATABASE ===
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=password123
DB_NAME=domaris

# === JWT ===
JWT_SECRET=your-super-secret-key-min-32-chars

# === REDIS (opțional pentru dev) ===
REDIS_HOST=localhost
REDIS_PORT=6379

# === AWS S3 (opțional - mock în dev) ===
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=eu-central-1
AWS_S3_BUCKET=domaris-uploads

# === OPENAI (pentru AI features) ===
OPENAI_API_KEY=sk-your-api-key

# === DEVELOPMENT ===
NODE_ENV=development
```

### 3. Pornire Baze de Date (Docker)

```bash
# PostgreSQL + Redis
docker-compose up -d
```

Sau manual:

```bash
docker run -d --name domaris-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password123 \
  -e POSTGRES_DB=domaris \
  -p 5432:5432 \
  postgres:15

docker run -d --name domaris-redis \
  -p 6379:6379 \
  redis:7
```

### 4. Pornire Backend

```bash
# Din root folder
pnpm nx serve @domaris/backend

# Backend va rula pe http://localhost:3000
```

### 5. Verificare

```bash
# Health check
curl http://localhost:3000/api

# Swagger UI
open http://localhost:3000/api/docs
```

---

## 🆕 ENDPOINT-URI NOI DE IMPLEMENTAT ÎN MOBILE

### 🔖 Saved Searches (`/saved-searches`)

| Method | Endpoint                     | Descriere                | Screen                      |
| ------ | ---------------------------- | ------------------------ | --------------------------- |
| GET    | `/saved-searches`            | Lista căutărilor salvate | SavedSearchesScreen         |
| POST   | `/saved-searches`            | Creează căutare nouă     | FiltersScreen (save button) |
| GET    | `/saved-searches/:id/run`    | Execută căutare          | SavedSearchResultsScreen    |
| PATCH  | `/saved-searches/:id/alerts` | Toggle alerte            | SavedSearchSettingsScreen   |
| DELETE | `/saved-searches/:id`        | Șterge căutare           | SavedSearchesScreen         |

**Request Example (Create):**

```typescript
const response = await api.post('/saved-searches', {
  name: 'Apartamente Cluj sub 400€',
  params: {
    city: 'Cluj-Napoca',
    rooms: 2,
    priceMax: 400,
  },
  alertsEnabled: true,
  alertFrequency: 'DAILY', // 'INSTANT' | 'DAILY' | 'WEEKLY'
});
```

---

### 🤖 AI Assistant (`/ai`)

| Method | Endpoint                   | Descriere          | Screen                  |
| ------ | -------------------------- | ------------------ | ----------------------- |
| POST   | `/ai/chat`                 | Chat cu AI         | AIAssistantScreen       |
| POST   | `/ai/generate-description` | Generare descriere | CreatePropertyWizard    |
| GET    | `/ai/analyze/:propertyId`  | Analiză anunț      | PropertyAnalyticsScreen |
| POST   | `/ai/estimate-price`       | Estimare preț      | CreatePropertyWizard    |

**Request Example (Chat):**

```typescript
const response = await api.post('/ai/chat', {
  message: 'Caut un apartament cu 2 camere în Cluj, maxim 400 euro',
  conversationHistory: previousMessages, // opțional
  context: {
    // Opțional - pentru personalizare
    userPreferences: {
      preferredCities: ['Cluj-Napoca'],
      budgetMax: 500,
    },
    tone: 'friendly',
    language: 'ro',
  },
});

// Response:
{
  "response": "Am găsit 5 apartamente...",
  "properties": [...], // Proprietăți reale din DB
  "intent": "search",
  "searchParams": { city: "Cluj-Napoca", rooms: 2, priceMax: 400 }
}
```

---

### 📸 Upload Imagini (`/properties/:id/photos`)

```typescript
// Folosește FormData pentru multipart upload
const formData = new FormData();
images.forEach((image, index) => {
  formData.append('photos', {
    uri: image.uri,
    type: 'image/jpeg',
    name: `photo_${index}.jpg`,
  });
});

const response = await api.post(`/properties/${propertyId}/photos`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});

// Response:
{
  "uploaded": [
    { "id": 1, "url": "https://...", "isPrimary": true },
    { "id": 2, "url": "https://...", "isPrimary": false }
  ],
  "total": 2,
  "message": "Successfully uploaded 2 of 2 images"
}
```

---

## 📊 MODELE DE DATE

### ISavedSearch

```typescript
interface ISavedSearch {
  id: number;
  userId: number;
  name: string;
  params: IPropertySearchParams;
  alertsEnabled: boolean;
  alertFrequency?: 'INSTANT' | 'DAILY' | 'WEEKLY';
  lastAlertAt?: string;
  newMatchesCount: number;
  totalMatchesCount: number;
  lastViewedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

### IAIMessage

```typescript
interface IAIMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface IAIChatResponse {
  response: string;
  properties?: IPropertyListing[];
  intent: 'search' | 'info' | 'comparison' | 'general';
  searchParams?: IPropertySearchParams;
}
```

### INotification (actualizat)

```typescript
interface INotification {
  id: number;
  userId: number;
  type:
    | 'MESSAGE'
    | 'VIEWING_REQUEST'
    | 'VIEWING_REMINDER'
    | 'NEW_PROPERTY_MATCH'
    | 'VERIFICATION'
    | 'SYSTEM';
  title: string;
  body: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}
```

---

## 🔗 EXEMPLE DE INTEGRARE

### 1. AIAssistantScreen.tsx

```typescript
import React, { useState } from 'react';
import { View, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { api } from '@/services/api';

export const AIAssistantScreen = () => {
  const [messages, setMessages] = useState<IAIMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.post('/ai/chat', {
        message: input,
        conversationHistory: messages.slice(-10), // Ultimele 10 mesaje
      });

      const aiMessage = { role: 'assistant', content: response.data.response };
      setMessages((prev) => [...prev, aiMessage]);

      // Dacă AI a găsit proprietăți, afișează-le
      if (response.data.properties?.length > 0) {
        // Navighează la rezultate sau afișează inline
      }
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <FlatList
        data={messages}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => <MessageBubble message={item} />}
      />
      <TextInput
        value={input}
        onChangeText={setInput}
        placeholder="Întreabă-mă orice despre proprietăți..."
      />
      <TouchableOpacity onPress={sendMessage} disabled={loading}>
        <Text>Trimite</Text>
      </TouchableOpacity>
    </View>
  );
};
```

### 2. SavedSearchesScreen.tsx

```typescript
import React, { useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity } from 'react-native';
import { api } from '@/services/api';

export const SavedSearchesScreen = () => {
  const [searches, setSearches] = useState<ISavedSearch[]>([]);

  useEffect(() => {
    loadSearches();
  }, []);

  const loadSearches = async () => {
    const { data } = await api.get('/saved-searches');
    setSearches(data.data);
  };

  const runSearch = async (id: number) => {
    const { data } = await api.get(`/saved-searches/${id}/run`);
    // Navighează la rezultate cu data.results
  };

  const toggleAlerts = async (id: number, enabled: boolean) => {
    await api.patch(`/saved-searches/${id}/alerts`, {
      enabled,
      frequency: 'DAILY',
    });
    loadSearches();
  };

  return (
    <FlatList
      data={searches}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <SavedSearchCard
          search={item}
          onRun={() => runSearch(item.id)}
          onToggleAlerts={(enabled) => toggleAlerts(item.id, enabled)}
        />
      )}
    />
  );
};
```

---

## ✅ CHECKLIST MVP

### Backend (GATA ✅)

- [x] Autentificare JWT
- [x] CRUD Proprietăți
- [x] Upload Imagini S3
- [x] Căutare Full-text
- [x] Favorite
- [x] Mesagerie
- [x] Vizionări
- [x] Notificări
- [x] Căutări Salvate + Alerte
- [x] AI Assistant (Chat, Generare, Analiză, Estimare)
- [x] Cron Jobs (Reminderi, Digest-uri)

### Mobile (DE IMPLEMENTAT 📱)

- [ ] Screen: AIAssistantScreen
- [ ] Screen: SavedSearchesScreen
- [ ] Integrare AI în SearchScreen (buton "Caută cu AI")
- [ ] Badge pe SavedSearches pentru newMatchesCount
- [ ] Handle notificări VIEWING_REMINDER și NEW_PROPERTY_MATCH
- [ ] UI pentru generare descriere AI în CreatePropertyWizard
- [ ] UI pentru estimare preț AI
- [ ] Upload imagini cu progress indicator

---

## 📚 DOCUMENTE IMPORTANTE

| Document           | Locație                                   | Ce conține              |
| ------------------ | ----------------------------------------- | ----------------------- |
| **Status Proiect** | `docs/PROJECT-STATUS.md`                  | Overview complet        |
| **Status Backend** | `docs/backend/IMPLEMENTATION-STATUS.md`   | Ce e implementat        |
| **API CRUD Guide** | `docs/shared/BACKEND-API-CRUD-GUIDE.md`   | Toate endpoint-urile    |
| **AI Module**      | `docs/backend/AI-MODULE.md`               | Detalii AI API          |
| **Saved Searches** | `docs/backend/SAVED-SEARCHES.md`          | Detalii căutări salvate |
| **Data Models**    | `docs/mobile/architecture/DATA-MODELS.md` | Modele de date          |
| **ADR-001**        | `docs/backend/MIGRATION-ADR-001.md`       | Model cont unificat     |

---

## 🔔 TIPURI DE NOTIFICĂRI

```typescript
// Handle în NotificationHandler.tsx

switch (notification.type) {
  case 'MESSAGE':
    // Navighează la conversație
    navigate('Chat', { conversationId: notification.data.conversationId });
    break;

  case 'VIEWING_REQUEST':
  case 'VIEWING_REMINDER':
    // Navighează la viewing
    navigate('ViewingDetails', { viewingId: notification.data.viewingId });
    break;

  case 'NEW_PROPERTY_MATCH':
    // Navighează la căutarea salvată
    navigate('SavedSearchResults', {
      savedSearchId: notification.data.savedSearchId,
    });
    break;

  case 'VERIFICATION':
    // Navighează la profile
    navigate('Profile');
    break;
}
```

---

## 💡 SFATURI PENTRU ECHIPA MOBILE

1. **Swagger UI** - Testați endpoint-urile la `http://localhost:3000/api/docs`

2. **Token JWT** - Toate endpoint-urile (exceptând `/auth/*` și `/ai/estimate-price`) necesită:

   ```
   Authorization: Bearer <token>
   ```

3. **AI fără API key** - În development fără OPENAI_API_KEY, AI returnează mock responses

4. **Notificări Push** - Device token se înregistrează la:

   ```
   POST /notifications/token
   { "token": "...", "platform": "ios|android", "deviceId": "..." }
   ```

5. **Shared Types** - Folosiți tipurile din `packages/types/src/lib/` pentru consistență

---

**Document creat:** 22 Ianuarie 2026  
**Autor:** Claude AI  
**Contact:** Kirill (PM)
