# 📋 Enumerări și Constante Comune - Domaris/RIVA

**Versiune:** 1.0.0  
**Data:** 20 Ianuarie 2026  
**Status:** DRAFT - De aliniat între echipe

---

## 🎯 Scop

Acest document definește toate enumerările (enums) și constantele care trebuie să fie identice în Backend, Frontend și Mobile.

**Sursa de adevăr:** Aceste valori trebuie exportate din `/packages/types/src/lib/enums.ts`

---

## 👤 User Enums

### UserRole

Tipul de utilizator în platformă.

| Valoare  | Descriere                     | Backend Actual | Acțiune     |
| -------- | ----------------------------- | -------------- | ----------- |
| `OWNER`  | Proprietar (vinde/închiriază) | `landlord`     | 🔧 Migrare  |
| `SEEKER` | Căutător (cumpărător/chiriaș) | `tenant`       | 🔧 Migrare  |
| `BOTH`   | Ambele roluri                 | N/A            | ➕ Adăugare |
| `ADMIN`  | Administrator                 | `admin`        | ✅ OK       |

```typescript
// packages/types/src/lib/enums.ts
export type UserRole = 'OWNER' | 'SEEKER' | 'BOTH' | 'ADMIN';

// Sau ca enum:
export enum UserRole {
  OWNER = 'OWNER',
  SEEKER = 'SEEKER',
  BOTH = 'BOTH',
  ADMIN = 'ADMIN',
}
```

### VerificationLevel

Nivelul de verificare al utilizatorului.

| Valoare | Descriere                                    |
| ------- | -------------------------------------------- |
| `0`     | Cont nou (nevalidat)                         |
| `1`     | Email/Telefon verificat                      |
| `2`     | Identitate verificată (KYC)                  |
| `3`     | Proprietar verificat (documente proprietate) |

```typescript
export type VerificationLevel = 0 | 1 | 2 | 3;
```

### UserStatus

```typescript
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';
```

---

## 🏠 Property Enums

### TransactionType

Tipul de tranzacție.

```typescript
export type TransactionType = 'SALE' | 'RENT';
```

### PropertyType

Tipul de proprietate.

| Valoare      | Descriere        |
| ------------ | ---------------- |
| `APARTMENT`  | Apartament       |
| `HOUSE`      | Casă             |
| `STUDIO`     | Garsonieră       |
| `PENTHOUSE`  | Penthouse        |
| `DUPLEX`     | Duplex           |
| `LAND`       | Teren            |
| `COMMERCIAL` | Spațiu comercial |
| `OFFICE`     | Birou            |
| `PARKING`    | Loc parcare      |
| `STORAGE`    | Depozit          |

```typescript
export type PropertyType =
  | 'APARTMENT'
  | 'HOUSE'
  | 'STUDIO'
  | 'PENTHOUSE'
  | 'DUPLEX'
  | 'LAND'
  | 'COMMERCIAL'
  | 'OFFICE'
  | 'PARKING'
  | 'STORAGE';
```

### PropertyStatus

| Valoare          | Descriere                  | Backend Actual |
| ---------------- | -------------------------- | -------------- |
| `DRAFT`          | În editare, nepublicat     | N/A            |
| `PENDING_REVIEW` | Asteaptă moderare          | N/A            |
| `ACTIVE`         | Publicat, activ            | `public`       |
| `PAUSED`         | Pus pe pauză de proprietar | `hidden`       |
| `SOLD`           | Vândut                     | N/A            |
| `RENTED`         | Închiriat                  | `rented`       |
| `EXPIRED`        | Expirat                    | `expired`      |
| `REJECTED`       | Respins de moderatori      | N/A            |

```typescript
export type PropertyStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'ACTIVE'
  | 'PAUSED'
  | 'SOLD'
  | 'RENTED'
  | 'EXPIRED'
  | 'REJECTED';
```

### CoordinateAccuracy

```typescript
export type CoordinateAccuracy = 'EXACT' | 'APPROXIMATE' | 'NEIGHBORHOOD';
```

### ParkingType

```typescript
export type ParkingType = 'GARAGE' | 'OUTDOOR' | 'UNDERGROUND' | 'NONE';
```

### Amenities (Lista standard)

```typescript
export const PROPERTY_AMENITIES = [
  'AIR_CONDITIONING',
  'HEATING_CENTRAL',
  'HEATING_BUILDING',
  'FURNISHED',
  'SEMI_FURNISHED',
  'BALCONY',
  'TERRACE',
  'GARDEN',
  'PARKING',
  'GARAGE',
  'STORAGE',
  'ELEVATOR',
  'INTERCOM',
  'VIDEO_INTERCOM',
  'SECURITY_24H',
  'POOL',
  'GYM',
  'PLAYGROUND',
  'PET_FRIENDLY',
  'SMOKE_FREE',
] as const;

export type PropertyAmenity = (typeof PROPERTY_AMENITIES)[number];
```

---

## 💬 Messaging Enums

### ConversationStatus

```typescript
export type ConversationStatus = 'ACTIVE' | 'ARCHIVED' | 'BLOCKED';
```

