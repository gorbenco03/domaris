# 🏛️ ADR-001: Model de Cont Unificat (Fără Separare pe Roluri)

**ID:** ADR-001  
**Status:** ✅ APROBAT  
**Data Deciziei:** 20 Ianuarie 2026  
**Decident:** Product Owner  
**Impact:** Backend, Frontend, Mobile, Database

---

## 📋 Sumar Executiv

**Decizia:** Platforma IMOBI va folosit un **model de cont unificat** - fiecare utilizator poate atât să caute proprietăți, cât și să publice anunțuri, fără separare pe roluri (Owner/Seeker).

**Motivație principală:** Simplitate pentru utilizatori și flexibilitate pentru cazuri reale de utilizare.

---

## 🎯 Context și Problemă

### Modelul Vechi (Proiectare Inițială)

```
La înregistrare, utilizatorul alegea un rol:
├── SEEKER (Căutător) - poate doar căuta și contacta
├── OWNER (Proprietar) - poate căuta + posta anunțuri
└── BOTH (Ambele) - hybrid încercat
```

### De Ce Nu Funcționează

1. **Complexitate inutilă** - Utilizatorul trebuie să decidă la înregistrare ce vrea să facă, când poate nu știe încă.

2. **Cazuri reale contradictorii:**
   - 👤 _Persoană fizică_: Caută apartament → peste 2 ani vrea să dea în chirie garsoniera moștenită
   - 🏢 _Dezvoltator imobiliar_: Vinde apartamente în proiectul său → caută terenuri de cumpărat
   - 👨‍👩‍👧 _Familie_: Vinde casa veche → simultan caută apartament nou

3. **Barieră psihologică** - Oamenii evită platformele care cer decizii imediate și complicate.

4. **Precedent de succes** - 999.md, OLX, Storia funcționează exact așa: cont unic, poți face orice.

---

## ✅ Decizia

### Principiul Core

> **Un cont = Acces complet la platformă**  
> Verificarea este singura "poartă" pentru a posta anunțuri, NU rolul.

### Cum Funcționează

```
┌─────────────────────────────────────────────────────────────────┐
│                     CONT UTILIZATOR UNIC                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📱 Înregistrare (email/telefon/oauth)                         │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────────────────────────────┐                   │
│  │  ✅ ACCES IMEDIAT (fără verificare):    │                   │
│  │  • Căutare proprietăți                  │                   │
│  │  • Filtre și hartă                      │                   │
│  │  • Salvare favorite                     │                   │
│  │  • Contactare proprietari               │                   │
│  │  • Programare vizionări                 │                   │
│  │  • Chat cu proprietari                  │                   │
│  │  • Alerte de preț                       │                   │
│  │  • AI Assistant pentru căutare          │                   │
│  └─────────────────────────────────────────┘                   │
│       │                                                         │
│       │  Vrei să postezi anunț?                                │
│       ▼                                                         │
│  ┌─────────────────────────────────────────┐                   │
│  │  🔐 VERIFICARE IDENTITATE (KYC):        │                   │
│  │  • Verificare telefon (SMS OTP)         │                   │
│  │  • Verificare document identitate       │                   │
│  │  • (Opțional) Verificare proprietate    │                   │
│  └─────────────────────────────────────────┘                   │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────────────────────────────┐                   │
│  │  ✅ ACCES EXTINS (post-verificare):     │                   │
│  │  • Tot ce e mai sus PLUS:               │                   │
│  │  • Postare anunțuri                     │                   │
│  │  • Management proprietăți               │                   │
│  │  • Dashboard Analytics                  │                   │
│  │  • Răspuns la mesaje ca proprietar      │                   │
│  │  • Promovare anunțuri (viitor)          │                   │
│  └─────────────────────────────────────────┘                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Schimbări Necesare

### 1. Model de Date - User Entity

**ÎNAINTE:**

```typescript
interface User {
  role: 'OWNER' | 'SEEKER' | 'BOTH' | 'ADMIN';
  // ...
}
```

**DUPĂ:**

```typescript
interface User {
  id: string;
  email: string;
  phone?: string;

  // Profil
  firstName: string;
  lastName: string;
  avatar?: string;

  // Verificare (SINGURA "poartă")
  verificationLevel: 0 | 1 | 2 | 3;
  // 0 = Cont nou (acces de bază)
  // 1 = Email/Telefon verificat (poate contacta)
  // 2 = Identitate verificată (POATE POSTA ANUNȚURI)
  // 3 = Proprietar verificat cu documente (badge special)

  // Admin flag separat (nu e rol)
  isAdmin: boolean;

  // Statistici (calculate, nu rol)
  activeListingsCount: number;

