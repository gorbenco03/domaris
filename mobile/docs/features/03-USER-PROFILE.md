# 👤 Feature: Profil Utilizator

**ID Feature:** PROFILE-001  
**Prioritate:** P0 - Critical  
**Estimare:** 1.5 săptămâni  
**Dependențe:** AUTH-001

---

## 📝 Descriere Generală

Profilul utilizatorului este centrul de control personal, unde utilizatorii își gestionează identitatea, preferințele și activitatea pe platformă.

---

## 👤 User Stories

```
US-PROF-001: Ca utilizator, vreau să-mi completez profilul
cu informații relevante despre mine.

US-PROF-002: Ca utilizator, vreau să încarc o poză de profil
pentru a fi recognoscibil pentru alți utilizatori.

US-PROF-003: Ca utilizator, vreau să-mi gestionez preferințele de notificări.

US-PROF-004: Ca utilizator, vreau să văd istoricul activității mele.

US-PROF-005: Ca proprietar, vreau să văd statisticile anunțurilor mele.

US-PROF-006: Ca căutător, vreau să-mi salvez preferințele de căutare.
```

---

## 🔄 Structura Profilului

### Secțiuni Profil

| Secțiune               | Conținut                                    |
| ---------------------- | ------------------------------------------- |
| **Informații de bază** | Nume, avatar, bio, locație                  |
| **Contact**            | Email, telefon (vizibilitate configurabilă) |
| **Verificări**         | Status KYC, badge-uri                       |
| **Preferințe**         | Notificări, limbă, temă                     |
| **Securitate**         | Parolă, 2FA, sesiuni active                 |
| **Activitate**         | Anunțuri, favorite, vizionări, mesaje       |
| **Statistici**         | (doar proprietari) Views, contacte          |

---

## ✅ Cerințe Funcționale

### RF-PROF-001: Informații de Bază

```typescript
interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  avatar?: string;
  bio?: string; // max 500 caractere
  location?: {
    city: string;
    county: string;
  };
  userType: "OWNER" | "SEEKER" | "BOTH";
  verificationLevel: 0 | 1 | 2 | 3;
  createdAt: Date;
  rating?: {
    average: number;
    count: number;
  };
}
```

### RF-PROF-002: Avatar Upload

- Formate: JPG, PNG, WebP
- Dimensiune max: 5MB
- Rezoluție min: 200x200px
- Auto-crop la pătrat
- Compresie automată

### RF-PROF-003: Preferințe Notificări

```typescript
interface NotificationPreferences {
  push: {
    newMessages: boolean;
    viewingReminders: boolean;
    priceChanges: boolean;
    newListings: boolean;
    promotions: boolean;
  };
  email: {
    weeklyDigest: boolean;
    newMessages: boolean;
    accountAlerts: boolean;
    newsletter: boolean;
  };
  sms: {
    viewingReminders: boolean;
    urgentAlerts: boolean;
  };
}
```

### RF-PROF-004: Preferințe Căutare (Căutători)

```typescript
interface SearchPreferences {
  savedSearches: SavedSearch[];
  defaultFilters: {
    transactionType: "SALE" | "RENT" | "BOTH";
    propertyTypes: PropertyType[];
    priceRange: { min?: number; max?: number };
    areaRange: { min?: number; max?: number };
    rooms: { min?: number; max?: number };
    locations: Location[];
  };
  alertFrequency: "instant" | "daily" | "weekly";
}
```

### RF-PROF-005: Setări Securitate

- Schimbare parolă
- Activare/dezactivare 2FA
- Vizualizare sesiuni active
- Logout din toate dispozitivele
- Ștergere cont (GDPR)

### RF-PROF-006: Rating și Recenzii

```typescript
interface Review {
  id: string;
  fromUserId: string;
  fromUserName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  context: "viewing" | "transaction" | "communication";
  createdAt: Date;
  response?: {
    text: string;
    createdAt: Date;
  };
}
```

---

## 🎨 UI/UX Guidelines

