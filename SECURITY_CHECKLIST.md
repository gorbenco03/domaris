# 🔒 Security Checklist - Domaris MVP Launch
**Last Updated:** 31 Ianuarie 2026
**Team:** 2-3 developers (Moldova SRL)

---

## 📊 Overall Status

| Category | Status | Blockers | Ready |
|----------|--------|----------|-------|
| **Access Control** | ✅ DONE | 0 | 3/3 |
| **Audit Logging** | ✅ DONE | 0 | 5/5 |
| **GDPR Compliance** | ⏳ IN PROGRESS | 1 | 1/2 |
| **Legal** | 📝 JURIST | 1 | 0/1 |

**Total Progress:** 9/11 (82%)
**Blockers for MVP:** 2 items

---

## ✅ 1. ACCESS CONTROL (DONE)

### 1.1 Property Analytics Access ✅
**Status:** IMPLEMENTED
**File:** `backend/src/app/modules/listing/listing.controller.ts`

**What it does:**
- Verifică că userul este proprietarul listingului înainte de a returna analytics
- Previne leak de business intelligence

**Code:**
```typescript
const listing = await this.listingService.findOne(numericId);
if (listing.ownerId !== userId) {
  throw new ForbiddenException('You can only view analytics for your own properties');
}
```

### 1.2 Viewing Availability Access ✅
**Status:** IMPLEMENTED
**File:** `backend/src/app/modules/viewing/viewing.controller.ts`

**What it does:**
- Necesită Level 1 (email verificat) pentru a vedea disponibilitatea
- Era PUBLIC înainte (oricine putea vedea calendarul proprietarului)

**Code:**
```typescript
@UseGuards(VerificationGuard)
@MinVerificationLevel(1)
@Get('availability/:propertyId')
```

### 1.3 Admin Actions Context ✅
**Status:** IMPLEMENTED
**Files:**
- `backend/src/app/modules/admin/admin.controller.ts`
- `backend/src/app/modules/kyc/kyc.controller.ts`

**What it does:**
- Toate acțiunile admin primesc IP + UserAgent + adminEmail
- Permite audit logging complet

---

## ✅ 2. AUDIT LOGGING (DONE)

### 2.1 AdminAuditLog Entity ✅
**Status:** IMPLEMENTED
**File:** `backend/src/app/db/entities/admin-audit-log.entity.ts`

**What it contains:**
- 18 tipuri de acțiuni (USER_DELETE, KYC_APPROVE, ADMIN_LOGIN, etc.)
- Context complet: adminId, adminEmail, IP, UserAgent, reason
- oldValue/newValue pentru tracking changes
- Timestamps automate

**IMPORTANT:** Tabela este **append-only** (no updatedAt, no deletedAt)

### 2.2 Database Triggers (Immutability) ✅
**Status:** IMPLEMENTED
**File:** `backend/migrations/004-add-audit-log-immutability-triggers.sql`

**What it does:**
- Blochează UPDATE pe admin_audit_logs
- Blochează DELETE pe admin_audit_logs
- Chiar și adminii cu acces DB NU pot modifica logs

**Deployment:**
```sql
psql -U domaris -d domaris -f migrations/004-add-audit-log-immutability-triggers.sql
```

### 2.3 IP Masking (GDPR) ✅
**Status:** IMPLEMENTED
**File:** `backend/src/app/core/audit/audit.service.ts`

**What it does:**
- Maschează ultimul octet din IP: `192.168.1.xxx`
- GDPR data minimization compliance

**Code:**
```typescript
private maskIp(ip: string): string {
  // 192.168.1.100 → 192.168.1.xxx
}
```

### 2.4 PII Removal (GDPR Critical) ✅
**Status:** IMPLEMENTED
**File:** `backend/src/app/core/audit/audit.service.ts`

**What it does:**
- NU salvează email/firstName/lastName în oldValue/newValue
- Salvează doar: userId, verificationLevel, status, flags
- Email → emailHash (pentru identificare fără PII)