### MessageType

```typescript
export type MessageType = 'TEXT' | 'IMAGE' | 'VIEWING_REQUEST' | 'SYSTEM';
```

### MessageStatus

```typescript
export type MessageStatus =
  | 'SENDING'
  | 'SENT'
  | 'DELIVERED'
  | 'READ'
  | 'FAILED';
```

---

## 📅 Viewing Enums

### ViewingStatus

```typescript
export type ViewingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'RESCHEDULED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'NO_SHOW';
```

---

## 🔔 Notification Enums

### NotificationType

```typescript
export type NotificationType =
  | 'NEW_MESSAGE'
  | 'MESSAGE_READ'
  | 'VIEWING_REQUEST'
  | 'VIEWING_CONFIRMED'
  | 'VIEWING_CANCELLED'
  | 'VIEWING_REMINDER'
  | 'PROPERTY_ALERT'
  | 'PRICE_CHANGE'
  | 'PROPERTY_UNAVAILABLE'
  | 'ACCOUNT_VERIFIED'
  | 'NEW_DEVICE_LOGIN'
  | 'PROMOTION';
```

### NotificationChannel

```typescript
export type NotificationChannel = 'PUSH' | 'EMAIL' | 'SMS' | 'IN_APP';
```

---

## 🏢 Source Enums (Backend specific)

Aceste enums sunt specifice pentru funcționalitatea de scraper din backend.

```typescript
export type ListingSourceType =
  | 'FACEBOOK'
  | 'OLX'
  | 'RIVALIARE'
  | 'MANUAL'
  | 'OTHER';
```

---

## 💰 Currency

```typescript
export type Currency = 'EUR' | 'RON';
```

---

## 🌍 Language

```typescript
export type Language = 'RO' | 'EN';
```

---

## 📦 Export Final

Toate aceste tipuri trebuie exportate din packages/types:

```typescript
// packages/types/src/lib/enums.ts

// User
export type UserRole = 'OWNER' | 'SEEKER' | 'BOTH' | 'ADMIN';
export type VerificationLevel = 0 | 1 | 2 | 3;
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';

// Property
export type TransactionType = 'SALE' | 'RENT';
export type PropertyType =
  | 'APARTMENT'
  | 'HOUSE'
  | 'STUDIO'
  | 'PENTHOUSE'
  | 'DUPLEX'
  | 'LAND'
  | 'COMMERCIAL'
  | 'OFFICE'
  | 'PARKING'
  | 'STORAGE';
export type PropertyStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'ACTIVE'
  | 'PAUSED'
  | 'SOLD'
  | 'RENTED'
  | 'EXPIRED'
  | 'REJECTED';
export type CoordinateAccuracy = 'EXACT' | 'APPROXIMATE' | 'NEIGHBORHOOD';
export type ParkingType = 'GARAGE' | 'OUTDOOR' | 'UNDERGROUND' | 'NONE';

// Messaging
export type ConversationStatus = 'ACTIVE' | 'ARCHIVED' | 'BLOCKED';
export type MessageType = 'TEXT' | 'IMAGE' | 'VIEWING_REQUEST' | 'SYSTEM';
export type MessageStatus =
  | 'SENDING'
  | 'SENT'
  | 'DELIVERED'
  | 'READ'
  | 'FAILED';

// Viewing
export type ViewingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'RESCHEDULED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'NO_SHOW';

// Notification
export type NotificationType =
  | 'NEW_MESSAGE'
  | 'MESSAGE_READ'
  | 'VIEWING_REQUEST'
  | 'VIEWING_CONFIRMED'
  | 'VIEWING_CANCELLED'
  | 'VIEWING_REMINDER'
  | 'PROPERTY_ALERT'
  | 'PRICE_CHANGE'
  | 'PROPERTY_UNAVAILABLE'
  | 'ACCOUNT_VERIFIED'
  | 'NEW_DEVICE_LOGIN'
  | 'PROMOTION';
export type NotificationChannel = 'PUSH' | 'EMAIL' | 'SMS' | 'IN_APP';

// Common
export type Currency = 'EUR' | 'RON';
export type Language = 'RO' | 'EN';
export type ListingSourceType =
  | 'FACEBOOK'
  | 'OLX'
  | 'RIVALIARE'
  | 'MANUAL'
  | 'OTHER';
```

---

## 🔧 Acțiuni de Migrare pentru Backend

1. **UserRole:**
   - `tenant` → `SEEKER`
   - `landlord` → `OWNER`
   - `admin` → `ADMIN`

2. **PropertyStatus:**
   - `new` → `DRAFT`
   - `early_access` → `PENDING_REVIEW`
   - `public` → `ACTIVE`
   - `hidden` → `PAUSED`
   - `rented` → `RENTED`
   - `expired` → `EXPIRED`

3. **Adaugare câmpuri lipsă:**
   - `Property.transactionType`
   - `Property.propertyType`
   - `Property.status.SOLD`
   - `Property.status.REJECTED`

---

**Document Status:** DRAFT  
**Responsabil:** Toate echipele  
**Deadline aliniere:** Sprint 1
