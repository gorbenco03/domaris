# 🔔 Feature: Notificări

**ID Feature:** NOTIF-001  
**Prioritate:** P0 - Critical  
**Estimare:** 1.5 săptămâni  
**Dependențe:** AUTH-001, Push Service (FCM/APNs)

---

## 📝 Descriere Generală

Sistemul de notificări ține utilizatorii la curent cu evenimentele relevante, maximizând engagement-ul și rata de răspuns.

---

## 📊 Tipuri de Notificări

### Push Notifications

| Categorie       | Eveniment                 | Prioritate |
| --------------- | ------------------------- | ---------- |
| **Mesaje**      | Mesaj nou                 | High       |
| **Vizionări**   | Cerere nouă               | High       |
| **Vizionări**   | Confirmare/Anulare        | High       |
| **Vizionări**   | Reminder 24h              | Medium     |
| **Vizionări**   | Reminder 2h               | High       |
| **Proprietăți** | Alerta potrivire nouă     | Medium     |
| **Proprietăți** | Preț schimbat (favorit)   | Medium     |
| **Proprietăți** | Proprietate indisponibilă | Low        |
| **Cont**        | Verificare completă       | Low        |
| **Cont**        | Login nou dispozitiv      | High       |
| **Marketing**   | Promoții (opt-in)         | Low        |

### In-App Notifications

- Centre de notificări cu istoric
- Badge-uri pe tabs (Messages, Viewings)
- Toasts pentru acțiuni

### Email Notifications

- Digest zilnic/săptămânal (configurabil)
- Transacționale (verificare, resetare parolă)
- Marketing (newsletter, opt-in)

### SMS Notifications (Premium)

- Reminders vizionări
- Alerte urgente (opțional)

---

## 📊 Model de Date

```typescript
interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  imageUrl?: string;

  // Linking
  actionType?:
    | "open_conversation"
    | "open_property"
    | "open_viewing"
    | "open_url";
  actionPayload?: string;

  // Status
  read: boolean;
  readAt?: Date;

  // Delivery
  channels: ("push" | "in_app" | "email" | "sms")[];
  deliveredVia: ("push" | "in_app" | "email" | "sms")[];

  createdAt: Date;
}

interface NotificationPreferences {
  userId: string;

  push: {
    enabled: boolean;
    messages: boolean;
    viewings: boolean;
    propertyAlerts: boolean;
    priceChanges: boolean;
    marketing: boolean;
    quietHours?: {
      enabled: boolean;
      start: string; // HH:mm
      end: string;
    };
  };

  email: {
    enabled: boolean;
    digest: "none" | "daily" | "weekly";
    transactional: boolean; // always true, cannot disable
    marketing: boolean;
  };

  sms: {
    enabled: boolean;
    viewingReminders: boolean;
    urgentOnly: boolean;
  };
}
```

---

## ✅ Cerințe Funcționale

### RF-NOTIF-001: Push Notifications

- Integrare FCM (Android) și APNs (iOS)
- Suport rich notifications (imagini)
- Deep linking la content
- Quiet hours

### RF-NOTIF-002: In-App Notifications

- Centru notificări cu istoric
- Mark as read individual/toate
- Pull to refresh

### RF-NOTIF-003: Badge Counts

- Tab bar badges
- App icon badge (iOS)
- Sync în timp real

### RF-NOTIF-004: Preferințe

- Granular per categorie
- Quiet hours configurabile
- Unsubscribe one-tap

---

## 🎨 UI/UX Guidelines

### Notification Center

```
┌─────────────────────────────────────┐
│  Notificări          [Mark all read]│
├─────────────────────────────────────┤
│                                     │
│  ASTĂZI                             │
│  ┌─────────────────────────────┐    │
│  │● 💬 Ion Popescu             │    │
│  │  "Când putem programa..."   │    │
│  │                     acum 5m │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │● 📅 Vizionare confirmată    │    │
│  │  Casă Pipera - Mâine 10:00  │    │
│  │                    acum 1h  │    │
│  └─────────────────────────────┘    │
│                                     │
│  IERI                               │
│  ┌─────────────────────────────┐    │
│  │○ 🏠 Proprietate nouă        │    │
│  │  Apartament 3 cam București │    │
│  │  potrivește căutării tale   │    │
│  │                        Ieri │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

### Notification Preferences

```
┌─────────────────────────────────────┐
│  ← Setări notificări                │
├─────────────────────────────────────┤
│                                     │
│  PUSH NOTIFICATIONS                 │
│  ├─ Mesaje noi           [●━━━]     │
│  ├─ Vizionări            [●━━━]     │
│  ├─ Alerte proprietăți   [●━━━]     │
│  ├─ Schimbări preț       [━━━○]     │
│  └─ Promoții             [━━━○]     │
│                                     │
│  Quiet Hours             [━━━○]     │
│  22:00 - 08:00                      │
│                                     │
├─────────────────────────────────────┤
│  EMAIL                              │
│  ├─ Activat              [●━━━]     │
│  ├─ Digest         [Săptămânal ▾]   │
│  └─ Newsletter           [━━━○]     │
│                                     │
├─────────────────────────────────────┤
│  SMS                                │
│  ├─ Activat              [━━━○]     │
│  └─ Doar urgente         [●━━━]     │
│                                     │
└─────────────────────────────────────┘
```

---

## ⚙️ Specificații Tehnice

### Push Token Management

```typescript
interface DevicePushToken {
  userId: string;
  token: string;
  platform: "ios" | "android";
  deviceId: string;
  createdAt: Date;
  lastUsedAt: Date;
}

// Register token on app start
const registerPushToken = async () => {
  const token = await messaging().getToken();
  await api.post("/devices/push-token", {
    token,
    platform: Platform.OS,
    deviceId: getUniqueId(),
  });
};
```

### Notification Handling

```typescript
// Foreground
messaging().onMessage(async (remoteMessage) => {
  showInAppNotification(remoteMessage);
  incrementBadge();
});

// Background/Quit - tap handling
messaging().onNotificationOpenedApp((remoteMessage) => {
  navigateToContent(remoteMessage.data);
});

// Initial notification (app opened via notification)
messaging()
  .getInitialNotification()
  .then((remoteMessage) => {
    if (remoteMessage) {
      navigateToContent(remoteMessage.data);
    }
  });
```

---

## ✅ Criterii de Acceptanță

- [x] Push-uri livrate în < 3s
- [x] Deep linking funcțional
- [x] Preferințe persistente
- [x] Badge-uri sincronizate
- [x] Quiet hours respectate

---

## 🔌 API Endpoints

```
GET    /api/v1/notifications
PATCH  /api/v1/notifications/:id/read
POST   /api/v1/notifications/read-all
DELETE /api/v1/notifications/:id

GET    /api/v1/users/me/notification-preferences
PUT    /api/v1/users/me/notification-preferences

POST   /api/v1/devices/push-token
DELETE /api/v1/devices/push-token
```

---

**Document Status:** Draft  
**Ultima actualizare:** Ianuarie 2026
