# 📅 Feature: Vizionări și Programări

**ID Feature:** VIEW-001  
**Prioritate:** P0 - Critical  
**Estimare:** 2 săptămâni  
**Dependențe:** AUTH-001, MSG-001, Notifications

---

## 📝 Descriere Generală

Sistemul de programări facilitează organizarea vizionărilor între proprietari și căutători, eliminând comunicarea fragmentată.

### Obiective

- Timp programare: **< 1 minut**
- Rata no-show: **< 10%**
- Satisfacție: **> 90%**

---

## 👤 User Stories

```
US-VIEW-001: Ca căutător, vreau să programez o vizionare
pentru a vedea proprietatea în persoană.

US-VIEW-002: Ca proprietar, vreau să-mi setez disponibilitatea
pentru a controla când primesc vizite.

US-VIEW-003: Ca proprietar, vreau să confirm/refuz cereri de vizionare.

US-VIEW-004: Ca utilizator, vreau reminder-uri înainte de vizionare.

US-VIEW-005: Ca utilizator, vreau să pot reprograma sau anula.

US-VIEW-006: Ca utilizator, vreau să las feedback după vizionare.
```

---

## 📊 Model de Date

```typescript
interface Viewing {
  id: string;
  propertyId: string;
  ownerId: string;
  seekerId: string;

  // Timing
  requestedSlots: TimeSlot[]; // Propuse de căutător
  confirmedSlot?: TimeSlot; // Confirmat de proprietar
  duration: number; // minute (default 30)

  // Status
  status: ViewingStatus;

  // Detalii
  notes?: string;
  meetingPoint?: string;

  // Feedback
  ownerFeedback?: ViewingFeedback;
  seekerFeedback?: ViewingFeedback;

  // Timestamps
  createdAt: Date;
  confirmedAt?: Date;
  cancelledAt?: Date;
  completedAt?: Date;
}

type ViewingStatus =
  | "pending" // Așteaptă confirmare
  | "confirmed" // Confirmat
  | "rescheduled" // Reprogramat, așteaptă confirmare
  | "cancelled" // Anulat
  | "completed" // Finalizat
  | "no_show"; // Nu s-a prezentat

interface TimeSlot {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

interface OwnerAvailability {
  propertyId: string;
  ownerId: string;

  // Definire disponibilitate
  defaultSlots: WeeklySlot[];
  blockedDates: string[]; // YYYY-MM-DD
  customSlots: TimeSlot[];

  // Setări
  advanceBookingDays: number; // min zile în avans
  bufferMinutes: number; // între vizionări
  maxViewingsPerDay: number;
}

interface WeeklySlot {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  slots: { startTime: string; endTime: string }[];
}

interface ViewingFeedback {
  rating: 1 | 2 | 3 | 4 | 5;
  interested: boolean;
  comment?: string;
  createdAt: Date;
}
```

---

## 🔄 Fluxuri

### Flux Programare Vizionare

```
┌─────────────────┐
│ Pagină Prop.    │
│ [📅Programează] │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Selectează      │
│ slot-uri        │
│ disponibile     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Adaugă mesaj    │
│ (opțional)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Trimite cerere  │
└────────┬────────┘
         │
         ▼ (Push to Owner)
┌─────────────────┐
│ Proprietar      │
│ confirmă/refuză │
└────────┬────────┘
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌───────────┐
│Confirm│ │  Refuz    │
│       │ │+alt slot? │
└───┬───┘ └─────┬─────┘
    │           │
    ▼           ▼
┌───────┐ ┌───────────┐
│Vizion.│ │Notif. cu  │
│progr! │ │alternative│
└───────┘ └───────────┘
```

---

## ✅ Cerințe Funcționale

### RF-VIEW-001: Calendar Disponibilitate (Proprietar)

- Setare ore disponibile pe zi
- Template săptămânal
- Blocare date specifice
- Buffer între vizionări

### RF-VIEW-002: Solicitare Vizionare (Căutător)

- Vizualizare sloturi disponibile
- Propunere mai multe sloturi
- Mesaj opțional

### RF-VIEW-003: Confirmare/Refuz (Proprietar)

- Push notification la cerere nouă
- Confirmare cu un tap
- Refuz cu motiv
- Propunere alternativă

### RF-VIEW-004: Reminders

- 24h înainte (push + email)
- 2h înainte (push)
- Opțiune confirmare prezență

### RF-VIEW-005: Reprogramare/Anulare

- Posibilă de ambele părți
- Notificare celeilalte părți
- Penalizare pentru anulări repetate?

