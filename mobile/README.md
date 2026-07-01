# RIVA - Platforma Imobiliară Direct de la Proprietari

Aplicație mobilă React Native/Expo pentru conectarea directă a proprietarilor cu potențialii cumpărători sau chiriași.

## Acțiuni necesare înainte de primul build production

### 1. Mapbox Download Token (SECRET — nu se comite niciodată)

Tokenul `sk.*` Mapbox trebuie setat ca EAS secret, nu în cod sau git:

```bash
eas secret:create --scope project --name RNMAPBOX_DOWNLOAD_TOKEN --value "sk.<YOUR_MAPBOX_SECRET_DOWNLOAD_TOKEN>"
```

Tokenul public `pk.*` este deja setat în `eas.json` sub `EXPO_PUBLIC_MAPBOX_TOKEN`.

### 2. google-services.json (FCM / Android push notifications)

Descarcă `google-services.json` din Firebase Console (proiectul asociat pachetului `ro.riva.app`) și plaseaz-o la rădăcina `mobile/`:

```
mobile/google-services.json
```

`app.json` conține deja `android.googleServicesFile: "./google-services.json"`.

### 3. APNs (iOS push notifications production)

La build-ul production EAS, entitlement-ul `aps-environment=production` este setat automat dacă profilul de distribuție este corect configurat în Apple Developer Portal pentru bundle ID `ro.riva.app`.

### 4. Icoane (trebuie regenerate)

- `assets/icon.png` (1024x1024) — trebuie sa fie FARA canal alpha (PNG RGB, nu RGBA). App Store respinge iconițele cu transparență. Regenerează cu un tool grafic (Figma, Sketch) exportând ca PNG fara transparenta.
- `assets/notification-icon.png` — trebuie sa fie silhouette alb pe fundal transparent (cerință Android Material). Verifică că este o imagine albă cu alpha.

### 5. App Store Connect / Google Play

Completează `submit.production` în `eas.json`:

**iOS:**
```json
"ios": {
  "appleId": "apple-id@exemplu.com",
  "ascAppId": "1234567890",
  "appleTeamId": "ABCDE12345"
}
```

**Android:**
```json
"android": {
  "serviceAccountKeyPath": "./pc-api-key.json",
  "track": "internal"
}
```

### 6. Monetizare (v1 OFF)

Monetizarea este dezactivata implicit (`EXPO_PUBLIC_MONETIZATION_ENABLED=false` în toate profilele din `eas.json`). Când ești gata să activezi IAP, seteaza valoarea la `"true"` în profilul de production.

### 7. URL-uri producție

Actualizează în `eas.json` → `build.production.env`:
- `EXPO_PUBLIC_API_URL` — URL-ul HTTPS al backend-ului production
- `EXPO_PUBLIC_WS_URL` — URL-ul WSS al backend-ului production

## 📱 Descriere

RIVA elimină intermediarii din piața imobiliară, oferind:

- **Zero comisioane de agenție**
- **Comunicare directă proprietar-client**
- **Transparență totală**
- **Asistent AI Inteligent** pentru căutare și analiză

## 🛠️ Stack Tehnologic

| Categorie            | Tehnologie                       |
| -------------------- | -------------------------------- |
| **Framework**        | React Native + Expo SDK 50+      |
| **Language**         | TypeScript                       |
| **State Management** | React Query (TanStack) + Zustand |
| **Navigation**       | React Navigation 6               |
| **Forms**            | React Hook Form + Zod            |
| **Storage**          | MMKV + Expo Secure Store         |
| **UI**               | Custom Design System             |

## 📁 Structura Proiectului

```
src/
├── app/                      # Entry point, providers, navigation
│   ├── navigation/           # Navigators (Root, Auth, Main)
│   └── providers/            # Context providers (Auth, Theme, Query)
│
├── features/                 # Feature-based modules
│   ├── auth/                 # Autentificare
│   ├── properties/           # Proprietăți
│   ├── search/               # Căutare
│   ├── messaging/            # Mesagerie
│   ├── viewings/             # Vizionări
│   ├── favorites/            # Favorite
│   ├── profile/              # Profil
│   ├── notifications/        # Notificări
│   └── ai/                   # Asistent AI
│
├── shared/                   # Resurse partajate
│   ├── components/           # Componente UI reutilizabile
│   ├── hooks/                # Custom hooks
│   ├── utils/                # Utilități (formatters, validators)
│   └── types/                # Tipuri TypeScript comune
│
├── core/                     # Core infrastructure
│   ├── api/                  # API client și endpoints
│   ├── storage/              # MMKV storage
│   ├── auth/                 # Token management
│   ├── stores/               # Zustand stores
│   └── websocket/            # WebSocket client
│
├── assets/                   # Static assets
│   ├── images/
│   ├── fonts/                # Inter font family
│   └── icons/
│
└── config/                   # Configuration
    ├── theme.ts              # Design system tokens
    ├── constants.ts          # App constants
    └── env.ts                # Environment config
```

## 🚀 Comenzi

### Development

```bash
# Instalare dependențe
npm install

# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

### Production Build (EAS)

```bash
# Build pentru toate platformele
eas build --platform all --profile production

# Submit la stores
eas submit --platform ios
eas submit --platform android
```

## 🎨 Design System

Design system complet definit în `src/config/theme.ts`:

- **Culori primare**: Deep Navy (#1E3A5F), Emerald (#10B981)
- **Font**: Inter (Regular, Medium, SemiBold, Bold)
- **Spacing**: 8pt grid system
- **Border Radius**: 4px - 24px scale
- **Shadows**: Soft diffusion style

## 📄 Documentație

- [Project Overview](./docs/00-PROJECT-OVERVIEW.md)
- [Mobile Architecture](./docs/architecture/MOBILE-ARCHITECTURE.md)
- [Design System](./docs/ui-ux/DESIGN-SYSTEM.md)

## 🔐 Environment Variables

Copiază `.env.example` în `.env` și completează valorile:

```bash
cp .env.example .env
```

## ✅ Setup Completat

- [x] Expo + TypeScript setup
- [x] Path aliases (@/...)
- [x] Design System tokens
- [x] Navigation structure
- [x] Auth flow setup
- [x] Zustand stores
- [x] React Query provider
- [x] API client cu interceptors
- [x] Token management
- [x] Form validation schemas
- [x] Utility functions
- [x] Custom hooks0
- [x] Inter font loaded

## 📝 Next Steps

1. Implementează ecranele de autentificare
2. Creează componentele UI de bază (Button, Input, Card)
3. Implementează serviciile API
4. Adaugă ecranele principale

---

**Creat cu ❤️ pentru RIVA**
