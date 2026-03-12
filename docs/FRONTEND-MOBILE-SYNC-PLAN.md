# RIVA — Plan de Sincronizare Frontend ↔ Mobile

> **Data analizei:** 12 Martie 2026  
> **Scop:** Documentul servește drept plan și suport pentru echipa de frontend să ajungă la paritatea funcțională cu echipa de mobile.

---

## 1. REZUMAT EXECUTIV

| Metric | Mobile | Frontend (înainte) | Frontend (după sync) |
|---|---|---|---|
| **Feature modules** | 14 | 0 (flat structure) | 0 (flat, dar cu infra nouă) |
| **Screens / Pages** | ~45 | ~23 | ~23 (wizard 7-step = echiv. 7 screens) |
| **API files** | 14+ (per-feature) | 14 (centralized) | 15 (+appStatusApi) |
| **Shared components** | 24 | ~10 + shadcn/ui | ~12 + shadcn/ui (+AppStatusGate, FilterChips) |
| **Hooks** | 14+ (per-feature) | 3 | 6 (+useDebounce, useRequireAuth, useRequireVerification) |
| **Services layer** | 5 shared + per-feature | 0 | 0 (API files servesc ca servicii) |
| **State stores** | 2 (Zustand) | 1 (React Context) | 3 (AuthContext + authStore + uiStore Zustand) |
| **Navigators / Routes** | 6 stacks + tabs | File-based (Next.js) | File-based (Next.js) ✅ |
| **Infrastructure (config, utils)** | Robust | Minimal | **Robust** (constants, env, endpoints, validators, formatters) |

**Verdict (actualizat):** Fundația arhitecturală a fost aliniată — constants, env, endpoints, validators, formatters, Zustand stores, shared hooks. Property Create Wizard (7 pași cu Mapbox + KYC), AppStatusGate, messaging filter tabs, AI suggestions pe analytics sunt **implementate**. Rămân: Tutorial system, dedicated AI pages, reviews page, availability settings, search quick filters, Google OAuth, web push.

---

## 2. STAREA ACTUALĂ — CE ARE FIECARE PROIECT

### 2.1 Mobile — Arhitectură Feature-Based (FSD)

```
mobile/src/
├── app/
│   ├── navigation/      # 6 navigators (Root, Auth, Main, Discovery, Search, Profile)
│   └── providers/       # AuthProvider, QueryProvider, ThemeProvider
├── config/              # constants.ts, env.ts
├── core/
│   ├── api/             # Axios client, endpoints registry, types
│   ├── auth/            # tokenManager (SecureStore)
│   ├── stores/          # Zustand: authStore, uiStore
│   ├── storage/         # MMKV storage
│   ├── websocket/       # WebSocket core
│   ├── analytics/       # anonymousId tracking
│   └── appStatus/       # App status API
├── features/            # 14 feature modules (vezi mai jos)
├── shared/
│   ├── components/      # 24 reusable components
│   ├── hooks/           # useDebounce, useGeolocation, useRequireAuth, useRequireVerification
│   ├── services/        # 5 shared services
│   ├── styles/          # scrollViewStyles
│   ├── types/           # common types
│   └── utils/           # dateUtils, earlyAccess, formatters, validators
├── assets/              # fonts, icons, images
└── debug/               # Debug tools
```

**14 Feature Modules (fiecare cu structura api/hooks/components/screens/services):**

