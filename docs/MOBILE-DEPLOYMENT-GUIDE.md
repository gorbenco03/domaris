# RIVA – Ghid de deploy aplicație mobile

Acest ghid acoperă pașii de la conturi de developer până la publicarea aplicației RIVA pe App Store (iOS) și Google Play (Android).

---

## Cuprins

1. [Cont Apple Developer](#1-cont-apple-developer)
2. [Cont Google Play Developer](#2-cont-google-play-developer)
3. [Pregătire proiect (Expo / EAS)](#3-pregătire-proiect-expo--eas)
4. [Variabile de mediu și secrete](#4-variabile-de-mediu-și-secrete)
5. [Build-uri iOS](#5-build-uri-ios)
6. [Build-uri Android](#6-build-uri-android)
7. [Submit App Store](#7-submit-app-store)
8. [Submit Google Play](#8-submit-google-play)
9. [In-App Purchase (IAP)](#9-in-app-purchase-iap)
10. [Notificări push (Expo vs direct vs Firebase)](#10-notificări-push-expo-vs-direct-vs-firebase)
11. [Certificate și credentiale – listă completă](#11-certificate-și-credentiale--listă-completă)
12. [Checklist pre-lansare](#12-checklist-pre-lansare)

---

## 1. Cont Apple Developer

### 1.1 Înscriere Apple Developer Program

- **Link:** [developer.apple.com/programs/enroll](https://developer.apple.com/programs/enroll/)
- **Cost:** ~99 USD/an (per organizație sau persoană).
- **Necesar:** Apple ID, documente de identitate (pentru persoană) sau D-U-N-S Number (pentru organizație).

**Pași:**

1. Intră pe [developer.apple.com](https://developer.apple.com) și autentifică-te cu Apple ID.
2. Alege **Enroll** → **Individual** sau **Organization**.
3. **Individual:** completezi datele personale și plătești.
4. **Organization:** ai nevoie de D-U-N-S Number pentru firmă; verificarea durează câteva zile.
5. După aprobare, ai acces la **App Store Connect** și **Certificates, Identifiers & Profiles**.

### 1.2 Ce configurezi în Apple (folosit și de EAS)

- **Identifiers:** App ID (ex: `ro.riva.app`) – de obicei creat de EAS la primul build.
- **Certificates:** Distribution Certificate (pentru release) – EAS poate le genera automat.
- **Profiles:** Provisioning Profile pentru aplicația ta – de asemenea gestionat de EAS.
- **App Store Connect:** aplicația (bundle ID), metadata, screenshots, review.

### 1.3 Sign in with Apple (opțional, dar recomandat)

- În [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list) → **Identifiers** → alege App ID `ro.riva.app`.
- Activează **Sign in with Apple** și salvează.
- În backend folosești `APPLE_CLIENT_ID` (ex: `ro.riva.app` sau Service ID dacă ai configurat unul separat).

---

## 2. Cont Google Play Developer

### 2.1 Cont Google Play Console

- **Link:** [play.google.com/console](https://play.google.com/console)
- **Cost:** 25 USD (plată unică, cont permanent).
- **Necesar:** Cont Google, document de identitate, eventual detalii de plată (pentru vânzări).

**Pași:**

1. Intră pe [play.google.com/console](https://play.google.com/console).
2. Acceptă **Developer Distribution Agreement**.
3. Plătești taxa de 25 USD (card).
4. Completezi profilul de developer (nume, email, site – opțional).

### 2.2 Ce configurezi în Play Console (după primul upload)

- **App:** creezi o aplicație nouă, titlu RIVA, limbă default.
- **Store listing:** descriere scurtă/lungă, screenshots (telefon, 7”, 10”), iconă, feature graphic.
- **Content rating:** questionnaire (ex: IARC sau formularul Google).
- **Target audience:** vârstă (ex: 18+ dacă e cazul).
- **Privacy policy:** URL către politica de confidențialitate (obligatoriu).
- **App signing:** Google poate gestiona signing-ul (recomandat); poți încărca un upload key sau folosi cel generat de EAS.

### 2.3 OAuth pentru Google Sign-In (Android / Web)

- **Link:** [console.cloud.google.com](https://console.cloud.google.com)
1. Creezi un proiect (sau alegi unul existent).
2. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**.
3. Tipuri utile:
   - **Android:** package name `ro.riva.app`, SHA-1 din keystore-ul de release (EAS îl poate furniza).
   - **Web:** pentru backend (dacă folosești Google Sign-In pe server) – Client ID și Client Secret.
4. Client ID-ul (Android și/sau Web) îl folosești în app (Expo/Google config) și în backend (`GOOGLE_CLIENT_ID` pentru web).

---

## 3. Pregătire proiect (Expo / EAS)

Aplicația RIVA folosește **Expo** și **EAS (Expo Application Services)** pentru build și submit.

### 3.1 Structură relevantă (din `mobile/structure.txt`)

- **Config:** `app.json`, `app.config.js`, `eas.json`
- **Entry:** `index.ts` → `App.tsx`
- **Features:** auth, KYC, properties, search, messaging, notifications, etc.
- **Build:** Expo SDK 54, React Native, `@rnmapbox/maps`, `expo-notifications`, OAuth (Apple/Google).

### 3.2 EAS CLI și cont Expo

```bash
npm install -g eas-cli
eas login
```

- Dacă nu ai proiect EAS legat: în `mobile/` rulezi `eas init` (sau îl legi la un projectId existent din `app.json` → `extra.eas.projectId`).
- În [expo.dev](https://expo.dev) → proiectul tău: verifici **Credentials** (iOS/Android) și **Secrets** (variabile pentru build).

### 3.3 Verificare `eas.json` (exemplu)

Proiectul are deja profile:

- **development** – development client, internal.
- **preview** – internal distribution.
- **production** – pentru App Store / Play Store (autoIncrement pentru iOS buildNumber și Android versionCode).

Poți adăuga un profile **staging** dacă vrei build-uri de test cu API de staging.

---

## 4. Variabile de mediu și secrete

### 4.1 Variabile la runtime (în app)

Definite în `mobile/src/config/env.ts`, citite din `EXPO_PUBLIC_*`:

| Variabilă | Descriere | Exemplu production |
|-----------|-----------|---------------------|
| `EXPO_PUBLIC_API_URL` | URL API backend | `https://api.domaris.md/api` |
| `EXPO_PUBLIC_WS_URL` | URL WebSocket | `wss://api.domaris.md` |
| `EXPO_PUBLIC_ENV` | `development` / `staging` / `production` | `production` |
| `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` | Token Mapbox (public) | `pk.xxx` |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Google OAuth iOS | (din Google Cloud Console) |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | Google OAuth Android | (din Google Cloud Console) |

Pentru **production**, acestea trebuie setate la build time (EAS Secrets sau în `eas.json` sub `env`).

### 4.2 EAS Secrets (pentru build)

Setare în [expo.dev](https://expo.dev) → proiect → **Secrets**, sau din CLI:

```bash
cd mobile
eas secret:create --name EXPO_PUBLIC_API_URL --value "https://api.domaris.md/api" --type string
eas secret:create --name EXPO_PUBLIC_WS_URL --value "wss://api.domaris.md" --type string
eas secret:create --name EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN --value "pk.xxx" --type string
# etc.
```

Sau în `eas.json` pe profile:

```json
"production": {
  "env": {
    "EXPO_PUBLIC_API_URL": "https://api.domaris.md/api",
    "EXPO_PUBLIC_WS_URL": "wss://api.domaris.md",
    "EXPO_PUBLIC_ENV": "production"
  },
  "ios": { "autoIncrement": true },
  "android": { "autoIncrement": true }
}
```

**Important:** Token-ul Mapbox pentru **download SDK** (build time) este în `app.json` sub plugin `@rnmapbox/maps` (sau din `RNMAPBOX_MAPS_DOWNLOAD_TOKEN`). Nu confunda cu token-ul public de hartă (`EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`).

### 4.3 Apple / Google pentru backend

- **Apple:** în backend pui `APPLE_CLIENT_ID` (bundle ID sau Service ID).
- **Google:** în backend pui `GOOGLE_CLIENT_ID` (client ID web, dacă verifici token-ul pe server). Mobile folosește client ID-uri iOS/Android în app.

---

## 5. Build-uri iOS

### 5.1 Credențiale iOS (EAS)

La primul build iOS, EAS poate genera:

- **Distribution Certificate**
- **Provisioning Profile** pentru `ro.riva.app`

Sau le poți încărca manual (dacă le ai de la Apple).

```bash
cd mobile
eas build --platform ios --profile production
```

- Build-ul rulează în cloud; la final primești un link către `.ipa` sau instalare prin link.
- Pentru **App Store** folosești același profile `production`; după build faci submit (vezi secțiunea 7).

### 5.2 Dacă folosești development build local

```bash
cd mobile
npx expo prebuild --clean --platform ios
cd ios && pod install && cd ..
npx expo run:ios --configuration Release
```

Pentru release pe device sau archive, ai nevoie de certificate și provisioning profile (Apple) sau lași EAS să le gestioneze.

---

## 6. Build-uri Android

### 6.1 Keystore (EAS)

EAS poate genera un keystore la primul build Android; îl stochezi în Expo și îl refolosești la fiecare build. Alternativ, poți încărca un keystore existent.

```bash
cd mobile
eas build --platform android --profile production
```

- Rezultat: `.aab` (recomandat pentru Play Store) sau `.apk`.
- **Google Play App Signing:** recomandat să lași Google să gestioneze signing-ul; încarci upload key-ul (sau îl lași pe EAS să îl genereze și să îl asociezi în Play Console).

### 6.2 SHA-1 pentru Google Sign-In

Pentru OAuth Android, în Google Cloud Console ai nevoie de SHA-1 al keystore-ului de release.

- Din EAS: în Expo Dashboard → proiect → **Credentials** → Android → poți vedea/exporta keystore info.
- Sau local: `keytool -list -v -keystore your-release.keystore` și copiezi SHA-1 în Google Cloud → Android OAuth client.

---

## 7. Submit App Store

### 7.1 După build iOS (EAS)

```bash
cd mobile
eas submit --platform ios --latest --profile production
```

- `--latest` trimite ultimul build din profile-ul `production`.
- Poți specifica și un path către `.ipa`: `eas submit --platform ios --path /path/to/app.ipa`.

### 7.2 În App Store Connect

1. [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **My Apps** → creezi o aplicație nouă (sau o deschizi pe cea existentă).
2. **Bundle ID:** `ro.riva.app` (aliniat cu `app.json`).
3. Completezi: **App Information**, **Pricing**, **App Privacy**, **App Store listing** (screenshots, descriere, cuvinte cheie).
4. După submit din EAS, build-ul apare în **TestFlight** / **App Store** → **+** (version/build).
5. Atașezi build-ul, completezi „What’s New”, trimiti la review.

### 7.3 Notificări push (iOS – APNs)

- În Apple Developer: **Certificates, Identifiers & Profiles** → **Keys** → creezi o cheie cu **Apple Push Notifications**; descarci fișierul .p8 (o singură dată).
- În EAS / Expo Dashboard încarci acest **APNs Key** ca să poți livra push pe iOS (Expo Push sau direct). Detalii complete: [secțiunea 10](#10-notificări-push-expo-vs-direct-vs-firebase) și [11.1](#111-apple).

---

## 8. Submit Google Play

### 8.1 După build Android (EAS)

```bash
cd mobile
eas submit --platform android --latest --profile production
```

- Dacă ceri `.aab`, EAS îl generează și îl trimite la Play Console.
- La primul submit îți cere un **track** (internal / closed / open testing / production).

### 8.2 În Google Play Console

1. Creezi aplicația (dacă nu există): package `ro.riva.app`.
2. **Release** → **Production** (sau **Testing**) → **Create new release** → încarci `.aab`-ul.
3. Completezi **Store listing**, **Content rating**, **Privacy policy**, **Target audience**.
4. După ce toate secțiunile sunt verificate, trimiți release-ul la review.

### 8.3 Notificări push (Android)

- Pentru **Expo Push**: în EAS încarci **FCM Server Key** (sau credentiale FCM) din Firebase Console – nu e nevoie de Firebase SDK în app. Detalii: [secțiunea 10](#10-notificări-push-expo-vs-direct-vs-firebase).
- Pentru **direct FCM**: backend trimite la FCM cu service account; token-ul FCM îl obții în app (expo-notifications în dev build sau alt mod).

---

## 9. In-App Purchase (IAP)

Aplicația RIVA folosește **Apple IAP** (iOS) și **Google Play Billing** (Android) pentru abonamente și boost-uri (vezi `mobile/src/features/monetization/`). În cod, fluxul este pregătit; IAP-ul efectiv este marcat TODO și folosește mock – trebuie conectat la store-uri și backend.

### 9.1 Apple – App Store Connect

1. **Agreements, Tax, and Banking** (obligatoriu înainte de IAP)
   - [App Store Connect](https://appstoreconnect.apple.com) → **Agreements, Tax, and Banking**.
   - Completezi **Paid Applications** (contract), **Tax**, **Banking** (IBAN etc.). Fără acestea nu poți vinde.

2. **In-App Purchases**
   - În aplicația ta (bundle `ro.riva.app`) → **Features** → **In-App Purchases**.
   - Creezi **Subscriptions** (ex: `ro.riva.app.subscription.monthly`, `ro.riva.app.subscription.yearly`) și/sau **Consumables** / **Non-Consumables** pentru boost-uri (ex: `ro.riva.app.boost.7d`).
   - Product IDs trebuie să coincidă cu cele din `paymentService.ts` / `monetizationApi` (ex: plan IDs din backend).

3. **App-Specific Shared Secret** (pentru verificare receipt pe server)
   - **App** → **App Information** → **App-Specific Shared Secret** → **Generate**.
   - Îl pui în backend: `APPLE_IAP_SHARED_SECRET=...` (dacă folosești verificare receipt legacy).
   - Pentru **App Store Server API** (recomandat): nu folosești Shared Secret; folosești JWT cu key .p8.

4. **App Store Server API** (verificare pe backend – deja pregătit în `backend/.env`)
   - [App Store Connect](https://appstoreconnect.apple.com) → **Users and Access** → **Keys** → **In-App Purchase** → creezi o cheie.
   - Descărci fișierul **.p8** (o singură dată); îl pui pe server (ex: `backend/certs/apple-iap.p8`).
   - În backend: `APPLE_IAP_KEY_ID`, `APPLE_IAP_ISSUER_ID`, `APPLE_IAP_PRIVATE_KEY_PATH` (sau conținutul cheii în env), `APPLE_IAP_ENV=sandbox` (dev) sau `production`.

5. **Capability în Xcode / EAS**
   - App ID `ro.riva.app` trebuie să aibă **In-App Purchase** activat în [Identifiers](https://developer.apple.com/account/resources/identifiers/list).
   - La build (EAS sau Xcode), capability este inclus automat dacă entitlements sunt generate din `app.json` / Expo; verifică că nu e dezactivat.

### 9.2 Google Play – Play Console

1. **Monetize** → **Products** → **Subscriptions** sau **In-app products**
   - Creezi produse cu **Product ID** (ex: `subscription_monthly`, `boost_7d`) – aliniate cu cele din app și backend.

2. **License testing**
   - **Setup** → **License testing**: adaugi adrese Gmail de testare ca să poți testa cumpărări fără a fi debitabil.

3. **Google Play Developer API** (pentru verificare pe backend)
   - [Google Cloud Console](https://console.cloud.google.com) → proiectul legat de Play Console → **APIs & Services** → **Enable** **Google Play Android Developer API**.
   - Creezi **Service Account**; îi dai acces în Play Console (**Users and permissions** → invite service account cu drepturi **View financial data** / **Manage orders**).
   - Descărci JSON-ul cheii; pe backend folosești `GOOGLE_APPLICATION_CREDENTIALS` sau variabile echivalente pentru a verifica purchase token-ul (Google Play Developer API).

### 9.3 Mobile – implementare IAP (react-native-iap)

- În proiect este pregătit fluxul în `mobile/src/features/monetization/services/paymentService.ts` (Apple / Google), dar apelurile reale sunt **TODO** (mock).
- Pași:
  1. Instalezi `react-native-iap` (compatibil cu Expo dev client / development build – nu merge în Expo Go).
  2. Inițializare: `IAP.initConnection()`, apoi `getProducts()` / `getSubscriptions()` cu product IDs din store.
  3. Cumpărare: `requestPurchase()` / `requestSubscription()`; la final trimiți receipt (Apple) sau `purchaseToken` (Google) la backend.
  4. Backend: endpoint-uri existente – `POST .../webhooks/apple/verify` și `.../google/verify` (mobile apelează `monetizationApi.verifyAppleReceipt` / `verifyGooglePurchase`); implementarea efectivă a verificării (Apple Server API / Google Play API) trebuie completată în backend dacă nu e deja.

### 9.4 Rezumat IAP

| Unde | Ce configurezi |
|------|-----------------|
| **Apple** | Agreements/Tax/Banking, In-App Purchases (product IDs), Shared Secret sau App Store Server API (.p8, Key ID, Issuer ID), capability In-App Purchase pe App ID. |
| **Google** | In-app products / Subscriptions (product IDs), License testing, Google Play Developer API + Service Account pentru backend. |
| **Mobile** | `react-native-iap`, product IDs aliniate cu store, trimitere receipt/token la backend după purchase. |
| **Backend** | `APPLE_IAP_*`, verificare Apple (receipt sau Server API); Google: service account, verificare purchase token. |

---

## 10. Notificări push (Expo vs direct vs Firebase)

În proiect, **app-ul folosește `expo-notifications`** și **Expo Push Token** (`getExpoPushTokenAsync`); **backend-ul** poate trimite fie prin **Expo Push API** (`https://api.expo.dev/v2/push/send`), fie prin **Firebase** (FCM), fie direct la APNs/FCM (dacă ai token-uri native). Nu e nevoie de **Firebase SDK în app** pentru niciuna dintre variante.

### 10.1 Varianta 1: Expo Push (recomandat – fără Firebase în app)

- **Cum funcționează:** App-ul obține **Expo Push Token**; îl trimite la backend; backend-ul trimite notificări la **Expo Push API**; Expo le livrează la APNs (iOS) și FCM (Android).
- **Ce configurezi:**
  - **iOS:** În EAS / Expo Dashboard încarci **APNs Key** (.p8) din Apple Developer → **Keys** (Apple Push Notifications). Fără acest key, Expo nu poate livra pe iOS.
  - **Android:** Expo poate folosi FCM în spate. În EAS poți încărca **FCM Server Key** (legacy) sau **FCM credentials** (JSON service account). Cheia o obții din [Firebase Console](https://console.firebase.google.com) → Project Settings → Cloud Messaging (fără să instalezi Firebase SDK în app – doar creezi proiectul și iei cheia pentru Expo).
  - **Backend:** `PUSH_PROVIDER=expo`. Opțional: `EXPO_ACCESS_TOKEN` (token EAS) pentru rate limit mai mare la api.expo.dev.
- **Avantaj:** Simplu, fără Firebase SDK în app, un singur API (Expo) din backend. **Dezavantaj:** dependență de serviciul Expo pentru livrare.

### 10.2 Varianta 2: Direct APNs + FCM (fără Firebase în app, fără Expo Push)

- **Cum funcționează:** App-ul obține **token-uri native** (APNs device token pe iOS, FCM token pe Android). Backend-ul trimite direct la APNs (HTTP/2) și la FCM (HTTP v1 API).
- **Ce configurezi:**
  - **iOS:** Backend are nevoie de **APNs Key** (.p8) + Key ID + Team ID + Bundle ID; app-ul trebuie să expună APNs device token (expo-notifications în development build poate furniza token-ul nativ).
  - **Android:** FCM HTTP v1 – backend folosește un **Google Cloud Service Account** (JSON) cu drepturi Firebase Cloud Messaging; **nu** pui Firebase SDK în app, doar un mod de a obține FCM token (ex: `expo-notifications` cu config FCM sau alt mod de a lua token-ul nativ).
  - **Backend:** `PUSH_PROVIDER=firebase` (dacă backend-ul tău mapează FCM la “direct”) sau logic custom: trimitere la APNs + FCM. Variabile: APNs .p8 path; FCM: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (sau `FIREBASE_PRIVATE_KEY` base64).
- **Avantaj:** Control total, fără dependență de Expo Push. **Dezavantaj:** Mai mult de configurat (APNs + FCM, token-uri native în app).

### 10.3 Varianta 3: Firebase (FCM) în backend + Expo sau token nativ în app

- Backend folosește **Firebase Admin SDK** (`PUSH_PROVIDER=firebase`) și trimite la FCM; FCM livrează pe Android și (prin APNs) pe iOS.
- App-ul poate rămâne cu **Expo Push Token** doar dacă Expo e configurat să folosească FCM pentru Android (Expo atunci primește token-ul FCM și îl mapează la Expo token). Sau app-ul trimite **FCM token** direct la backend (cu sau fără Firebase SDK în app – fără SDK poți folosi doar un mod de a obține FCM token, ex. prin Expo config).
- **Firebase în app:** Nu e obligatoriu. Poți folosi doar Firebase în backend (service account) și în app Expo Push sau token nativ FCM.

### 10.4 Recomandare

- **Fără Firebase în app:** Cel mai simplu este **Expo Push** (varianta 1): pui APNs key în EAS, pentru Android pui FCM server key (sau credentiale) în EAS, backend rămâne cu `PUSH_PROVIDER=expo` și trimite la `api.expo.dev/v2/push/send`. Zero Firebase SDK în app.
- **Dacă vrei “direct”:** Înseamnă backend trimite direct la APNs și FCM (varianta 2). Tot nu ai nevoie de Firebase SDK în app; ai nevoie de APNs key și de FCM (service account) doar pe server.

---

## 11. Certificate și credentiale – listă completă

Lista următoare rezultă din analiza proiectului (mobile + backend) și trebuie să fie toate configurate / instalate unde e cazul.

### 11.1 Apple

| Ce | Unde / Cum |
|----|-------------|
| **Apple Developer account** | developer.apple.com, 99 USD/an. |
| **App ID** | `ro.riva.app` – Identifiers, cu capabilities: Sign in with Apple, Push Notifications, In-App Purchase. |
| **Distribution Certificate** | Pentru release; EAS poate genera sau îl încarci. |
| **Provisioning Profile** | Pentru `ro.riva.app`; EAS sau manual. |
| **Sign in with Apple** | Activ pe App ID; backend: `APPLE_CLIENT_ID` (bundle ID sau Service ID). |
| **APNs Key** (.p8) | Keys → Apple Push Notifications; pentru push (Expo sau direct). |
| **In-App Purchase** | Capability pe App ID; App Store Connect: Agreements/Tax/Banking, products, Shared Secret sau App Store Server API. |
| **App Store Server API** | Key .p8, Key ID, Issuer ID; backend: `APPLE_IAP_KEY_ID`, `APPLE_IAP_ISSUER_ID`, `APPLE_IAP_PRIVATE_KEY_PATH`, `APPLE_IAP_ENV`. |

### 11.2 Google

| Ce | Unde / Cum |
|----|-------------|
| **Play Console account** | 25 USD o dată. |
| **Package name** | `ro.riva.app` (în `app.json`). |
| **OAuth 2.0 Client ID (Android)** | Google Cloud Console – Android, package `ro.riva.app`, SHA-1 din keystore release (EAS sau local). |
| **OAuth 2.0 Client ID (Web)** | Pentru backend – `GOOGLE_CLIENT_ID`. |
| **Keystore (upload / signing)** | EAS îl poate genera; sau îl încarci în EAS / Play Console. |
| **FCM** | Pentru push: fie FCM Server Key (legacy) în EAS, fie Service Account pe backend dacă trimiți direct. Nu e obligatoriu Firebase SDK în app. |
| **Google Play Developer API** | Service account pentru verificare IAP pe backend; JSON key pe server. |
| **In-app products / Subscriptions** | Play Console → Monetize; product IDs aliniate cu app și backend. |

### 11.3 Expo / EAS

| Ce | Unde / Cum |
|----|-------------|
| **projectId** | `app.json` → `extra.eas.projectId` (ex: `5986308b-82d0-4d84-af05-6e614efc3263`). |
| **owner** | `app.json` → `owner` (ex: `gorbenco03`). |
| **EAS Secrets** | EXPO_PUBLIC_API_URL, EXPO_PUBLIC_WS_URL, EXPO_PUBLIC_ENV, EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN, EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID, EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID. |
| **Build credentials** | iOS: Distribution Certificate + Provisioning Profile (sau EAS auto); Android: keystore (sau EAS auto). |
| **Push credentials** | iOS: APNs key în EAS; Android: FCM key sau credentiale în EAS (dacă folosești Expo Push). |
| **EXPO_ACCESS_TOKEN** | Opțional, pe backend, dacă folosești Expo Push (rate limit mai mare). |

### 11.4 Mapbox

| Ce | Unde / Cum |
|----|-------------|
| **Download token** (build time) | `app.json` → plugin `@rnmapbox/maps` → `RNMapboxMapsDownloadToken`; sau env `RNMAPBOX_MAPS_DOWNLOAD_TOKEN`. Secret, nu îl pune în client. |
| **Public token** (runtime) | `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` – pentru hărți în app (pk.xxx). |

### 11.5 Backend (relevante pentru mobile)

| Ce | Unde / Cum |
|----|-------------|
| **JWT_SECRET** | Pentru access/refresh tokens. |
| **APPLE_CLIENT_ID** | Bundle ID sau Service ID pentru Apple Sign-In. |
| **GOOGLE_CLIENT_ID** | Client ID web pentru verificare token Google. |
| **Push** | `PUSH_PROVIDER=expo` (și opțional `EXPO_ACCESS_TOKEN`) sau `firebase` (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) sau logic directă APNs+FCM. |
| **Apple IAP** | `APPLE_IAP_SHARED_SECRET` (receipt) și/sau `APPLE_IAP_KEY_ID`, `APPLE_IAP_ISSUER_ID`, `APPLE_IAP_PRIVATE_KEY_PATH`, `APPLE_IAP_ENV`. |
| **Google IAP** | Service account JSON sau `GOOGLE_APPLICATION_CREDENTIALS` pentru Google Play Developer API. |

### 11.6 Mobile (variabile la build / runtime)

| Variabilă | Rol |
|-----------|-----|
| `EXPO_PUBLIC_API_URL` | URL API backend. |
| `EXPO_PUBLIC_WS_URL` | URL WebSocket. |
| `EXPO_PUBLIC_ENV` | development / staging / production. |
| `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` | Token public Mapbox. |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Google OAuth iOS. |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | Google OAuth Android. |

---

## 12. Checklist pre-lansare

- [ ] Cont Apple Developer activ; Bundle ID `ro.riva.app`; Sign in with Apple și In-App Purchase activate pe App ID.
- [ ] Cont Google Play Developer activ; OAuth Android (SHA-1, package) în Google Cloud; In-app products / Subscriptions create.
- [ ] Backend production live; `EXPO_PUBLIC_API_URL` și `EXPO_PUBLIC_WS_URL` setate în build.
- [ ] EAS Secrets / `eas.json` env: API, WS, Mapbox, OAuth, ENV.
- [ ] Mapbox: token download (build); token public (runtime).
- [ ] **IAP:** Apple – Agreements/Tax/Banking, products, Shared Secret sau Server API (.p8); Google – products, License testing, Service Account pentru backend; mobile – `react-native-iap` conectat, backend verify endpoints implementate.
- [ ] **Push:** APNs key în EAS (iOS); FCM key/credentiale în EAS (Android) dacă folosești Expo Push; backend `PUSH_PROVIDER=expo` (sau direct); fără Firebase SDK în app dacă alegi Expo/direct.
- [ ] Toate certificate/credentiale din secțiunea 11 verificate (Apple, Google, EAS, Mapbox, backend).
- [ ] Politica de confidențialitate și termeni; link-uri în app și store listings.
- [ ] Screenshots și texte pentru App Store și Play Store.
- [ ] Testare pe device: login (email, phone, Google, Apple), notificări, hărți, IAP (sandbox / license test), flow principal.

---

## Referințe rapide

| Resursă | URL |
|--------|-----|
| Apple Developer | https://developer.apple.com |
| App Store Connect | https://appstoreconnect.apple.com |
| Google Play Console | https://play.google.com/console |
| Google Cloud Console | https://console.cloud.google.com |
| Expo Dashboard | https://expo.dev |
| EAS Build | https://docs.expo.dev/build/introduction/ |
| EAS Submit | https://docs.expo.dev/submit/introduction/ |

---

*Document generat pentru proiectul RIVA (mobile). Actualizat conform structurii din `mobile/structure.txt` și configurării Expo/EAS.*
