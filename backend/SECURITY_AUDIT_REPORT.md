# Security & Compliance Audit Report
## Domaris Real Estate Platform (Moldova)

**Audit Date:** January 31, 2026
**Auditor Role:** Senior Software Architect + Security Engineer
**Scope:** Backend API + Mobile App
**Context:** Pre-MVP launch security assessment for 2-3 developer team (SRL)

---

## Executive Summary

The Domaris platform has a **solid foundation** with well-structured verification levels (ADR-001), JWT authentication, and basic security controls. However, there are **critical gaps** in audit logging, GDPR compliance implementation, and access control that must be addressed before production launch.

**Overall Security Posture:** 🟡 MODERATE (acceptable for MVP with fixes)
**GDPR Compliance Status:** 🔴 HIGH RISK (missing critical features)
**Production Readiness:** ⚠️ NOT READY (requires 5-7 critical fixes)

---

## 1. Architecture Overview

### Backend Architecture

**Framework:** NestJS (Node.js)
**Database:** PostgreSQL (with Sequelize ORM)
**Cache/Sessions:** Redis
**File Storage:** AWS S3
**Real-time:** WebSocket (Socket.io) for messaging

**Module Structure:**
```
src/app/
├── auth/              # JWT authentication, OTP, OAuth
├── core/              # Guards, decorators, shared services (email, SMS, push)
├── db/entities/       # Data models (20+ entities)
├── modules/
│   ├── admin/         # Admin operations
│   ├── ai/            # AI chat, analysis
│   ├── analytics/     # Property analytics
│   ├── chat/          # Real-time messaging
│   ├── favorite/      # Favorites management
│   ├── kyc/           # Identity verification
│   ├── listing/       # Property listings
│   ├── monetization/  # Subscriptions, promotions, payments
│   ├── notification/  # Push notifications
│   ├── search/        # Property search
│   ├── user/          # User profiles
│   └── viewing/       # Viewing bookings
└── s3/                # File upload service
```

**Architecture Assessment:**
- ✅ **Well-organized** modular structure following NestJS best practices
- ✅ **Scalable** separation of concerns (controllers, services, entities)
- ✅ **Extensible** verification level system instead of rigid roles
- ⚠️ **Growing complexity** - 20+ entities, 15+ modules
- ❌ **Missing** dedicated audit logging module
- ❌ **Missing** GDPR compliance module

### Mobile Architecture

**Framework:** React Native + Expo
**State Management:** Zustand + React Query
**Navigation:** React Navigation (stack + bottom tabs)
**Storage:** MMKV (encrypted local storage)
**API Client:** Axios with interceptors

**Feature Structure:**
```
src/features/
├── auth/              # Registration, login, OTP
├── ai/                # AI chat assistant
├── analytics/         # Property analytics
├── favorites/         # Saved properties
├── kyc/               # Identity verification
├── maps/              # Map search, location picker
├── messaging/         # Real-time chat
├── monetization/      # In-app purchases
├── notifications/     # Push notifications
├── profile/           # User profile, settings
├── properties/        # Listing creation/management
├── search/            # Property search
├── tutorial/          # Onboarding flows
└── viewings/          # Viewing bookings
```

**Architecture Assessment:**
- ✅ **Well-structured** feature-based organization
- ✅ **Consistent** API patterns across features
- ✅ **Secure** token storage (MMKV + Keychain)
- ✅ **Modern** React Native practices (hooks, TypeScript)
- ⚠️ **Token management** could be more robust (auto-refresh implementation unclear)

### Data Flow

```
Mobile App
    ↓ (JWT in Authorization header)
AuthGuard → VerificationGuard → Controller → Service → Database
    ↓ (validation)      ↓ (level check)     ↓ (business logic)
    401 Unauthorized    403 Forbidden        200 OK + Data
```

**Strengths:**
- Consistent authentication flow
- Multi-layer authorization (AuthGuard + VerificationGuard)
- Clear separation of concerns

**Weaknesses:**
- No request logging layer
- No rate limiting middleware visible
- Missing audit trail interceptor

---

## 2. Authentication & Authorization

### Authentication Implementation

**Method:** JWT (JSON Web Tokens) with refresh tokens

**Token Configuration:**
- **Algorithm:** HS256 (HMAC SHA-256)
- **Access Token Expiry:** 3600 seconds (1 hour)
- **Refresh Token Expiry:** 30 days
- **Storage:** Redis (refresh tokens) + PostgreSQL (user sessions)
- **Library:** `jose` for cryptographic operations

**JWT Payload:**
```typescript
{
  sub: userId,           // Subject (user ID)
  iss: 'domaris',       // Issuer
  aud: 'mobile/web',    // Audience
  iat: timestamp,       // Issued at
  exp: timestamp,       // Expiration
  jti: tokenId,         // JWT ID (first 11 chars of refresh token)
  email, firstName, lastName, avatar,
  verificationLevel,
  isAdmin
}
```

**Authentication Endpoints:**
- `POST /auth/register` - Email/password registration (2-step with OTP)
- `POST /auth/register/phone` - Phone registration
- `POST /auth/login` - Email/password login (OTP verification)
- `POST /auth/login/phone` - Phone login
- `POST /auth/oauth/google` - Google OAuth
- `POST /auth/oauth/apple` - Apple OAuth
- `POST /auth/refresh` - Token refresh
- `POST /auth/logout` - Token revocation

**Security Features:**
- ✅ Bcrypt password hashing (10 rounds)
- ✅ OTP verification (6 digits, 10-minute expiry, 5 max attempts)
- ✅ Refresh token rotation on refresh
- ✅ Token revocation on logout (Redis deletion)
- ✅ Email enumeration prevention (forgot-password always returns success)
- ✅ OAuth token verification with official libraries
- ⚠️ No MFA/2FA implementation (optional enhancement)
- ❌ No failed login attempt tracking
- ❌ No account lockout mechanism

**Critical Finding #1: No Brute-Force Protection**
- Location: `backend/src/app/auth/auth.service.ts`
- Issue: No rate limiting on login attempts
- Risk: Account takeover via credential stuffing
- Recommendation: Implement account lockout after 5-10 failed attempts