| # | Feature | Screens | Componente cheie |
|---|---------|---------|------------------|
| 1 | **ai** | AIChatScreen, AiConversationsListScreen, ListingAnalysisScreen, PropertyInsightsScreen | AiPropertyCard, useAiChat |
| 2 | **analytics** | PropertyAnalyticsScreen, OwnerDashboardWidget | AnalyticsChart, MetricCard, SuggestionCard |
| 3 | **auth** | LoginScreen, RegisterScreen, OTPVerificationScreen, ForgotPasswordScreen, ResetPasswordScreen, OnboardingScreen, WelcomeScreen | authApi |
| 4 | **favorites** | FavoritesListScreen, PropertyCompareScreen | FavoritesNavigator, useFavorites |
| 5 | **kyc** | — (API + hooks only) | kycApi, useKyc |
| 6 | **maps** | — (components only) | MapView, LocationPickerModal, PropertyMarker, PropertyPreviewCard |
| 7 | **messaging** | ChatScreen, ConversationsListScreen, ReportScreen | AIChatAnalysis, ChatHeader, ChatInput, ConversationItem, EmptyConversations, FilterTabs, MessageBubble, QuickActionsMenu, TypingIndicator, SocketProvider |
| 8 | **monetization** | PricingScreen, BoostPurchaseScreen | monetizationApi, usePayments, paymentService |
| 9 | **notifications** | NotificationsCenterScreen, NotificationPreferencesScreen | NotificationItem, PushNotificationsProvider |
| 10 | **profile** | ProfileScreen, EditProfileScreen, ChangePasswordScreen, SettingsScreen, NotificationSettingsScreen, PublicProfileScreen, ReviewsScreen, VerificationHubScreen, IdentityVerificationScreen, OwnershipVerificationScreen | Avatar, ProfileMenuItem, ProfileSection, RatingBadge, SettingsToggle, StatCard |
| 11 | **properties** | CreatePropertyWizard (6 steps), EditPropertyScreen, MyPropertiesScreen | AIAnalysisWidget, AmenitySelector, PhotoUploader, PropertyCard, PropertyTypeSelector, TransactionTypeToggle |
| 12 | **search** | HomeScreen, SearchResultsScreen, FiltersScreen, MapSearchScreen, SavedSearchesScreen, PropertyDetailScreen | SearchBar, FilterChips, QuickFilters |
| 13 | **tutorial** | — (overlay system) | SpotlightMask, TutorialGate, TutorialOverlay, TutorialProgress, TutorialPromptModal, TutorialTooltip, TutorialContext |
| 14 | **viewings** | ViewingsListScreen, ViewingDetailScreen, RequestViewingScreen, AvailabilitySettingsScreen | CalendarSelector, TimeSlotPicker, ViewingCard |

---

### 2.2 Frontend — Next.js App Router (Flat Structure)

```
frontend/src/
├── app/                     # Next.js App Router pages
│   ├── page.tsx             # Home (Hero, Categories, Featured)
│   ├── layout.tsx           # Root layout
│   ├── providers.tsx        # QueryClient + AuthProvider + Toaster
│   ├── auth/                # Login + Register (single page)
│   ├── verify-email/        # OTP verification
│   ├── forgot-password/     # Forgot password
│   ├── reset-password/      # Reset password
│   ├── search/              # Search + filters + map view + saved search
│   ├── property/[id]/       # Property detail (971 lines, feature-rich)
│   ├── add-property/        # Create property (single page)
│   ├── edit-property/[id]/  # Edit property
│   ├── my-properties/       # My listings + [id]/analytics
│   ├── favorites/           # Favorites list
│   ├── compare/             # Property compare
│   ├── messages/            # Messaging + [id] (WebSocket)
│   ├── ai-chat/             # AI chat
│   ├── viewings/            # Viewings list
│   ├── notifications/       # Notifications center
│   ├── profile/             # User profile
│   ├── settings/            # Settings
│   ├── user/[id]/           # Public user profile
│   ├── pricing/             # Pricing plans
│   ├── subscription/        # Subscription management
│   ├── promote/[id]/        # Promote listing
│   ├── saved-searches/      # Saved searches
│   └── not-found.tsx        # 404 page
├── components/
│   ├── CategorySection.tsx, FeaturedProperties.tsx, Footer.tsx
│   ├── HeroSection.tsx, NavLink.tsx, Navbar.tsx
│   ├── PropertyCard.tsx, PropertyMap.tsx
│   ├── ai-chat/             # 7 AI chat components
│   ├── search/              # PropertyTypeFilters
│   └── ui/                  # shadcn/ui primitives
├── contexts/
│   └── AuthContext.tsx       # Auth state (React Context)
├── hooks/
│   ├── use-mobile.tsx        # Mobile detection
│   ├── use-toast.ts          # Toast hook
│   └── useMessagingSocket.ts # WebSocket hook
└── lib/
    ├── api.ts                # Core API client + auth functions
    ├── aiApi.ts              # AI endpoints (405 lines)
    ├── propertiesApi.ts      # Properties CRUD (354 lines)
    ├── messagingApi.ts       # Messaging (224 lines)
    ├── viewingsApi.ts        # Viewings (195 lines)
    ├── favoritesApi.ts       # Favorites + lists (233 lines)
    ├── monetizationApi.ts    # Subscriptions + promotions (245 lines)
    ├── notificationsApi.ts   # Notifications (182 lines)
    ├── searchApi.ts          # Search + map (147 lines)
    ├── savedSearchesApi.ts   # Saved searches (165 lines)
    ├── userApi.ts            # User profile (184 lines)
    ├── reviewsApi.ts         # Reviews (94 lines)
    ├── earlyAccess.ts        # Early access utils (64 lines)
    └── utils.ts              # cn() utility (169 bytes)
```

