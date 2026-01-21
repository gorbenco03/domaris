# 🔄 DOMARIS - Ghid de Sincronizare Echipe

**Versiune:** 1.0.0  
**Data:** 20 Ianuarie 2026

---

## 🎯 Scop

Acest document stabilește procesele și convențiile pentru sincronizarea între echipele Backend, Frontend și Mobile în cadrul monorepo-ului Domaris/IMOBI.

---

## 📁 Structura Documentației Centralizate

```
docs/
├── PROJECT-STATUS.md          # Acest document - Status general, gap analysis
├── SYNC-GUIDE.md              # Procese de sincronizare (acest fișier)
├── shared/
│   ├── API-SPECIFICATION.md   # OpenAPI/Contract pentru TOATE echipele
│   ├── DATA-MODELS.md         # Modele de date comune (migrat din mobile)
│   ├── ENUMS.md               # Enumerări comune (roles, statuses, types)
│   └── CONVENTIONS.md         # Convenții de cod și denumire
├── mobile/                    # Documentație specifică Mobile
│   ├── features/              # (migrat din mobile/docs/features)
│   ├── architecture/          # (migrat din mobile/docs/architecture)
│   ├── security/              # (migrat din mobile/docs/security)
│   └── ui-ux/                 # (migrat din mobile/docs/ui-ux)
├── backend/
│   ├── SETUP.md               # Cum rulezi backend local
│   ├── DATABASE.md            # Schema și migrări
│   └── MODULES.md             # Documentație per modul
├── frontend/
│   ├── SETUP.md               # Cum rulezi frontend local
│   └── COMPONENTS.md          # Librărie de componente
└── status/
    └── weekly/                # Rapoarte săptămânale
```

---

## 🔧 Pașii pentru Sincronizare

### Pas 1: Unificarea Types (packages/types)

Toate interfețele TypeScript trebuie să existe într-un singur loc: `/packages/types/src/`.

**Acțiuni:**

1. **Mobile Team** exportă toate interfețele din `docs/architecture/DATA-MODELS.md` în TypeScript
2. **Backend Team** actualizează entitățile să respecte aceste interfețe
3. **Toate echipele** importă din `@domaris/types`

**Structură propusă `/packages/types/src/`:**

```typescript
// lib/user.interface.ts
export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  verificationLevel: 0 | 1 | 2 | 3;
  // ... conform DATA-MODELS.md
}

export type UserRole = 'OWNER' | 'SEEKER' | 'BOTH';

// lib/property.interface.ts
export interface IProperty {
  id: string;
  ownerId: string;
  slug: string;
  title: string;
  transactionType: TransactionType;
  propertyType: PropertyType;
  location: IPropertyLocation;
  characteristics: IPropertyCharacteristics;
  pricing: IPropertyPricing;
  media: IPropertyMedia;
  status: PropertyStatus;
  // ...
}

// lib/enums.ts
export type TransactionType = 'SALE' | 'RENT';
export type PropertyType = 'APARTMENT' | 'HOUSE' | 'STUDIO' | /* ... */;
export type PropertyStatus = 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | /* ... */;
```

### Pas 2: Aliniere Backend la Specificații

Backend trebuie să implementeze endpoint-urile din `BACKEND-API-CRUD-GUIDE.md`.

**Prioritizare Implementare:**

| Prioritate | Modul                     | Responsabil  | Status      |
| ---------- | ------------------------- | ------------ | ----------- |
| P0         | Auth Complet              | Backend Team | ✅ DONE     |
| P0         | Users CRUD                | Backend Team | ✅ DONE     |
| P0         | Properties CRUD (aliniat) | Backend Team | ✅ DONE     |
| P1         | Email/SMS Services        | Backend Team | ✅ DONE     |
| P1         | Messaging + WebSocket     | Backend Team | ✅ DONE     |
| P1         | KYC Module                | Backend Team | ✅ DONE     |
| P2         | Viewings                  | Backend Team | ✅ DONE     |
| P2         | Push Notifications        | Backend Team | ✅ DONE     |
| P1         | Search Advanced           | Backend Team | 📋 Planned  |
| P3         | AI Assistant              | Backend Team | 📋 Post-MVP |
| P3         | Analytics                 | Backend Team | ✅ DONE     |

### Pas 3: Mobile API Layer

Mobile team trebuie să creeze un strat de servicii API.

**Structură sugerată:**