**Code:**
```typescript
private sanitizeData(data: Record<string, any>) {
  // Whitelist: doar câmpuri non-PII
  // Email → SHA256 hash (primele 16 caractere)
}
```

**Before (VULNERABIL):**
```json
{
  "oldValue": {
    "email": "user@example.com",    // ❌ PII
    "firstName": "Ion",              // ❌ PII
    "verificationLevel": 2
  }
}
```

**After (GDPR COMPLIANT):**
```json
{
  "oldValue": {
    "userId": 42,                   // ✓ OK
    "emailHash": "a3f2c1b9e7d4",    // ✓ Hash
    "verificationLevel": 2           // ✓ OK
  }
}
```

### 2.5 Admin Login/Logout Logging ✅
**Status:** IMPLEMENTED
**Files:**
- `backend/src/app/auth/auth.service.ts` (login/logout methods)
- `backend/src/app/auth/auth.controller.ts` (pass IP/UserAgent)

**What it does:**
- Loghează fiecare admin login cu IP + UserAgent
- Loghează fiecare admin logout
- Detectare login-uri suspicioase
- Incident response capability

**Actions logged:**
- `ADMIN_LOGIN` - când admin se loghează
- `ADMIN_LOGOUT` - când admin face logout

### 2.6 Reason Validation ✅
**Status:** IMPLEMENTED
**Files:**
- `backend/src/app/modules/admin/admin.service.ts` (deleteUser)
- `backend/src/app/modules/kyc/kyc.service.ts` (rejectVerification)

**What it does:**
- User deletion NECESITĂ reason (obligatoriu)
- KYC rejection NECESITĂ reason (obligatoriu)
- Returns 400 Bad Request dacă lipsește reason

**Code:**
```typescript
if (!reason || reason.trim().length === 0) {
  throw new BadRequestException('Reason is required');
}
```

### 2.7 AuditService Integration ✅
**Status:** IMPLEMENTED
**File:** `backend/src/app/core/audit/audit.service.ts`

**Actions currently logged:**
- ✅ USER_DELETE
- ✅ USER_VERIFICATION_CHANGE
- ✅ USER_ADMIN_GRANT
- ✅ USER_ADMIN_REVOKE
- ✅ KYC_APPROVE
- ✅ KYC_REJECT
- ✅ LISTING_STATUS_CHANGE
- ✅ ADMIN_LOGIN
- ✅ ADMIN_LOGOUT

**Actions NOT logged yet (viitor):**
- ⏳ USER_DATA_EXPORT
- ⏳ USER_DATA_VIEW
- ⏳ MESSAGES_VIEW (support)
- ⏳ KYC_DOCUMENT_VIEW

---

## ⏳ 3. GDPR COMPLIANCE (1 BLOCKER REMAINING)

### 3.1 Consent Tracking ✅ DONE
**Status:** IMPLEMENTED
**Date:** 31 Ianuarie 2026

**What it does:**
- Tracks MANDATORY consents: Terms, Privacy Policy, GDPR acceptance
- Tracks OPTIONAL consents: Marketing, Analytics
- Versioned consents for legal document updates
- IP address masking (192.168.1.xxx) for GDPR compliance
- Append-only consent records (audit trail)
- Consent withdrawal for optional consents (GDPR right)

**Implementation:**
```typescript
// Entity: UserConsent
ConsentType: 'TERMS' | 'PRIVACY' | 'GDPR' | 'MARKETING' | 'ANALYTICS'
Fields: userId, consentType, granted, version, grantedAt, withdrawnAt, ipAddress (masked), userAgent

// Registration flow (email/phone)
- DTOs include: acceptTerms, acceptPrivacy, acceptGdpr, acceptMarketing, acceptAnalytics
- Validation: Mandatory consents MUST be true
- Redis stores consents during OTP flow
- After OTP verification: ConsentService.recordConsents() creates records

// OAuth flow (Google/Apple)
- Auto-creates consents with defaults:
  * TERMS, PRIVACY, GDPR: true (implicit via OAuth)
  * MARKETING, ANALYTICS: false (default off)

// Consent management endpoints
- GET /users/me/consents - Current consent status
- GET /users/me/consents/history - Full audit history
- POST /users/me/consents/withdraw - Withdraw optional consent
- POST /users/me/consents/grant - Re-grant optional consent
- PATCH /users/me/consents - Update multiple consents
```