---

## 3. ANALIZA GAP-URILOR — CE LIPSEȘTE FRONTEND-ULUI

### 3.1 🔴 Gap-uri CRITICE (Funcționalități lipsă complet)

| # | Feature | Mobile | Frontend | Prioritate |
|---|---------|--------|----------|------------|
| 1 | **KYC (Know Your Customer)** | `kycApi.ts` + `useKyc.ts` | ❌ Nimic | 🔴 CRITICĂ |
| 2 | **Tutorial / Onboarding System** | 6 componente + context + hooks + constants | ❌ Nimic | 🔴 CRITICĂ |
| 3 | **Verification Hub** | 3 ecrane (Hub, Identity, Ownership) | ❌ Nimic | 🔴 CRITICĂ |
| 4 | **App Status Gate** | AppStatusGate + MaintenanceScreen + UpdateRequiredScreen | ❌ Nimic | 🟡 MEDIE |
| 5 | **Onboarding / Welcome** | OnboardingScreen + WelcomeScreen | ❌ Nimic | 🟡 MEDIE |

### 3.2 🟡 Gap-uri IMPORTANTE (Funcționalități parțiale)

| # | Feature | Mobile | Frontend | Ce lipsește |
|---|---------|--------|----------|-------------|
| 1 | **Property Create Wizard** | 6-step wizard (PropertyType → Characteristics → Location → Photos → Pricing → Preview) | Single page form | Wizard multi-step, LocationPicker, PhotoUploader cu drag & reorder, Preview step, AI analysis pre-publish |
| 2 | **Profile System** | 10+ screens | 1 page (profile/) | ChangePasswordScreen, NotificationSettingsScreen, VerificationHubScreen, IdentityVerification, OwnershipVerification, ReviewsScreen |
| 3 | **Notification Preferences** | Dedicated screen cu granular toggles | API exists, no UI | Notification preferences page/dialog |
| 4 | **AI — Advanced Screens** | ListingAnalysisScreen, PropertyInsightsScreen (standalone) | Inline pe property detail | Dedicated ListingAnalysis page, PropertyInsights page |
| 5 | **Analytics — Owner Dashboard** | OwnerDashboardWidget + AnalyticsChart + MetricCard + SuggestionCard | Single analytics page under my-properties | Rich dashboard widget, chart components, suggestions |
| 6 | **Maps — Location Picker** | LocationPickerModal (reusable) | Nu are location picker | Modal/component pt selectat locație pe hartă la create/edit property |
| 7 | **Messaging — Enhanced** | AIChatAnalysis, FilterTabs, QuickActionsMenu, ReportScreen | Basic chat | Filter tabs (All/Unread/Archived), Quick actions menu, AI analysis integration, Report functionality |
| 8 | **Search — HomeScreen** | Dedicated HomeScreen cu featured, recent, categories | Combined in page.tsx | N/A (design choice for web — OK) |

### 3.3 🟢 Gap-uri ARHITECTURALE (Structura codului)

