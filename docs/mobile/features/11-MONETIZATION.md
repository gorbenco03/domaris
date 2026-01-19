# 💳 Feature: Monetizare

**ID Feature:** MONET-001  
**Prioritate:** P3 - Low (Phase 2+)  
**Estimare:** 3-4 săptămâni  
**Dependențe:** Core platform funcțional, Payment Gateway

---

## 📝 Descriere Generală

Strategia de monetizare este crucială pentru sustenabilitatea platformei. Modelul trebuie să rămână atractiv pentru utilizatori în comparație cu agențiile tradiționale.

---

## 💰 Modele de Monetizare

### 1. Freemium Model (Recomandat pentru început)

| Tier         | Preț        | Caracteristici                          |
| ------------ | ----------- | --------------------------------------- |
| **Free**     | 0€          | 1 anunț activ, 5 poze, stats de bază    |
| **Standard** | 9.99€/lună  | 5 anunțuri, 15 poze, stats avansate     |
| **Premium**  | 19.99€/lună | 15 anunțuri, 30 poze, prioritate, badge |
| **Business** | 49.99€/lună | Nelimitat, API, white-label             |

### 2. Pay-per-Listing

| Opțiune        | Preț  | Durată              |
| -------------- | ----- | ------------------- |
| Anunț Standard | 4.99€ | 30 zile             |
| Anunț Premium  | 9.99€ | 30 zile + promovare |
| Reînnoire      | 2.99€ | +30 zile            |

### 3. Boost & Promovare

| Feature          | Preț   | Efect                      |
| ---------------- | ------ | -------------------------- |
| Boost 24h        | 1.99€  | Top lista 24h în zonă      |
| Boost 7 zile     | 9.99€  | Top lista 7 zile           |
| Highlight        | 4.99€  | Badge "Promovat" 14 zile   |
| Homepage Feature | 29.99€ | Afișare pe homepage 7 zile |

### 4. Servicii Auxiliare (Viitor)

- Fotografii profesionale: 49-99€
- Video tour/3D scan: 79-149€
- Verificare proprietate prioritară: 19.99€
- Consultanță prețare: 29.99€

### 📈 Eficiența Costurilor AI (DigitalOcean GPT-oss-120b)

Bazat pe tarifele de **$0.10 / 1M input** și **$0.70 / 1M output**:

| Activitate                      | Cost unitar (est.) | ROI              |
| ------------------------------- | ------------------ | ---------------- |
| Conversație Căutător (5 mesaje) | ~$0.003            | Mare (Conversie) |
| Analiză Anunț + Sugestii Preț   | ~$0.001            | Mare (Retenție)  |
| Generare Descriere SEO          | ~$0.001            | Mare (Calitate)  |

_Costul total pentru 1,000 de utilizatori activi este estimat la sub **$20/lună**, oferind o marjă de profit excelentă pentru subscripțiile de minimum 9.99€._

---

## 📊 Model de Date

```typescript
interface Subscription {
  id: string;
  userId: string;
  plan: "free" | "standard" | "premium" | "business";
  status: "active" | "cancelled" | "past_due" | "expired";

  // Billing
  priceMonthly: number;
  currency: "EUR" | "RON";
  billingCycle: "monthly" | "yearly";

  // Dates
  startedAt: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelledAt?: Date;

  // Payment
  paymentMethod?: PaymentMethod;
  stripeSubscriptionId?: string;
}

interface Boost {
  id: string;
  propertyId: string;
  type: "boost_24h" | "boost_7d" | "highlight" | "homepage";
  status: "pending" | "active" | "expired" | "cancelled";
  price: number;
  startedAt: Date;
  expiresAt: Date;
}

interface Transaction {
  id: string;
  userId: string;
  type: "subscription" | "boost" | "listing" | "service";
  amount: number;
  currency: "EUR" | "RON";
  status: "pending" | "completed" | "failed" | "refunded";
  paymentMethod: "card" | "apple_pay" | "google_pay";
  createdAt: Date;
  receiptUrl?: string;
}
```