  // ...restul rămâne la fel
}
```

### 2. Permisiuni - Logica de Access

**Conceptul cheie:** Folosim `verificationLevel` în loc de `role`.

```typescript
// permissions.ts - LOGICĂ NOUĂ

const PERMISSIONS = {
  // Nivel 0+ (toți utilizatorii)
  BROWSE_PROPERTIES: 0,
  SEARCH_PROPERTIES: 0,
  VIEW_PROPERTY_DETAILS: 0,
  ADD_TO_FAVORITES: 0,
  USE_FILTERS: 0,
  USE_MAP_SEARCH: 0,
  USE_AI_SEARCH: 0,

  // Nivel 1+ (email/telefon verificat)
  CONTACT_OWNER: 1,
  START_CONVERSATION: 1,
  REQUEST_VIEWING: 1,
  RECEIVE_ALERTS: 1,

  // Nivel 2+ (identitate verificată - POATE POSTA)
  CREATE_LISTING: 2,
  EDIT_OWN_LISTING: 2,
  DELETE_OWN_LISTING: 2,
  VIEW_LISTING_ANALYTICS: 2,
  RESPOND_TO_MESSAGES: 2,
  MANAGE_VIEWINGS: 2,

  // Nivel 3 (proprietar verificat cu documente)
  BOOST_LISTING: 3, // promovare plătită
  VERIFIED_BADGE: 3, // badge "Proprietar Verificat"
};

// Helper function
function canPerformAction(
  user: User,
  action: keyof typeof PERMISSIONS,
): boolean {
  return user.verificationLevel >= PERMISSIONS[action];
}
```

### 3. Flow Înregistrare - Simplificat

**ÎNAINTE (complex):**

```
Welcome → Register → OTP → UserTypeSelection → Onboarding
                              ▲
                              └── Alegere: "Sunt proprietar" / "Caut locuință"
```

**DUPĂ (simplu):**

```
Welcome → Register → (opțional OTP) → Home
                                        │
                                        └── Dacă vrea să posteze → "Verifică-ți identitatea"
```

### 4. UI Navigation - Schimbări Mobile

```
// ÎNAINTE: MainNavigator cu logică pe rol
if (user.role === 'OWNER') {
  showOwnerDashboard();
} else {
  showSeekerHome();
}

// DUPĂ: Un singur flow, UI adaptiv
<MainNavigator>
  <HomeTab />           // Căutare (toți)
  <FavoritesTab />      // Favorite (toți)
  <MessagesTab />       // Mesaje (verificare lvl 1+)
  <MyListingsTab />     // Anunțurile mele (verificare lvl 2+, gol dacă n-are)
  <ProfileTab />        // Profil + setări
</MainNavigator>

// Tab "Anunțurile mele" arată:
// - Lista anunțuri (dacă are și e verificat)
// - CTA "Postează primul anunț" (dacă e verificat dar n-are)
// - CTA "Verifică-ți identitatea pentru a posta" (dacă nu e verificat)
```

### 5. Backend API - Schimbări Endpoint-uri

**Endpoint-uri care NU se schimbă:**

- Toate endpoint-urile de căutare/browse
- Favorites CRUD
- Messaging (dar cu verificare lvl 1+)

**Endpoint-uri care SE schimbă:**

```typescript
// ÎNAINTE: Verificare pe rol
@Post('/properties')
@Roles('OWNER', 'BOTH')  // ❌ ELIMINAT
createProperty() { ... }

// DUPĂ: Verificare pe nivel
@Post('/properties')
@MinVerificationLevel(2)  // ✅ NOU
createProperty() { ... }