### Authorization System

**Model:** Verification Level System (not traditional roles)

**ADR-001 Compliant Verification Levels:**

| Level | Name | Requirements | Capabilities |
|-------|------|--------------|--------------|
| **0** | New Account | Email + password | Browse, search, map, favorites |
| **1** | Email Verified | Email/phone verification | + Contact users, request viewings |
| **2** | Identity Verified | Government ID + selfie (KYC) | + Send messages, book viewings |
| **3** | Property Owner | Property ownership documents | + Create listings |

**Admin Flag:**
- Separate `isAdmin` boolean field
- Not tied to verification levels
- Grants access to admin panel and operations

**Guard Implementation:**

1. **AuthGuard** (`backend/src/app/auth/auth.guard.ts`)
   - Global guard applied to all routes
   - Validates JWT signature and expiration
   - Fetches fresh user data from database
   - Allows `@Public()` routes to bypass

2. **VerificationGuard** (`backend/src/app/core/verification.guard.ts`)
   - Checks `@MinVerificationLevel(N)` decorator
   - Throws 403 Forbidden if user level < required level
   - Provides user-friendly error messages

3. **AdminGuard** (`backend/src/app/core/admin.guard.ts`)
   - Checks `@AdminOnly()` decorator
   - Validates `isAdmin` flag on user object
   - Throws 403 if not admin

**Decorators:**
```typescript
@Public()                          // Bypass authentication
@MinVerificationLevel(2)           // Require level 2+
@RequireEmailVerified()            // Shorthand for level 1
@RequireIdentityVerified()         // Shorthand for level 2
@RequirePropertyVerified()         // Shorthand for level 3
@AdminOnly()                       // Require admin flag
@CurrentUser()                     // Inject user object
@CurrentUserId()                   // Inject user ID
```

**Strengths:**
- ✅ Flexible verification level system
- ✅ Clear progression path for users
- ✅ Consistent decorator-based authorization
- ✅ Separate admin privileges

**Weaknesses:**
- ⚠️ No resource ownership checks in guards (must be in services)
- ❌ No audit logging of authorization failures
- ❌ No permission caching (database hit on every request)

### User Roles Identified

**Implicit Roles (based on verification level + context):**

1. **Guest** (Level 0 + not authenticated)
   - Can browse listings, search, view map
   - Cannot contact users or save favorites

2. **Basic User** (Level 0 + authenticated)
   - Can save favorites
   - Cannot contact users or post listings

3. **Verified User** (Level 1)
   - Can contact property owners
   - Can request viewings
   - Cannot post listings

4. **Identified User** (Level 2)
   - Can send/receive messages
   - Can book viewings
   - Cannot post listings

5. **Property Owner** (Level 3)
   - Can create/edit/delete listings
   - Can manage viewings
   - Can access property analytics

6. **Administrator** (isAdmin flag)
   - Can modify user verification levels
   - Can approve/reject KYC documents
   - Can delete users
   - Can change listing status
   - Can grant admin privileges to others

**Critical Finding #2: Admin Privilege Escalation Risk**
- Location: `backend/src/app/modules/user/user.controller.ts:197-218`
- Issue: Any admin can grant admin status to any user (including themselves)
- Risk: No oversight or approval process
- Recommendation: Require super-admin role or multi-admin approval

---

## 3. Data Access & Security

### Sensitive Data Categories

**Personal Data:**
- User: email, phone, firstName, lastName, bio, location, avatar
- KYC: government ID scans, selfies, property deeds, utility bills
- Messages: conversation content, participant IDs
- Viewings: scheduled times, meeting points, feedback
- Transactions: payment details, IP addresses, user agents

**Business Data:**
- Listings: property details, photos, pricing, owner contact info
- Analytics: property views, favorites, contact attempts
- Search history: saved searches, AI conversation logs

### Access Control Analysis

#### 🔴 CRITICAL: Property Analytics - Missing Owner Check

**Location:** `backend/src/app/modules/listing/listing.controller.ts:405`
```typescript
@Get(':id/analytics')
@ApiBearerAuth()
@UseGuards(AuthGuard, VerificationGuard)
@MinVerificationLevel(3)
async getAnalytics(@Param('id') id: string, @Query('period') period)
```

**Issue:** Any Level 3 user can view analytics for **any property**, not just their own.

**Code Comment (line 19):** `// Ideally check if user is owner`

**Risk Assessment:**
- **Severity:** HIGH
- **Impact:** Business intelligence leak, privacy violation
- **Exploitation:** Competitor can view all property performance metrics
- **GDPR Violation:** Yes (unauthorized data access)

**Recommendation:**
```typescript
async getAnalytics(@CurrentUserId() userId: number, @Param('id') id: string) {
  const listing = await Listing.findByPk(id);
  if (!listing) throw new NotFoundException();
  if (listing.ownerId !== userId) throw new ForbiddenException('Not your property');
  return this.analyticsService.getPropertyAnalytics(id, period);
}
```

#### 🔴 CRITICAL: Viewing Availability Disclosure

**Location:** `backend/src/app/modules/viewing/viewing.controller.ts:76-88`
```typescript
@Get('availability/:propertyId')
async getAvailability(@Param('propertyId') propertyId: number)
```

**Issue:** Public endpoint (no `@UseGuards()`) reveals property owner's availability schedule.

**Risk Assessment:**
- **Severity:** MEDIUM-HIGH
- **Impact:** Privacy violation, security risk (reveals when owner is away)
- **Exploitation:** Stalking, social engineering, burglary planning
- **GDPR Violation:** Yes (unnecessary data disclosure)

**Recommendation:**
- Option 1: Require authentication (Level 1+)
- Option 2: Use "blind scheduling" (seeker proposes times, owner accepts/rejects without revealing full calendar)

#### 🔴 CRITICAL: Payment Webhooks - No Signature Verification