---

## ✅ Cerințe Funcționale

### RF-MON-001: Subscripții

- Upgrade/Downgrade fluid
- Prorate la schimbare
- Anulare oricând
- Grace period 7 zile după expirare

### RF-MON-002: Plăți

- Stripe/Card
- Apple Pay (iOS)
- Google Pay (Android)
- Facturi automate

### RF-MON-003: Boost

- Cumpărare din app
- Activare imediată
- Statistici boost separate
- Notificare la expirare

### RF-MON-004: Trial

- 14 zile Premium gratis
- Fără card necesar
- Downgrade automat la Free

---

## 🎨 UI/UX Guidelines

### Pricing Screen

```
┌─────────────────────────────────────┐
│  ← Planuri și prețuri               │
├─────────────────────────────────────┤
│                                     │
│  Alege planul potrivit pentru tine  │
│                                     │
│  [Lunar] [Anual -20%]               │
│                                     │
│  ┌─────────────────────────────┐    │
│  │        GRATUIT              │    │
│  │          0€                 │    │
│  │                             │    │
│  │  ✓ 1 anunț activ            │    │
│  │  ✓ 5 fotografii             │    │
│  │  ✓ Statistici de bază       │    │
│  │  ✗ Fără promovare           │    │
│  │                             │    │
│  │  [Plan curent]              │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  ⭐ STANDARD        💎      │    │
│  │     9.99€/lună              │    │
│  │                             │    │
│  │  ✓ 5 anunțuri active        │    │
│  │  ✓ 15 fotografii/anunț      │    │
│  │  ✓ Statistici avansate      │    │
│  │  ✓ Suport prioritar         │    │
│  │                             │    │
│  │  [Încearcă 14 zile gratis]  │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  🏆 PREMIUM           🔥    │    │
│  │     19.99€/lună             │    │
│  │     ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬         │    │
│  │     CEL MAI POPULAR         │    │
│  │                             │    │
│  │  ✓ 15 anunțuri active       │    │
│  │  ✓ 30 fotografii/anunț      │    │
│  │  ✓ Video tour               │    │
│  │  ✓ Badge Premium            │    │
│  │  ✓ Prioritate în căutări    │    │
│  │                             │    │
│  │  [Upgrade acum]             │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

### Boost Purchase

```
┌─────────────────────────────────────┐
│  ← Promovează anunțul               │
├─────────────────────────────────────┤
│                                     │
│  🏠 Apartament 3 camere             │
│     Drumul Taberei                  │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  Alege promovarea                   │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🚀 Boost 24h         1.99€  │    │
│  │    Top lista în zonă 24h    │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🚀 Boost 7 zile      9.99€  │    │
│  │    Top lista 7 zile   💎    │    │
│  │    +50% mai multe views     │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ ⭐ Highlight         4.99€  │    │
│  │    Badge "Promovat" 14 zile │    │
│  └─────────────────────────────┘    │
│                                     │
├─────────────────────────────────────┤
│  Total selectat: 9.99€              │
│                                     │
│  ┌─────────────────────────────┐    │
│  │   Plătește cu Apple Pay     │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

---

## ✅ Criterii de Acceptanță

- [x] Upgrade/downgrade funcțional
- [x] Plăți procesate corect
- [x] Facturi generate automat
- [x] Boost se activează instant
- [x] Trial 14 zile funcțional

---

## 🔌 API Endpoints

```
# Subscriptions
GET    /api/v1/subscriptions/plans
GET    /api/v1/users/me/subscription
POST   /api/v1/subscriptions
PATCH  /api/v1/subscriptions/change-plan
DELETE /api/v1/subscriptions/cancel

# Boosts
GET    /api/v1/boosts/options
POST   /api/v1/properties/:id/boost
GET    /api/v1/properties/:id/boosts

# Payments
POST   /api/v1/payments/create-intent
GET    /api/v1/users/me/transactions
GET    /api/v1/users/me/invoices/:id
```

---

**Document Status:** Draft  
**Ultima actualizare:** Ianuarie 2026
