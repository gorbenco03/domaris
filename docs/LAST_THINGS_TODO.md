# RIVA — Last Things TODO (Client Requirements)

> **Document creat:** 2026-02-04  
> **Scop:** Listă clară cu ultimele funcționalități de implementat, plus idei de implementare și dependințe.

---

## 1) Editare Profil Extins

### Cerințe
- Utilizatorul să poată edita:
  - Adresa (oraș / stradă)
  - Țara / regiunea
  - Numărul de telefon
  - Alte detalii personale (bio, link-uri sociale etc.)

### Idei de implementare
- **Backend:** Extindem `User` model cu câmpuri noi (`address`, `phone`, `bio`, `socialLinks`).
- **API:** `PATCH /users/me` + validare Zod.
- **Mobile:** Ecran `ProfileEditScreen` cu secțiuni:
  - Date personale (formular)
  - Adresă (autocomplete cu `expo-location` + `locations/search` API)
  - Social links (opțional)
- **Validări:** Număr telefon format internațional (`libphonenumber-js`), adresa validă prin API.

### Dependențe
- `expo-location` (permisii)
- `libphonenumber-js` (format telefon)
- API `locations/search` (autocomplete)

---

## 2) Notificări & Setări Ore Funcționale

### Cerințe
- Sistemul de notificări să respecte setările de ore (ex: nu între 22:00–08:00).
- Utilizatorul să poată seta intervalul orar pentru notificări.
- Notificările de mesaje, vizionări, status anunțuri să funcționeze corect.

### Idei de implementare
- **Backend:** `UserNotificationSettings` model (`quietHoursStart`, `quietHoursEnd`, `enabledTypes`).
- **Scheduler:** La trimitere notificare, verificăm dacă e în intervalul “quiet”.
- **Mobile:** Ecran `NotificationSettingsScreen` cu:
  - Toggle per tip (mesaje, vizionări, promoții)
  - Time picker pentru interval orar
- **Push:** Folosim `expo-notifications` cu `setNotificationChannelAsync` + `scheduleNotificationAsync`.

### Dependențe
- `expo-notifications` (permisii)
- `expo-background-fetch` (dacă e necesar)
- Backend job (cron) pentru notificări programate

---

## 3) Restructurare KYC — Doar 2 Niveluri

### Cerințe
- **Nivel 1 (la înregistrare):** Vizualizare, mesaje, funcționalități de bază.
- **Nivel 2 (proprietar):** Permite postarea de anunțuri (`listings`).

### Idei de implementare
- **Model:** `User.verificationLevel` enum (`'basic' | 'owner'`).
- **Flux:** La signup → `basic` automat. Pentru `owner` → cerere verificare proprietate (documente).
- **UI:** În ecrane de postare, dacă `verificationLevel !== 'owner'` afișăm banner “Devino proprietar verificat” cu link către ecran de verificare.
- **Backend:** Middleware care verifică `verificationLevel` la `POST /listings`.

### Dependențe
- Ecrane de verificare proprietate (upload documente)
- Serviciu de revizuire manuală sau automată

---

## 4) Planuri de Abonament Regândite + Limitări Funcționale

### Cerințe
- Planuri cu limitări reale: număr poze, anunțuri active, early access.
- Early access pentru abonați (văd primele anunțurile noi).
- UI clar cu upgrade prompts.

### Idei de implementare
- **Backend:** `SubscriptionPlan` cu câmpuri:
  - `maxListings`, `maxPhotosPerListing`, `hasEarlyAccess`
- **Middleware:** La creare/actualizare `listing` verificăm limitările.
- **Early Access:** Câmp `publishedAt` + `visibleAt`. La creare, `visibleAt` e `now + X ore` pentru non-abonați, `now` pentru abonați.
- **Mobile:** Ecran `SubscriptionScreen` cu carduri per plan, upgrade prompts în ecrane de limitare.

### Dependențe
- `expo-in-app-purchases` (dacă vrem plăți)
- Middleware backend pentru validare limitări

---

## 5) Refactorizare AI — Mai Natural & Proactiv

### Cerințe
- AI-ul să fie mai natural, să conducă conversația, să pună întrebări pas cu pas.
- Să se ocupe de client (lead generation, qualifying).

### Idei de implementare
- **Flux conversațional:**
  - Salut + detectare intenție (`'buy' | 'sell' | 'info'`)
  - Dacă `buy` → întrebări: buget, zona, camere, preferințe
  - Dacă `sell` → întrebări: tip proprietate, adresă, detali
- **Memory:** Salvăm context per utilizator în `ConversationState` (JSONB).
- **Backend:** Prompt structurat + funcții (`searchListings`, `scheduleViewing`).
- **UI:** Ecran `AIChatScreen` cu typing indicator, quick replies, butoane acțiune.

### Dependențe
- LLM API (OpenAI/Anthropic)
- `ConversationState` model
- Funcții tool calling pentru search/schedule

---

## Ordine Recomandată de Implementare

| # | Funcționalitate | Efort | Dependențe | Notă |
|---|----------------|-------|------------|------|
| 1 | Editare Profil | Mediu | Locație API | MVP rapid |
| 2 | Notificări + Setări Ore | Mediu | Scheduler | Utilizator impact mare |
| 3 | KYC 2 niveluri | Mic | UI verificare | Simplu de implementat |
| 4 | Abonamente + Limitări | Mare | Plăți | Cel mai complex |
| 5 | Refactor AI | Mare | LLM API | Poate fi paralel cu 4 |

---

## Next Steps (pentru echipă)

1. **Sprint 1 (1–2 săptămâni):** Editare profil + notificări ore.
2. **Sprint 2 (1 săptămână):** KYC 2 niveluri + UI upgrade prompts.
3. **Sprint 3 (2–3 săptămâni):** Abonamente + limitări + early access.
4. **Sprint 4 (2 săptămâni):** Refactor AI conversațional.

---

### Notă finală
- Toate funcționalitățile trebuie să fie **responsive** și **testate** pe iOS/Android.
- Folosim **TypeScript strict** și **Zod** pentru validări.
- Documentația API se actualizează în paralel (Swagger).

---

*Document creat de Cascade (AI Assistant) pentru RIVA.*
