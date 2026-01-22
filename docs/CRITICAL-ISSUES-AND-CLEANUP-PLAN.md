# 🚨 ANALIZĂ CRITICĂ ȘI PLAN DE CURĂȚARE - DOMARIS

**Data Analizei:** 22 Ianuarie 2026  
**Analist:** CTO AI Assistant  
**Severitate:** 🔴 CRITICĂ - Necesită Acțiune Imediată

---

## 📋 SUMAR EXECUTIV

Am identificat **3 probleme majore** care necesită rezolvare urgentă:

1. ❌ **Mențiuni Facebook** - Aplicația conține referințe la scraping Facebook care trebuie eliminate
2. ❌ **Model de Cont Inconsistent** - Baza de date încă folosește `tenant`/`landlord` în loc de modelul unificat
3. ❌ **Lipsă OTP la Email Registration** - Înregistrarea cu email nu are verificare OTP
4. ❌ **Lipsă Login cu Telefon** - Nu există posibilitate de login cu număr de telefon

---

## 🔍 PROBLEMA 1: MENȚIUNI FACEBOOK (Scraping Legacy)

### Locații Identificate:

#### Backend - Module de Șters Complet:

```
❌ /backend/src/app/modules/parser/
   - parser.service.ts (409 linii - SCRAPING FACEBOOK)
   - parser.module.ts

❌ /backend/src/app/services/apify.service.ts
   - Service pentru scraping Facebook cu Apify

❌ /backend/src/app/services/groupSource.service.ts
   - Management grupuri Facebook pentru scraping

❌ /backend/src/app/db/entities/groupSource.entity.ts
   - Entity pentru grupuri Facebook
```

#### Backend - Câmpuri de Eliminat din Entities:

**`listing.entity.ts`** (linii 29-63):

```typescript
❌ sourceType: 'facebook' | 'manual' | 'other'  // Elimină 'facebook'
❌ externalPostId
❌ externalGroupId
❌ sourceUrl
❌ parsedOwnerName
❌ parsedOwnerProfileUrl
❌ reactionCount
❌ shareCount
❌ commentCount
❌ rawSource (JSONB cu date FB)
❌ scrapedAt
```

**`enums.ts`** (linii 24-30):

```typescript
❌ ListingSourceType.FACEBOOK
❌ ListingSourceType.OLX
❌ ListingSourceType.IMOBILIARE
```

#### Packages/Types:

**`property.interface.ts`** (linia 209):

```typescript
❌ type: 'MANUAL' | 'FACEBOOK' | 'OTHER';  // Elimină 'FACEBOOK'
```

#### Mobile:

**`SocialButton.tsx`** (linii 11, 50-57):

```typescript
❌ type SocialProvider = 'google' | 'apple' | 'facebook';
❌ case 'facebook': ...
```

**Documente** (linii identificate):

```
❌ /mobile/docs/architecture/DATA-MODELS.md:55 - facebookId
❌ /mobile/docs/features/01-AUTH-REGISTRATION.md:256,668 - Facebook Login
❌ /mobile/docs/00-PROJECT-OVERVIEW.md:224 - OAuth Facebook
```

### Acțiuni Necesare:

1. **Șterge complet modulul parser** și serviciile asociate
2. **Curăță entity-urile** de câmpuri legacy Facebook
3. **Actualizează enum-urile** să elimine referințe Facebook
4. **Actualizează documentația** să elimine mențiuni OAuth Facebook
5. **Curăță UI mobile** de butonul Facebook login

---

## 🔍 PROBLEMA 2: MODEL DE CONT INCONSISTENT (tenant/landlord)

### Situația Actuală:

Conform **ADR-001** (docs/decisions/001-UNIFIED-ACCOUNT-MODEL.md), aplicația ar trebui să folosească:

- ✅ `verificationLevel` (0-3) pentru control acces
- ✅ `isAdmin` (boolean) pentru admin
- ❌ **NU** `role` ('tenant' | 'landlord' | 'admin')

