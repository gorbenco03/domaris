# 🔐 Feature: Autentificare și Înregistrare

**ID Feature:** AUTH-001  
**Prioritate:** P0 - Critical  
**Estimare:** 2-3 săptămâni  
**Dependențe:** Backend Auth API

---

## 📋 Cuprins

1. [Descriere Generală](#descriere-generală)
2. [User Stories](#user-stories)
3. [Fluxuri Utilizator](#fluxuri-utilizator)
4. [Cerințe Funcționale](#cerințe-funcționale)
5. [Cerințe Non-Funcționale](#cerințe-non-funcționale)
6. [Specificații Tehnice](#specificații-tehnice)
7. [Securitate](#securitate)
8. [UI/UX Guidelines](#uiux-guidelines)
9. [Edge Cases & Error Handling](#edge-cases--error-handling)
10. [Criterii de Acceptanță](#criterii-de-acceptanță)
11. [API Endpoints Necesare](#api-endpoints-necesare)

---

## 📝 Descriere Generală

Sistemul de autentificare reprezintă poarta de intrare în aplicația IMOBI. Trebuie să fie **simplu**, **sigur** și **fără fricțiuni** pentru a maximiza rata de conversie la înregistrare.

### Obiective

- Timp de înregistrare: **< 60 secunde**
- Rata de abandon la înregistrare: **< 20%**
- Securitate: **Nivel enterprise**

---

## 👤 User Stories

### Înregistrare

```
US-AUTH-001: Ca utilizator nou, vreau să mă înregistrez cu emailul meu
pentru a-mi crea un cont în aplicație.

US-AUTH-002: Ca utilizator nou, vreau să mă înregistrez cu numărul de telefon
pentru a avea acces rapid fără parolă.

US-AUTH-003: Ca utilizator nou, vreau să mă înregistrez cu contul Google/Apple
pentru a economisi timp și a evita crearea unei noi parole.

US-AUTH-004: Ca utilizator nou, vreau să aleg tipul de cont (Proprietar/Căutător)
pentru a avea o experiență personalizată.

US-AUTH-005: Ca utilizator, vreau să primesc confirmare pe email/SMS
pentru a-mi verifica identitatea.
```

### Autentificare

```
US-AUTH-010: Ca utilizator existent, vreau să mă autentific cu email și parolă
pentru a accesa contul meu.

US-AUTH-011: Ca utilizator existent, vreau să mă autentific cu amprentă/Face ID
pentru acces rapid și sigur.

US-AUTH-012: Ca utilizator existent, vreau să rămân autentificat
pentru a nu introduce credențiale la fiecare deschidere.

US-AUTH-013: Ca utilizator, vreau să pot schimba între contul de Proprietar și Căutător
pentru a avea acces la ambele funcționalități.
```

### Recuperare Parolă

```
US-AUTH-020: Ca utilizator, vreau să pot reseta parola uitată
pentru a recăpăta accesul la cont.

US-AUTH-021: Ca utilizator, vreau să primesc un link/cod de resetare pe email
pentru a confirma că sunt proprietarul contului.

US-AUTH-022: Ca utilizator, vreau să pot seta o parolă nouă sigură
pentru a-mi proteja contul.
```

---

## 🔄 Fluxuri Utilizator

### Flux 1: Înregistrare cu Email

```
┌─────────────────┐
│  Welcome Screen │
│  [Înregistrare] │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Alege metoda:   │
│ • Email         │
│ • Telefon       │
│ • Google        │
│ • Apple         │
└────────┬────────┘
         │ (Email)
         ▼
┌─────────────────┐
│ Formular:       │
│ • Email         │
│ • Parolă        │
│ • Confirmare    │
│ • Accept T&C    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Alege tip cont: │
│ • Proprietar    │
│ • Căutător      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Email trimis!   │
│ Verifică inbox  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Confirmă email  │
│ (click pe link) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Cont creat! 🎉  │
│ → Onboarding    │
└─────────────────┘
```

### Flux 2: Înregistrare cu Telefon (OTP)

```
┌─────────────────┐
│ Introdu telefon │
│ +40 7XX XXX XXX │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Trimite cod SMS │
│ ████ ████       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Introdu cod OTP │
│ [_][_][_][_]    │
│ Retrimite: 45s  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Alege tip cont  │
│ + Setări bază   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Cont creat! 🎉  │
└─────────────────┘
```

### Flux 3: Login cu Biometrics

```
┌─────────────────┐
│  Welcome Back   │
│                 │
│   [Face ID]     │
│       sau       │
│ [Login manual]  │
└────────┬────────┘
         │ (Face ID)
         ▼
┌─────────────────┐
│ Verificare      │
│ biometrică...   │
└────────┬────────┘
         │ ✓
         ▼
┌─────────────────┐
│   Home Screen   │
│   (logged in)   │
└─────────────────┘
```

### Flux 4: Recuperare Parolă

```
┌─────────────────┐
│ Am uitat parola │
│ [Email: ____]   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Email trimis!   │
│ Verifică inbox  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Parolă nouă:    │
│ [________]      │
│ Confirmă:       │
│ [________]      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Parolă schimbată│
│ → Login         │
└─────────────────┘
```

---

## ✅ Cerințe Funcționale

### RF-AUTH-001: Înregistrare Email

- **Input:** Email, Parolă, Confirmare parolă
- **Validări:**
  - Email format valid (RFC 5322)
  - Parolă min 8 caractere, 1 majusculă, 1 cifră, 1 special
  - Parole identice
- **Output:** Cont creat, email confirmare trimis

### RF-AUTH-002: Înregistrare Telefon

- **Input:** Număr telefon format internațional
- **Validări:**
  - Format valid (+40, +373, etc.)
  - Număr unic în sistem
- **Output:** SMS cu cod OTP (6 cifre), validitate 5 minute

### RF-AUTH-003: OAuth Social Login

- **Provideri suportați:**
  - Google Sign-In
  - Apple Sign-In (obligatoriu pentru iOS)
  - Facebook Login (opțional)
- **Date preluate:** Email, Nume, Avatar URL
- **Comportament:**
  - Cont nou dacă email inexistent
  - Login automat dacă email existent + linked
  - Prompt linking dacă email existent fără link

### RF-AUTH-004: Tip Cont

- **Opțiuni:**
  - `OWNER` - Proprietar
  - `SEEKER` - Căutător
- **Comportament:**
  - Selectat la înregistrare
  - Poate fi schimbat ulterior din setări
  - Ambele roluri pot fi active simultan

### RF-AUTH-005: Verificare Email

- **Mecanism:** Link magic cu token unic
- **Expirare:** 24 ore
- **Retry:** Max 3 emailuri/oră

### RF-AUTH-006: Login Standard

- **Input:** Email/Telefon + Parolă
- **Output:** Access token + Refresh token
- **Comportament:**
  - Blocare cont după 5 încercări eșuate (15 min)
  - Notificare pe email la login suspect

### RF-AUTH-007: Biometric Login

- **Suport:**
  - iOS: Face ID, Touch ID
  - Android: Fingerprint, Face Unlock
- **Cerințe:**
  - Activare explicită din setări
  - Fallback pe PIN/parolă
  - Re-autentificare periodică (7 zile)

### RF-AUTH-008: Remember Me

- **Comportament:**
  - Token refresh automat
  - Sesiune activă 30 zile fără activitate
  - Logout automat la securitate compromisă

### RF-AUTH-009: Logout

- **Comportament:**
  - Invalidare token server-side
  - Ștergere date locale sensibile
  - Păstrare preferințe nesensibile

### RF-AUTH-010: Resetare Parolă

- **Flux email:** Link magic cu token
- **Flux telefon:** Cod OTP
- **Validări:** Parolă nouă diferită de ultimele 3

---

## 📊 Cerințe Non-Funcționale

### Performanță

| Metrică                  | Target  |
| ------------------------ | ------- |
| Timp răspuns login       | < 500ms |
| Timp trimitere OTP       | < 3s    |
| Timp validare biometrics | < 1s    |

### Disponibilitate

| Metrică             | Target |
| ------------------- | ------ |
| Uptime auth service | 99.99% |
| Fallback disponibil | Da     |

### Scalabilitate

| Metrică           | Target      |
| ----------------- | ----------- |
| Concurrent logins | 10,000/min  |
| Rate limit per IP | 100 req/min |

---

## ⚙️ Specificații Tehnice

### Token Management

```typescript
interface AuthTokens {
  accessToken: string; // JWT, exp: 15 min
  refreshToken: string; // Opaque, exp: 30 zile
  tokenType: "Bearer";
  expiresIn: number; // seconds
}

interface JWTPayload {
  sub: string; // User ID
  email: string;
  roles: ("OWNER" | "SEEKER")[];
  emailVerified: boolean;
  phoneVerified: boolean;
  iat: number;
  exp: number;
}
```

### Stocare Securizată

```typescript
// iOS: Keychain, Android: Keystore
// Library: react-native-keychain

interface SecureStorage {
  // Tokens
  setTokens(tokens: AuthTokens): Promise<void>;
  getTokens(): Promise<AuthTokens | null>;
  clearTokens(): Promise<void>;

  // Biometrics
  setBiometricEnabled(enabled: boolean): Promise<void>;
  authenticateWithBiometrics(): Promise<boolean>;
}
```

### State Management

```typescript
interface AuthState {
  // Status
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  // User
  user: User | null;
  roles: UserRole[];

  // Tokens (în memorie, nu în state persistent!)
  accessToken: string | null;

  // Errors
  error: AuthError | null;
}

type AuthAction =
  | { type: "LOGIN_START" }
  | { type: "LOGIN_SUCCESS"; payload: { user: User; tokens: AuthTokens } }
  | { type: "LOGIN_FAILURE"; payload: AuthError }
  | { type: "LOGOUT" }
  | { type: "TOKEN_REFRESH"; payload: AuthTokens }
  | { type: "SESSION_EXPIRED" };
```

### Validare Formular

```typescript
import { z } from "zod";

const emailSchema = z
  .string()
  .email("Email invalid")
  .max(255, "Email prea lung");

const passwordSchema = z
  .string()
  .min(8, "Minim 8 caractere")
  .regex(/[A-Z]/, "Minim o majusculă")
  .regex(/[0-9]/, "Minim o cifră")
  .regex(/[!@#$%^&*]/, "Minim un caracter special");

const phoneSchema = z
  .string()
  .regex(/^\+[1-9]\d{1,14}$/, "Format telefon invalid");

const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: "Trebuie să accepți termenii" }),
    }),
    userType: z.enum(["OWNER", "SEEKER"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Parolele nu coincid",
    path: ["confirmPassword"],
  });
```

---

## 🔒 Securitate

### Must Have

- [x] HTTPS/TLS 1.3 pentru toate request-urile
- [x] Certificate Pinning
- [x] Tokens stocate în Keychain/Keystore
- [x] Password hashing server-side (bcrypt/argon2)
- [x] Rate limiting pe endpoints auth
- [x] Brute force protection
- [x] Secure session invalidation

### Should Have

- [ ] CAPTCHA/reCAPTCHA pe înregistrare
- [ ] Device fingerprinting
- [ ] Login anomaly detection
- [ ] Notificări pe login de pe device nou

### Vulnerabilități de Evitat

| Vulnerabilitate   | Mitigare                  |
| ----------------- | ------------------------- |
| SQL Injection     | Parametrized queries, ORM |
| XSS               | Sanitizare input, CSP     |
| CSRF              | SameSite cookies, tokens  |
| Session Hijacking | Secure tokens, HTTPS      |
| Brute Force       | Rate limiting, lockout    |

---

## 🎨 UI/UX Guidelines

### Design Principles

1. **Simplicitate** - Minim câmpuri, maxim claritate
2. **Feedback Instant** - Validare în timp real
3. **Progres Vizibil** - Indicatori de etape
4. **Error Recovery** - Erori clare cu acțiuni

### Screen Requirements

#### Welcome Screen

- Logo IMOBI prominent
- Tagline motivațional
- 2 CTA-uri principale: [Înregistrare] [Am cont]
- Social login buttons (vizibile dar secundare)
- Link T&C discret

#### Register Screen

- Progress indicator (Step 1/3)
- Câmpuri cu label deasupra
- Password strength indicator
- Checkbox T&C cu link
- CTA "Continuă" full-width

#### Login Screen

- Câmpuri pentru email/telefon și parolă
- Toggle vizibilitate parolă
- "Am uitat parola" link
- "Remember me" checkbox
- Opțiuni biometrics (dacă disponibile)
- Social login alternativ

### Error Messages

```
Email:
  - "Acest email nu este valid"
  - "Există deja un cont cu acest email"

Parolă:
  - "Parola trebuie să aibă minim 8 caractere"
  - "Adaugă cel puțin o literă mare"
  - "Adaugă cel puțin o cifră"

Login:
  - "Email sau parolă incorectă"
  - "Contul este temporar blocat. Încearcă din nou în 15 minute."

OTP:
  - "Cod incorect. Mai ai 2 încercări."
  - "Cod expirat. Solicită un nou cod."
```

---

## ⚠️ Edge Cases & Error Handling

### Scenarii Edge Cases

| Scenariu                 | Comportament                    |
| ------------------------ | ------------------------------- |
| Email existent (social)  | Prompt pentru linking conturi   |
| Telefon deja înregistrat | Eroare + sugestie login         |
| OTP expirat              | Buton retrimite activ automat   |
| Biometrics indisponibil  | Fallback pe PIN/parolă          |
| Offline la login         | Eroare + queue pentru retry     |
| Token refresh fail       | Logout cu păstrare draft-uri    |
| Account locked           | Countdown + opțiune email reset |
| MFA device pierdut       | Recovery codes + suport         |

### Error Handling Strategy

```typescript
enum AuthErrorCode {
  INVALID_CREDENTIALS = "AUTH_001",
  EMAIL_EXISTS = "AUTH_002",
  PHONE_EXISTS = "AUTH_003",
  ACCOUNT_LOCKED = "AUTH_004",
  EMAIL_NOT_VERIFIED = "AUTH_005",
  TOKEN_EXPIRED = "AUTH_006",
  TOKEN_INVALID = "AUTH_007",
  RATE_LIMITED = "AUTH_008",
  OTP_INVALID = "AUTH_009",
  OTP_EXPIRED = "AUTH_010",
  SOCIAL_AUTH_FAILED = "AUTH_011",
  NETWORK_ERROR = "AUTH_999",
}

interface AuthError {
  code: AuthErrorCode;
  message: string;
  details?: Record<string, string>;
  retryAfter?: number; // seconds (for rate limiting)
}
```

---

## ✅ Criterii de Acceptanță

### AC-AUTH-001: Înregistrare Email

- [x] User poate introduce email și parolă
- [x] Validare în timp real a formularului
- [x] Email de confirmare trimis în < 5 secunde
- [x] Link de confirmare funcțional 24h
- [x] Contul este creat și verificat după click

### AC-AUTH-002: Înregistrare Telefon

- [x] User poate introduce număr format internațional
- [x] SMS OTP primit în < 30 secunde
- [x] OTP validat corect
- [x] Retry disponibil după 60 secunde

### AC-AUTH-003: OAuth Login

- [x] Google Sign-In funcțional
- [x] Apple Sign-In funcțional pe iOS
- [x] Linking automat dacă email există
- [x] Avatar sincronizat de la provider

### AC-AUTH-004: Login Standard

- [x] Login cu email sau telefon
- [x] "Remember me" funcțional
- [x] Error messages clare
- [x] Account lockout după 5 încercări

### AC-AUTH-005: Biometric Login

- [x] Prompt pentru activare după primul login
- [x] Face ID/Touch ID funcțional
- [x] Fallback disponibil
- [x] Re-autentificare la 7 zile

### AC-AUTH-006: Resetare Parolă

- [x] Email de resetare trimis în < 5 secunde
- [x] Link funcțional 1 oră
- [x] Parolă nouă validată
- [x] Sesiuni existente invalidate

---

## 🔌 API Endpoints Necesare

### Authentication

```
POST /api/v1/auth/register
POST /api/v1/auth/register/phone
POST /api/v1/auth/login
POST /api/v1/auth/login/phone
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
```

### Verification

```
POST /api/v1/auth/verify-email
POST /api/v1/auth/verify-phone
POST /api/v1/auth/resend-verification
```

### Password Reset

```
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
POST /api/v1/auth/change-password
```

### OAuth

```
POST /api/v1/auth/oauth/google
POST /api/v1/auth/oauth/apple
POST /api/v1/auth/oauth/facebook
POST /api/v1/auth/oauth/link
```

### Session Management

```
GET  /api/v1/auth/sessions
DELETE /api/v1/auth/sessions/:sessionId
DELETE /api/v1/auth/sessions/all
```

---

## 📝 Note de Implementare

### Pentru Dezvoltator

1. Folosește `react-native-keychain` pentru stocare securizată
2. Implementează token refresh în interceptor Axios/Fetch
3. Nu stoca token-uri în AsyncStorage!
4. Testează pe dispozitive reale pentru biometrics

### Pentru QA

1. Testează scenarii de network instabil
2. Verifică comportamentul când biometrics fail
3. Testează brute force protection
4. Verifică email delivery la provideri diferiți

---

**Document Status:** Draft  
**Ultima actualizare:** Ianuarie 2026  
**Autor:** IMOBI Mobile Team
