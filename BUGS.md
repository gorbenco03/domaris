# 🐛 Bug Tracker - Domaris Mobile App

> Acest fișier conține toate bug-urile identificate în aplicația mobilă.
> Vom actualiza acest fișier pe măsură ce rezolvăm sau descoperim noi bug-uri.

---

## 📋 Bug-uri Active

_Toate bug-urile raportate au fost rezolvate!_

---

## ✅ Bug-uri Rezolvate

### 1. Ecranul de înregistrare (Register Screen) - Bara de sus
- **Status:** ✅ Rezolvat
- **Descriere:** Bara de sus cu butonul de back nu arăta ok
- **Screenshot:** Image 2 - Creează cont screen
- **Fix:** Înlocuit ScreenHeader cu un header custom mai curat, fără border și background. Butonul back este acum un TouchableOpacity simplu cu stil consistent.
- **Fișier modificat:** `src/features/auth/screens/RegisterScreen.tsx`

---

### 2. Layout stricat în Proprietăți Salvate (Favorite) - Selecție 2 proprietăți
- **Status:** ✅ Rezolvat
- **Descriere:** Când alegi două proprietăți pentru comparare, layout-ul este stricat
- **Fix:** Îmbunătățit floating action bar cu background solid, border și shadow. Butonul "Compară" arată acum "Selectează încă 1" când e selectată doar o proprietate.
- **Fișier modificat:** `src/features/favorites/screens/FavoritesListScreen.tsx`

---

### 3. Ecranul de Comparare - Scroll și centrare
- **Status:** ✅ Rezolvat
- **Descriere:** Ecranul de comparare este scrolabil în dreapta și stânga și nu este centrat corect
- **Fix:** Eliminat scroll-ul orizontal inutil. Coloanele se calculează acum automat pentru a încăpea pe ecran. Conținutul este centrat corect.
- **Fișier modificat:** `src/features/favorites/screens/PropertyCompareScreen.tsx`

---

### 4. Vizualizare profil din Chat
- **Status:** ✅ Rezolvat
- **Descriere:** Vreau să poți vizualiza profilul utilizatorului apăsând pe iconița lui din chat (lângă numele lui)
- **Fix:** Adăugat `onProfilePress` handler în ChatHeader. Avatar-ul și numele sunt acum clickabile și navighează la PublicProfile.
- **Fișiere modificate:** 
  - `src/features/messaging/components/ChatHeader.tsx`
  - `src/features/messaging/screens/ChatScreen.tsx`

---

### 5. Inputuri stricate în Caracteristici (Creare proprietate nouă)
- **Status:** ✅ Rezolvat
- **Descriere:** Când creezi o proprietate nouă, în secțiunea Caracteristici, inputurile sunt stricate (3 coloane prea înguste în secțiunea Etaj)
- **Fix:** Reorganizat layout-ul secțiunii "Etaj" - acum "Etaj" și "Din total" sunt pe un rând, iar "An construcție" este pe rândul următor pentru mai mult spațiu.
- **Fișier modificat:** `src/features/properties/screens/steps/CharacteristicsStep.tsx`

---

### 6. Notificare Request Vizionare - Redirect greșit (din Notifications Center)
- **Status:** ✅ Rezolvat
- **Descriere:** Când primești un request de vizionare și apeși pe notificare din centrul de notificări, te redirecționează pe pagina proprietății tale în loc de pagina request-ului
- **Fix:** Îmbunătățit logica de navigare în NotificationsCenterScreen - acum verifică mai multe câmpuri posibile pentru viewingId (viewingId, viewing_id, id) și redirecționează corect la ViewingDetail.
- **Fișiere modificate:** 
  - `src/features/notifications/screens/NotificationsCenterScreen.tsx`
  - `src/features/notifications/providers/PushNotificationsProvider.tsx` (pentru push notifications)

---

### 7. Ecranul de Vizionări - Lipsă săgeată navigare înapoi
- **Status:** ✅ Rezolvat
- **Descriere:** Când intri într-o vizionare programată, nu ai săgeata de navigare înapoi
- **Screenshot:** Image 5 - Ecran vizionare cu detalii
- **Fix:** Adăugat un header fix cu titlu "Detalii vizionare" și buton back vizibil mereu, separat de imaginea proprietății. Header-ul rămâne vizibil indiferent de scroll.
- **Fișier modificat:** `src/features/viewings/screens/ViewingDetailScreen.tsx`

---

### 8. Notificări → Lasă Feedback - Navigare blocată
- **Status:** ✅ Rezolvat
- **Descriere:** Când deschizi notificările și apeși pe "Lasă feedback", îți deschide pagina de vizită a proprietății unde mai jos este secțiunea de feedback, dar nu te lasă să mergi înapoi (back navigation blocat)
- **Fix:** Îmbunătățit logica butonului back în ViewingDetailScreen. Acum verifică dacă există rute în stivă și dacă nu, face reset la lista de Vizionări în loc să rămână blocat.
- **Fișier modificat:** `src/features/viewings/screens/ViewingDetailScreen.tsx`

---

### 9. Keyboard covering input fields (Global)
- **Status:** ✅ Rezolvat
- **Descriere:** Toate inputurile se comportă diferit. În unele locuri tastatura acoperă câmpul și nu vezi ce introduci.
- **Fix:** Creat component `KeyboardAvoidingWrapper` care poate fi folosit consistent în toate ecranele cu inputuri. Componentul gestionează corect comportamentul tastaturii pe iOS și Android, include ScrollView cu `keyboardShouldPersistTaps="handled"` și opțiune de dismiss keyboard la tap.
- **Fișier creat:** `src/shared/components/KeyboardAvoidingWrapper.tsx`
- **Utilizare:** 
```tsx
import { KeyboardAvoidingWrapper } from '@/shared/components';

<KeyboardAvoidingWrapper>
  {/* Conținut cu inputuri */}
</KeyboardAvoidingWrapper>
```

---

## 📝 Note

- Fișierul va fi actualizat pe măsură ce rezolvăm bug-urile
- Vom adăuga noi bug-uri pe măsură ce sunt identificate
- Prioritatea va fi stabilită împreună cu echipa

---

**Ultima actualizare:** 2 Februarie 2026
