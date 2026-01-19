# 🏠 IMOBI - Platforma Imobiliară Direct de la Proprietari

Aplicație mobilă React Native/Expo pentru conectarea directă a proprietarilor cu potențialii cumpărători sau chiriași.

## 📱 Descriere

IMOBI elimină intermediarii din piața imobiliară, oferind:

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

**Creat cu ❤️ pentru IMOBI**
