# Logo și iconițe din Figma (RIVA)

Aplicația folosește aceste asset-uri:

- **Icon** (pe ecranul de start și în drawer): `mobile/assets/icon.png`
- **Splash** (ecranul de încărcare): `mobile/assets/splash-icon.png`
- **Adaptive icon** (Android): `mobile/assets/adaptive-icon.png`
- **Favicon** (web): `mobile/assets/favicon.png`
- **Notification icon**: `mobile/assets/notification-icon.png`

## Cum iei logo-ul din Figma

1. Deschide link-ul Figma (proto-ul tău cu logo-ul).
2. Selectează frame-ul/componenta cu logo-ul.
3. **Export** (panoul din dreapta sau click dreapta → Export):
   - Pentru **icon** și **splash**: exportă ca **PNG** (recomandat 1024×1024 pentru icon, sau dimensiunea din design).
   - Poți exporta și **SVG** dacă vrei să îl redimensionezi local.

## Dimensiuni recomandate (Expo)

| Asset            | Dimensiune      | Fișier                    |
|------------------|-----------------|---------------------------|
| App icon         | 1024×1024 px    | `assets/icon.png`         |
| Splash           | ori 1024×1024 sau raportul ecranului (ex. 1284×2778) | `assets/splash-icon.png` |
| Adaptive (Android) | 1024×1024 px  | `assets/adaptive-icon.png`|
| Favicon          | 48×48 px        | `assets/favicon.png`      |
| Notification     | 96×96 px (alb pe transparent) | `assets/notification-icon.png` |

## Pași rapizi

1. Exportă din Figma PNG 1024×1024 pentru logo (fără fundal sau cu fundal transparent, după cum vrei pe splash).
2. Copiază fișierul peste:
   - `mobile/assets/icon.png`
   - `mobile/assets/splash-icon.png` (poți folosi același sau un crop pentru splash)
   - `mobile/assets/adaptive-icon.png` (același sau variantă pentru Android)
3. Pentru **splash**, în `app.json` e setat:
   - `splash.image`: `./assets/splash-icon.png`
   - `splash.resizeMode`: `contain`
   - `splash.backgroundColor`: `#1e3a5f` (poți schimba la culoarea din Figma)
4. Repornește Metro / refă build-ul ca să vezi noile imagini.

## Notă

Iframe-ul din Figma (embed) nu poate fi „exportat” direct din browser. Trebuie să deschizi proiectul în **Figma** (Desktop sau browser), să selectezi logo-ul și să folosești Export din Figma.

Dacă vrei dimensiuni multiple (1x, 2x, 3x) pentru icon, Expo le generează la build din `icon.png` 1024×1024.
