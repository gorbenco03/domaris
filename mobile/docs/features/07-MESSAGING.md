# 💬 Feature: Mesagerie

**ID Feature:** MSG-001  
**Prioritate:** P0 - Critical  
**Estimare:** 2 săptămâni  
**Dependențe:** AUTH-001, Push Notifications, WebSocket Server

---

## 📝 Descriere Generală

Mesageria în timp real este esențială pentru comunicarea directă între proprietari și căutători. Este diferențiatorul cheie față de platformele cu agenți.

### Obiective

- Timp livrare mesaj: **< 500ms**
- Rata răspuns: **> 60% în primele 24h**
- Satisfacție utilizatori: **> 4.5/5**

---

## 👤 User Stories

```
US-MSG-001: Ca căutător, vreau să contactez proprietarul
pentru a pune întrebări despre proprietate.

US-MSG-002: Ca proprietar, vreau să răspund la mesaje
și să organizez conversațiile.

US-MSG-003: Ca utilizator, vreau să primesc notificări
când primesc mesaje noi.

US-MSG-004: Ca utilizator, vreau să trimit fotografii
pentru a clarifica situații.

US-MSG-005: Ca utilizator, vreau să văd când mesajul a fost citit.

US-MSG-006: Ca utilizator, vreau să raportez comportament inadecvat.
```

---

## 📊 Model de Date

```typescript
interface Conversation {
  id: string;
  propertyId: string;
  participants: {
    ownerId: string;
    seekerId: string;
  };
  lastMessage?: Message;
  unreadCount: {
    [userId: string]: number;
  };
  status: "active" | "archived" | "blocked";
  createdAt: Date;
  updatedAt: Date;

  // Populated
  property?: Property;
  otherParticipant?: User;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: "text" | "image" | "viewing_request" | "system";
  content: string;
  metadata?: {
    imageUrl?: string;
    thumbnailUrl?: string;
    viewingRequest?: ViewingRequest;
  };
  status: "sending" | "sent" | "delivered" | "read" | "failed";
  readAt?: Date;
  createdAt: Date;
}

interface MessageTemplate {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: "greeting" | "question" | "response";
}
```

---

## ✅ Cerințe Funcționale

### RF-MSG-001: Inițiere Conversație

- Buton contact pe pagina proprietății
- Mesaj inițial opțional sau template
- O singură conversație per user+proprietate

### RF-MSG-002: Trimitere Mesaje

- Text cu limit 2000 caractere
- Suport emoji
- Trimitere imagini (max 5/mesaj)
- Indicatori typing (opțional)

### RF-MSG-003: Real-time

- WebSocket pentru live updates
- Fallback polling
- Offline queue cu retry

### RF-MSG-004: Status Mesaje

- Sending → Sent → Delivered → Read
- Timestamp pentru read
- Last seen status

### RF-MSG-005: Notificări

- Push la mesaj nou
- Badge pe iconița Messages
- Sound configurable

### RF-MSG-006: Gestionare Conversații

- Listă conversații sortată după activitate
- Căutare în conversații
- Arhivare/dezarhivare
- Blocare utilizator

### RF-MSG-007: Templates

- Templates predefinite sistem
- Templates personalizate utilizator
- Quick select în chat

### RF-MSG-008: Integrări

- Link către solicitare vizionare
- Share locație (opțional)
- Apel telefonic (dacă număr disponibil)

### RF-MSG-009: Raportare

- Raportare mesaj/utilizator
- Motive: spam, hărțuire, fraudă
- Review de moderatori

---

## 🎨 UI/UX Guidelines

### Conversations List

