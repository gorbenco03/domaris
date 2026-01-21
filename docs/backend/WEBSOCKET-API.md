# 💬 WebSocket API - Real-time Messaging

**Versiune:** 1.0.0  
**Data:** 22 Ianuarie 2026

---

## 🎯 Prezentare Generală

Backend-ul suportă comunicare în timp real prin Socket.IO pentru:

- Mesaje instantanee în chat
- Indicatori de tastare (typing indicators)
- Confirmări de citire (read receipts)
- Status online/offline

---

## 🔌 Conectare

### URL & Namespace

```
ws://localhost:4000/chat           # Development
wss://api.domaris.ro/chat          # Production
```

### Autentificare

Conexiunea necesită token JWT. Există două metode:

**1. Query String (recomandat pentru mobile)**

```javascript
const socket = io('http://localhost:4000/chat', {
  query: { token: 'JWT_TOKEN_HERE' },
});
```

**2. Header Authorization**

```javascript
const socket = io('http://localhost:4000/chat', {
  extraHeaders: {
    Authorization: 'Bearer JWT_TOKEN_HERE',
  },
});
```

### Exemplu React Native

```typescript
import io, { Socket } from 'socket.io-client';

class ChatWebSocket {
  private socket: Socket | null = null;

  connect(token: string) {
    this.socket = io('https://api.domaris.ro/chat', {
      query: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connected', ({ userId, socketId }) => {
      console.log('Connected to chat:', userId);
    });

    this.socket.on('error', ({ code, message }) => {
      console.error('WebSocket error:', code, message);
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}
```

---

## 📤 Evenimente Client → Server

### `join_conversation`

Alătură-te unei conversații pentru a primi mesaje în timp real.

**Payload:**

```json
{
  "conversationId": 123
}
```

**Response:**

```json
{
  "success": true,
  "conversationId": 123
}
```

### `leave_conversation`

Părăsește o conversație.

**Payload:**

```json
{
  "conversationId": 123
}
```

### `send_message`

Trimite un mesaj în conversație.

**Payload:**

```json
{
  "conversationId": 123,
  "content": "Bună! Sunt interesat de apartament.",
  "type": "TEXT",
  "localId": "temp_123" // Optional: pentru tracking local
}
```

**Response:**

```json
{
  "success": true,
  "message": {
    "id": 456,
    "conversationId": 123,
    "senderId": 1,
    "content": "Bună! Sunt interesat de apartament.",
    "type": "TEXT",
    "createdAt": "2026-01-22T00:15:00.000Z",
    "isFromMe": true
  }
}
```

### `typing_start`

Notifică că utilizatorul scrie.

**Payload:**

```json
{
  "conversationId": 123
}
```

### `typing_stop`

Notifică că utilizatorul a terminat de scris.

**Payload:**

```json
{
  "conversationId": 123
}
```

### `mark_read`

Marchează mesajele din conversație ca citite.

**Payload:**

```json
{
  "conversationId": 123
}
```

---

## 📥 Evenimente Server → Client

### `connected`

Confirmare conexiune reușită.

```json
{
  "userId": 1,
  "socketId": "abc123xyz"
}
```

### `new_message`

Mesaj nou primit în conversație (broadcast la toți participanții).

```json
{
  "id": 456,
  "conversationId": 123,
  "senderId": 2,
  "senderName": "Ion",
  "senderAvatar": "https://...",
  "content": "Salut! Când putem programa o vizionare?",
  "type": "TEXT",
  "createdAt": "2026-01-22T00:20:00.000Z",
  "isFromMe": false
}
```

### `message_sent`

Confirmare că mesajul tău a fost trimis (doar sender-ului).

```json
{
  "localId": "temp_123",
  "message": {
    "id": 456,
    "conversationId": 123,
    ...
  }
}
```

### `user_typing`

Un utilizator scrie în conversație.

```json
{
  "conversationId": 123,
  "userId": 2,
  "userName": "Ion",
  "avatar": "https://..."
}
```

### `user_stopped_typing`

Un utilizator a terminat de scris.

```json
{
  "conversationId": 123,
  "userId": 2
}
```

### `messages_read`

Mesajele au fost citite de partener.

```json
{
  "conversationId": 123,
  "readBy": 2,
  "readAt": "2026-01-22T00:21:00.000Z"
}
```

### `user_online`

Un contact s-a conectat.

```json
{
  "userId": 2
}
```

### `user_offline`

Un contact s-a deconectat.

```json
{
  "userId": 2
}
```

### `new_message_notification`

Notificare de mesaj nou (chiar dacă nu ești în conversație).

```json
{
  "conversationId": 123,
  "message": { ... },
  "preview": "Bună! Sunt interesat de ap..."
}
```

### `error`

Eroare la operațiune.

```json
{
  "code": "AUTH_REQUIRED",
  "message": "Token de autentificare necesar"
}
```

**Coduri de eroare:**

