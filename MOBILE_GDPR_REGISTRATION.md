# 📱 Mobile App - GDPR Registration Implementation

**Destinat:** Echipa de Mobile (React Native / Expo)
**Data:** 31 Ianuarie 2026
**Status:** 🔴 REQUIRED pentru MVP

---

## 📋 Ce trebuie implementat

### 1. Adăugare Checkbox-uri la Registration Screens

Trebuie să adaugi **5 checkbox-uri** la toate screen-urile de înregistrare:
- ✅ Email registration
- ✅ Phone registration
- ❌ OAuth (Google/Apple) - NU trebuie, backend-ul creează automat consents

---

## 🎨 UI/UX Requirements

### **Layout sugerată:**

```
┌─────────────────────────────────────┐
│  Email: [________________]          │
│  Password: [________________]       │
│  First Name: [________________]     │
│  Last Name: [________________]      │
│                                     │
│  ☑️ Accept Terms & Conditions *     │
│     (link to terms)                 │
│                                     │
│  ☑️ Accept Privacy Policy *         │
│     (link to privacy policy)        │
│                                     │
│  ☑️ Accept GDPR data processing *   │
│     (link to GDPR info)             │
│                                     │
│  ☐ Receive marketing emails         │
│                                     │
│  ☐ Enable analytics tracking        │
│                                     │
│  * = Obligatoriu                    │
│                                     │
│  [      Înregistrează-te      ]     │
└─────────────────────────────────────┘
```

### **Validare UI:**
- Primele 3 checkbox-uri (Terms, Privacy, GDPR) trebuie **CHECKED** înainte de submit
- Dacă userul încearcă să facă submit fără ele → arată eroare: **"Trebuie să accepți Termenii și Condițiile, Politica de Confidențialitate și prelucrarea datelor conform GDPR"**
- Ultimele 2 (Marketing, Analytics) sunt **OPȚIONALE**

---

## 🔌 API Integration

### **1. Email Registration (2 steps)**

#### **Step 1: POST /auth/register** (trimite OTP)

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "firstName": "Ion",
  "lastName": "Popescu",
  "acceptTerms": true,          // ← MANDATORY (checkbox 1)
  "acceptPrivacy": true,        // ← MANDATORY (checkbox 2)
  "acceptGdpr": true,           // ← MANDATORY (checkbox 3)
  "acceptMarketing": false,     // ← OPTIONAL (checkbox 4)
  "acceptAnalytics": true       // ← OPTIONAL (checkbox 5)
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Cod de verificare trimis pe email",
  "expiresIn": 600
}
```

**Response (Error - consents missing):**
```json
{
  "statusCode": 400,
  "message": "Trebuie să accepți Termenii și Condițiile, Politica de Confidențialitate și prelucrarea datelor conform GDPR",
  "error": "Bad Request",
  "code": "CONSENTS_REQUIRED"
}
```

#### **Step 2: POST /auth/verify-email-otp** (verificare OTP)

**Request:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response (Success):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1...",
  "refreshToken": "a1b2c3d4e5...",
  "expiresIn": 86400,
  "user": {
    "id": "123",
    "email": "user@example.com",
    "firstName": "Ion",
    "lastName": "Popescu",
    "verificationLevel": 1,
    "isAdmin": false,
    "emailVerified": true,
    "phoneVerified": false,
    "hasActiveSubscription": false
  }
}
```

---

### **2. Phone Registration (2 steps)**

#### **Step 1: POST /auth/register/phone** (trimite OTP)

**Request:**
```json
{
  "phone": "+40712345678",
  "password": "SecurePass123",
  "firstName": "Ion",
  "lastName": "Popescu",
  "acceptTerms": true,          // ← MANDATORY
  "acceptPrivacy": true,        // ← MANDATORY
  "acceptGdpr": true,           // ← MANDATORY
  "acceptMarketing": false,     // ← OPTIONAL
  "acceptAnalytics": true       // ← OPTIONAL
}
```

