# 🔒 Arhitectura de Securitate

**Versiune:** 1.0.0  
**Data:** Ianuarie 2026  
**Clasificare:** Confidențial

---

## 📋 Cuprins

1. [Principii de Securitate](#principii-de-securitate)
2. [Securitate Transport](#securitate-transport)
3. [Autentificare și Autorizare](#autentificare-și-autorizare)
4. [Stocare Securizată](#stocare-securizată)
5. [Protecția Aplicației](#protecția-aplicației)
6. [Protecția Datelor](#protecția-datelor)
7. [Checklist Securitate](#checklist-securitate)

---

## 🎯 Principii de Securitate

### Defense in Depth

Implementăm multiple straturi de securitate:

1. **Transport** - TLS, Certificate Pinning
2. **Autentificare** - JWT, MFA, Biometrics
3. **Stocare** - Criptare, Keychain
4. **Aplicație** - Obfuscare, Tamper Detection
5. **Date** - Encryption at rest, Minimizare

### Zero Trust

- Nu presupunem niciodată că requestul este legitim
- Validare pe client ȘI server
- Rate limiting și throttling

### Least Privilege

- Cerere permisiuni doar când e nevoie
- Acces minimal la date

---

## 🔐 Securitate Transport

### TLS/HTTPS

```typescript
// TOATE conexiunile trebuie să fie HTTPS
// Configurare în axios/fetch

const api = axios.create({
  baseURL: "https://api.imobi.ro", // Doar HTTPS
  timeout: 30000,
});
```

### Certificate Pinning

```typescript
// react-native-ssl-pinning
import { fetch } from "react-native-ssl-pinning";

const secureRequest = async (url: string) => {
  return fetch(url, {
    method: "GET",
    sslPinning: {
      certs: ["imobi_cert"], // SHA-256 hash of certificate
    },
    headers: {
      "Content-Type": "application/json",
    },
  });
};
```

**Certificate Rotation:**

- Backup pins pentru rotație
- Minimum 2 pins activi
- Rotație la 6 luni înainte de expirare

---

## 🔑 Autentificare și Autorizare

### JWT Strategy

```typescript
// Token structure
interface AccessToken {
  header: {
    alg: "RS256";
    typ: "JWT";
  };
  payload: {
    sub: string; // User ID
    email: string;
    roles: string[];
    iat: number;
    exp: number; // 15 minute expiry
    jti: string; // Token ID for revocation
  };
}

// Refresh Token
// - Opaque token (nu JWT)
// - Stocat în httpOnly cookie (web) / Keychain (mobile)
// - Expirare 30 zile
// - Revocare la logout
```

### Token Flow

```
1. Login → Access Token (15min) + Refresh Token (30d)
2. Request → Authorization: Bearer <access_token>
3. 401 Response → Refresh Token → New Access Token
4. Refresh expired → Re-login required
```

### Multi-Factor Authentication

| Factor                 | Implementare                      |
| ---------------------- | --------------------------------- |
| **Something you know** | Password                          |
| **Something you have** | SMS OTP, TOTP (Authenticator)     |
| **Something you are**  | Biometrics (Face ID, Fingerprint) |

### Biometric Auth

```typescript
import ReactNativeBiometrics from "react-native-biometrics";

const authenticateWithBiometrics = async () => {
  const rnBiometrics = new ReactNativeBiometrics();

  const { available, biometryType } = await rnBiometrics.isSensorAvailable();

  if (!available) {
    throw new Error("Biometrics not available");
  }

  const { success } = await rnBiometrics.simplePrompt({
    promptMessage: "Confirmă identitatea",
    cancelButtonText: "Anulează",
  });

  if (success) {
    // Retrieve stored credentials from Keychain
    const token = await getSecureToken();
    return token;
  }

  throw new Error("Biometric auth failed");
};
```

---

## 🗄️ Stocare Securizată

### Keychain/Keystore

```typescript
import * as Keychain from "react-native-keychain";

// Stocare credențiale
const storeCredentials = async (token: string) => {
  await Keychain.setGenericPassword("auth_tokens", token, {
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
  });
};

// Recuperare credențiale
const getCredentials = async () => {
  const credentials = await Keychain.getGenericPassword();
  if (credentials) {
    return credentials.password;
  }
  return null;
};

// Ștergere la logout
const clearCredentials = async () => {
  await Keychain.resetGenericPassword();
};
```

### Ce SE stochează în Keychain

| Date          | DA/NU | Motiv                  |
| ------------- | ----- | ---------------------- |
| Access Token  | ✅ DA | Sensibil, acces la API |
| Refresh Token | ✅ DA | Foarte sensibil        |
| User ID       | ✅ DA | Identificator unic     |
| Email/Phone   | ❌ NU | Nu e necesar local     |
| Biometric Key | ✅ DA | Pentru auth local      |

### MMKV pentru date nesensibile

```typescript
import { MMKV } from "react-native-mmkv";

const storage = new MMKV({
  id: "user-preferences",
  encryptionKey: "generated-key", // Optional encryption
});

// Stocare preferințe
storage.set("theme", "dark");
storage.set("language", "ro");
storage.set("onboarding_completed", true);

// NU stoca date sensibile!
// ❌ storage.set('token', token);
// ❌ storage.set('password', password);
```

---

## 🛡️ Protecția Aplicației

### Code Obfuscation

**Android (ProGuard/R8):**

```proguard
# proguard-rules.pro
-keep class com.imobi.** { *; }
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Obfuscate everything else
-obfuscationdictionary obfuscation-dictionary.txt
```

**iOS:**

- Hermes bytecode (built-in obfuscation)
- Bitcode enabled

### Root/Jailbreak Detection

```typescript
import JailMonkey from "jail-monkey";

const checkDeviceSecurity = () => {
  const isRooted = JailMonkey.isJailBroken();
  const canMockLocation = JailMonkey.canMockLocation();
  const isDebugMode = JailMonkey.isDebuggedMode();

  if (isRooted) {
    // Warn user or restrict functionality
    showSecurityWarning();
  }

  if (isDebugMode && !__DEV__) {
    // Potential tampering
    logSecurityEvent("debugger_detected");
  }
};
```

### Tamper Detection

```typescript
// Verifică integritatea app-ului
const verifyAppIntegrity = async () => {
  // 1. Verifică semnătura APK/IPA
  const signature = await getAppSignature();
  const isValid = await verifySignature(signature);

  // 2. Verifică că nu rulează în emulator (prod)
  const isEmulator = await checkEmulator();

  return isValid && !isEmulator;
};
```

### Prevent Screenshots (Sensitive Screens)

```typescript
import { preventScreenCapture, allowScreenCapture } from "expo-screen-capture";

// Pe ecrane sensibile
useEffect(() => {
  preventScreenCapture();
  return () => allowScreenCapture();
}, []);
```

---

## 📊 Protecția Datelor

### Encryption at Rest

```typescript
import CryptoJS from "crypto-js";

// Criptare date locale sensibile
const encryptData = (data: string, key: string): string => {
  return CryptoJS.AES.encrypt(data, key).toString();
};

const decryptData = (encryptedData: string, key: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, key);
  return bytes.toString(CryptoJS.enc.Utf8);
};
```

### Data Minimization

| Date           | Stocăm local?      | Motiv          |
| -------------- | ------------------ | -------------- |
| User profile   | Cache temporar     | UX             |
| Search history | Criptat            | UX             |
| Favorite IDs   | Da                 | Offline access |
| Messages       | Nu (doar în cache) | Securitate     |
| Passwords      | NICIODATĂ          | Securitate     |
| Documents      | Nu                 | Securitate     |

### Secure Logging

```typescript
// NU logăm date sensibile
const sanitizeLog = (data: any) => {
  const sensitiveFields = ["password", "token", "email", "phone", "ssn"];

  return Object.keys(data).reduce((acc, key) => {
    if (sensitiveFields.includes(key.toLowerCase())) {
      acc[key] = "***REDACTED***";
    } else {
      acc[key] = data[key];
    }
    return acc;
  }, {} as any);
};

// Usage
console.log(sanitizeLog({ email: "test@example.com", name: "Ion" }));
// Output: { email: '***REDACTED***', name: 'Ion' }
```

---

## ✅ Checklist Securitate

### Transport Security

- [ ] HTTPS exclusiv (no HTTP fallback)
- [ ] TLS 1.3 minimum
- [ ] Certificate Pinning implementat
- [ ] Backup pins pentru rotație

### Authentication

- [ ] JWT cu expirare scurtă (15 min)
- [ ] Refresh tokens securizate
- [ ] Biometric auth disponibil
- [ ] MFA opțional
- [ ] Password policy enforced
- [ ] Account lockout după încercări eșuate
- [ ] Logout în toate dispozitivele

### Secure Storage

- [ ] Tokens în Keychain/Keystore
- [ ] Nu se stochează parole
- [ ] Criptare date sensibile locale
- [ ] Ștergere date la logout

### App Protection

- [ ] Code obfuscation (ProGuard/Hermes)
- [ ] Root/Jailbreak detection
- [ ] Debugger detection (production)
- [ ] Screenshot prevention (când necesar)
- [ ] App signature verification

### Data Protection

- [ ] Encryption at rest
- [ ] Data minimization
- [ ] Secure logging (no sensitive data)
- [ ] Cache expiration
- [ ] GDPR compliance

### Input Validation

- [ ] Client-side validation
- [ ] Server-side validation (always)
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] File upload validation

### API Security

- [ ] Rate limiting aware
- [ ] Retry with backoff
- [ ] Error handling (no leak info)
- [ ] Request signing (optional)

---

## 🚨 Incident Response

### Dacă se detectează breach:

1. **Imediat:** Invalidare toate tokens
2. **< 1h:** Notificare echipă securitate
3. **< 24h:** Notificare utilizatori afectați
4. **< 72h:** Raport GDPR (dacă e cazul)

### Contact Securitate

- Security Team: security@imobi.ro
- Bug Bounty: security@imobi.ro
- Emergency: +40 XXX XXX XXX

---

**Document Status:** Draft  
**Ultima actualizare:** Ianuarie 2026  
**Revizuit de:** [Pending Security Audit]
