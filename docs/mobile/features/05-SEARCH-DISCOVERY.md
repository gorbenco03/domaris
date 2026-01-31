# 🔍 Feature: Căutare și Descoperire

**ID Feature:** SEARCH-001  
**Prioritate:** P0 - Critical  
**Estimare:** 2.5 săptămâni  
**Dependențe:** LISTING-001, Search Engine (Elasticsearch/Algolia)

---

## 📝 Descriere Generală

Sistemul de căutare este esențial pentru a conecta căutătorii cu proprietățile potrivite. Trebuie să fie rapid, precis și intuitiv.

### Obiective

- Timp de răspuns căutare: **< 200ms**
- Relevanță primele 10 rezultate: **> 80%**
- Conversie căutare → vizualizare: **> 15%**

---

## 👤 User Stories

```
US-SEARCH-001: Ca căutător, vreau să caut proprietăți după locație
pentru a găsi opțiuni în zona dorită.

US-SEARCH-002: Ca căutător, vreau să filtrez după preț, camere, suprafață
pentru a vedea doar ce îmi permit.

US-SEARCH-003: Ca căutător, vreau să caut pe hartă
pentru a vizualiza proprietățile geografic.

US-SEARCH-004: Ca căutător, vreau să salvez căutările mele
pentru a le rula din nou.

US-SEARCH-005: Ca căutător, vreau alerte pentru proprietăți noi
care corespund criteriilor mele.

US-SEARCH-006: Ca căutător, vreau să sortez rezultatele
după preț, dată, relevanță.
```

---

## 🎯 Tipuri de Căutare

### 1. Căutare Text

- Căutare liberă (full-text search)
- Sugestii autocomplete
- Căutare în: titlu, descriere, locație, caracteristici

### 2. Căutare cu Filtre

- Filtre combinate multiple
- Rangeuri pentru valori numerice
- Multiselect pentru categorii

### 3. Căutare pe Hartă

- Vizualizare cluster markers
- Desenare zonă de interes
- Rezultate în timp real la pan/zoom

### 4. Căutare Salvată

- Salvare criterii
- Alertă automată la potriviri noi

---

## 📊 Specificații Filtre

### Filtre Disponibile

```typescript
interface SearchFilters {
  // Locație
  location?: {
    type: "city" | "county" | "neighborhood" | "coordinates";
    value: string | Coordinates;
    radius?: number; // km, pentru coordinates
  };

  // Tip
  transactionType?: "SALE" | "RENT";
  propertyTypes?: PropertyType[];

  // Preț
  priceRange?: {
    min?: number;
    max?: number;
    currency: "EUR" | "RON";
  };

  // Suprafață
  areaRange?: {
    min?: number;
    max?: number;
  };

  // Camere
  rooms?: {
    min?: number;
    max?: number;
  };

  bedrooms?: {
    min?: number;
    max?: number;
  };

  bathrooms?: {
    min?: number;
    max?: number;
  };

  // Etaj
  floor?: {
    min?: number;
    max?: number;
    excludeGroundFloor?: boolean;
    excludeLastFloor?: boolean;
  };

  // An construcție
  yearBuilt?: {
    min?: number;
    max?: number;
  };

  // Dotări
  amenities?: Amenity[];

  // Extras
  hasPhotos?: boolean;
  hasVirtualTour?: boolean;
  ownerVerified?: boolean;
  priceReduced?: boolean;
  newListing?: boolean; // < 7 zile

  // Sortare
  sortBy?:
    | "relevance"
    | "price_asc"
    | "price_desc"
    | "date_newest"
    | "date_oldest"
    | "area_asc"
    | "area_desc";
}
```

### Filtre Quick-Select (Chips)

```
┌─────────────────────────────────────────────────┐
│  [Vânzare ▾] [Apartament ▾] [Orice preț ▾]     │
│  [2+ camere] [50+ mp] [+Mai multe filtre]      │
└─────────────────────────────────────────────────┘
```

---

## 🔄 Fluxuri

### Search Flow

```
┌─────────────────┐
│ Home / Search   │
│ [🔍 Caută...]   │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌───────────┐
│ Text  │ │   Hartă   │
│ Search│ │   View    │
└───┬───┘ └─────┬─────┘
    │           │
    ▼           ▼
┌─────────────────────┐
│  Rezultate List/Map │
│  + Filtre active    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Detalii Proprietate│
└─────────────────────┘
```