### Probleme Identificate:

#### 1. **User Entity** (`user.entity.ts` linii 209-214):

```typescript
⚠️ DEPRECATED dar încă prezent:
@Column({
  type: DataType.ENUM('tenant', 'landlord', 'admin'),
  defaultValue: 'tenant',
  allowNull: true,
})
role?: 'tenant' | 'landlord' | 'admin' | null;
```

**Status:** Marcat ca deprecated, dar încă folosit în cod!

#### 2. **Conversation Entity** (`conversation.entity.ts`):

```typescript
❌ PROBLEMA MAJORĂ - Încă folosește tenant/landlord:
@Column(DataType.BIGINT)
tenantId!: number;

@BelongsTo(() => User, 'tenantId')
tenant!: User;

@Column(DataType.BIGINT)
landlordId!: number;

@BelongsTo(() => User, 'landlordId')
landlord!: User;
```

**Impact:** Sistemul de mesagerie presupune că există "tenant" (chiriaș) și "landlord" (proprietar), ceea ce **contrazice modelul unificat**!

#### 3. **Chat Service** (`chat.service.ts`):

```typescript
❌ Logică bazată pe tenant/landlord (linii 38, 48-49, 78-79, etc.):
[Op.or]: [{ tenantId: userId }, { landlordId: userId }]

{ model: User, as: 'tenant', ... }
{ model: User, as: 'landlord', ... }

if (conversation.tenantId !== userId && conversation.landlordId !== userId)
```

#### 4. **Admin Service** (`admin.service.ts` linia 32):

```typescript
❌ Încă permite setarea role-ului:
async updateUserRole(userId: number, role: 'tenant' | 'landlord' | 'admin')
```

#### 5. **Enums** (`enums.ts` linii 2-6):

```typescript
❌ Enum-ul UserRole încă există:
export enum UserRole {
  TENANT = 'tenant',
  LANDLORD = 'landlord',
  ADMIN = 'admin',
}
```

### Consecințe în Baza de Date:

Când verifici baza de date, vezi:

```sql
SELECT role, COUNT(*) FROM users GROUP BY role;

-- Rezultat probabil:
-- tenant    | 45
-- landlord  | 12
-- admin     | 1
```

**Problema:** Utilizatorii au `role` setat, deși ar trebui să fie `NULL` și să folosească doar `verificationLevel`!

---

## 🔍 PROBLEMA 3: LIPSĂ OTP LA EMAIL REGISTRATION

### Situația Actuală:

**Auth Controller** (`auth.controller.ts`):

```typescript
✅ POST /auth/register/phone - Trimite OTP
✅ POST /auth/verify-phone-otp - Verifică OTP

❌ POST /auth/register - NU trimite OTP, creează cont direct!
```

### Problema:

Conform cerințelor:

> "LA inregistrare cu email tot trebuie sa verifici un OTP, ca si la mobile."

**Dar:** Endpoint-ul `/auth/register` creează contul imediat, fără verificare OTP!

### Ce Lipsește:

1. **Endpoint nou:** `POST /auth/register/email` - Trimite OTP pe email
2. **Endpoint nou:** `POST /auth/verify-email-otp` - Verifică OTP și creează cont
3. **Logică:** Similar cu phone registration, dar pentru email

---

## 🔍 PROBLEMA 4: LIPSĂ LOGIN CU TELEFON

### Situația Actuală:

**Auth Controller** (`auth.controller.ts`):

```typescript
✅ POST /auth/login - Login cu email + parolă
✅ POST /auth/login/phone - Trimite OTP pe telefon
✅ POST /auth/verify-phone-otp - Verifică OTP

❌ DAR: verify-phone-otp funcționează doar pentru REGISTER, nu și pentru LOGIN!
```

### Problema:

Conform cerințelor:

> "La login nu exista posibilitate cu nr de telefon."

**Realitate:** Există endpoint `/auth/login/phone`, dar implementarea este incompletă!

### Ce Lipsește:

Verificare în `auth.service.ts` dacă OTP-ul este pentru login sau register, și returnarea token-urilor corespunzător.

---

## 📊 PLAN DE CURĂȚARE ȘI MIGRARE

### FAZA 1: CURĂȚARE FACEBOOK (Prioritate: 🔴 CRITICĂ)

#### 1.1 Backend - Ștergere Module

```bash
# Șterge complet:
rm -rf backend/src/app/modules/parser/
rm backend/src/app/services/apify.service.ts
rm backend/src/app/services/groupSource.service.ts
rm backend/src/app/db/entities/groupSource.entity.ts
```

#### 1.2 Backend - Curățare Entities

**Fișier:** `backend/src/app/db/entities/listing.entity.ts`

**Acțiune:** Elimină câmpurile:

- `sourceType` (sau schimbă enum la doar 'MANUAL' | 'OTHER')
- `externalPostId`
- `externalGroupId`
- `sourceUrl`
- `parsedOwnerName`
- `parsedOwnerProfileUrl`
- `reactionCount`
- `shareCount`
- `commentCount`
- `rawSource`
- `scrapedAt`

#### 1.3 Backend - Curățare Enums

**Fișier:** `backend/src/app/db/entities/enums.ts`

**Acțiune:** Elimină:

```typescript
export enum ListingSourceType {
  FACEBOOK = 'facebook', // ❌ ȘTERGE
  OLX = 'olx', // ❌ ȘTERGE
  IMOBILIARE = 'imobiliare', // ❌ ȘTERGE
  MANUAL = 'manual',
  OTHER = 'other',
}
```

#### 1.4 Packages/Types

**Fișier:** `packages/types/src/lib/property.interface.ts`

**Acțiune:** Linia 209:

```typescript
// ÎNAINTE:
type: 'MANUAL' | 'FACEBOOK' | 'OTHER';

// DUPĂ:
type: 'MANUAL' | 'OTHER';
```

#### 1.5 Mobile - Curățare UI

**Fișier:** `mobile/src/shared/components/SocialButton.tsx`

**Acțiune:** Elimină:

- `'facebook'` din `type SocialProvider`
- `case 'facebook':` din switch

#### 1.6 Documentație

**Fișiere de actualizat:**

- `mobile/docs/architecture/DATA-MODELS.md` - Elimină `facebookId`
- `mobile/docs/features/01-AUTH-REGISTRATION.md` - Elimină Facebook Login
- `mobile/docs/00-PROJECT-OVERVIEW.md` - Elimină OAuth Facebook

---

### FAZA 2: MIGRARE MODEL UNIFICAT (Prioritate: 🔴 CRITICĂ)

#### 2.1 Migrare Bază de Date

**Script SQL:** `backend/migrations/002-cleanup-unified-account.sql`

```sql
-- ============================================================================
-- CLEANUP: Unified Account Model - Eliminare tenant/landlord
-- ============================================================================

-- 1. Actualizare Conversation Entity
-- Redenumire coloane pentru neutralitate
ALTER TABLE conversations
  RENAME COLUMN tenant_id TO participant1_id;

ALTER TABLE conversations
  RENAME COLUMN landlord_id TO participant2_id;

-- 2. Curățare User.role
-- Setează toate role-urile la NULL (folosim doar verificationLevel)
UPDATE users SET role = NULL WHERE role IS NOT NULL;

-- 3. Verificare
SELECT
  COUNT(*) as total_users,
  SUM(CASE WHEN role IS NULL THEN 1 ELSE 0 END) as role_null,
  SUM(CASE WHEN verification_level >= 2 THEN 1 ELSE 0 END) as can_post_listings
FROM users;

-- Rezultat așteptat: toate role-urile NULL
```

