# 🇪🇺 Conformitate GDPR

**Versiune:** 1.0.0  
**Data:** Ianuarie 2026

---

## 📋 Cuprins

1. [Principii GDPR](#principii-gdpr)
2. [Bază Legală pentru Procesare](#bază-legală-pentru-procesare)
3. [Drepturile Utilizatorilor](#drepturile-utilizatorilor)
4. [Implementare în Aplicație](#implementare-în-aplicație)
5. [Data Mapping](#data-mapping)
6. [Checklist Conformitate](#checklist-conformitate)

---

## 📜 Principii GDPR

| Principiu                              | Implementare RIVA                                  |
| -------------------------------------- | --------------------------------------------------- |
| **Legalitate, echitate, transparență** | Consimțământ explicit, Privacy Policy clar          |
| **Limitarea scopului**                 | Date folosite doar pentru funcționalitate declarată |
| **Minimizarea datelor**                | Colectăm doar ce e necesar                          |
| **Acuratețe**                          | Utilizatorii pot edita datele oricând               |
| **Limitarea stocării**                 | Politică de retenție definită                       |
| **Integritate și confidențialitate**   | Criptare, acces controlat                           |
| **Responsabilitate**                   | Audit logs, documentație                            |

---

## ⚖️ Bază Legală pentru Procesare

### Date colectate și baza legală

| Date                   | Bază Legală                    | Scop                         |
| ---------------------- | ------------------------------ | ---------------------------- |
| Email, Telefon         | Executare contract             | Creare cont, comunicare      |
| Nume, Avatar           | Executare contract             | Profil utilizator            |
| Locație (coarse)       | Consimțământ                   | Căutare proprietăți          |
| Locație (precisă)      | Consimțământ                   | Hartă, navigare              |
| Fotografii proprietăți | Executare contract             | Listare anunțuri             |
| Documente identitate   | Consimțământ + Interes legitim | Verificare KYC               |
| Mesaje                 | Executare contract             | Comunicare între utilizatori |
| Date navigare          | Interes legitim                | Îmbunătățire serviciu        |
| Date marketing         | Consimțământ                   | Newsletter, promoții         |

---

## 👤 Drepturile Utilizatorilor

### Drepturi implementate

| Drept                        | Implementare           | Termen  |
| ---------------------------- | ---------------------- | ------- |
| **Acces** (Art. 15)          | Export date din setări | 30 zile |
| **Rectificare** (Art. 16)    | Editare profil         | Imediat |
| **Ștergere** (Art. 17)       | Buton "Șterge cont"    | 30 zile |
| **Restricționare** (Art. 18) | Pausare cont           | Imediat |
| **Portabilitate** (Art. 20)  | Export JSON/CSV        | 30 zile |
| **Opoziție** (Art. 21)       | Opt-out marketing      | Imediat |
| **Retragere consimțământ**   | Setări privacy         | Imediat |

---

## 📱 Implementare în Aplicație

### 1. Consimțământ la Înregistrare

```typescript
interface ConsentCheckboxes {
  termsAccepted: boolean; // Obligatoriu
  privacyPolicyAccepted: boolean; // Obligatoriu
  marketingConsent: boolean; // Opțional
  analyticsConsent: boolean; // Opțional
}

// Înregistrare validare
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  consents: z.object({
    termsAccepted: z.literal(true, {
      errorMap: () => ({ message: "Trebuie să accepți termenii" }),
    }),
    privacyPolicyAccepted: z.literal(true, {
      errorMap: () => ({
        message: "Trebuie să accepți politica de confidențialitate",
      }),
    }),
    marketingConsent: z.boolean(),
    analyticsConsent: z.boolean(),
  }),
});
```

### 2. Privacy Settings Screen

```
┌─────────────────────────────────────┐
│  ← Confidențialitate                │
├─────────────────────────────────────┤
│                                     │
│  📊 ANALYTICS                       │
│  ├─ Îmbunătățire experiență [●━━━]  │
│  │  Colectăm date anonime despre    │
│  │  cum folosești aplicația.        │
│  │                                  │
│  └─ Raportare crash-uri     [●━━━]  │
│     Ne ajută să reparăm erorile.    │
│                                     │
├─────────────────────────────────────┤
│  📧 MARKETING                       │
│  ├─ Email-uri promoționale  [━━━○]  │
│  ├─ Push notifications      [━━━○]  │
│  └─ SMS marketing           [━━━○]  │
│                                     │
├─────────────────────────────────────┤
│  📍 LOCAȚIE                         │
│  ├─ Locație precisă         [●━━━]  │
│  │  Pentru căutare pe hartă         │
│  └─ Locație în background   [━━━○]  │
│                                     │
├─────────────────────────────────────┤
│  🔐 DATELE TALE                     │
│  ├─ Descarcă datele tale        >   │
│  ├─ Șterge contul               >   │
│  └─ Istoric consimțăminte       >   │
│                                     │
└─────────────────────────────────────┘
```

### 3. Data Export

```typescript
interface DataExport {
  user: {
    profile: UserProfile;
    settings: UserSettings;
  };
  properties: Property[];
  favorites: Favorite[];
  messages: Message[];
  viewings: Viewing[];
  consents: ConsentRecord[];
  exportedAt: Date;
  format: "json" | "csv";
}

// API endpoint
// GET /api/v1/users/me/data-export
// Response: Download link (expires in 24h)
```

### 4. Account Deletion

```typescript
interface DeletionRequest {
  reason?: string;
  confirmPassword: string;
  confirmEmail: string;
}

// Flow:
// 1. User solicită ștergere
// 2. Email confirmare cu link
// 3. Grace period 14 zile (poate anula)
// 4. Ștergere definitivă

// Ce se șterge:
// - Date profil
// - Anunțuri și fotografii
// - Mesaje
// - Favorite
// - Istoricul vizionărilor

// Ce se păstrează (anonimizat):
// - Date statistice agregate
// - Logs de audit (fără date personale)
```

---

## 📊 Data Mapping

### Date personale și retenție

| Categorie         | Date                    | Stocare              | Retenție                |
| ----------------- | ----------------------- | -------------------- | ----------------------- |
| **Identitate**    | Nume, Email, Telefon    | PostgreSQL (criptat) | Durată cont + 30 zile   |
| **Autentificare** | Parole hash             | PostgreSQL           | Durată cont             |
| **Profile**       | Avatar, Bio             | S3 + PostgreSQL      | Durată cont + 30 zile   |
| **KYC**           | Documente identitate    | S3 (criptat)         | 5 ani (legal)           |
| **Anunțuri**      | Proprietăți, Fotografii | PostgreSQL + S3      | Durată cont + 90 zile   |
| **Comunicare**    | Mesaje                  | PostgreSQL           | 2 ani sau ștergere cont |
| **Vizionări**     | Programări              | PostgreSQL           | 1 an                    |
| **Plăți**         | Tranzacții              | PostgreSQL           | 7 ani (legal)           |
| **Logs**          | Acces, Acțiuni          | Elasticsearch        | 90 zile                 |
| **Analytics**     | Comportament            | Mixpanel             | 2 ani (anonimizat)      |

### Locația datelor

- **Producție:** AWS EU (Frankfurt)
- **Backup:** AWS EU (Ireland)
- **CDN:** CloudFront EU

---

## ✅ Checklist Conformitate

### Consimțământ

- [ ] Consimțământ granular la înregistrare
- [ ] Posibilitate de retragere oricând
- [ ] Istoric consimțăminte stocat
- [ ] Re-consent la schimbări majore

### Transparency

- [ ] Privacy Policy accesibilă
- [ ] Limbaj clar și simplu
- [ ] Notificări la schimbări politici
- [ ] Cookie policy (web)

### Drepturi Utilizatori

- [ ] Data export funcțional
- [ ] Ștergere cont funcțională
- [ ] Editare date profil
- [ ] Opt-out marketing one-click

### Securitate

- [ ] Criptare date sensibile
- [ ] Acces bazat pe roluri
- [ ] Audit logging
- [ ] Breach notification procedure

### Documentație

- [ ] DPA cu sub-procesatori
- [ ] DPIA pentru funcții noi
- [ ] Registrul activităților de procesare

---

## 📞 Responsabil Protecție Date (DPO)

| Contact          | Detalii            |
| ---------------- | ------------------ |
| **Email**        | dpo@riva.ro       |
| **Adresă**       | [Adresa companiei] |
| **Timp răspuns** | 30 zile maximum    |

---

**Document Status:** Draft  
**Ultima actualizare:** Ianuarie 2026  
**Revizuit de:** [Pending Legal Review]