**Location:** `backend/src/app/modules/monetization/monetization.controller.ts:599-824`
```typescript
@Public()
@Post('webhooks/stripe')
@Post('webhooks/apple')
@Post('webhooks/google')
@Post('webhooks/paynet')
@Post('webhooks/maib')
@Post('webhooks/mpay')
```

**Issue:** All webhook endpoints are public with TODO comments about signature verification:
```typescript
// TODO: Implement Stripe webhook handling
// TODO: Verify webhook signature
// const isValid = this.verifyPaynetSignature(body, signature);
// if (!isValid) { return { received: false, error: 'Invalid signature' }; }
```

**Risk Assessment:**
- **Severity:** CRITICAL
- **Impact:** Fraudulent subscription activation, financial loss
- **Exploitation:** Attacker can forge webhooks to activate subscriptions/promotions without payment
- **Compliance:** PCI-DSS violation

**Recommendation:** Implement webhook signature verification for ALL payment providers before production.

#### 🟡 MEDIUM: Health Endpoint - Infrastructure Disclosure

**Location:** `backend/src/app/app.controller.ts:5-26`
```typescript
@Get('health')
getHealth() {
  return {
    environment: process.env.NODE_ENV,
    redis: { host: process.env.REDIS_HOST ? '✅ Set' : '❌ Missing' },
    database: { host: process.env.DB_HOST ? '✅ Set' : '❌ Missing' },
    google: { clientId: process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing' }
  };
}
```

**Issue:** Public endpoint reveals infrastructure details.

**Risk Assessment:**
- **Severity:** LOW-MEDIUM
- **Impact:** Information disclosure aids reconnaissance
- **Recommendation:** Return simple `{ status: 'ok' }` or require admin authentication

### Over-Permissive Access Patterns

**Endpoints with Potential Issues:**

1. **Saved Searches** - Service must verify userId matches search owner
2. **Chat Conversations** - Must verify user is participant
3. **Listing Update/Delete** - Must verify user is listing owner
4. **Promotion Creation** - Must verify user owns the listing

**Code Review Status:** Guards are present, but **ownership checks must be in service layer**.

**Recommendation:** Add explicit ownership verification in all services handling user-owned resources.

---

## 4. Logging & Auditability

### Existing Logging Mechanisms

**Framework:** NestJS Logger (built-in)
**Configuration:** `['log', 'error', 'warn', 'debug', 'verbose']`
**Output:** Console (not persisted by default)

**Services Using Logger:**
- S3Service, EmailService, SMSService, PushService
- ListingService, MonetizationService, SubscriptionService
- SearchService, AIService
- 20+ total services

**Logging Patterns:**
```typescript
this.logger.log(`Creating listing for ownerId: ${ownerId}`);
this.logger.warn('Payment confirmation failed');
this.logger.error('Internal error', exception);
console.log('[ADMIN] User verification changed');
```

### Audit Trail Analysis

**✅ IMPLEMENTED:**

1. **Payment Transaction Logs** (`transaction.entity.ts`)
   - Explicitly documented as "audit log for payments"
   - Tracks: userId, type, status, amount, paymentMethod, ipAddress, userAgent
   - Includes: failureCode, failureMessage, refundReason
   - Timestamps: createdAt, completedAt, failedAt, refundedAt

2. **KYC Verification Audit** (`kyc-verification.entity.ts`)
   - Tracks: status transitions, submittedAt, reviewedAt, reviewedBy (admin ID)
   - Includes: rejectionReason for compliance
   - Expiration tracking for regulatory compliance

3. **Listing Views Tracking** (`listing-view.entity.ts`)
   - Tracks: viewerId, ip, anonymousId
   - Immutable events (no updatedAt field)

**❌ MISSING:**

### Critical Audit Gaps

| Event Type | Status | Impact | GDPR Risk |
|-----------|--------|--------|-----------|
| **User login success** | ❌ Not logged | Cannot detect unauthorized access | HIGH |
| **Failed login attempts** | ❌ Not logged | No brute-force detection | HIGH |
| **Password changes** | ❌ Not logged | Cannot prove user action | MEDIUM |
| **Admin user deletion** | ❌ Not logged | Cannot audit admin actions | CRITICAL |
| **Admin verification change** | ⚠️ console.log only | Not persisted to database | CRITICAL |
| **Admin privilege grant** | ❌ Not logged | No oversight of admin creation | CRITICAL |
| **Listing status change by admin** | ❌ Not logged | Cannot audit moderation | MEDIUM |
| **KYC approval/rejection** | ⚠️ console.log only | Regulatory compliance risk | HIGH |
| **Data export requests** | ❌ Not logged | GDPR violation (Article 30) | CRITICAL |
| **Account deletion requests** | ❌ Not logged | GDPR violation (Article 30) | CRITICAL |
| **User data access by admin** | ❌ Not logged | Cannot prove compliance | CRITICAL |

### Specific Audit Issues

#### Issue #1: Admin Actions Not Audited
**Location:** `backend/src/app/modules/admin/admin.controller.ts`

**Unlogged Admin Operations:**
- `deleteUser()` - No record of who deleted whom
- `updateVerificationLevel()` - Only console.log
- `setAdminStatus()` - No audit trail
- `updateListingStatus()` - No record of moderation

**Compliance Impact:**
- Cannot prove who made changes (accountability)
- Cannot respond to GDPR Article 30 (records of processing)
- Cannot detect insider threats

#### Issue #2: GDPR Request Tracking Missing
**Location:** `backend/src/app/modules/user/user.controller.ts:126-141`

```typescript
@Post('me/export')
async requestExport(@CurrentUserId() userId: number) {
  return this.userService.requestDataExport(userId);
  // NO LOGGING
}

@Delete('me')
async deleteMyAccount(@CurrentUserId() userId: number) {
  await this.userService.deleteUser(userId);
  // NO LOGGING
}
```

**Compliance Impact:**
- Cannot prove compliance with GDPR requests
- No audit trail for data subject requests
- Cannot track request completion timeline

#### Issue #3: Authentication Events Not Logged