#### 2.2 Actualizare Conversation Entity

**Fișier:** `backend/src/app/db/entities/conversation.entity.ts`

```typescript
// ÎNAINTE:
@Column(DataType.BIGINT)
tenantId!: number;

@BelongsTo(() => User, 'tenantId')
tenant!: User;

@Column(DataType.BIGINT)
landlordId!: number;

@BelongsTo(() => User, 'landlordId')
landlord!: User;

// DUPĂ:
@Column(DataType.BIGINT)
participant1Id!: number;

@BelongsTo(() => User, 'participant1Id')
participant1!: User;

@Column(DataType.BIGINT)
participant2Id!: number;

@BelongsTo(() => User, 'participant2Id')
participant2!: User;
```

#### 2.3 Actualizare Chat Service

**Fișier:** `backend/src/app/modules/chat/chat.service.ts`

**Acțiune:** Înlocuiește toate referințele:

- `tenantId` → `participant1Id`
- `landlordId` → `participant2Id`
- `tenant` → `participant1`
- `landlord` → `participant2`

**Logică nouă:**

```typescript
// Găsește conversația unde userId este participant1 SAU participant2
const conversations = await Conversation.findAll({
  where: {
    [Op.or]: [{ participant1Id: userId }, { participant2Id: userId }],
  },
  include: [
    { model: User, as: 'participant1' },
    { model: User, as: 'participant2' },
    { model: Listing, as: 'property' },
  ],
});

// Determină celălalt participant
const otherParticipant =
  conversation.participant1Id === userId
    ? conversation.participant2
    : conversation.participant1;
```

#### 2.4 Eliminare UserRole Enum

**Fișier:** `backend/src/app/db/entities/enums.ts`

**Acțiune:** Șterge complet:

```typescript
export enum UserRole {
  TENANT = 'tenant',
  LANDLORD = 'landlord',
  ADMIN = 'admin',
}
```

#### 2.5 Actualizare Admin Service

**Fișier:** `backend/src/app/modules/admin/admin.service.ts`

**Acțiune:** Elimină metoda `updateUserRole` sau modifică-o:

```typescript
// ÎNAINTE:
async updateUserRole(userId: number, role: 'tenant' | 'landlord' | 'admin')

// DUPĂ:
async updateVerificationLevel(userId: number, level: 0 | 1 | 2 | 3)
async setAdminStatus(userId: number, isAdmin: boolean)
```

#### 2.6 Eliminare Câmp `role` din User Entity

**Fișier:** `backend/src/app/db/entities/user.entity.ts`

**Acțiune:** Șterge complet liniile 204-214:

```typescript
// ❌ ȘTERGE COMPLET:
@Column({
  type: DataType.ENUM('tenant', 'landlord', 'admin'),
  defaultValue: 'tenant',
  allowNull: true,
})
role?: 'tenant' | 'landlord' | 'admin' | null;
```

---

### FAZA 3: IMPLEMENTARE OTP PENTRU EMAIL (Prioritate: 🟡 MEDIE)

#### 3.1 Actualizare Auth Service

**Fișier:** `backend/src/app/auth/auth.service.ts`

**Acțiune:** Adaugă metode:

