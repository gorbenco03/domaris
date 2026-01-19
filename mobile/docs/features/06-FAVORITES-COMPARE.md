# ❤️ Feature: Favorite și Comparații

**ID Feature:** FAV-001  
**Prioritate:** P0/P1  
**Estimare:** 1 săptămână  
**Dependențe:** AUTH-001, LISTING-001

---

## 📝 Descriere Generală

Funcționalitatea de favorite permite utilizatorilor să salveze proprietățile de interes și să le compare pentru a lua decizii informate.

---

## 👤 User Stories

```
US-FAV-001: Ca căutător, vreau să salvez proprietăți la favorite
pentru a le revizui mai târziu.

US-FAV-002: Ca căutător, vreau să organizez favoritele în liste
pentru a grupa proprietățile după criterii.

US-FAV-003: Ca căutător, vreau să compar proprietăți
pentru a vedea diferențele la un loc.

US-FAV-004: Ca căutător, vreau notificări când se schimbă prețul
unei proprietăți din favorite.

US-FAV-005: Ca căutător, vreau să adaug note personale
pe proprietățile salvate.
```

---

## 📊 Model de Date

```typescript
interface Favorite {
  id: string;
  userId: string;
  propertyId: string;
  listId?: string;
  notes?: string;
  createdAt: Date;

  // Snapshot la salvare (pentru istoric)
  priceAtSave: number;

  // Property populated
  property?: Property;
}

interface FavoriteList {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isDefault: boolean;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Comparison {
  id: string;
  userId: string;
  propertyIds: string[]; // max 4
  createdAt: Date;
}
```

---

## ✅ Cerințe Funcționale

### RF-FAV-001: Adăugare la Favorite

- Toggle rapid din card/detalii (heart icon)
- Confirmare vizuală instantanee
- Opțional: selectare listă la salvare

### RF-FAV-002: Liste Personalizate

- Listă default "Toate Favoritele"
- Creare liste custom (max 20)
- Redenumire/ștergere liste
- Mutare proprietăți între liste

### RF-FAV-003: Gestionare Favorite

- Vizualizare toate favoritele
- Filtrare după listă
- Sortare după dată/preț
- Ștergere individuală sau în masă

### RF-FAV-004: Note Personale

- Adăugare notă text (max 500 caractere)
- Vizibilă doar pentru utilizator
- Editare/ștergere

### RF-FAV-005: Comparație

- Selectare 2-4 proprietăți pentru comparare
- Vizualizare side-by-side
- Highlight diferențe
- Partajare comparație

### RF-FAV-006: Notificări

- Alertă la schimbare preț
- Alertă dacă proprietatea devine indisponibilă
- Configurabil on/off

---

## 🎨 UI/UX Guidelines

### Favorites List Screen

```
┌─────────────────────────────────────┐
│  ← Favorite              [Editează] │
├─────────────────────────────────────┤
│  Liste                               │
│  [Toate (12)] [București (5)] [+]    │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐    │
│  │ [📷]  Apartament 3 camere   │    │
│  │       95.000€ (↓-5.000€)    │    │
│  │       📝 "Sună luni"        │    │
│  │       [Compară] [✕]         │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ [📷]  Casă 4 camere         │    │
│  │       180.000€              │    │
│  │       [Compară] [✕]         │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

### Comparison Screen

```
┌─────────────────────────────────────┐
│  ← Comparație (3)        [Partajează]│
├─────────────────────────────────────┤
│         Prop 1   Prop 2   Prop 3    │
├─────────────────────────────────────┤
│ Foto    [📷]     [📷]     [📷]      │
│ Preț    95K€     87K€     102K€     │
│ Supraf  75mp     68mp     82mp      │
│ €/mp    1.267    1.279    1.244 ✓   │
│ Camere  3        2        3         │
│ Etaj    4/10     2/8      6/12      │
│ An      2008     2015     2020 ✓    │
│ Parcare ✓        ✗        ✓         │
│ AC      ✓        ✓        ✓         │
│ Balcon  1        2 ✓      1         │
├─────────────────────────────────────┤
│  [Contact] [Contact] [Contact]      │
└─────────────────────────────────────┘
```

---

## ✅ Criterii de Acceptanță

- [x] Toggle favorit în < 200ms
- [x] Sync între dispozitive
- [x] Liste personalizate funcționale
- [x] Comparație afișează diferențe clar
- [x] Notificări la schimbare preț

---

## 🔌 API Endpoints

```
GET    /api/v1/favorites
POST   /api/v1/favorites
DELETE /api/v1/favorites/:propertyId
PATCH  /api/v1/favorites/:propertyId/notes

GET    /api/v1/favorite-lists
POST   /api/v1/favorite-lists
PUT    /api/v1/favorite-lists/:id
DELETE /api/v1/favorite-lists/:id

POST   /api/v1/properties/compare
```

---

**Document Status:** Draft  
**Ultima actualizare:** Ianuarie 2026
