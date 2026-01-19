# 🏠 Feature: Listare Proprietăți

**ID Feature:** LISTING-001  
**Prioritate:** P0 - Critical  
**Estimare:** 3 săptămâni  
**Dependențe:** AUTH-001, Media Service, Maps Integration

---

## 📝 Descriere Generală

Sistemul de listare proprietăți este core-ul platformei. Proprietarii trebuie să poată crea anunțuri complete, atractive și ușor de găsit.

### Obiective

- Timp creare anunț: **< 5 minute**
- Abandon rate: **< 15%**
- Calitate anunțuri: **> 90%** complete

---

## 👤 User Stories

```
US-LIST-001: Ca proprietar, vreau să creez un anunț nou
cu toate detaliile despre proprietatea mea.

US-LIST-002: Ca proprietar, vreau să încarc fotografii de calitate
pentru a atrage potențiali cumpărători/chiriași.

US-LIST-003: Ca proprietar, vreau să setez locația exactă pe hartă
pentru ca oamenii să știe unde se află proprietatea.

US-LIST-004: Ca proprietar, vreau să pot edita anunțul oricând.

US-LIST-005: Ca proprietar, vreau să văd câte vizualizări are anunțul.

US-LIST-006: Ca proprietar, vreau să marchez anunțul ca indisponibil
când proprietatea a fost vândută/închiriată.
```

---

## 📊 Model de Date

### Property (Proprietate)

```typescript
interface Property {
  // Identificare
  id: string;
  ownerId: string;
  slug: string; // URL-friendly: "apartament-3-camere-drumul-taberei"

  // Informații de bază
  title: string;
  description: string;

  // Tip tranzacție
  transactionType: "SALE" | "RENT";

  // Tip proprietate
  propertyType: PropertyType;

  // Locație
  location: PropertyLocation;

  // Caracteristici
  characteristics: PropertyCharacteristics;

  // Prețuri
  pricing: PropertyPricing;

  // Media
  media: PropertyMedia;

  // Status
  status: PropertyStatus;

  // Metadate
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  expiresAt?: Date;

  // Statistici
  stats: PropertyStats;
}

type PropertyType =
  | "APARTMENT" // Apartament
  | "HOUSE" // Casă/Vilă
  | "STUDIO" // Garsonieră
  | "PENTHOUSE" // Penthouse
  | "DUPLEX" // Duplex
  | "LAND" // Teren
  | "COMMERCIAL" // Spațiu comercial
  | "OFFICE" // Birou
  | "PARKING" // Parcare
  | "STORAGE"; // Depozit

interface PropertyLocation {
  // Adresă
  country: string;
  county: string;
  city: string;
  neighborhood?: string;
  street?: string;
  streetNumber?: string;
  building?: string;
  floor?: number;
  apartment?: string;
  postalCode?: string;

  // Coordonate (pentru hartă)
  coordinates: {
    latitude: number;
    longitude: number;
    accuracy: "EXACT" | "APPROXIMATE" | "NEIGHBORHOOD";
  };

  // Puncte de interes apropiate
  nearbyPOIs?: NearbyPOI[];
}

interface PropertyCharacteristics {
  // Dimensiuni
  totalArea: number; // mp
  usableArea?: number; // mp
  landArea?: number; // mp (pentru case/terenuri)

  // Structură
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  balconies?: number;

  // Construcție
  yearBuilt?: number;
  buildingType?: "BLOCK" | "HOUSE" | "VILLA" | "RESIDENTIAL_COMPLEX";
  structure?: "CONCRETE" | "BRICK" | "WOOD" | "MIXED";

  // Etaj
  floor?: number;
  totalFloors?: number;

  // Orientare
  orientation?: ("N" | "S" | "E" | "W")[];

  // Dotări
  amenities: Amenity[];

  // Utilități
  utilities: Utility[];

  // Confort
  comfort?: "LUXURY" | "INCREASED" | "STANDARD" | "REDUCED";

  // Parcare
  parking?: {
    type: "GARAGE" | "OUTDOOR" | "UNDERGROUND" | "NONE";
    spots?: number;
  };
}

type Amenity =
  | "AIR_CONDITIONING"
  | "CENTRAL_HEATING"
  | "UNDERFLOOR_HEATING"
  | "FIREPLACE"
  | "ELEVATOR"
  | "FURNISHED"
  | "SEMI_FURNISHED"
  | "KITCHEN_APPLIANCES"
  | "WASHER"
  | "DRYER"
  | "DISHWASHER"
  | "BALCONY"
  | "TERRACE"
  | "GARDEN"
  | "POOL"
  | "SAUNA"
  | "GYM"
  | "STORAGE"
  | "SECURITY_SYSTEM"
  | "VIDEO_INTERCOM"
  | "SMART_HOME"
  | "FIBER_INTERNET"
  | "CABLE_TV"
  | "PET_FRIENDLY";

type Utility =
  | "ELECTRICITY"
  | "GAS"
  | "WATER"
  | "SEWAGE"
  | "CENTRAL_HEATING"
  | "INTERNET"
  | "CABLE_TV";

interface PropertyPricing {
  price: number;
  currency: "EUR" | "RON";
  pricePerSqm?: number;
  negotiable: boolean;

  // Pentru închirieri
  rentDetails?: {
    depositMonths: number;
    utilitiesIncluded: boolean;
    minimumPeriodMonths?: number;
  };

  // Istoric prețuri (intern)
  priceHistory?: {
    price: number;
    changedAt: Date;
  }[];
}

interface PropertyMedia {
  photos: PropertyPhoto[];
  videos?: PropertyVideo[];
  virtualTour?: string; // URL Matterport/similar
  floorPlan?: string; // URL imagine plan
}

interface PropertyPhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  order: number;
  caption?: string;
  room?: string; // living, bedroom, kitchen, etc.
  isPrimary: boolean;
}

type PropertyStatus =
  | "DRAFT" // În editare
  | "PENDING_REVIEW" // Așteaptă moderare
  | "ACTIVE" // Publicat și activ
  | "PAUSED" // Pausat temporar
  | "SOLD" // Vândut
  | "RENTED" // Închiriat
  | "EXPIRED" // Expirat
  | "REJECTED"; // Respins la moderare

interface PropertyStats {
  views: number;
  uniqueViews: number;
  favorites: number;
  contacts: number;
  shares: number;
  viewingsScheduled: number;
  lastViewedAt?: Date;
}
```