**Missing:**
- Successful logins (only `lastActiveAt` updated)
- Failed login attempts
- OTP generation/verification
- OAuth authentication events
- Token refresh events
- Logout events

**Security Impact:**
- Cannot detect credential stuffing attacks
- Cannot identify compromised accounts
- Cannot forensically investigate security incidents

### Legal & Operational Risk

**Moldova Law Requirements:**
- Law 133/2011 (Personal Data Protection) - requires audit trail
- Likely requirement: 90-day retention of security events

**Documentation Claims:**
- GDPR doc mentions "Elasticsearch for 90-day audit logs"
- **Reality:** No Elasticsearch integration found in codebase

**Risk Level:** 🔴 **CRITICAL** - Cannot demonstrate compliance to regulators

---

## 5. Access Restriction & Internal Security

### Admin/Developer Access

**Admin Account Structure:**
- Single `isAdmin` boolean flag on User entity
- No distinction between:
  - Super admin vs. regular admin
  - Technical admin vs. business admin
  - Read-only admin vs. full access

**Admin Capabilities:**
- List all users (`GET /admin/users`)
- Delete any user (`DELETE /admin/users/:id`)
- Modify verification levels
- Grant/revoke admin status (including self-elevation)
- Approve/reject KYC documents
- Change listing status (moderation)
- Access system statistics

**Critical Security Issues:**

#### Issue #1: Shared Admin Accounts Likely
**Evidence:**
- No admin username/email tracking
- Admin actions log userId, but developers may share accounts
- No separate "developer" vs. "admin" roles

**Risk:**
- Cannot trace actions to individual person
- Team of 2-3 developers likely sharing admin credentials
- Violates principle of individual accountability

**Recommendation:**
- Each person must have individual admin account
- Use email as unique identifier
- Implement admin action logging with email/name

#### Issue #2: No Admin Action Traceability
**Evidence:**
- Admin operations not logged (see Section 4)
- `reviewedBy` field in KYC only stores userId (not immutable audit record)

**Risk:**
- Cannot answer "who deleted user X?"
- Cannot answer "who approved this suspicious KYC?"
- Insider threat detection impossible

#### Issue #3: Admin Privilege Escalation
**Location:** `backend/src/app/modules/user/user.controller.ts:197-218`

```typescript
@Patch('admin/:id/admin')
@UseGuards(AuthGuard, AdminGuard)
async toggleAdmin(@Param('id') userId: number, @Body('isAdmin') isAdmin: boolean) {
  return this.userService.setAdminStatus(userId, isAdmin);
  // NO APPROVAL PROCESS
  // NO AUDIT LOG
  // ADMIN CAN GRANT THEMSELVES MORE ACCESS
}
```

**Risk:**
- Single admin can create unlimited admin accounts
- No oversight or approval workflow
- Rogue admin can grant access to external parties

**Recommendation:**
- Require multi-admin approval for new admin creation
- OR create separate "super-admin" role
- Always log admin status changes with timestamp + admin email

### Production Data Access

**Current State:**
- Developers have direct database access (assumed for 2-3 person team)
- No audit logging of direct database queries
- No distinction between production and development access

**Risks for Small Team:**

1. **Accidental Data Modification**
   - Severity: MEDIUM
   - Likelihood: HIGH (small team, direct DB access)
   - Mitigation: Read-only replicas for analysis, write operations via API only

2. **Privacy Violation**
   - Severity: HIGH
   - Likelihood: MEDIUM (curious developer accessing user messages)
   - Mitigation: Audit all production queries, access logs

3. **Data Leak**
   - Severity: CRITICAL
   - Likelihood: LOW (but impact severe)
   - Mitigation: Database access logging, IP whitelisting

**Recommendations for Small Team:**

✅ **Acceptable for MVP:**
- Developers have admin accounts (not shared credentials)
- Admin panel for most operations (avoid direct DB access)
- Database access via VPN only

❌ **Not Acceptable:**
- Shared admin accounts
- No logging of admin operations
- Production database access from personal laptops

🔧 **Minimal Security Improvements:**
1. Each developer has named admin account (personal email)
2. Enable PostgreSQL query logging for production
3. Implement basic admin action audit log table
4. Use SSH tunnels or VPN for database access
5. Rotate database passwords quarterly

---

## 6. Legal & Compliance Readiness

### GDPR Compliance Assessment

**Documentation Status:**
- ✅ GDPR compliance document exists (`docs/mobile/security/GDPR-COMPLIANCE.md`)
- ⚠️ Marked as "Draft - pending legal review"
- ⚠️ Version 1.0.0 (January 2026) - not yet finalized

### Article-by-Article Analysis

#### Article 5: Principles (Lawfulness, Fairness, Transparency)
**Status:** 🟡 PARTIAL