```typescript
/**
 * Trimite OTP pentru înregistrare cu email
 */
async registerEmail(dto: RegisterEmailDto): Promise<OtpSentResponseDto> {
  // 1. Verifică dacă email-ul există deja
  const existing = await this.userModel.findOne({ where: { email: dto.email } });
  if (existing) {
    throw new BadRequestException('Email already exists');
  }

  // 2. Generează OTP
  const otp = this.generateOTP();

  // 3. Salvează în Redis cu TTL 10 minute
  await this.redis.setex(
    `email_otp:${dto.email}`,
    600,
    JSON.stringify({ otp, ...dto })
  );

  // 4. Trimite email cu OTP
  await this.emailService.sendVerificationCode(dto.email, otp);

  return {
    success: true,
    message: 'Verification code sent to email',
    expiresIn: 600,
  };
}

/**
 * Verifică OTP email și creează cont
 */
async verifyEmailOtp(dto: VerifyEmailOtpDto): Promise<AuthResponseDto> {
  // 1. Verifică OTP din Redis
  const stored = await this.redis.get(`email_otp:${dto.email}`);
  if (!stored) {
    throw new BadRequestException('OTP expired or invalid');
  }

  const data = JSON.parse(stored);
  if (data.otp !== dto.otp) {
    throw new BadRequestException('Invalid OTP');
  }

  // 2. Creează utilizator
  const hashedPassword = await bcrypt.hash(data.password, 10);
  const user = await this.userModel.create({
    email: dto.email,
    password: hashedPassword,
    firstName: data.firstName,
    lastName: data.lastName,
    emailVerified: true,
    verificationLevel: 1, // Email verificat
  });

  // 3. Șterge OTP din Redis
  await this.redis.del(`email_otp:${dto.email}`);

  // 4. Generează tokens
  return this.login(user);
}
```

#### 3.2 Actualizare Auth Controller

**Fișier:** `backend/src/app/auth/auth.controller.ts`

**Acțiune:** Modifică endpoint-ul `/auth/register`:

```typescript
// ÎNAINTE:
@Post('register')
async register(@Body() body: RegisterDto) {
  return this.authService.register(body); // ❌ Creează cont direct
}

// DUPĂ:
@Post('register/email')
@ApiOperation({ summary: 'Register with email (sends OTP)' })
async registerEmail(@Body() body: RegisterEmailDto) {
  return this.authService.registerEmail(body);
}

@Post('verify-email-otp')
@ApiOperation({ summary: 'Verify email OTP (completes registration)' })
async verifyEmailOtp(@Body() body: VerifyEmailOtpDto) {
  return this.authService.verifyEmailOtp(body);
}
```

---

### FAZA 4: FIX LOGIN CU TELEFON (Prioritate: 🟡 MEDIE)

#### 4.1 Actualizare Auth Service

**Fișier:** `backend/src/app/auth/auth.service.ts`

**Acțiune:** Modifică `verifyPhoneOtp` să detecteze login vs register:

```typescript
async verifyPhoneOtp(dto: VerifyPhoneOtpDto): Promise<AuthResponseDto> {
  // 1. Verifică OTP din Redis
  const stored = await this.redis.get(`phone_otp:${dto.phone}`);
  if (!stored) {
    throw new BadRequestException('OTP expired or invalid');
  }

  const data = JSON.parse(stored);
  if (data.otp !== dto.otp) {
    throw new BadRequestException('Invalid OTP');
  }

  // 2. Verifică dacă este LOGIN sau REGISTER
  const existingUser = await this.userModel.findOne({
    where: { phone: dto.phone }
  });

  if (existingUser) {
    // ✅ LOGIN - Utilizator existent
    existingUser.phoneVerified = true;
    if (existingUser.verificationLevel < 1) {
      existingUser.verificationLevel = 1;
    }
    await existingUser.save();

    await this.redis.del(`phone_otp:${dto.phone}`);
    return this.login(existingUser);
  } else {
    // ✅ REGISTER - Utilizator nou
    const user = await this.userModel.create({
      phone: dto.phone,
      firstName: data.firstName || 'User',
      lastName: data.lastName || '',
      phoneVerified: true,
      verificationLevel: 1,
    });

    await this.redis.del(`phone_otp:${dto.phone}`);
    return this.login(user);
  }
}
```

---

## 🗂️ ORDINE DE EXECUȚIE RECOMANDATĂ

### Săptămâna 1: Curățare Critică

**Ziua 1-2: Eliminare Facebook**

- [ ] Șterge module parser, apify, groupSource
- [ ] Curăță entities (listing, enums)
- [ ] Actualizează packages/types
- [ ] Curăță mobile UI
- [ ] Actualizează documentație