---

## 🎨 UI/UX Guidelines

### Home Screen - Search Focused

```
┌─────────────────────────────────────┐
│                            [👤]     │
│                                     │
│  🏠 RIVA                           │
│                                     │
│  Găsește-ți casa visurilor          │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🔍 Caută după locație...    │    │
│  └─────────────────────────────┘    │
│                                     │
│  [Vânzare] [Închiriere]             │
│                                     │
│  Căutări populare:                  │
│  • București Sector 1               │
│  • Cluj-Napoca Centru               │
│  • Brașov                           │
│                                     │
├─────────────────────────────────────┤
│  📍 Descoperă în zona ta            │
│  ┌────────────────────────────┐     │
│  │      [Google Map View]     │     │
│  │         · · ·              │     │
│  └────────────────────────────┘     │
│                                     │
├─────────────────────────────────────┤
│  🆕 Adăugate recent                 │
│  [Card][Card][Card] →               │
│                                     │
└─────────────────────────────────────┘
```

### Search Results Screen

```
┌─────────────────────────────────────┐
│  ← București        [🗺️] [≡]       │
├─────────────────────────────────────┤
│  [Vânzare▾][Apart▾][Preț▾][Filtre]  │
├─────────────────────────────────────┤
│  234 rezultate          [Sortare ▾] │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐    │
│  │ [📷📷📷]                    │    │
│  │ Apartament 3 camere         │    │
│  │ Drumul Taberei, Sector 6    │    │
│  │ 75 mp · Etaj 4/10          │    │
│  │ 💰 95.000€    ♡             │    │
│  │ ✓✓ Proprietar verificat     │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ [📷📷📷]                    │    │
│  │ Apartament 2 camere         │    │
│  │ Militari, Sector 6          │    │
│  │ 52 mp · Etaj 2/8           │    │
│  │ 💰 72.000€    ♡    🔥 NOU   │    │
│  └─────────────────────────────┘    │
│                                     │
│  [Load more...]                     │
│                                     │
└─────────────────────────────────────┘
```

### Map Search Screen

```
┌─────────────────────────────────────┐
│  ← Caută pe hartă     [≡ Listă]     │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │     [Google Maps View]      │    │
│  │                             │    │
│  │    (12)●     ●95K           │    │
│  │         ●87K                │    │
│  │              (8)●           │    │
│  │    ●102K           ●78K     │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
├─────────────────────────────────────┤
│  [Vânzare▾][Apart▾][Preț▾][Filtre]  │
├─────────────────────────────────────┤
│  ← [Property Card Preview] →        │
│     Swipe pentru alte rezultate     │
└─────────────────────────────────────┘
```

---

## ✅ Cerințe Funcționale

### RF-SEARCH-001: Text Search

- Autocomplete cu debounce (300ms)
- Highlight în rezultate
- Sugestii istoric + populare

### RF-SEARCH-002: Filtre

- Aplicare instantanee
- Număr rezultate actualizat live
- Reset filtre individual/toate

### RF-SEARCH-003: Rezultate

- Infinite scroll
- Skeleton loading
- Cache pentru back navigation

### RF-SEARCH-004: Hartă

- Clustering pentru zoom out
- Marcere cu preț
- Half-sheet cu detalii la tap
- Sync hartă ↔ listă

### RF-SEARCH-005: Salvare Căutări

- Max 10 căutări salvate
- Nume personalizat
- Alerte on/off

### RF-SEARCH-006: Alerte

- Push notification la match
- Email digest (daily/weekly)
- Configurabil per căutare

---

## ✅ Criterii de Acceptanță

- [x] Căutare returnează rezultate în < 500ms
- [x] Filtre se aplică instant
- [x] Hartă încarcă smooth cu clustering
- [x] Salvare căutări funcțională
- [x] Alerte se trimit corect

---

## 🔌 API Endpoints

```
GET  /api/v1/properties/search
GET  /api/v1/properties/search/suggestions
GET  /api/v1/properties/search/map
POST /api/v1/saved-searches
GET  /api/v1/saved-searches
PUT  /api/v1/saved-searches/:id
DELETE /api/v1/saved-searches/:id
```

---

**Document Status:** Draft  
**Ultima actualizare:** Ianuarie 2026