| # | Aspect | Mobile | Frontend | Recomandare |
|---|--------|--------|----------|-------------|
| 1 | **Structura proiectului** | Feature-based (FSD) | Flat / page-based | Migrare la feature-based structure |
| 2 | **State Management** | Zustand (authStore, uiStore) | React Context (AuthContext) | Adoptare Zustand sau alt state manager |
| 3 | **Centralized Constants** | `config/constants.ts` (QUERY_KEYS, VALIDATION, PROPERTY_TYPES, etc.) | Nimic — hardcoded în fiecare fișier | Creare `lib/constants.ts` |
| 4 | **Centralized Endpoints** | `core/api/endpoints.ts` (174 linii) | Endpoints inline în fiecare API file | Creare `lib/endpoints.ts` |
| 5 | **Environment Config** | `config/env.ts` (typed, centralized) | `process.env.NEXT_PUBLIC_*` scattered | Creare `lib/env.ts` |
| 6 | **Shared Types** | `core/api/types` + `shared/types` | Types inline în API files | Extrahere în `types/` sau folosire `@domaris/types` |
| 7 | **Shared Hooks** | useDebounce, useGeolocation, useRequireAuth, useRequireVerification | use-mobile, use-toast, useMessagingSocket | Creare hooks partajate |
| 8 | **Shared Services** | 5 services (ai, favorites, messaging, properties, tutorial) | 0 services | Opțional — API files servesc ca servicii |
| 9 | **Utils** | dateUtils, formatters, validators, earlyAccess | earlyAccess (portat), utils.ts (cn only) | Creare validators, formatters |
| 10 | **Anonymous Analytics** | `anonymousId.ts` | Nimic | Implementare tracking anonim |

---

## 4. FEATURE PARITY MATRIX

Legenda: ✅ Complet | 🟡 Parțial | ❌ Lipsă | ➖ N/A (platform-specific)