```
mobile/src/
├── services/
│   ├── api/
│   │   ├── client.ts          # Axios/Fetch config
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── property.service.ts
│   │   ├── search.service.ts
│   │   ├── messaging.service.ts
│   │   ├── favorites.service.ts
│   │   ├── viewings.service.ts
│   │   └── notifications.service.ts
│   └── index.ts
├── store/                      # Redux sau Zustand
│   ├── slices/
│   └── hooks/
└── config/
    └── env.ts                  # API_URL, etc.
```

---

## 📋 Convenții de Denumire

### API Endpoints

- Folosim **kebab-case** pentru URL-uri: `/user-profile`, `/property-listings`
- Folosim **camelCase** pentru body JSON: `{ firstName, lastName }`
- Toate endpoint-urile încep cu `/api/v1/`

### Base URL-uri

| Environment | URL                                     |
| ----------- | --------------------------------------- |
| Development | `http://localhost:3000/api/v1`          |
| Staging     | `https://staging-api.domaris.ro/api/v1` |
| Production  | `https://api.domaris.ro/api/v1`         |

### Response Format

**Success:**

```json
{
  "data": {
    /* payload */
  },
  "meta": {
    /* optional pagination, etc */
  }
}
```

**Error:**

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {
      /* optional field-level errors */
    }
  }
}
```

### Enums Standardizate

Folosim UPPERCASE cu underscore pentru toate enum-urile:

```typescript
// ✅ Corect
type UserRole = 'OWNER' | 'SEEKER' | 'BOTH';
type PropertyType = 'APARTMENT' | 'HOUSE' | 'STUDIO';
type PropertyStatus = 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE';

// ❌ Greșit (de migrat în backend)
type UserRole = 'tenant' | 'landlord' | 'admin'; // -> 'SEEKER' | 'OWNER' | 'ADMIN'
```

---

## 🔀 Workflow Git

### Branch Strategy

```
main                    # Producție
├── develop             # Development integration
├── feature/mobile-*    # Features mobile
├── feature/backend-*   # Features backend
├── feature/frontend-*  # Features frontend
├── feature/shared-*    # Changes în packages/
└── hotfix/*            # Urgent fixes
```

### Commit Conventions

Folosim [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

feat(mobile): implement chat screen UI
fix(backend): correct user validation
docs(shared): add API specification
refactor(types): align property interfaces
```

**Scopes:** `mobile`, `backend`, `frontend`, `types`, `docs`, `config`

### PR Requirements

- [ ] Toate testele trec
- [ ] Lint fără erori
- [ ] Types actualizate în `/packages/types/` dacă e cazul
- [ ] Documentație actualizată
- [ ] Review de la cel puțin 1 persoană din echipa afectată

---

## 📅 Sync Meetings

### Weekly Sync (Recomandare)

**Când:** Luni, 10:00  
**Cine:** Tech Leads de la fiecare echipă  
**Durată:** 30 min

**Agenda:**

1. Ce s-a finalizat săptămâna trecută
2. Ce este în lucru
3. Blockers / Dependențe între echipe
4. Alineere pe priorities

### API Design Reviews

**Când:** Ad-hoc, când se adaugă features noi  
**Cine:** Backend + Mobile/Frontend  
**Durată:** 15-30 min

**Scop:**

- Review contract înainte de implementare
- Aliniere pe edge cases
- Actualizare `docs/shared/API-SPECIFICATION.md`

---

## ✅ Checklist pentru Features Noi

Înainte de a începe o feature nouă:

### Backend

- [ ] Endpoint-ul este documentat în `API-SPECIFICATION.md`
- [ ] Types/interfaces sunt în `packages/types`
- [ ] Request/Response DTOs respectă convențiile
- [ ] Swagger annotations adăugate

### Mobile

- [ ] UI mockup/design aprobat
- [ ] Endpoint-ul backend este implementat (sau mock agreeat)
- [ ] Componente folosesc Design System
- [ ] Screens sunt documentate în `docs/mobile/features/`

### Frontend

- [ ] Endpoint-ul backend este implementat
- [ ] Componente reutilizabile unde posibil
- [ ] Responsive design verificat

---

## 🔗 Resurse Utile

- **Monorepo:** `/Users/kirill/domaris`
- **Backend API Docs:** `http://localhost:3000/api` (Swagger)
- **Mobile Docs:** `/mobile/docs/` (și `/docs/mobile/`)
- **Design System:** `/mobile/docs/ui-ux/DESIGN-SYSTEM.md`

---

**Document creat de:** CTO Review  
**Responsabil actualizare:** Tech Leads  
**Următoarea revizuire:** După implementare Sprint 1