**Response:** Același format ca la email registration

#### **Step 2: POST /auth/verify-phone-otp** (verificare OTP)

**Request:**
```json
{
  "phone": "+40712345678",
  "code": "123456"
}
```

**Response:** Același format ca la email verification

---

### **3. Google / Apple OAuth** (NO CHANGES NEEDED)

**Important:** Backend-ul creează **automat** consents pentru OAuth users:
- Terms, Privacy, GDPR → `true` (implicit prin OAuth)
- Marketing, Analytics → `false` (default off)

**NU trebuie** să adaugi checkbox-uri la OAuth login! Continuă să folosești flow-ul actual.

---

## 📝 Code Examples (React Native)

### **State Management:**

```typescript
const [formData, setFormData] = useState({
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  // GDPR Consents
  acceptTerms: false,
  acceptPrivacy: false,
  acceptGdpr: false,
  acceptMarketing: false,
  acceptAnalytics: false,
});
```

### **Validation:**

```typescript
const validateConsents = () => {
  if (!formData.acceptTerms || !formData.acceptPrivacy || !formData.acceptGdpr) {
    Alert.alert(
      'Consimțăminte obligatorii',
      'Trebuie să accepți Termenii și Condițiile, Politica de Confidențialitate și prelucrarea datelor conform GDPR'
    );
    return false;
  }
  return true;
};
```

### **Checkbox Component:**

```typescript
import { CheckBox } from 'react-native-elements'; // or your preferred lib

<CheckBox
  title={
    <Text>
      Accept <Text style={{color: 'blue'}} onPress={() => openTerms()}>
        Terms & Conditions
      </Text> *
    </Text>
  }
  checked={formData.acceptTerms}
  onPress={() => setFormData({...formData, acceptTerms: !formData.acceptTerms})}
  containerStyle={styles.checkbox}
/>

<CheckBox
  title={
    <Text>
      Accept <Text style={{color: 'blue'}} onPress={() => openPrivacy()}>
        Privacy Policy
      </Text> *
    </Text>
  }
  checked={formData.acceptPrivacy}
  onPress={() => setFormData({...formData, acceptPrivacy: !formData.acceptPrivacy})}
  containerStyle={styles.checkbox}
/>

<CheckBox
  title="Accept GDPR data processing *"
  checked={formData.acceptGdpr}
  onPress={() => setFormData({...formData, acceptGdpr: !formData.acceptGdpr})}
  containerStyle={styles.checkbox}
/>

<CheckBox
  title="Receive marketing emails"
  checked={formData.acceptMarketing}
  onPress={() => setFormData({...formData, acceptMarketing: !formData.acceptMarketing})}
  containerStyle={styles.checkbox}
/>

<CheckBox
  title="Enable analytics tracking"
  checked={formData.acceptAnalytics}
  onPress={() => setFormData({...formData, acceptAnalytics: !formData.acceptAnalytics})}
  containerStyle={styles.checkbox}
/>

<Text style={{fontSize: 12, color: 'gray'}}>* = Obligatoriu</Text>
```

### **Submit Handler:**

```typescript
const handleRegister = async () => {
  // Validate consents FIRST
  if (!validateConsents()) {
    return;
  }

  try {
    const response = await axios.post('https://api.domaris.md/auth/register', {
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      acceptTerms: formData.acceptTerms,
      acceptPrivacy: formData.acceptPrivacy,
      acceptGdpr: formData.acceptGdpr,
      acceptMarketing: formData.acceptMarketing,
      acceptAnalytics: formData.acceptAnalytics,
    });

    // Navigate to OTP screen
    navigation.navigate('VerifyOTP', { email: formData.email });
  } catch (error) {
    if (error.response?.data?.code === 'CONSENTS_REQUIRED') {
      Alert.alert('Eroare', error.response.data.message);
    } else if (error.response?.data?.code === 'EMAIL_ALREADY_EXISTS') {
      Alert.alert('Eroare', 'Un cont cu acest email există deja');
    } else {
      Alert.alert('Eroare', 'A apărut o eroare. Te rugăm să încerci din nou.');
    }
  }
};
```