| Feature | Mobile | Frontend | Note |
|---------|--------|----------|------|
| **Auth — Login** | ✅ | ✅ | Frontend: pe aceeași pagină cu Register |
| **Auth — Register** | ✅ | ✅ | OK |
| **Auth — OTP Verification** | ✅ | ✅ | verify-email page |
| **Auth — Forgot Password** | ✅ | ✅ | OK |
| **Auth — Reset Password** | ✅ | ✅ | OK |
| **Auth — Onboarding** | ✅ | ❌ | Mobile: slides de prezentare |
| **Auth — Welcome** | ✅ | ❌ | Mobile: choose user type |
| **Auth — Social Login (Google)** | ✅ | 🟡 | Frontend: buton exista, funcționalitate placeholder |
| **Search — List View** | ✅ | ✅ | OK |
| **Search — Map View** | ✅ | ✅ | OK |
| **Search — Filters** | ✅ | ✅ | OK — ambele au filtre avansate |
| **Search — Autocomplete** | ✅ | ✅ | OK |
| **Search — Saved Searches** | ✅ | ✅ | OK |
| **Search — Quick Filters** | ✅ | ❌ | Mobile: QuickFilters, FilterChips |
| **Property — Detail** | ✅ | ✅ | Frontend: 971 linii, feature-rich |
| **Property — Create** | ✅ (6-step wizard) | 🟡 (single page) | Frontend: lipsă multi-step, preview |
| **Property — Edit** | ✅ | ✅ | OK |
| **Property — My Listings** | ✅ | ✅ | OK |
| **Property — Analytics** | ✅ | 🟡 | Frontend: pagină simplă; Mobile: rich dashboard |
| **Property — AI Analysis Widget** | ✅ | 🟡 | Frontend: inline collapsible; Mobile: dedicated screen |
| **Property — Photo Upload** | ✅ | 🟡 | Mobile: drag-reorder, preview; Frontend: basic upload |
| **Favorites — List** | ✅ | ✅ | OK |
| **Favorites — Compare** | ✅ | ✅ | OK (compare page) |
| **Favorites — Lists** | ✅ | ✅ | API + basic UI |
| **Messaging — Conversations** | ✅ | ✅ | OK |
| **Messaging — Chat** | ✅ | ✅ | OK, cu WebSocket |
| **Messaging — Typing Indicator** | ✅ | ✅ | OK |
| **Messaging — Archive** | ✅ | ✅ | OK |
| **Messaging — Report** | ✅ (dedicated screen) | 🟡 (doar dropdown item) | Frontend: lipsă report flow complet |
| **Messaging — Filter Tabs** | ✅ | ❌ | Mobile: All/Unread/Archived tabs |
| **Messaging — Quick Actions** | ✅ | ❌ | Mobile: predefined quick replies |
| **AI — Chat** | ✅ | ✅ | OK |
| **AI — Conversations List** | ✅ | 🟡 | Frontend: sidebar; Mobile: dedicated screen |
| **AI — Listing Analysis** | ✅ (dedicated screen) | ❌ | Frontend: nu are pagină dedicată |
| **AI — Property Insights** | ✅ (dedicated screen) | 🟡 | Frontend: inline collapsible pe property detail |
| **AI — Valuation (AVM)** | ✅ | ✅ | OK |
| **AI — Generate Description** | ✅ | ✅ | API exists |
| **Viewings — List** | ✅ | ✅ | OK |
| **Viewings — Detail** | ✅ | ❌ | Frontend: nu are viewing detail page |
| **Viewings — Request** | ✅ | ✅ | OK (inline pe property detail) |
| **Viewings — Availability Settings** | ✅ | ❌ | Mobile: owner sets available slots |
| **Notifications — Center** | ✅ | ✅ | OK |
| **Notifications — Preferences** | ✅ (dedicated screen) | ❌ | Frontend: API exists, no UI |
| **Notifications — Push Provider** | ✅ | ➖ | Web push: diferit, dar lipsă implementare |
| **Profile — View** | ✅ | ✅ | OK |
| **Profile — Edit** | ✅ | ✅ | OK |
| **Profile — Change Password** | ✅ (dedicated screen) | ❌ | Frontend: API exists, no dedicated page |
| **Profile — Settings** | ✅ (dedicated screen) | 🟡 | Frontend: settings/ page exists |
| **Profile — Public Profile** | ✅ | ✅ | OK (user/[id]) |
| **Profile — Reviews** | ✅ (dedicated screen) | 🟡 | Frontend: inline pe property detail |
| **Verification — Hub** | ✅ | ❌ | Complet lipsă |
| **Verification — Identity** | ✅ | ❌ | Complet lipsă |
| **Verification — Ownership** | ✅ | ❌ | Complet lipsă |
| **KYC** | ✅ | ❌ | Complet lipsă |
| **Tutorial System** | ✅ | ❌ | Complet lipsă |
| **Monetization — Pricing** | ✅ | ✅ | OK |
| **Monetization — Subscription** | ✅ | ✅ | OK |
| **Monetization — Boost/Promote** | ✅ | ✅ | OK |
| **Maps — Property Markers** | ✅ | ✅ | OK |
| **Maps — Location Picker** | ✅ | ❌ | Lipsă pt create/edit property |
| **Maps — Property Preview Card** | ✅ | 🟡 | Frontend: basic popup |
| **App Status — Maintenance** | ✅ | ❌ | Complet lipsă |
| **Analytics — Anonymous ID** | ✅ | ❌ | Complet lipsă |
| **Early Access** | ✅ | ✅ | Portat din mobile |

---

## 5. PLAN DE ACȚIUNE — FAZE DE IMPLEMENTARE

### FAZA 0: Fundația Arhitecturală (1-2 săptămâni)

> **Obiectiv:** Alinierea structurii frontend-ului cu pattern-urile mobile înainte de adăugarea feature-urilor.

#### 0.1 Centralized Constants & Config
- [x] Creare `frontend/src/lib/constants.ts` — ✅ DONE
- [x] Creare `frontend/src/lib/env.ts` — ✅ DONE
- [x] Creare `frontend/src/lib/endpoints.ts` — ✅ DONE
- [ ] Refactor API files să folosească endpoints centralizate

#### 0.2 Shared Types
- [ ] Creare `frontend/src/types/` directory (deferred — types rămân inline pt compatibilitate)
- [ ] Extrahere types din API files → `types/property.ts`, `types/user.ts`, etc.
- [ ] Verificare aliniere cu `@domaris/types` package

#### 0.3 State Management
- [x] Instalare `zustand` — ✅ DONE
- [x] Creare `frontend/src/stores/authStore.ts` — ✅ DONE
- [x] Creare `frontend/src/stores/uiStore.ts` — ✅ DONE
- [x] Păstrare AuthContext ca wrapper compatibil — ✅ păstrat