---

## 🔄 Flux Creare Anunț

### Wizard Multi-Step

```
Step 1: Tip Proprietate
    ↓
Step 2: Locație
    ↓
Step 3: Caracteristici
    ↓
Step 4: Fotografii
    ↓
Step 5: Preț și Descriere
    ↓
Step 6: Preview și Publicare
```

### Screen Flow

```
┌─────────────────────────────────────┐
│  ← Anunț nou         Pasul 1 din 6  │
│  [░░░░░░░░░░░░░░░░] 17%             │
├─────────────────────────────────────┤
│                                     │
│  Ce dorești să publici?             │
│                                     │
│  Tip tranzacție                     │
│  ┌───────────┐  ┌───────────┐       │
│  │  Vânzare  │  │ Închiriere│       │
│  └───────────┘  └───────────┘       │
│                                     │
│  Tip proprietate                    │
│  ┌───────┐┌───────┐┌───────┐        │
│  │ 🏢    ││ 🏠    ││ 🏗️    │        │
│  │Apart. ││ Casă  ││ Teren │        │
│  └───────┘└───────┘└───────┘        │
│  ┌───────┐┌───────┐┌───────┐        │
│  │ 🏪    ││ 🅿️    ││ ...   │        │
│  │Comerci││Parcare││Altele │        │
│  └───────┘└───────┘└───────┘        │
│                                     │
│  ┌─────────────────────────────┐    │
│  │         Continuă            │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

---

## ✅ Cerințe Funcționale

### RF-LIST-001: Creare Anunț

- Wizard ghidat în 6 pași
- Salvare automată draft
- Reluare de unde s-a rămas
- Validare la fiecare pas

### RF-LIST-002: Upload Fotografii

- Minim 3 fotografii obligatorii
- Maxim 30 fotografii
- Formate: JPG, PNG, HEIC, WebP
- Dimensiune max: 10MB/fiecare
- Compresie automată pentru upload
- Reordonare drag & drop
- Setare fotografie principală
- Caption opțional

### RF-LIST-003: Localizare

- Căutare adresă cu autocomplete
- Selectare pe hartă
- Opțiune locație aproximativă
- Auto-detect POIs din zonă

### RF-LIST-004: Moderare

- AI-assisted pre-review
- Verificare fotografii (nu sunt furate)
- Verificare descriere (spam, date contact)
- Aprobare automată pentru utilizatori verificați

### RF-LIST-005: Editare

- Editare orice câmp post-publicare
- Notificare utilizatori interested la schimbări majore
- Istoric modificări

### RF-LIST-006: Status Management

- Publicare/Pausare anunț
- Marcare vândut/închiriat
- Reînnoiri automate (opțional)
- Expirare la 60 de zile (configurabil)

### 🤖 RF-LIST-007: Integrare AI (Diferențiator Cheie)

#### Analiză Automată la Finalizare Anunț

La finalizarea wizard-ului, AI-ul analizează automat anunțul și oferă:

**1. Analiză Preț**

- Comparație cu proprietăți similare din zonă
- Interval de preț recomandat (conservativ/optimal/ambițios)
- Procent diferență față de piață
- Impact estimat asupra vizibilității

**2. Analiză Descriere**

- Scor SEO și readability
- Keywords lipsă din categoria proprietății
- Sugestii de îmbunătățire
- Opțiune: **Generare descriere optimizată AI**

**3. Analiză Fotografii**

- Verificare completitudine (toate camerele)
- Detecție calitate (blur, luminozitate)
- Sugestii camere lipsă

**4. Scor General Anunț (0-100)**

- Agregare toate analizele
- Recomandări prioritizate

#### Generare Descriere AI

```typescript
// Proprietarul apasă "Generează cu AI"
const generateDescription = async (propertyId: string) => {
  const result = await aiService.generateDescription({
    propertyId,
    style: "professional", // sau "friendly", "luxurious"
    targetAudience: "families", // opțional
    language: "ro",
  });

  // Returnează descriere + variante alternative
  return result; // { content, variations, seoScore }
};
```

#### UI: AI Analysis Widget

```
┌─────────────────────────────────────┐
│  🤖 Analiză AI          Scor: 78   │
├─────────────────────────────────────┤
│                                     │
│  ⚠️ PREȚ                            │
│  Prețul tău: 120.000€               │
│  Recomandat: 95-105.000€            │
│  📉 -22% vizibilitate estimată      │
│  [Ajustează]                        │
│                                     │
│  💡 DESCRIERE                       │
│  Scor: 65/100                       │
│  Lipsă: an renovare, încălzire      │
│  [Generează cu AI] [Editează]       │
│                                     │
│  📸 FOTOGRAFII                      │
│  8 încărcate · Lipsă: bucătărie     │
│  [Adaugă]                           │
│                                     │
└─────────────────────────────────────┘
```

---

## 🎨 UI/UX Guidelines

### Photo Upload Screen

```
┌─────────────────────────────────────┐
│  ← Fotografii        Pasul 4 din 6  │
├─────────────────────────────────────┤
│                                     │
│  Adaugă fotografii ale proprietății │
│  (minim 3, maxim 30)                │
│                                     │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐    │
│  │ ⭐  │ │ 📷  │ │ 📷  │ │ + │    │
│  │foto1│ │foto2│ │foto3│ │ Add │    │
│  └─────┘ └─────┘ └─────┘ └─────┘    │
│                                     │
│  💡 Sfaturi:                        │
│  • Fotografii luminoase și clare    │
│  • Arată toate camerele             │
│  • Include față și curte            │
│  • Prima poză = principală          │
│                                     │
│  ✓ 3 fotografii încărcate           │
│                                     │
│  ┌─────────────────────────────┐    │
│  │         Continuă            │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

---

## ✅ Criterii de Acceptanță

- [x] User poate crea anunț în max 5 minute
- [x] Draft salvat automat la fiecare pas
- [x] Upload fotografii funcționează offline-first
- [x] Hartă încarcă și funcționează smooth
- [x] Validări clare la fiecare pas
- [x] Preview fidel înainte de publicare
- [x] Anunț publicat apare în căutări

---

## 🔌 API Endpoints

```
POST   /api/v1/properties
GET    /api/v1/properties/:id
PUT    /api/v1/properties/:id
DELETE /api/v1/properties/:id
PATCH  /api/v1/properties/:id/status
POST   /api/v1/properties/:id/photos
DELETE /api/v1/properties/:id/photos/:photoId
PUT    /api/v1/properties/:id/photos/reorder
GET    /api/v1/users/me/properties
```

---

**Document Status:** Draft  
**Ultima actualizare:** Ianuarie 2026
