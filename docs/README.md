# 📚 Documentație Centralizată - Domaris/RIVA

Acest folder conține întreaga documentație pentru monorepo-ul Domaris/RIVA.

---

## 📂 Structura

```
docs/
├── README.md                   # Acest fișier
├── PROJECT-STATUS.md           # ⭐ STATUS ACTUAL - Gap analysis și recomandări
├── SYNC-GUIDE.md               # Ghid sincronizare între echipe
│
├── decisions/                  # 🆕 Decizii Arhitecturale (ADR)
│   └── 001-UNIFIED-ACCOUNT-MODEL.md  # ⭐ IMPORTANT: Model cont fără roluri
│
├── shared/                     # Documentație COMUNĂ tuturor echipelor
│   ├── DATA-MODELS.md          # Modele de date (interfețe TypeScript)
│   ├── BACKEND-API-CRUD-GUIDE.md # Specificații API complete
│   └── API-SPECIFICATION.md    # OpenAPI spec (TBD)
│
├── mobile/                     # Documentație specifică MOBILE
│   ├── 00-PROJECT-OVERVIEW.md  # Viziunea și obiectivele proiectului
│   ├── IMPLEMENTATION-SUMMARY.md # Ce s-a implementat
│   ├── features/               # Specificații per feature (12 documente)
│   ├── architecture/           # Arhitectură și contracte API
│   ├── security/               # GDPR, securitate
│   └── ui-ux/                  # Design system
│
├── backend/                    # Documentație specifică BACKEND
│   └── (pending)               # TODO: Echipa backend
│
├── frontend/                   # Documentație specifică FRONTEND (Web)
│   └── (pending)               # TODO: Echipa frontend
│
├── packages/                   # Documentație pentru shared packages
│   └── (pending)
│
└── status/                     # Rapoarte de status
    └── weekly/                 # Rapoarte săptămânale
```

---

## 🚀 Quick Links

| Document                                                                           | Descriere                                                | Ultima Actualizare |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------ |
| [PROJECT-STATUS.md](./PROJECT-STATUS.md)                                           | **Status actual al proiectului, gap analysis**           | 20 Ian 2026        |
| [SYNC-GUIDE.md](./SYNC-GUIDE.md)                                                   | Ghid pentru sincronizare echipe                          | 20 Ian 2026        |
| [decisions/001-UNIFIED-ACCOUNT-MODEL.md](./decisions/001-UNIFIED-ACCOUNT-MODEL.md) | **⭐ CITEȘTE PRIMUL: Model cont unificat (fără roluri)** | 20 Ian 2026        |
| [shared/DATA-MODELS.md](./shared/DATA-MODELS.md)                                   | Modele de date comune                                    | 20 Ian 2026        |
| [shared/BACKEND-API-CRUD-GUIDE.md](./shared/BACKEND-API-CRUD-GUIDE.md)             | Specificații API                                         | 19 Ian 2026        |
| [mobile/00-PROJECT-OVERVIEW.md](./mobile/00-PROJECT-OVERVIEW.md)                   | Viziunea completă RIVA                                  | Ian 2026           |
| [mobile/ui-ux/DESIGN-SYSTEM.md](./mobile/ui-ux/DESIGN-SYSTEM.md)                   | Design System                                            | Ian 2026           |

---

## 📱 Mobile Features Documentation

| Feature               | Document                                                                     | Status Implementare |
| --------------------- | ---------------------------------------------------------------------------- | ------------------- |
| Auth & Registration   | [01-AUTH-REGISTRATION.md](./mobile/features/01-AUTH-REGISTRATION.md)         | ✅ UI Complete      |
| Identity Verification | [02-IDENTITY-VERIFICATION.md](./mobile/features/02-IDENTITY-VERIFICATION.md) | ✅ UI Complete      |
| User Profile          | [03-USER-PROFILE.md](./mobile/features/03-USER-PROFILE.md)                   | ✅ UI Complete      |
| Property Listing      | [04-PROPERTY-LISTING.md](./mobile/features/04-PROPERTY-LISTING.md)           | ✅ UI Complete      |
| Search & Discovery    | [05-SEARCH-DISCOVERY.md](./mobile/features/05-SEARCH-DISCOVERY.md)           | ✅ UI Complete      |
| Favorites & Compare   | [06-FAVORITES-COMPARE.md](./mobile/features/06-FAVORITES-COMPARE.md)         | ✅ UI Complete      |
| Messaging             | [07-MESSAGING.md](./mobile/features/07-MESSAGING.md)                         | ✅ UI Complete      |
| Viewings & Bookings   | [08-VIEWINGS-BOOKINGS.md](./mobile/features/08-VIEWINGS-BOOKINGS.md)         | ⏳ Pending          |
| Notifications         | [09-NOTIFICATIONS.md](./mobile/features/09-NOTIFICATIONS.md)                 | ⏳ Pending          |
| Analytics (Owner)     | [10-ANALYTICS-OWNER.md](./mobile/features/10-ANALYTICS-OWNER.md)             | ⏳ Pending          |
| Monetization          | [11-MONETIZATION.md](./mobile/features/11-MONETIZATION.md)                   | 📝 Post-MVP         |
| AI Assistant          | [12-AI-ASSISTANT.md](./mobile/features/12-AI-ASSISTANT.md)                   | 📝 Post-MVP         |

---

## ⚡ Pentru Dezvoltatori Noi

1. **⭐ CITEȘTE PRIMUL:** [decisions/001-UNIFIED-ACCOUNT-MODEL.md](./decisions/001-UNIFIED-ACCOUNT-MODEL.md) - Decizia critică: cont unificat, fără roluri
2. **Citește** [PROJECT-STATUS.md](./PROJECT-STATUS.md) pentru a înțelege starea actuală
3. **Citește** [SYNC-GUIDE.md](./SYNC-GUIDE.md) pentru convenții și procese
4. **Backend devs:** Citește [shared/BACKEND-API-CRUD-GUIDE.md](./shared/BACKEND-API-CRUD-GUIDE.md)
5. **Mobile devs:** Citește [mobile/00-PROJECT-OVERVIEW.md](./mobile/00-PROJECT-OVERVIEW.md)
6. **Toți:** Verifică [shared/DATA-MODELS.md](./shared/DATA-MODELS.md) pentru interfețe

---

## 📝 Cum să Contribui la Documentație

1. **Actualizează** documentele când faci schimbări în cod
2. **Adaugă** documente noi în folderul potrivit (`mobile/`, `backend/`, `frontend/`, `shared/`)
3. **Urmează** templateurile existente
4. **Actualizează** acest README dacă adaugi secțiuni noi

---

**Ultima actualizare structură:** 20 Ianuarie 2026