#### 0.4 Shared Hooks
- [x] Creare `frontend/src/hooks/useDebounce.ts` — ✅ DONE
- [x] Creare `frontend/src/hooks/useRequireAuth.ts` — ✅ DONE
- [x] Creare `frontend/src/hooks/useRequireVerification.ts` — ✅ DONE
- [ ] Creare `frontend/src/hooks/useGeolocation.ts`

#### 0.5 Shared Utils
- [x] Creare `frontend/src/lib/validators.ts` — ✅ DONE (Zod schemas: login, register, property, profile, etc.)
- [x] Creare `frontend/src/lib/formatters.ts` — ✅ DONE (price, date, text, property formatters)
- [x] `dateUtils` inclus în `formatters.ts` — ✅ DONE

---

### FAZA 1: Feature-uri Critice Lipsă (2-3 săptămâni)

#### 1.1 Verification Hub & KYC
- [x] KYC integrat în Property Create Wizard (Step 6: Ownership Verification) — ✅ DONE
- [x] Verification status badge pe Settings > Profile tab — ✅ EXISTENT
- [x] Badge "Neverificat" / "Verificare în curs" pe Preview step — ✅ DONE
- [ ] Creare `app/verification/page.tsx` — Verification Hub dedicat (enhancement viitor)
- [ ] Creare `lib/kycApi.ts` — dedicated KYC API (enhancement viitor)

#### 1.2 Tutorial / Onboarding System (Web-adapted)
- [ ] Creare `components/tutorial/TutorialOverlay.tsx` — adaptare overlay pt web
- [ ] Creare `components/tutorial/TutorialTooltip.tsx` — guided tooltip
- [ ] Creare `components/tutorial/TutorialProgress.tsx` — progress indicator
- [ ] Creare `contexts/TutorialContext.tsx` — tutorial state management
- [ ] Creare `hooks/useTutorial.ts`
- [ ] Definire tutorial steps (constants) pt web flows
- [ ] Integrare pe paginile principale (Search, Property Detail, Create Property)

#### 1.3 App Status & Maintenance
- [x] Creare `components/AppStatusGate.tsx` — ✅ DONE (fail-open, re-check on tab focus)
- [x] Maintenance screen integrat în AppStatusGate — ✅ DONE
- [x] Creare `lib/appStatusApi.ts` — ✅ DONE
- [x] Integrare în `providers.tsx` — ✅ DONE

---

### FAZA 2: Îmbunătățirea Feature-urilor Existente (2-3 săptămâni)

#### 2.1 Property Create Wizard (Multi-step)
- [x] Refactor `app/add-property/page.tsx` → wizard multi-step (7 pași) — ✅ DONE
- [x] Step 1: PropertyType + TransactionType selection — ✅ DONE (inline)
- [x] Step 2: Location cu Mapbox LocationPicker (click/drag marker) — ✅ DONE (inline)
- [x] Step 3: Characteristics (rooms, area, amenities checkboxes) — ✅ DONE (inline)
- [x] Step 4: Photos upload cu preview + primary badge — ✅ DONE (inline)
- [x] Step 5: Pricing + Title + Description — ✅ DONE (inline)
- [x] Step 6: Ownership Verification / KYC (document upload, opțional) — ✅ DONE (inline)
- [x] Step 7: Preview card cu edit shortcuts + publish — ✅ DONE (inline)
- [x] Success screen post-publish — ✅ DONE
- [x] Moldova regions/cities/neighborhoods data — ✅ DONE
- [x] Progress bar + step navigation — ✅ DONE
- [ ] Drag & reorder pe fotografii (enhancement viitor)
- [ ] AI price suggestion integration (enhancement viitor)

#### 2.2 Profile System Enhancement
- [x] Change password — ✅ EXISTENT în `app/settings/page.tsx` tab "Securitate"
- [x] Notification preferences UI — ✅ EXISTENT în `app/settings/page.tsx` tab "Notificări" (7 toggles)
- [x] Verification level badge — ✅ EXISTENT în `app/settings/page.tsx` tab "Profil"
- [x] Creare `app/profile/reviews/page.tsx` — ✅ DONE (rating summary, review cards, helpful toggle, report dialog)

