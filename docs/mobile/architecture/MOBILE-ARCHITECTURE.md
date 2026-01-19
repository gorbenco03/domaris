# 📱 Arhitectura Aplicației Mobile

**Versiune:** 1.0.0  
**Data:** Ianuarie 2026

---

## 🏗️ Overview Arhitectură

### Pattern: Clean Architecture + MVVM

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    UI Components                     │    │
│  │     Screens, Components, Navigation, Themes         │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   ViewModels/Hooks                   │    │
│  │        State Management, Business Logic UI          │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                      DOMAIN LAYER                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    Use Cases                         │    │
│  │          Application Business Logic                  │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                     Entities                         │    │
│  │              Core Business Objects                   │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                       DATA LAYER                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  Repositories                        │    │
│  │       Data Access Abstraction, Caching              │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌────────────────────┐  ┌─────────────────────────────┐    │
│  │    Remote Data     │  │      Local Data             │    │
│  │    API Services    │  │   SQLite, Secure Storage    │    │
│  └────────────────────┘  └─────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Structura Folderelor

```
src/
├── app/                      # App entry, providers, navigation
│   ├── App.tsx
│   ├── navigation/
│   │   ├── RootNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   ├── MainNavigator.tsx
│   │   └── types.ts
│   └── providers/
│       ├── AuthProvider.tsx
│       ├── ThemeProvider.tsx
│       └── QueryProvider.tsx
│
├── features/                 # Feature-based modules
│   ├── auth/
│   │   ├── screens/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── RegisterScreen.tsx
│   │   │   └── ForgotPasswordScreen.tsx
│   │   ├── components/
│   │   ├── hooks/
│   │   │   ├── useLogin.ts
│   │   │   └── useRegister.ts
│   │   ├── services/
│   │   │   └── authService.ts
│   │   └── types.ts
│   │
│   ├── properties/
│   │   ├── screens/
│   │   │   ├── PropertyListScreen.tsx
│   │   │   ├── PropertyDetailScreen.tsx
│   │   │   └── CreatePropertyScreen.tsx
│   │   ├── components/
│   │   │   ├── PropertyCard.tsx
│   │   │   ├── PropertyFilters.tsx
│   │   │   └── PhotoGallery.tsx
│   │   ├── hooks/
│   │   │   ├── useProperties.ts
│   │   │   ├── usePropertyDetail.ts
│   │   │   └── useCreateProperty.ts
│   │   └── services/
│   │       └── propertyService.ts
│   │
│   ├── search/
│   ├── messaging/
│   ├── viewings/
│   ├── favorites/
│   ├── profile/
│   ├── notifications/
│   └── ai/                    # 🤖 AI Assistant Module
│       ├── screens/
│       │   ├── AIChatScreen.tsx
│       │   └── AIAnalysisScreen.tsx
│       ├── components/
│       │   ├── ChatBubble.tsx
│       │   ├── PropertySuggestionCard.tsx
│       │   ├── AnalysisWidget.tsx
│       │   ├── PriceSuggestion.tsx
│       │   └── DescriptionGenerator.tsx
│       ├── hooks/
│       │   ├── useAIChat.ts
│       │   ├── useAIStream.ts
│       │   ├── useListingAnalysis.ts
│       │   └── useDescriptionGenerator.ts
│       ├── services/
│       │   └── aiService.ts
│       └── types.ts
│
├── shared/                   # Shared utilities
│   ├── components/           # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── Modal.tsx
│   ├── hooks/                # Shared hooks
│   │   ├── useDebounce.ts
│   │   └── useGeolocation.ts
│   ├── utils/                # Utilities
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── constants.ts
│   └── types/                # Shared types
│       └── common.ts
│
├── core/                     # Core infrastructure
│   ├── api/
│   │   ├── client.ts         # Axios/Fetch config
│   │   ├── interceptors.ts
│   │   └── endpoints.ts
│   ├── storage/
│   │   ├── secureStorage.ts
│   │   └── mmkvStorage.ts
│   ├── auth/
│   │   ├── tokenManager.ts
│   │   └── authContext.ts
│   └── websocket/
│       └── wsClient.ts
│
├── assets/                   # Static assets
│   ├── images/
│   ├── fonts/
│   └── icons/
│
└── config/                   # Configuration
    ├── env.ts
    └── constants.ts
```

---

## 🔧 Stack Tehnologic

### Core