---

## ⚠️ Error Codes

| Code | Message | Action |
|------|---------|--------|
| `CONSENTS_REQUIRED` | Trebuie să accepți Termenii... | Verifică că toate 3 mandatory checkboxes sunt checked |
| `EMAIL_ALREADY_EXISTS` | Un cont cu acest email există deja | Sugerează login sau password reset |
| `PHONE_ALREADY_EXISTS` | Un cont cu acest număr de telefon există deja | Sugerează login sau password reset |
| `OTP_INVALID` | Cod invalid sau expirat | Permite re-trimiterea OTP-ului |

---

## 📄 Legal Links

**IMPORTANT:** Aceste documente trebuie create de jurist. Până atunci, poți folosi placeholder-uri:

```typescript
const openTerms = () => {
  // TODO: Replace with actual Terms & Conditions URL
  Linking.openURL('https://domaris.md/terms');
};

const openPrivacy = () => {
  // TODO: Replace with actual Privacy Policy URL
  Linking.openURL('https://domaris.md/privacy');
};

const openGdprInfo = () => {
  // TODO: Replace with GDPR info page URL
  Linking.openURL('https://domaris.md/gdpr');
};
```

---

## ✅ Testing Checklist

### **Before submitting to backend team:**
- [ ] Checkbox-uri afișate corect pe Email Registration screen
- [ ] Checkbox-uri afișate corect pe Phone Registration screen
- [ ] NU există checkbox-uri pe OAuth (Google/Apple) screens
- [ ] Validare: Submit blocat dacă mandatory checkboxes NU sunt checked
- [ ] Validare: Submit funcționează dacă mandatory checkboxes SUNT checked
- [ ] Optional checkboxes pot fi unchecked (default: false)
- [ ] Link-uri către Terms/Privacy funcționează (placeholder OK)
- [ ] Error handling pentru `CONSENTS_REQUIRED`
- [ ] Error handling pentru `EMAIL_ALREADY_EXISTS`

### **API Testing:**
```bash
# Test cu Postman/Insomnia:

# ✅ Success case
POST https://api.domaris.md/auth/register
{
  "email": "test@example.com",
  "password": "SecurePass123",
  "firstName": "Test",
  "lastName": "User",
  "acceptTerms": true,
  "acceptPrivacy": true,
  "acceptGdpr": true,
  "acceptMarketing": false,
  "acceptAnalytics": false
}

# ❌ Error case (missing consents)
POST https://api.domaris.md/auth/register
{
  "email": "test@example.com",
  "password": "SecurePass123",
  "firstName": "Test",
  "lastName": "User",
  "acceptTerms": false,  // ← Will fail
  "acceptPrivacy": true,
  "acceptGdpr": true
}
```

---

## 🚀 Timeline

| Task | Estimare | Priority |
|------|----------|----------|
| UI: Add checkboxes to registration screens | 2-3 ore | 🔴 CRITICAL |
| Integration: Update API calls | 1-2 ore | 🔴 CRITICAL |
| Testing: Validation & error handling | 1-2 ore | 🔴 CRITICAL |
| Polish: Links to Terms/Privacy (placeholder) | 30 min | 🟡 MEDIUM |

**Total:** ~1 zi de lucru

---

## 📞 Contact

**Întrebări?** Contactează backend team:
- API endpoint documentation: `https://api.domaris.md/api-docs` (Swagger)
- Backend repo: `/Users/kirill/domaris/backend`

**BLOCKER:** Privacy Policy & Terms of Service documents trebuie create de jurist (2-3 zile).

---

**Status:** Ready for mobile team implementation 🚀