#### 2.3 Analytics Dashboard Enhancement
- [x] AnalyticsChart (recharts AreaChart) — ✅ EXISTENT
- [x] MetricCard (4 stat cards cu icon + valoare) — ✅ EXISTENT
- [x] AI Suggestions section (score, recommendations, improvements cu impact badges) — ✅ DONE
- [x] Period selector (7d / 30d / all) — ✅ EXISTENT
- [ ] Creare `components/analytics/OwnerDashboardWidget.tsx` — widget pt profile page

#### 2.4 Messaging Enhancement
- [x] Adăugare filter tabs (Toate / Necitite / Arhivate) pe messages page — ✅ DONE
- [ ] Creare `components/messaging/QuickActionsMenu.tsx`
- [ ] Creare `app/messages/report/page.tsx` sau dialog component
- [ ] Integrare AI analysis insights în chat

#### 2.5 AI — Dedicated Pages
- [x] Creare `app/ai/listing-analysis/[id]/page.tsx` — ✅ DONE (scores, price check, AVM, recommendations, improvements)
- [x] Creare `app/ai/property-insights/[id]/page.tsx` — ✅ DONE (summary, highlights, concerns, AVM valuation)
- [ ] Îmbunătățire AI chat cu property card components mai avansate

#### 2.6 Viewings Enhancement
- [x] Viewings list cu filter tabs (Toate/În așteptare/Confirmate/Finalizate) — ✅ EXISTENT
- [x] Inline viewing detail (property, date, status, actions) — ✅ EXISTENT
- [x] Reschedule dialog — ✅ EXISTENT
- [x] Feedback dialog (star rating + comment + interest) — ✅ EXISTENT
- [x] Creare `app/viewings/availability/page.tsx` — ✅ DONE (weekly schedule, time slots, duration, add/remove)

---

### FAZA 3: Polish & Aliniere (1-2 săptămâni)

#### 3.1 Anonymous Analytics
- [ ] Creare `lib/anonymousId.ts` — portare din mobile
- [ ] Integrare în API client (header X-Anonymous-Id)

#### 3.2 Search Enhancements
- [x] Creare `components/search/FilterChips.tsx` — ✅ DONE (QuickFilters + ActiveFilterChips, integrat în search page)
- [ ] Îmbunătățire map popup cu PropertyPreviewCard mai detaliat

#### 3.3 Map Components
- [ ] Creare `components/map/PropertyMarker.tsx` — custom marker
- [ ] Creare `components/map/PropertyPreviewCard.tsx` — rich preview on click
- [ ] Îmbunătățire PropertyMap cu clustering support

#### 3.4 Social Login (Google)
- [ ] Implementare Google OAuth flow (butonul există, funcționalitate lipsă)
- [ ] Apple Sign-In (opțional, mai puțin relevant pt web)

#### 3.5 Web Push Notifications
- [ ] Implementare Service Worker pt push notifications
- [ ] Integrare cu existing notificationsApi

---

## 6. DEPENDENȚE SUGERATE DE ADĂUGAT

```json
{
  "zustand": "^5.0.10",
  "react-dropzone": "^14.x",
  "framer-motion": "^11.x"
}
```

- **zustand** — state management (aliniat cu mobile)
- **react-dropzone** — photo upload cu drag & drop (property wizard)
- **framer-motion** — animații pentru tutorial overlays și tranziții

> **Notă:** Restul dependențelor necesare (react-query, socket.io-client, mapbox-gl, zod, react-hook-form) sunt deja instalate.

---

## 7. API ENDPOINTS — STATUS COVERAGE

Aceste endpoint-uri din mobile's `endpoints.ts` sunt deja acoperite în frontend:

| Endpoint Group | Mobile Endpoints | Frontend Coverage |
|---|---|---|
| AUTH | 9 endpoints | ✅ 9/9 |
| USERS | 8 endpoints | ✅ 8/8 |
| PROPERTIES | 11 endpoints | ✅ 11/11 |
| SEARCH | 2 endpoints | ✅ 2/2 |
| SAVED_SEARCHES | 6 endpoints | ✅ 6/6 |
| FAVORITES | 7 endpoints | ✅ 7/7 |
| CONVERSATIONS | 8 endpoints | ✅ 8/8 |
| VIEWINGS | 7 endpoints | ✅ 7/7 |
| NOTIFICATIONS | 4 endpoints | ✅ 4/4 |
| DEVICES | 1 endpoint | ✅ 1/1 |
| AI | 12 endpoints | ✅ 12/12 |
| APP | 3 endpoints | ❌ 0/3 — AppStatus lipsă |
| ANALYTICS | 2 endpoints | ✅ 2/2 |
| MEDIA | 2 endpoints | 🟡 1/2 |
| MISC | 4 endpoints | ❌ 0/4 — locations, amenities, report |
| REVIEWS | 6 endpoints | ✅ 6/6 |
| **TOTAL** | **92** | **~85/92 (92%)** |

---

## 8. PRIORITĂȚI RECOMANDATE

### Sprint 1 (Săptămânile 1-2): Fundația
1. Constants, env config, endpoints registry
2. Zustand stores (auth + ui)
3. Shared hooks & utils
4. Shared types extraction

### Sprint 2 (Săptămânile 3-4): Feature-uri Critice
1. Verification Hub + KYC
2. Property Create Wizard (multi-step)
3. App Status Gate

### Sprint 3 (Săptămânile 5-6): Feature Enhancement
1. Profile system (change password, reviews, notification settings)
2. Messaging enhancement (filters, quick actions, report)
3. Analytics dashboard components

### Sprint 4 (Săptămânile 7-8): Polish
1. Tutorial / Onboarding system
2. AI dedicated pages
3. Viewings enhancement
4. Anonymous analytics
5. Web push notifications

---

## 9. NOTE IMPORTANTE

1. **Nu totul trebuie portat 1:1.** Web-ul are UX patterns diferite de mobile. De exemplu:
   - Mobile: bottom tabs → Web: sidebar/top nav (deja implementat)
   - Mobile: screen navigation stacks → Web: URL-based routing (deja implementat)
   - Mobile: swipe gestures → Web: hover states, dropdowns

2. **API layer-ul este cel mai aliniat.** ~92% din endpoint-uri sunt deja acoperite. Focus-ul trebuie să fie pe UI/UX.

3. **`@domaris/types` package** există dar nu pare utilizat activ. Recomandare: migrare types comune aici.

4. **Property detail page (frontend)** este deja foarte feature-rich (971 linii) — include reviews, AI valuation, booking, map, gallery. Dar este un "mega-component" care ar beneficia de extragere în sub-componente.

5. **Mobile's shared components** (24 componente) nu au echivalent direct în frontend, dar shadcn/ui acoperă multe din ele (Button, Input, Card, Badge, Checkbox, etc.). Diferența reală este la componente business-specific: PasswordStrength, OTPInput, PropertyCard (custom), ScreenHeader, etc.

---

## 10. FIȘIERE DE REFERINȚĂ PENTRU PORTARE

Când portați funcționalități din mobile → frontend, folosiți aceste fișiere ca referință:

| Ce portați | Fișier sursă (mobile) |
|---|---|
| Constants | `mobile/src/config/constants.ts` |
| Env config | `mobile/src/config/env.ts` |
| API endpoints | `mobile/src/core/api/endpoints.ts` |
| Auth store | `mobile/src/core/stores/authStore.ts` |
| Token manager | `mobile/src/core/auth/tokenManager.ts` |
| KYC API | `mobile/src/features/kyc/api/kycApi.ts` |
| KYC hook | `mobile/src/features/kyc/hooks/useKyc.ts` |
| Tutorial system | `mobile/src/features/tutorial/` (entire dir) |
| Property wizard | `mobile/src/features/properties/screens/steps/` |
| Verification screens | `mobile/src/features/profile/screens/verification/` |
| Analytics components | `mobile/src/features/analytics/components/` |
| Validators | `mobile/src/shared/utils/validators.ts` |
| Formatters | `mobile/src/shared/utils/formatters.ts` |
| Date utils | `mobile/src/shared/utils/dateUtils.ts` |
| Anonymous ID | `mobile/src/core/analytics/anonymousId.ts` |
| App status | `mobile/src/core/appStatus/appStatusApi.ts` |
