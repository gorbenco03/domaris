# 🪪 Feature: Verificare Identitate (KYC)

**ID Feature:** KYC-001  
**Prioritate:** P1 - High  
**Estimare:** 2 săptămâni  
**Dependențe:** AUTH-001, Backend KYC Service

---

## 📝 Descriere Generală

Verificarea identității (KYC) construiește încredere între utilizatori și previne fraudele.

### Obiective

- Rata verificare completă: **> 70%** pentru proprietari
- Timp verificare automată: **< 5 minute**
- Rata respingere falsă: **< 2%**

---

## 🏆 Niveluri de Verificare

| Nivel | Cerințe                   | Badge         | Capabilități                 |
| ----- | ------------------------- | ------------- | ---------------------------- |
| **0** | Cont nou                  | -             | Nu poate posta/contacta      |
| **1** | Email/Telefon verificat   | ✓ Verificat   | Căutare, favorite, contact   |
| **2** | Document ID + Selfie      | ✓✓ Identitate | Full access, aprobare rapidă |
| **3** | Nivel 2 + Doc proprietate | 🏠 Proprietar | Badge special, prioritate    |

---

## 👤 User Stories

```
US-KYC-001: Ca proprietar, vreau să-mi verific identitatea
pentru ca anunțurile mele să aibă încredere.

US-KYC-002: Ca căutător, vreau să văd dacă proprietarul este verificat.

US-KYC-003: Ca proprietar, vreau să încarc documente de proprietate.

US-KYC-004: Ca utilizator, vreau să știu statusul verificării mele.
```

---

## ✅ Cerințe Funcționale

### RF-KYC-001: Verificare Document Identitate

- **Documente:** CI, Pașaport, Permis conducere
- **Validări:** OCR, dată expirare, autenticitate

### RF-KYC-002: Liveness Check

- Întoarce capul stânga/dreapta
- Clipește din ochi
- Detecție ecran/printout

### RF-KYC-003: Matching Față-Document

- Comparație biometrică
- Threshold: > 85% similaritate

### RF-KYC-004: Verificare Proprietate

- Extras CF, Contract vânzare, Certificat moștenitor
- Verificare semi-automată + manuală

---

## ⚙️ Specificații Tehnice

### Data Models

```typescript
interface VerificationLevel {
  level: 0 | 1 | 2 | 3;
  status: "pending" | "approved" | "rejected" | "expired";
  expiresAt?: Date;
}

interface IdentityDocument {
  id: string;
  type: "national_id" | "passport" | "driving_license";
  documentNumber: string; // masked
  expiryDate: Date;
  verificationStatus: "pending" | "verified" | "rejected";
}

interface PropertyDocument {
  id: string;
  propertyId: string;
  type: "land_registry" | "sale_contract";
  verificationStatus: "pending" | "verified" | "rejected";
}
```

### Provideri KYC Recomandați

| Provider | Preț/verificare |
| -------- | --------------- |
| Onfido   | ~2-5€           |
| Veriff   | ~1-3€           |
| Sumsub   | ~1-2€           |

---

## 🔒 Securitate și GDPR

- [x] Consimțământ explicit
- [x] Criptare AES-256
- [x] Drept la ștergere
- [x] Retenție: 30 zile (respinse), 5 ani (aprobate)

---

## ✅ Criterii de Acceptanță

- [x] User poate selecta tipul de document
- [x] Liveness check funcționează
- [x] Verificare automată < 5 minute
- [x] Notificare push la rezultat
- [x] Badge vizibil pe profil

---

**Document Status:** Draft  
**Ultima actualizare:** Ianuarie 2026