### RF-VIEW-006: Feedback Post-Vizionare

- Prompt după ora vizionării
- Rating simplu (1-5)
- Întrebare: încă interesat?
- Comentariu opțional

---

## 🎨 UI/UX Guidelines

### Request Viewing Screen

```
┌─────────────────────────────────────┐
│  ← Programează vizionare            │
├─────────────────────────────────────┤
│                                     │
│  🏠 Apartament 3 camere             │
│     Drumul Taberei                  │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  Selectează când poți veni          │
│  (alege min. 1, max. 3 sloturi)     │
│                                     │
│  ◀ Ianuarie 2026 ▶                  │
│  L  M  Mi J  V  S  D                │
│  20 21 22 23 24 25 26               │
│  ○  ○  ●  ○  ●  ●  -                │
│  27 28 29 30 31                     │
│  ○  ○  ●  -  -                      │
│                                     │
│  Sloturi pentru 22 Ian:             │
│  [✓10:00-10:30] [11:00-11:30]       │
│  [14:00-14:30] [✓15:00-15:30]       │
│                                     │
│  Sloturi selectate (2):             │
│  • 22 Ian, 10:00                    │
│  • 22 Ian, 15:00                    │
│                                     │
├─────────────────────────────────────┤
│  Mesaj pentru proprietar            │
│  ┌─────────────────────────────┐    │
│  │ Bună ziua, sunt interesat...│    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │     Trimite cererea         │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

### Owner Availability Settings

```
┌─────────────────────────────────────┐
│  ← Disponibilitate vizionări        │
├─────────────────────────────────────┤
│                                     │
│  Program săptămânal                 │
│                                     │
│  Luni      [09:00-12:00, 14:00-18:00]│
│  Marți     [10:00-14:00]             │
│  Miercuri  [09:00-18:00]             │
│  Joi       [Indisponibil]            │
│  Vineri    [10:00-16:00]             │
│  Sâmbătă   [10:00-13:00]             │
│  Duminică  [Indisponibil]            │
│                                     │
├─────────────────────────────────────┤
│  Setări                             │
│                                     │
│  Durată vizionare    [30 min ▾]     │
│  Pauză între viz.    [15 min ▾]     │
│  Rezervare în avans  [2 zile ▾]     │
│  Max viz./zi         [5      ▾]     │
│                                     │
├─────────────────────────────────────┤
│  Zile blocate                       │
│  [+ Adaugă zile indisponibile]      │
│                                     │
└─────────────────────────────────────┘
```

### My Viewings Screen

```
┌─────────────────────────────────────┐
│  Vizionări                          │
├─────────────────────────────────────┤
│  [Viitoare] [Trecute] [Anulate]     │
├─────────────────────────────────────┤
│                                     │
│  MÂINE                              │
│  ┌─────────────────────────────┐    │
│  │ 🕐 10:00 - 10:30             │    │
│  │ 🏠 Apartament 3 camere       │    │
│  │ 👤 Ion Popescu               │    │
│  │ 📍 Drumul Taberei 45         │    │
│  │                              │    │
│  │ [Reprogramează] [Anulează]   │    │
│  └─────────────────────────────┘    │
│                                     │
│  VINERI, 24 IAN                     │
│  ┌─────────────────────────────┐    │
│  │ 🕐 15:00 - 15:30             │    │
│  │ 🏠 Casă 4 camere             │    │
│  │ 👤 Maria Ionescu             │    │
│  │ ⏳ Așteaptă confirmare       │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

---

## ✅ Criterii de Acceptanță

- [x] Proprietar poate seta disponibilitatea
- [x] Căutător vede doar sloturi disponibile
- [x] Confirmare în < 24h (reminder automat)
- [x] Reminders funcționează corect
- [x] Anulare/reprogramare cu notificare
- [x] Feedback prompt după vizionare

---

## 🔌 API Endpoints

```
# Availability
GET    /api/v1/properties/:id/availability
PUT    /api/v1/properties/:id/availability

# Viewings
GET    /api/v1/viewings
POST   /api/v1/viewings
GET    /api/v1/viewings/:id
PATCH  /api/v1/viewings/:id/confirm
PATCH  /api/v1/viewings/:id/reject
PATCH  /api/v1/viewings/:id/reschedule
PATCH  /api/v1/viewings/:id/cancel
POST   /api/v1/viewings/:id/feedback
```

---

**Document Status:** Draft  
**Ultima actualizare:** Ianuarie 2026