- `AUTH_REQUIRED` - Token lipsă
- `AUTH_INVALID` - Token invalid sau expirat
- `CONNECTION_ERROR` - Eroare la conectare
- `NOT_FOUND` - Conversație negăsită

---

## 📱 Exemplu Complet React Native

```typescript
// services/ChatSocket.ts
import io, { Socket } from 'socket.io-client';
import { API_URL } from '@env';

type MessageHandler = (message: any) => void;
type TypingHandler = (data: {
  conversationId: number;
  userId: number;
  userName: string;
}) => void;

class ChatSocketService {
  private socket: Socket | null = null;
  private messageHandlers: Map<number, MessageHandler[]> = new Map();
  private typingHandlers: Map<number, TypingHandler[]> = new Map();

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(`${API_URL}/chat`, {
        query: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });

      this.socket.on('connected', () => {
        console.log('✅ Chat connected');
        resolve();
      });

      this.socket.on('error', (error) => {
        console.error('❌ Chat error:', error);
        reject(error);
      });

      this.socket.on('new_message', (message) => {
        const handlers = this.messageHandlers.get(message.conversationId) || [];
        handlers.forEach((handler) => handler(message));
      });

      this.socket.on('user_typing', (data) => {
        const handlers = this.typingHandlers.get(data.conversationId) || [];
        handlers.forEach((handler) => handler(data));
      });

      this.socket.on('user_stopped_typing', (data) => {
        const handlers = this.typingHandlers.get(data.conversationId) || [];
        handlers.forEach((handler) => handler({ ...data, userName: '' }));
      });
    });
  }

  joinConversation(conversationId: number): void {
    this.socket?.emit('join_conversation', { conversationId });
  }

  leaveConversation(conversationId: number): void {
    this.socket?.emit('leave_conversation', { conversationId });
  }

  sendMessage(conversationId: number, content: string, localId: string): void {
    this.socket?.emit('send_message', {
      conversationId,
      content,
      type: 'TEXT',
      localId,
    });
  }

  startTyping(conversationId: number): void {
    this.socket?.emit('typing_start', { conversationId });
  }

  stopTyping(conversationId: number): void {
    this.socket?.emit('typing_stop', { conversationId });
  }

  markAsRead(conversationId: number): void {
    this.socket?.emit('mark_read', { conversationId });
  }

  onMessage(conversationId: number, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(conversationId)) {
      this.messageHandlers.set(conversationId, []);
    }
    this.messageHandlers.get(conversationId)!.push(handler);

    // Return cleanup function
    return () => {
      const handlers = this.messageHandlers.get(conversationId);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) handlers.splice(index, 1);
      }
    };
  }

  onTyping(conversationId: number, handler: TypingHandler): () => void {
    if (!this.typingHandlers.has(conversationId)) {
      this.typingHandlers.set(conversationId, []);
    }
    this.typingHandlers.get(conversationId)!.push(handler);

    return () => {
      const handlers = this.typingHandlers.get(conversationId);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) handlers.splice(index, 1);
      }
    };
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.messageHandlers.clear();
    this.typingHandlers.clear();
  }
}

export const chatSocket = new ChatSocketService();
```

### Utilizare în Component

```tsx
// screens/ChatScreen.tsx
import React, { useEffect, useState } from 'react';
import { chatSocket } from '../services/ChatSocket';

export const ChatScreen = ({ conversationId }: { conversationId: number }) => {
  const [messages, setMessages] = useState([]);
  const [typingUser, setTypingUser] = useState<string | null>(null);

  useEffect(() => {
    chatSocket.joinConversation(conversationId);

    const unsubMessage = chatSocket.onMessage(conversationId, (message) => {
      setMessages((prev) => [...prev, message]);
    });

    const unsubTyping = chatSocket.onTyping(conversationId, (data) => {
      setTypingUser(data.userName || null);
    });

    return () => {
      unsubMessage();
      unsubTyping();
      chatSocket.leaveConversation(conversationId);
    };
  }, [conversationId]);

  const sendMessage = (content: string) => {
    const localId = `temp_${Date.now()}`;
    chatSocket.sendMessage(conversationId, content, localId);
  };

  // ... rest of component
};
```

---

## 🔧 Configurare Server

WebSocket-ul rulează pe același port cu REST API (4000 by default).

### Variabile de Mediu

Nu sunt necesare variabile suplimentare. WebSocket folosește aceleași credențiale JWT ca REST API.

### Scalare (Production)

Pentru multiple instanțe, Redis este folosit pentru:

- Tracking sesiuni cross-instance
- Broadcast mesaje între noduri

---

## 📁 Fișiere Relevante

| Fișier                         | Descriere                   |
| ------------------------------ | --------------------------- |
| `modules/chat/chat.gateway.ts` | WebSocket Gateway principal |
| `modules/chat/chat.service.ts` | Logică business pentru chat |
| `modules/chat/chat.module.ts`  | Modul NestJS                |

---

**Document creat:** 22 Ianuarie 2026  
**Autor:** Claude AI