```
┌─────────────────────────────────────┐
│  Mesaje                    [Search] │
├─────────────────────────────────────┤
│  [Toate] [Necitite (3)] [Arhivate]  │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐    │
│  │ [👤] Ion Popescu      12:45 │    │
│  │ 🏠 Apartament 3 camere      │    │
│  │ "Când putem programa o..." ● │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ [👤] Maria Ionescu    Ieri │    │
│  │ 🏠 Casă Pipera              │    │
│  │ "Da, prețul e negociabil"   │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ [👤] Alex Stan      Marți │    │
│  │ 🏠 Garsonieră Titan         │    │
│  │ "✓ Mulțumesc pentru info"   │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

### Chat Screen

```
┌─────────────────────────────────────┐
│  ← Ion Popescu       [📞] [⋮]      │
│  🏠 Apartament 3 camere - 95K€      │
├─────────────────────────────────────┤
│                           │
│  Bună ziua! Mă interesează │        │
│  apartamentul. Este încă    │        │
│  disponibil?               │  12:30 │
│                                     │
│       │ Da, este disponibil!         │
│       │ Când ați dori să veniți     │
│       │ la vizionare?        12:32 ✓✓│
│                                     │
│  Poate sâmbătă dimineața?  │        │
│                            │  12:33 │
│                                     │
│       │ Perfect! Vă propun ora     │
│       │ 10:00.                      │
│       │ [📅 Programează vizionare]  │
│       │                     12:35 ✓ │
│                                     │
├─────────────────────────────────────┤
│  [📷] [Aa Message...]    [➤]       │
└─────────────────────────────────────┘
```

### Quick Actions Menu

```
┌─────────────────────────────────────┐
│  Acțiuni rapide                     │
├─────────────────────────────────────┤
│  📅 Programează vizionare           │
│  📍 Cere locația exactă             │
│  💰 Întreabă de preț                │
│  📋 Folosește template              │
│  📞 Sună (dacă disponibil)          │
└─────────────────────────────────────┘
```

---

## ⚙️ Specificații Tehnice

### WebSocket Connection

```typescript
interface WSConfig {
  url: string;
  reconnectAttempts: number;
  reconnectInterval: number;
  heartbeatInterval: number;
}

// Events
type WSEvent =
  | { type: "message:new"; payload: Message }
  | {
      type: "message:status";
      payload: { messageId: string; status: MessageStatus };
    }
  | {
      type: "typing:start";
      payload: { conversationId: string; userId: string };
    }
  | { type: "typing:stop"; payload: { conversationId: string; userId: string } }
  | { type: "user:online"; payload: { userId: string } }
  | { type: "user:offline"; payload: { userId: string } };
```

### Offline Support

```typescript
interface OfflineQueue {
  pendingMessages: Array<{
    tempId: string;
    message: Partial<Message>;
    retryCount: number;
    lastAttempt: Date;
  }>;

  add(message: Partial<Message>): string;
  retry(tempId: string): void;
  remove(tempId: string): void;
  sync(): Promise<void>;
}
```

---

## 🔒 Securitate

- [x] Encrypted in transit (TLS)
- [x] Rate limiting (max 100 msg/min)
- [x] Content moderation (AI-assisted)
- [x] Block/Report functionality
- [x] No personal info in initial message

---

## ✅ Criterii de Acceptanță

- [x] Mesaje livrate în < 1s
- [x] Offline queue funcțional
- [x] Status read/delivered vizibil
- [x] Push notifications funcționale
- [x] Imagini se încarcă corect
- [x] Templates accesibile rapid

---

## 🔌 API Endpoints

```
# Conversations
GET    /api/v1/conversations
GET    /api/v1/conversations/:id
POST   /api/v1/conversations
PATCH  /api/v1/conversations/:id/archive
POST   /api/v1/conversations/:id/block

# Messages
GET    /api/v1/conversations/:id/messages
POST   /api/v1/conversations/:id/messages
POST   /api/v1/conversations/:id/messages/:msgId/read

# Templates
GET    /api/v1/message-templates
POST   /api/v1/message-templates
PUT    /api/v1/message-templates/:id
DELETE /api/v1/message-templates/:id

# Report
POST   /api/v1/reports/message
POST   /api/v1/reports/user
```

---

**Document Status:** Draft  
**Ultima actualizare:** Ianuarie 2026