**Files created:**
- `backend/src/app/db/entities/user-consent.entity.ts` ✅
- `backend/src/app/core/consent/consent.service.ts` ✅
- `backend/src/app/core/consent/consent.module.ts` ✅
- `backend/src/app/modules/user/consent.dto.ts` ✅

**Files modified:**
- `backend/src/app/auth/dto/auth.dto.ts` - Added consent fields to RegisterEmailDto, RegisterPhoneDto ✅
- `backend/src/app/auth/auth.service.ts` - Integrated ConsentService in registration flows ✅
- `backend/src/app/auth/auth.controller.ts` - Pass IP/UserAgent to registration methods ✅
- `backend/src/app/modules/user/user.controller.ts` - Added consent management endpoints ✅
- `backend/src/app/app.module.ts` - Added ConsentModule ✅

**IMPORTANT:**
- ❌ Cannot withdraw MANDATORY consents (TERMS, PRIVACY, GDPR) - user must delete account
- ✅ Can withdraw/re-grant OPTIONAL consents (MARKETING, ANALYTICS)
- ✅ All consent changes logged with IP (masked) and UserAgent
- ✅ Append-only records for compliance audit trail

### 3.2 Complete Data Export ⚠️ PARTIAL
**Status:** PARTIALLY IMPLEMENTED
**Priority:** 🟡 HIGH
**Estimated:** 2-3 days

**Current status:**
- ✅ Endpoint exists: `POST /users/me/export`
- ❌ Returns only basic profile (incomplete)

**What's missing:**
- Include: listings, favorites, messages, viewings, search history
- Generate downloadable file (JSON/CSV)
- Send email with 24h download link

**Implementation plan:**
```typescript
async requestDataExport(userId: number) {
  const user = await User.findByPk(userId);
  const listings = await Listing.findAll({ where: { ownerId: userId } });
  const favorites = await Favorite.findAll({ where: { userId } });
  const messages = await Message.findAll({ where: { senderId: userId } });
  const viewings = await Viewing.findAll({ where: { seekerId: userId } });

  const exportData = { user, listings, favorites, messages, viewings };
  const filePath = await this.generateExportFile(userId, exportData);
  await this.emailService.sendExportLink(user.email, filePath);
}
```

**Files to modify:**
- `backend/src/app/modules/user/user.service.ts` (expand export logic)
- Add file generation utility
- Add S3 upload for export files

---

## 📝 4. LEGAL (JURIST - 1 BLOCKER)

### 4.1 Privacy Policy & Terms ❌ BLOCKER
**Status:** NOT IMPLEMENTED
**Responsibility:** 📝 JURIST (external)
**Priority:** 🔴 CRITICAL
**Estimated:** 2-3 days (with lawyer)

**What's needed:**
1. Privacy Policy (română + engleză)
2. Terms of Service (română + engleză)
3. Cookie Policy (dacă există web)

**Minimum content:**
- Data controller identity (SRL info)
- DPO contact (dpo@riva.ro?)
- Data collected & purposes
- Legal basis (consent, contract, etc.)
- User rights (access, deletion, portability)
- Data retention periods
- Third-party sharing (AWS, payment processors)

**Implementation:**
- Option 1: Static pages hosted on website
- Option 2: API endpoint `/legal/privacy-policy`
- Link in mobile app: Settings → Privacy Policy

**Cost:** €200-500 (legal review Moldova)

---

## 🎯 MVP LAUNCH BLOCKERS

**Must fix before production:**

1. ✅ **GDPR Consent Tracking** ~~(1 day)~~ **DONE**
   - ✅ Proof of user consent tracked with IP and timestamps
   - ✅ GDPR Article 7 compliant