| Teknologie   | Scop                 | Versiune |
| ------------ | -------------------- | -------- |
| React Native | Framework            | 0.73+    |
| TypeScript   | Type safety          | 5.0+     |
| Expo         | Build & Distribution | SDK 50+  |

### State Management

| Teknologie             | Scop                  |
| ---------------------- | --------------------- |
| React Query (TanStack) | Server state, caching |
| Zustand                | Client state          |
| React Context          | Auth, Theme           |

### Navigation

| Teknologie         | Scop         |
| ------------------ | ------------ |
| React Navigation 6 | Routing      |
| Deep Linking       | URL handling |

### Forms

| Teknologie      | Scop       |
| --------------- | ---------- |
| React Hook Form | Form state |
| Zod             | Validation |

### UI

| Teknologie                   | Scop                |
| ---------------------------- | ------------------- |
| React Native Paper           | Material components |
| React Native Reanimated      | Animations          |
| React Native Gesture Handler | Gestures            |

### Networking

| Teknologie       | Scop        |
| ---------------- | ----------- |
| Axios            | HTTP client |
| Socket.IO Client | WebSocket   |

### Storage

| Teknologie            | Scop           |
| --------------------- | -------------- |
| MMKV                  | Fast key-value |
| React Native Keychain | Secure storage |

### Media

| Teknologie                | Scop           |
| ------------------------- | -------------- |
| React Native Image Picker | Camera/Gallery |
| React Native Fast Image   | Image caching  |

### Maps

| Teknologie        | Scop              |
| ----------------- | ----------------- |
| React Native Maps | Google/Apple Maps |

### Push

| Teknologie            | Scop                |
| --------------------- | ------------------- |
| React Native Firebase | FCM                 |
| Expo Notifications    | Local notifications |

---

## 🔄 Data Flow

### Query Flow (Read)

```
Screen → useQuery Hook → API Service → Axios → Backend
                ↓
            Cache (React Query)
                ↓
            Screen Update
```

### Mutation Flow (Write)

```
User Action → Form Validation → useMutation Hook
                                      ↓
                              API Service → Backend
                                      ↓
                              Invalidate Queries
                                      ↓
                              Optimistic Update
```

### Offline Flow

```
User Action → Check Network
                 ↓
         ┌──────┴──────┐
         ↓             ↓
      Online        Offline
         ↓             ↓
      API Call     Queue Action
         ↓             ↓
      Success      Store Local
         ↓             ↓
      Update       Sync on Reconnect
```

---

## 🔐 Gestionare Autentificare

```typescript
// core/auth/tokenManager.ts
interface TokenManager {
  getAccessToken(): Promise<string | null>;
  getRefreshToken(): Promise<string | null>;
  setTokens(access: string, refresh: string): Promise<void>;
  clearTokens(): Promise<void>;
  isTokenExpired(token: string): boolean;
  refreshTokens(): Promise<boolean>;
}

// Axios interceptor pentru auto-refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshed = await tokenManager.refreshTokens();
      if (refreshed) {
        // Retry original request
        return api(error.config);
      } else {
        // Logout user
        authStore.logout();
      }
    }
    return Promise.reject(error);
  },
);
```

---

## 📊 State Management Strategy

### Server State (React Query)

```typescript
// features/properties/hooks/useProperties.ts
export const useProperties = (filters: PropertyFilters) => {
  return useQuery({
    queryKey: ["properties", filters],
    queryFn: () => propertyService.getProperties(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });
};
```

### Client State (Zustand)

```typescript
// core/stores/uiStore.ts
interface UIState {
  theme: "light" | "dark" | "system";
  language: "ro" | "en";
  setTheme: (theme: Theme) => void;
  setLanguage: (lang: Language) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: "system",
      language: "ro",
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: "ui-storage",
      storage: createMMKVStorage(),
    },
  ),
);
```

---

## 🧪 Testing Strategy

| Tip             | Tool                         | Coverage Target |
| --------------- | ---------------------------- | --------------- |
| Unit Tests      | Jest                         | 80%+            |
| Component Tests | React Native Testing Library | Key flows       |
| E2E Tests       | Detox                        | Critical paths  |
| API Mocking     | MSW                          | All endpoints   |

---

## 📦 Build & Distribution

### Development

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

### Production (EAS Build)

```bash
# Build for stores
eas build --platform all --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

---

**Document Status:** Draft  
**Ultima actualizare:** Ianuarie 2026
