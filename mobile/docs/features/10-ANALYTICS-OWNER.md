# 📊 Feature: Analytics pentru Proprietari

**ID Feature:** ANALYTICS-001  
**Prioritate:** P1 - High  
**Estimare:** 1 săptămână  
**Dependențe:** LISTING-001, Backend Analytics Service

---

## 📝 Descriere Generală

Proprietarii au nevoie de insight-uri despre performanța anunțurilor lor pentru a lua decizii informate (preț, fotografii, descriere).

---

## 👤 User Stories

```
US-ANAL-001: Ca proprietar, vreau să văd câte vizualizări are anunțul
pentru a înțelege interesul.

US-ANAL-002: Ca proprietar, vreau să știu de unde vin vizitatorii
(căutare, direct, favorite).

US-ANAL-003: Ca proprietar, vreau să compar performanța cu anunțuri similare.

US-ANAL-004: Ca proprietar, vreau sugestii pentru îmbunătățire.

US-ANAL-005: Ca proprietar, vreau să export statisticile.
```

---

## 📊 Metrici Disponibile

### Per Anunț

| Metrică          | Descriere             | Vizualizare    |
| ---------------- | --------------------- | -------------- |
| **Vizualizări**  | Total views + unique  | Grafic + număr |
| **Favorite**     | Câți au salvat        | Număr          |
| **Contacte**     | Mesaje inițiate       | Număr          |
| **Vizionări**    | Programate/finalizate | Număr          |
| **CTR**          | Impresii → click      | Procent        |
| **Contact Rate** | Views → mesaj         | Procent        |
| **Share Rate**   | Partajări             | Număr          |

### Surse Trafic

- Căutare directă
- Alerte salvate
- Link direct/partajare
- Din favorite

### Performanță comparativă

- Poziție medie în căutări
- Comparație cu anunțuri similare (zonă, preț)
- Benchmark contact rate

---

## 📊 Model de Date

```typescript
interface PropertyAnalytics {
  propertyId: string;
  period: "day" | "week" | "month" | "all_time";

  // Core metrics
  impressions: number; // Apariții în liste
  views: number; // Click pe anunț
  uniqueViews: number; // Vizitatori unici
  favorites: number; // Salvări
  contacts: number; // Mesaje inițiate
  viewingsRequested: number;
  viewingsCompleted: number;
  shares: number;

  // Rates
  ctr: number; // views / impressions
  contactRate: number; // contacts / views
  viewingRate: number; // viewings / contacts

  // Time series
  timeline: {
    date: string;
    views: number;
    contacts: number;
  }[];

  // Sources
  sources: {
    search: number;
    alerts: number;
    direct: number;
    favorites: number;
  };

  // Position
  avgSearchPosition?: number;

  // Benchmark
  benchmark?: {
    avgViews: number;
    avgContacts: number;
    percentile: number; // 0-100
  };
}

interface AnalyticsSuggestion {
  type: "photos" | "price" | "description" | "availability";
  priority: "high" | "medium" | "low";
  message: string;
  action?: string;
}
```

---

## 🎨 UI/UX Guidelines

### Property Analytics Screen

```
┌─────────────────────────────────────┐
│  ← Statistici anunț                 │
│  Apartament 3 camere, Drumul Tab.   │
├─────────────────────────────────────┤
│  [7 zile] [30 zile] [Tot]           │
├─────────────────────────────────────┤
│                                     │
│  ┌────────┐ ┌────────┐ ┌────────┐   │
│  │  234   │ │   12   │ │   5    │   │
│  │Vizual. │ │Contact │ │Vizion. │   │
│  │ ↑ 15%  │ │ ↑ 8%   │ │ = 0%   │   │
│  └────────┘ └────────┘ └────────┘   │
│                                     │
├─────────────────────────────────────┤
│  Vizualizări (ultim. 7 zile)        │
│  ┌─────────────────────────────┐    │
│  │ 50│    ╱╲                   │    │
│  │ 40│ ╱╲╱  ╲   ╱╲             │    │
│  │ 30│╱      ╲ ╱  ╲            │    │
│  │ 20│        ╲    ╲╱          │    │
│  │   └─────────────────────    │    │
│  │   L  M  Mi J  V  S  D       │    │
│  └─────────────────────────────┘    │
│                                     │
├─────────────────────────────────────┤
│  📊 Comparație cu piața             │
│  Anunțul tău e în top 25% pentru    │
│  contacte în zona Drumul Taberei.   │
│                                     │
├─────────────────────────────────────┤
│  💡 Sugestii                        │
│  ┌─────────────────────────────┐    │
│  │ ⚠️ Adaugă mai multe poze    │    │
│  │ Anunțurile cu 10+ poze au   │    │
│  │ 40% mai multe contacte.     │    │
│  │              [Adaugă poze]  │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 💰 Verifică prețul          │    │
│  │ Prețul tău e cu 5% peste    │    │
│  │ media zonei.                │    │
│  │          [Vezi comparație]  │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

### Owner Dashboard Widget

```
┌─────────────────────────────────────┐
│  📊 Sumar anunțuri (luna aceasta)   │
├─────────────────────────────────────┤
│                                     │
│  Total vizualizări        1,234     │
│  Total contacte              45     │
│  Vizionări programate        12     │
│                                     │
│  Cel mai performant:                │
│  🏆 Apartament 3 cam. - 456 views   │
│                                     │
│  Necesită atenție:                  │
│  ⚠️ Casă Pipera - 0 contacte        │
│                                     │
│                    [Vezi detalii →] │
└─────────────────────────────────────┘
```

---

## ✅ Criterii de Acceptanță

- [x] Metrici calculate corect
- [x] Grafice încarcă smooth
- [x] Sugestii relevante afișate
- [x] Comparații cu piața disponibile
- [x] Export funcțional (PDF/CSV)

---

## 🔌 API Endpoints

```
GET /api/v1/properties/:id/analytics
GET /api/v1/properties/:id/analytics/suggestions
GET /api/v1/users/me/properties/analytics/summary
GET /api/v1/properties/:id/analytics/export
```

---

**Document Status:** Draft  
**Ultima actualizare:** Ianuarie 2026