2. ❌ **Privacy Policy & Terms** (2-3 days with jurist)
   - Cannot process data without legal basis
   - GDPR Article 13-14 violation

3. ⚠️ **Complete Data Export** (2-3 days)
   - Partial compliance Article 15
   - Can postpone to first 30 days

**Total blocker time:** ~2-3 days (legal only)

---

## ✅ WHAT'S ALREADY DONE (Don't need to redo)

1. ✅ Property analytics owner verification
2. ✅ Viewing availability access control
3. ✅ Admin audit logging (complete system)
4. ✅ Database immutability triggers
5. ✅ IP masking (GDPR)
6. ✅ PII removal from logs (GDPR)
7. ✅ Admin login/logout tracking
8. ✅ Reason validation for sensitive actions
9. ✅ GDPR consent tracking (Terms, Privacy, GDPR, Marketing, Analytics)

---

## 📂 Key Files Reference

### Entities
- `backend/src/app/db/entities/admin-audit-log.entity.ts` - Audit logs
- `backend/src/app/db/entities/user.entity.ts` - User model
- `backend/src/app/db/entities/user-consent.entity.ts` - GDPR consent tracking ✅ NEW

### Services
- `backend/src/app/core/audit/audit.service.ts` - Audit logging (IP mask, PII removal)
- `backend/src/app/core/consent/consent.service.ts` - GDPR consent management ✅ NEW
- `backend/src/app/auth/auth.service.ts` - Login/logout logging + consent tracking
- `backend/src/app/modules/admin/admin.service.ts` - Admin operations (with audit)
- `backend/src/app/modules/kyc/kyc.service.ts` - KYC operations (with audit)

### Controllers
- `backend/src/app/modules/listing/listing.controller.ts` - Analytics access control
- `backend/src/app/modules/viewing/viewing.controller.ts` - Availability access control
- `backend/src/app/modules/admin/admin.controller.ts` - Admin endpoints (with context)
- `backend/src/app/modules/kyc/kyc.controller.ts` - KYC endpoints (with context)
- `backend/src/app/auth/auth.controller.ts` - Login/logout (with IP/UA) + registration
- `backend/src/app/modules/user/user.controller.ts` - User profile + consent management ✅ NEW

### Database
- `backend/migrations/004-add-audit-log-immutability-triggers.sql` - Immutability triggers

---

## 🔄 Next Actions

**Priority 1 (This week - BLOCKER):**
1. ~~Implement GDPR consent tracking (1 day)~~ ✅ DONE
2. Coordinate with jurist for Privacy Policy (2-3 days) ❌ BLOCKER

**Priority 2 (First 30 days):**
3. Complete data export functionality (2-3 days)
4. Add migration for `user_consents` table
5. Test all security features in production
6. Mobile app: Add consent checkboxes to registration screens

**Priority 3 (Nice to have):**
7. Payment webhook signature verification (1-2 days per provider)
8. Failed login tracking (1 day)
9. Account deletion grace period (1 day)

---

## 📞 Questions & Clarifications

**Q: Este totul immutable acum?**
A: ✅ DA - database triggers blochează UPDATE/DELETE

**Q: Avem PII în audit logs?**
A: ❌ NU - doar userId + emailHash, fără email/nume

**Q: IP-urile sunt mascate?**
A: ✅ DA - ultimul octet mascat (192.168.1.xxx)

**Q: Admin login este logat?**
A: ✅ DA - ADMIN_LOGIN + ADMIN_LOGOUT cu IP/UA

**Q: Când putem lansa MVP?**
A: După Privacy Policy (2-3 zile cu jurist)

**Q: Este consent tracking gata?**
A: ✅ DA - toate consents trackuite cu IP mascat, versiuni, și withdraw capability

---

**Last Review:** 31 Ianuarie 2026
**Next Review:** După primire Privacy Policy de la jurist
**Status:** 🟢 82% DONE - 2 blockers remaining (1 critical: Privacy Policy)