**Ziua 3-4: Migrare Model Unificat**

- [ ] Rulează migration SQL pentru conversations
- [ ] Actualizează Conversation entity
- [ ] Actualizează Chat service
- [ ] Elimină UserRole enum
- [ ] Șterge câmp `role` din User entity
- [ ] Testare completă messaging

**Ziua 5: Testing**

- [ ] Test complet backend
- [ ] Test complet mobile
- [ ] Verificare bază de date

### Săptămâna 2: Îmbunătățiri Auth

**Ziua 1-2: OTP Email**

- [ ] Implementare registerEmail
- [ ] Implementare verifyEmailOtp
- [ ] Actualizare controller
- [ ] Testare flow complet

**Ziua 3: Login Telefon**

- [ ] Fix verifyPhoneOtp pentru login
- [ ] Testare flow complet

**Ziua 4-5: Testing Final**

- [ ] Test end-to-end toate flow-urile auth
- [ ] Documentare actualizată
- [ ] Code review

---

## ⚠️ RISCURI ȘI PRECAUȚII

### Risc 1: Date Existente în Producție

**Problemă:** Dacă există utilizatori în producție cu `role` setat.

**Soluție:**

```sql
-- Înainte de a șterge coloana, verifică:
SELECT role, COUNT(*) FROM users GROUP BY role;

-- Dacă există date, migrează logic:
UPDATE users
SET verification_level = 2
WHERE role = 'landlord' AND verification_level < 2;
```

### Risc 2: Conversații Existente

**Problemă:** Conversații existente cu `tenantId`/`landlordId`.

**Soluție:** Migration SQL redenumește coloanele, păstrând datele.

### Risc 3: Breaking Changes în API

**Problemă:** Mobile app-ul poate folosi endpoint-uri vechi.

**Soluție:**

- Păstrează endpoint-ul vechi `/auth/register` pentru backwards compatibility
- Adaugă deprecation warning
- Documentează noul flow

---

## 📝 CHECKLIST FINAL

### Backend

- [ ] ❌ Module parser șters
- [ ] ❌ Entities curățate (listing, groupSource)
- [ ] ❌ Enums curățate (UserRole, ListingSourceType)
- [ ] ❌ Conversation entity actualizat (participant1/2)
- [ ] ❌ Chat service actualizat
- [ ] ❌ User.role eliminat complet
- [ ] ❌ OTP email implementat
- [ ] ❌ Login telefon fixat

### Mobile

- [ ] ❌ SocialButton fără Facebook
- [ ] ❌ Documentație actualizată

### Database

- [ ] ❌ Migration conversations rulat
- [ ] ❌ Migration users.role rulat
- [ ] ❌ Verificare: toate role-urile NULL
- [ ] ❌ Verificare: conversations folosesc participant1/2

### Testing

- [ ] ❌ Register cu email + OTP
- [ ] ❌ Login cu email + parolă
- [ ] ❌ Register cu telefon + OTP
- [ ] ❌ Login cu telefon + OTP
- [ ] ❌ Messaging funcționează cu participant1/2
- [ ] ❌ Verificare: nu mai există referințe Facebook

---

## 🎯 REZULTAT AȘTEPTAT

După finalizarea acestui plan:

✅ **Zero mențiuni Facebook** în cod  
✅ **Model unificat 100% implementat** - doar `verificationLevel` + `isAdmin`  
✅ **Bază de date curată** - fără `role`, fără `tenant`/`landlord`  
✅ **Auth complet** - OTP pentru email și telefon, login cu ambele  
✅ **Cod curat și consistent** cu documentația ADR-001

---

**Document creat:** 22 Ianuarie 2026  
**Autor:** CTO AI Assistant  
**Status:** 🔴 NECESITĂ ACȚIUNE IMEDIATĂ