✅ **Implemented:**
- Data minimization via verification levels
- Purpose limitation (only collect what's needed for service)

❌ **Missing:**
- No Privacy Policy found in codebase
- No Terms of Service
- No cookie consent mechanism (web)
- Transparency documents not linked in app

#### Article 6: Lawful Basis for Processing
**Status:** 🔴 INCOMPLETE

❌ **Missing:**
- No consent management system
- No granular consent tracking
- Cannot prove when user consented to terms
- Cannot track consent withdrawal

**Documented but Not Implemented:**
```typescript
interface ConsentCheckboxes {
  termsAccepted: boolean;        // Mandatory
  privacyPolicyAccepted: boolean; // Mandatory
  marketingConsent: boolean;       // Optional
  analyticsConsent: boolean;       // Optional
}
```

#### Article 7: Conditions for Consent
**Status:** 🔴 NOT IMPLEMENTED

❌ **Missing:**
- No consent entity/table
- No timestamp of consent
- No ability to withdraw specific consents
- No re-consent mechanism for policy changes

✅ **Partial Implementation:**
- Notification preferences exist (but not full GDPR consent)

#### Article 13-14: Information to Data Subjects
**Status:** 🔴 NOT READY

❌ **Missing:**
- Privacy Policy not found in codebase
- DPO contact mentioned (`dpo@riva.ro`) but not displayed in app
- No data retention information shown to users
- No third-party data sharing disclosure

#### Article 15: Right of Access
**Status:** 🟡 PARTIAL

✅ **Implemented:**
- `POST /users/me/export` endpoint exists
- Mobile API: `profileApi.requestDataExport()`

⚠️ **Limitations:**
- Only returns basic profile data
- Missing: listings, messages, favorites, viewings, search history
- No email delivery mechanism
- No 24-hour download link expiration

**Code Status:**
```typescript
// backend/src/app/modules/user/user.service.ts
async requestDataExport(userId: number) {
  const user = await User.findByPk(userId);
  // TODO: Include all related data
  return user.toJSON();
}
```

#### Article 16: Right to Rectification
**Status:** ✅ IMPLEMENTED

- `PATCH /users/me` endpoint allows profile updates
- Works correctly

#### Article 17: Right to Erasure ("Right to be Forgotten")
**Status:** 🟡 PARTIAL

✅ **Implemented:**
- `DELETE /users/me` endpoint exists
- Soft delete enabled (paranoid mode)

❌ **Missing:**
- No 14-day grace period (documented but not implemented)
- No automatic permanent deletion after grace period
- Cascade deletion of related data unclear
- No data anonymization process

**Documentation Claims:**
- 30-day deletion timeline (account + 30 days)
- Grace period for account recovery

**Code Reality:**
```typescript
async deleteUser(userId: number) {
  const user = await User.findByPk(userId);
  await user.destroy(); // Soft delete only
  // NO GRACE PERIOD
  // NO CASCADING DELETION
  // NO ANONYMIZATION
}
```

#### Article 20: Right to Data Portability
**Status:** 🔴 INCOMPLETE

- Export endpoint exists but incomplete (see Article 15)
- No structured format (JSON/CSV)
- Missing comprehensive data export

#### Article 30: Records of Processing Activities
**Status:** 🔴 NOT IMPLEMENTED

❌ **Critical Gap:**
- No audit logging of data processing activities
- Cannot prove compliance with processing records requirement
- No DPIA (Data Protection Impact Assessment) framework

**Documentation mentions:**
- Elasticsearch for 90-day audit logs

**Reality:**
- No Elasticsearch integration found
- Only console.log() for most events
- Transaction and KYC entities have some audit fields

#### Article 32: Security of Processing
**Status:** 🟡 ADEQUATE (with caveats)

✅ **Implemented:**
- Bcrypt password hashing
- JWT token authentication
- KYC documents encrypted in S3
- HTTPS enforcement (assumed)
- Database credentials in environment variables

❌ **Missing:**
- No encryption at rest for messages
- No database column encryption for sensitive fields
- No security incident response plan documented

### Moldova-Specific Requirements

**Law 133/2011 (Personal Data Protection):**
- Requires data protection officer (DPO) - mentioned but not visible
- Requires notification to National Center for Personal Data Protection
- **Status:** 🔴 COMPLIANCE UNKNOWN (no evidence of registration)

**Data Localization:**
- Documentation mentions AWS EU (Frankfurt/Ireland)
- ✅ Compliant with EU data residency

### KYC/AML Compliance

**Requirements for Real Estate Platform:**
- Identity verification for high-value transactions
- Document retention (5 years minimum)

**Implementation:**
- ✅ KYC document upload system
- ✅ Manual review workflow
- ✅ Document retention structure
- ⚠️ No automated deletion after 5 years
- ❌ No DPA with KYC provider (Onfido/Sumsub recommended but not integrated)

### Payment Compliance

**PCI-DSS Status:**
- ✅ Uses third-party payment processors (Stripe, PayNet, MAIB, MPay)
- ✅ No card data stored in application
- ⚠️ Webhook signature verification missing (see Section 3)

---

## 7. MVP Launch Readiness

### ❌ BLOCKERS (Cannot Launch Without)

1. **🔴 Payment Webhook Security**
   - **Issue:** Webhooks not verified, can be forged
   - **Impact:** Financial fraud, fake subscriptions
   - **Effort:** 1-2 days per provider
   - **Priority:** CRITICAL

2. **🔴 Property Analytics Access Control**
   - **Issue:** Any Level 3 user can view any property's analytics
   - **Impact:** Business intelligence leak
   - **Effort:** 2-4 hours
   - **Priority:** CRITICAL

3. **🔴 Admin Action Audit Logging**
   - **Issue:** No traceability of admin operations
   - **Impact:** Cannot prove compliance, insider threat
   - **Effort:** 1-2 days
   - **Priority:** CRITICAL

4. **🔴 Basic GDPR Consent Tracking**
   - **Issue:** No proof of user consent to terms
   - **Impact:** GDPR violation, legal risk
   - **Effort:** 1 day
   - **Priority:** CRITICAL

5. **🔴 Privacy Policy & Terms of Service**
   - **Issue:** No legal documentation provided to users
   - **Impact:** GDPR violation, cannot process data legally
   - **Effort:** 2-3 days (with lawyer review)
   - **Priority:** CRITICAL

### ⚠️ HIGH PRIORITY (Fix in First Month)

6. **🟡 Complete Data Export Functionality**
   - **Issue:** Only exports basic profile, missing related data
   - **Impact:** GDPR Article 15 violation
   - **Effort:** 2-3 days
   - **Timeline:** Within 30 days of launch

7. **🟡 Account Deletion Grace Period**
   - **Issue:** Soft delete works, but no grace period or permanent deletion
   - **Impact:** GDPR Article 17 partial compliance
   - **Effort:** 1-2 days
   - **Timeline:** Within 30 days

8. **🟡 Failed Login Tracking & Rate Limiting**
   - **Issue:** No brute-force protection
   - **Impact:** Account takeover risk
   - **Effort:** 1 day
   - **Timeline:** Within 30 days

9. **🟡 Viewing Availability Access Control**
   - **Issue:** Public disclosure of owner schedules
   - **Impact:** Privacy/security risk
   - **Effort:** 4-6 hours
   - **Timeline:** Within 30 days

10. **🟡 Individual Admin Accounts**
    - **Issue:** Likely shared credentials
    - **Impact:** No personal accountability
    - **Effort:** 1-2 hours (policy + verification)
    - **Timeline:** Before launch

### ✅ ACCEPTABLE TO POSTPONE

11. **🟢 Multi-Admin Approval for Privilege Escalation**
    - **Current:** Any admin can create admins
    - **Risk:** LOW (2-3 person trusted team)
    - **Timeline:** Post-MVP (when team grows)

12. **🟢 Database Query Audit Logging**
    - **Current:** Direct DB access assumed
    - **Risk:** MEDIUM (small team, trusted)
    - **Timeline:** Post-MVP (when scaling)

13. **🟢 Advanced Security Features**
    - MFA/2FA authentication
    - IP whitelisting for admin panel
    - SIEM integration
    - **Timeline:** Phase 2 (6+ months)

14. **🟢 Automated Data Retention**
    - **Current:** Manual retention policy documented
    - **Risk:** LOW (can be managed manually initially)
    - **Timeline:** Phase 2 (when data volume increases)

15. **🟢 Third-Party KYC Integration**
    - **Current:** Manual KYC review
    - **Risk:** LOW (acceptable for MVP scale)
    - **Timeline:** When KYC volume exceeds 10/day

---

## 8. Prioritized Recommendations

### 🔥 MUST FIX BEFORE LAUNCH (5 items, ~5-7 days)

#### 1. Implement Webhook Signature Verification
**File:** `backend/src/app/modules/monetization/monetization.controller.ts:599-824`

**Implementation:**
```typescript
@Post('webhooks/stripe')
async handleStripeWebhook(@Req() req, @Headers('stripe-signature') signature: string) {
  const isValid = this.stripeService.verifySignature(req.rawBody, signature);
  if (!isValid) throw new ForbiddenException('Invalid signature');
  // Process webhook
}
```

**Providers to implement:**
- Stripe (webhook secret)
- PayNet (HMAC signature)
- MAIB (signature verification)
- MPay (API key verification)

**Effort:** 1-2 days
**Documentation:** Available for all providers

---

#### 2. Add Property Owner Verification to Analytics
**File:** `backend/src/app/modules/listing/listing.controller.ts:405`

**Implementation:**
```typescript
@Get(':id/analytics')
async getAnalytics(@CurrentUserId() userId: number, @Param('id') id: string) {
  const listing = await this.listingService.findOne(id);
  if (!listing) throw new NotFoundException();
  if (listing.ownerId !== userId) {
    throw new ForbiddenException('You can only view analytics for your own properties');
  }
  return this.analyticsService.getPropertyAnalytics(id, period);
}
```

**Effort:** 2-4 hours
**Testing:** Verify Level 3 user cannot access other users' analytics

---

#### 3. Create Admin Audit Log System
**New Files:**
- `backend/src/app/db/entities/admin-audit-log.entity.ts`
- `backend/src/app/core/decorators/auditable.decorator.ts`

**Schema:**
```typescript
@Table({ tableName: 'admin_audit_logs', timestamps: true })
export class AdminAuditLog extends Model {
  @Column adminId: number;
  @Column adminEmail: string;
  @Column action: string; // 'USER_DELETE', 'VERIFICATION_CHANGE', etc.
  @Column targetType: string; // 'User', 'Listing', etc.
  @Column targetId: number;
  @Column oldValue: string; // JSON
  @Column newValue: string; // JSON
  @Column ipAddress: string;
  @Column userAgent: string;
  @Column createdAt: Date;
}
```

**Events to log:**
- User deletion
- Verification level changes
- Admin status grants
- KYC approval/rejection
- Listing status changes

**Implementation:**
```typescript
// In admin.service.ts
async deleteUser(adminId: number, adminEmail: string, userId: number) {
  const user = await User.findByPk(userId);
  await user.destroy();

  await AdminAuditLog.create({
    adminId,
    adminEmail,
    action: 'USER_DELETE',
    targetType: 'User',
    targetId: userId,
    oldValue: JSON.stringify(user.toJSON()),
    ipAddress: req.ip,
  });
}
```

**Effort:** 1-2 days
**Retention:** 90 days minimum (Moldova compliance)

---

#### 4. Implement Basic Consent Tracking
**New Files:**
- `backend/src/app/db/entities/user-consent.entity.ts`

**Schema:**
```typescript
@Table({ tableName: 'user_consents' })
export class UserConsent extends Model {
  @Column userId: number;
  @Column consentType: 'TERMS' | 'PRIVACY' | 'MARKETING' | 'ANALYTICS';
  @Column granted: boolean;
  @Column version: string; // Policy version
  @Column grantedAt: Date;
  @Column withdrawnAt?: Date;
  @Column ipAddress: string;
}
```

**Registration Flow Update:**
```typescript
// In auth.service.ts
async registerEmail(email, password, consents: ConsentDto) {
  const user = await User.create({ email, password });

  await UserConsent.bulkCreate([
    { userId: user.id, consentType: 'TERMS', granted: consents.termsAccepted, version: '1.0', grantedAt: new Date(), ipAddress: req.ip },
    { userId: user.id, consentType: 'PRIVACY', granted: consents.privacyPolicyAccepted, version: '1.0', grantedAt: new Date(), ipAddress: req.ip },
    { userId: user.id, consentType: 'MARKETING', granted: consents.marketingConsent, version: '1.0', grantedAt: new Date(), ipAddress: req.ip },
  ]);
}
```

**Mobile Update:**
- Add consent checkboxes to registration screen
- Require terms + privacy acceptance
- Optional marketing consent

**Effort:** 1 day (backend + mobile)

---

#### 5. Create Privacy Policy & Terms of Service
**Deliverables:**
- Privacy Policy (Romanian + English)
- Terms of Service (Romanian + English)
- Cookie Policy (if web version exists)

**Minimum Content:**
- Data controller identity (SRL name, address)
- DPO contact (dpo@riva.ro)
- Data collected and purposes
- Legal basis for processing
- Third-party data sharing (AWS, payment processors, analytics)
- User rights (access, deletion, portability)
- Data retention periods
- Contact information

**Implementation:**
- Host on website or serve via `/legal/privacy-policy` endpoint
- Link in mobile app (Settings > Privacy Policy)
- Require acceptance during registration

**Effort:** 2-3 days (with lawyer review)
**Cost:** €200-500 for legal review in Moldova

---

### 🟡 SHOULD FIX WITHIN 30 DAYS (5 items, ~5-7 days)

#### 6. Complete Data Export Functionality
**File:** `backend/src/app/modules/user/user.service.ts`

**Current:**
```typescript
async requestDataExport(userId: number) {
  const user = await User.findByPk(userId);
  return user.toJSON(); // Incomplete
}
```

**Target:**
```typescript
async requestDataExport(userId: number) {
  const user = await User.findByPk(userId);
  const listings = await Listing.findAll({ where: { ownerId: userId } });
  const favorites = await Favorite.findAll({ where: { userId } });
  const messages = await Message.findAll({ where: { senderId: userId } });
  const viewings = await Viewing.findAll({ where: { seekerId: userId } });
  const savedSearches = await SavedSearch.findAll({ where: { userId } });

  const exportData = {
    user: user.toJSON(),
    listings: listings.map(l => l.toJSON()),
    favorites: favorites.map(f => f.toJSON()),
    messages: messages.map(m => m.toJSON()),
    viewings: viewings.map(v => v.toJSON()),
    savedSearches: savedSearches.map(s => s.toJSON()),
    exportedAt: new Date(),
  };

  // Generate downloadable file
  const filePath = await this.generateExportFile(userId, exportData);

  // Send email with download link (24-hour expiration)
  await this.emailService.sendExportLink(user.email, filePath);

  return { status: 'processing', message: 'Export will be sent to your email' };
}
```

**Effort:** 2-3 days
**Format:** JSON (initially), CSV (optional)

---

#### 7. Implement Account Deletion Grace Period
**File:** `backend/src/app/modules/user/user.service.ts`

**Implementation:**
```typescript
async deleteUser(userId: number) {
  const user = await User.findByPk(userId);

  // Soft delete (sets deletedAt timestamp)
  await user.destroy();

  // Schedule permanent deletion in 14 days
  await this.schedulePermanentDeletion(userId, 14);

  // Notify user
  await this.emailService.sendAccountDeletionConfirmation(user.email, 14);
}

async permanentlyDeleteUser(userId: number) {
  // Delete related data
  await Favorite.destroy({ where: { userId }, force: true });
  await SavedSearch.destroy({ where: { userId }, force: true });
  await Message.update({ senderId: null }, { where: { senderId: userId } }); // Anonymize

  // Permanently delete user
  await User.destroy({ where: { id: userId }, force: true });
}
```

**Cron Job:**
```typescript
@Cron('0 2 * * *') // Daily at 2 AM
async processPendingDeletions() {
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const usersToDelete = await User.findAll({
    where: {
      deletedAt: { [Op.lte]: fourteenDaysAgo }
    },
    paranoid: false
  });

  for (const user of usersToDelete) {
    await this.permanentlyDeleteUser(user.id);
  }
}
```

**Effort:** 1-2 days

---

#### 8. Add Failed Login Tracking & Rate Limiting
**New Entity:**
```typescript
@Table({ tableName: 'login_attempts' })
export class LoginAttempt extends Model {
  @Column email: string;
  @Column success: boolean;
  @Column ipAddress: string;
  @Column userAgent: string;
  @Column attemptedAt: Date;
}
```

**Implementation:**
```typescript
// In auth.service.ts
async login(email: string, password: string, req: Request) {
  // Check if account is locked
  const recentFailures = await LoginAttempt.count({
    where: {
      email,
      success: false,
      attemptedAt: { [Op.gte]: new Date(Date.now() - 15 * 60 * 1000) } // Last 15 minutes
    }
  });

  if (recentFailures >= 5) {
    throw new TooManyRequestsException('Account temporarily locked. Try again in 15 minutes.');
  }

  const user = await User.findOne({ where: { email } });
  const valid = user && await bcrypt.compare(password, user.password);

  // Log attempt
  await LoginAttempt.create({
    email,
    success: valid,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    attemptedAt: new Date()
  });

  if (!valid) {
    throw new UnauthorizedException('Invalid credentials');
  }

  // Generate tokens and return
}
```

**Effort:** 1 day
**Retention:** 90 days for login attempts

---

#### 9. Secure Viewing Availability Endpoint
**File:** `backend/src/app/modules/viewing/viewing.controller.ts:76-88`

**Option 1: Require Authentication**
```typescript
@Get('availability/:propertyId')
@UseGuards(AuthGuard, VerificationGuard)
@MinVerificationLevel(1) // Require email verification
async getAvailability(@Param('propertyId') propertyId: number) {
  return this.viewingService.getAvailability(propertyId);
}
```

**Option 2: Blind Scheduling (Better UX)**
```typescript
// Remove getAvailability endpoint entirely
// Seeker proposes times, owner accepts/rejects
@Post('request')
@MinVerificationLevel(2)
async requestViewing(@Body() dto: RequestViewingDto) {
  // Seeker proposes 2-3 time slots
  // Owner gets notification and accepts one slot
  // Prevents calendar disclosure
}
```

**Effort:** 4-6 hours
**Recommendation:** Option 2 (better privacy)

---

#### 10. Enforce Individual Admin Accounts
**Action Items:**
1. Create individual admin accounts for each developer (use personal emails)
2. Disable any shared admin accounts
3. Document in team policy: "No shared credentials"

**Verification:**
```sql
SELECT email, isAdmin FROM users WHERE isAdmin = true;
```

**Expected:** 2-3 accounts with personal emails (not admin@domaris.md)

**Effort:** 1-2 hours (policy + verification)

---

### 🟢 NICE TO HAVE (Can Postpone to Phase 2)

- Multi-admin approval for privilege escalation
- Database query audit logging (production)
- MFA/2FA authentication
- Advanced rate limiting (per user/IP)
- Automated data retention jobs
- Third-party KYC integration (Onfido/Sumsub)
- SIEM integration for security monitoring
- IP whitelisting for admin panel
- Security incident response plan
- DPIA framework for new features

---

## 9. Summary & Recommendations

### Current State Summary

**Strengths:**
- ✅ Well-architected verification level system
- ✅ Solid JWT authentication foundation
- ✅ Proper password hashing
- ✅ Basic authorization guards in place
- ✅ Payment transaction audit logging
- ✅ KYC workflow with manual review

**Critical Weaknesses:**
- 🔴 Payment webhooks not secured (financial risk)
- 🔴 No admin action audit logging (compliance risk)
- 🔴 Property analytics accessible by anyone (business risk)
- 🔴 No consent tracking (GDPR violation)
- 🔴 No Privacy Policy or Terms of Service (legal blocker)

**Overall Assessment:**
- **Security:** 6/10 (good foundation, critical gaps)
- **GDPR Compliance:** 4/10 (major gaps in consent, audit, transparency)
- **Production Ready:** NO (requires 5 critical fixes)

### Launch Blockers Checklist

Before production launch, you MUST complete:

- [ ] **1. Payment webhook signature verification** (all providers)
- [ ] **2. Property analytics owner verification**
- [ ] **3. Admin audit logging system**
- [ ] **4. Basic consent tracking (terms + privacy)**
- [ ] **5. Privacy Policy + Terms of Service (with legal review)**

**Total Effort:** 5-7 days
**Estimated Cost:** €200-500 (legal review)

### Post-Launch (30 Days) Checklist

- [ ] **6. Complete data export functionality**
- [ ] **7. Account deletion grace period**
- [ ] **8. Failed login tracking + rate limiting**
- [ ] **9. Viewing availability access control**
- [ ] **10. Individual admin accounts (policy enforcement)**

**Total Effort:** 5-7 days

### Acceptable Risks for MVP

Given your startup context (2-3 developers, SRL, Moldova), these are acceptable to defer:

✅ **Direct database access** - OK if:
- Each developer uses individual named accounts
- PostgreSQL query logging enabled
- VPN or SSH tunnel required

✅ **Manual KYC review** - OK if:
- Volume < 10 verifications/day
- Admin audit logging implemented
- Document retention enforced

✅ **No MFA** - OK if:
- Strong password requirements enforced
- Failed login tracking implemented
- Account lockout after 5 attempts

✅ **Shared codebase access** - OK if:
- Git commit history provides accountability
- Code reviews required for security-sensitive changes

### Moldova SRL Compliance

**Minimum Legal Requirements:**
1. ✅ Company registered as data controller
2. ❌ Privacy Policy published (BLOCKER)
3. ⚠️ DPO designated (mentioned but not visible)
4. ❌ Registration with National Center for Personal Data Protection (unclear)

**Action:** Consult Moldovan data protection lawyer before launch.

### Final Recommendation

**Can you launch?**
**NO** - Not yet. You are **5-7 days away** from minimum viable security.

**What's the path forward?**

**Week 1 (Critical Fixes):**
- Days 1-2: Webhook signature verification
- Day 3: Property analytics + viewing availability + failed login tracking
- Day 4: Admin audit logging system
- Day 5: Consent tracking implementation
- Days 6-7: Privacy Policy + Terms (with lawyer)

**Week 2 (Testing):**
- Security testing of webhook verification
- End-to-end consent flow testing
- Admin audit log verification
- Load testing with rate limiting

**Week 3 (Post-Launch):**
- Data export completion
- Account deletion grace period
- Monitoring and incident response

**Week 4 (Compliance):**
- GDPR documentation finalization
- Moldovan data protection registration
- DPA agreements with sub-processors

**Total Timeline to Production:** 2-3 weeks

### Budget Estimate

| Item | Cost | Notes |
|------|------|-------|
| Developer time (80-100 hours) | Internal | 2 devs × 1 week |
| Legal review (Privacy Policy) | €200-500 | Moldova lawyer |
| Security testing | €0-300 | Manual testing OK for MVP |
| **Total** | **€200-800** | Minimal for startup |

### Success Criteria

You're ready to launch when:
- ✅ All 5 blockers resolved
- ✅ Privacy Policy live and linked in app
- ✅ Consent checkboxes in registration flow
- ✅ Admin audit logging operational
- ✅ Security testing completed (manual OK)
- ✅ Team trained on admin account policies

---

## Appendix: Key File References

**Authentication:**
- `backend/src/app/auth/auth.service.ts:668-717` - JWT implementation
- `backend/src/app/auth/auth.guard.ts` - Global authentication guard
- `backend/src/app/core/verification.guard.ts` - Verification level enforcement

**Authorization Issues:**
- `backend/src/app/modules/listing/listing.controller.ts:405` - Analytics access (CRITICAL)
- `backend/src/app/modules/viewing/viewing.controller.ts:76-88` - Availability disclosure (HIGH)
- `backend/src/app/modules/monetization/monetization.controller.ts:599-824` - Webhook security (CRITICAL)

**Data Models:**
- `backend/src/app/db/entities/user.entity.ts` - User model with verification levels
- `backend/src/app/db/entities/kyc-verification.entity.ts` - KYC audit trail
- `backend/src/app/db/entities/transaction.entity.ts` - Payment audit log

**GDPR:**
- `docs/mobile/security/GDPR-COMPLIANCE.md` - Compliance documentation (draft)
- `backend/src/app/modules/user/user.controller.ts:126-141` - Data export/deletion endpoints

**Admin:**
- `backend/src/app/modules/admin/admin.controller.ts` - Admin operations (no audit logging)
- `backend/src/app/modules/user/user.controller.ts:197-218` - Admin privilege escalation

---

**End of Report**

*This security audit was conducted based on static code analysis and documentation review. Production deployment should include penetration testing and legal review specific to Moldovan data protection law.*