// Guard NOU pentru verificare
@Injectable()
export class VerificationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredLevel = this.reflector.get<number>('minVerificationLevel', context.getHandler());
    const user = context.switchToHttp().getRequest().user;
    return user.verificationLevel >= requiredLevel;
  }
}
```

### 6. Ecran Eliminat: UserTypeSelectionScreen

**ACȚIUNE:** Ștergere completă din:

- `/mobile/src/features/auth/screens/UserTypeSelectionScreen.tsx`
- Navigație din `AuthNavigator`
- Referințe din documentație

---

## 📱 UX Flow Nou - Scenarii

### Scenariul 1: Utilizator Nou Caută Apartament

```
1. Descarcă app → Înregistrare email/Google
2. Acces imediat la căutare, filtre, hartă
3. Găsește apartament → Apasă "Contactează"
4. Popup: "Verifică-ți telefonul pentru a contacta proprietarul"
5. Verificare SMS (1 minut)
6. Poate contacta, programa vizionări, etc.
```

### Scenariul 2: Același Utilizator Peste 2 Ani Vrea Să Posteze

```
1. Deschide app (cont existent, verificat telefon)
2. Tab "Anunțurile mele" → "Postează anunț"
3. Popup: "Pentru siguranță, verifică-ți identitatea"
4. Upload CI + selfie (proces KYC, 5-10 minute)
5. Verificare aprobată → Poate posta anunțuri
6. Accesează și Dashboard Analytics pentru anunțuri
```

### Scenariul 3: Dezvoltator Imobiliar

```
1. Înregistrare cont
2. Verificare rapidă (lvl 2) → Postează apartamente de vânzare
3. Același cont → Caută terenuri de cumpărat
4. Contactează proprietari terenuri
5. Tot într-un singur cont, fără schimbare de "rol"
```

---

## 📊 Enumerări și Constante Actualizate

### CE SE ELIMINĂ din ENUMS

```typescript
// ❌ ELIMINAT
type UserRole = 'OWNER' | 'SEEKER' | 'BOTH' | 'ADMIN';
```

### CE RĂMÂNE/SE ADAUGĂ

```typescript
// ✅ PĂSTRAT ȘI EXTINS
type VerificationLevel = 0 | 1 | 2 | 3;

// Descrieri pentru UI
const VERIFICATION_LEVEL_INFO = {
  0: {
    name: 'Cont Nou',
    description: 'Cont creat, nevalidat',
    canPost: false,
    canContact: false,
  },
  1: {
    name: 'Verificat Bază',
    description: 'Email sau telefon confirmat',
    canPost: false,
    canContact: true,
  },
  2: {
    name: 'Identitate Verificată',
    description: 'Document de identitate validat',
    canPost: true,
    canContact: true,
    badge: '✓ Verificat',
  },
  3: {
    name: 'Proprietar Verificat',
    description: 'Documente proprietate confirmate',
    canPost: true,
    canContact: true,
    badge: '⭐ Proprietar Verificat',
  },
};

// Admin separat - nu e "rol" ci flag
interface User {
  isAdmin: boolean; // Acces la admin panel
}
```

---

## 🗓️ Plan de Implementare

### Faza 1: Backend (1-2 zile)

- [ ] Modificare `User` entity: eliminare câmp `role`, adăugare `isAdmin`
- [ ] Creare `VerificationGuard` pentru protecție endpoint-uri
- [ ] Actualizare permisiuni pe endpoint-uri existente
- [ ] Migrare DB: `ALTER TABLE users DROP COLUMN role;`

### Faza 2: Mobile (1-2 zile)

- [ ] Ștergere `UserTypeSelectionScreen`
- [ ] Actualizare `AuthNavigator` (flow simplificat)
- [ ] Creare UI pentru "Verifică-ți identitatea" CTA
- [ ] Actualizare tab "Anunțurile mele" cu stări condiționate

### Faza 3: Frontend Web (1 zi)

- [ ] Eliminare selecție rol la înregistrare
- [ ] Dashboard adaptiv bazat pe verificare, nu rol

### Faza 4: Types Comune (2-4 ore)

- [ ] Actualizare `/packages/types/` conform noii structuri
- [ ] Eliminare `UserRole` enum
- [ ] Documentare `VerificationLevel`

---

## 📎 Impactul Asupra Documentației Existente

### Documente de Actualizat

| Document                      | Secțiune          | Schimbare                            |
| ----------------------------- | ----------------- | ------------------------------------ |
| `ENUMS.md`                    | UserRole          | Eliminare completă                   |
| `DATA-MODELS.md`              | User interface    | Eliminare `role`, adăugare `isAdmin` |
| `01-AUTH-REGISTRATION.md`     | Flow înregistrare | Eliminare UserTypeSelection          |
| `02-IDENTITY-VERIFICATION.md` | Context           | Accent pe "poarta către postare"     |
| `PROJECT-STATUS.md`           | Gap Analysis      | Actualizare referințe rol            |

---

## ✅ Criterii de Succes

1. **Utilizator nou poate căuta în < 2 minute** de la instalare
2. **Utilizator poate posta în < 10 minute** dacă nu e verificat (include KYC)
3. **Zero confuzie despre rol** - nu mai există întrebarea "Ce tip de cont?"
4. **Același cont pentru orice acțiune** - căutare, postare, comunicare

---

## 📚 Referințe

- **Model de succes:** 999.md, OLX, Storia, Airbnb (Host/Guest pe același cont)
- **Anti-pattern evitat:** Platforme care forțează alegerea rol la înregistrare

---

**Document creat de:** Technical Team  
**Aprobat de:** Product Owner  
**Data implementare:** TBD (Sprint 1-2)