### Screen: Vizualizare Profil (Propriu)

```
┌─────────────────────────────────────┐
│  ← Profil              [Editează]   │
├─────────────────────────────────────┤
│                                     │
│         ┌─────────┐                 │
│         │  👤     │                 │
│         │ Avatar  │                 │
│         └─────────┘                 │
│                                     │
│       Ion Popescu                   │
│    ✓✓ Identitate Verificată         │
│                                     │
│    📍 București, Sector 1           │
│    📅 Membru din Ian 2026           │
│                                     │
├─────────────────────────────────────┤
│  ⭐ 4.8  (23 recenzii)    [Vezi]    │
├─────────────────────────────────────┤
│                                     │
│  📊 Statistici                      │
│  ├─ 5 Anunțuri active               │
│  ├─ 234 Vizualizări luna aceasta    │
│  └─ 12 Contacte primite             │
│                                     │
├─────────────────────────────────────┤
│  ⚙️ Setări                          │
│  ├─ Notificări                  >   │
│  ├─ Securitate                  >   │
│  ├─ Verificare identitate       >   │
│  └─ Preferințe căutare          >   │
│                                     │
├─────────────────────────────────────┤
│  📄 Legal                           │
│  ├─ Termeni și condiții         >   │
│  ├─ Politica de confidențialitate > │
│  └─ Ștergere cont               >   │
│                                     │
└─────────────────────────────────────┘
```

### Screen: Vizualizare Profil (Alt Utilizator)

```
┌─────────────────────────────────────┐
│  ← Profil utilizator                │
├─────────────────────────────────────┤
│                                     │
│         ┌─────────┐                 │
│         │  👤     │                 │
│         └─────────┘                 │
│                                     │
│       Maria Ionescu                 │
│    🏠 Proprietar Verificat          │
│                                     │
│    📍 Cluj-Napoca                   │
│    📅 Membru din Mar 2025           │
│                                     │
├─────────────────────────────────────┤
│  ⭐ 4.9  (45 recenzii)    [Vezi]    │
├─────────────────────────────────────┤
│                                     │
│  🏠 Anunțuri active (3)             │
│  ┌─────────────────────────────┐    │
│  │ [📷] Apartament 3 camere    │    │
│  │      85.000€                │    │
│  └─────────────────────────────┘    │
│                                     │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐    │
│  │       💬 Contactează        │    │
│  └─────────────────────────────┘    │
│                                     │
│  ⚠️ Raportează utilizator           │
│                                     │
└─────────────────────────────────────┘
```

---

## ✅ Criterii de Acceptanță

### AC-PROF-001: Vizualizare Profil

- [x] User vede toate informațiile profilului
- [x] Badge-uri de verificare afișate corect
- [x] Rating și număr recenzii vizibile

### AC-PROF-002: Editare Profil

- [x] User poate edita informațiile de bază
- [x] Validare în timp real
- [x] Salvare cu feedback de succes

### AC-PROF-003: Avatar

- [x] Upload funcționează pe iOS și Android
- [x] Crop și redimensionare automată
- [x] Preview înainte de salvare

### AC-PROF-004: Notificări

- [x] Toate opțiunile configurabile
- [x] Salvare persistentă
- [x] Sync cu backend

### AC-PROF-005: Securitate

- [x] Schimbare parolă cu confirmare
- [x] Vizualizare sesiuni active
- [x] Logout funcțional

---

## 🔌 API Endpoints

```
GET    /api/v1/users/me
PUT    /api/v1/users/me
PATCH  /api/v1/users/me/avatar
GET    /api/v1/users/:id (profil public)
GET    /api/v1/users/me/preferences
PUT    /api/v1/users/me/preferences
GET    /api/v1/users/:id/reviews
POST   /api/v1/users/:id/reviews
GET    /api/v1/users/me/sessions
DELETE /api/v1/users/me/sessions/:sessionId
DELETE /api/v1/users/me (ștergere cont)
```

---

**Document Status:** Draft  
**Ultima actualizare:** Ianuarie 2026
