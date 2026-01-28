# Fix pentru eroarea AssetCatalogSimulatorAgent

## Problema
Eroarea `Failed to launch AssetCatalogSimulatorAgent via CoreSimulator spawn` apare la build iOS, chiar și pentru device fizic.

## Soluții de încercat (în ordine)

### 1. Construire directă din Xcode (RECOMANDAT)
Deschide proiectul în Xcode și construiește de acolo pentru a vedea eroarea mai detaliată:

```bash
cd mobile/ios
open RIVA.xcodeproj
```

În Xcode:
1. Selectează device-ul fizic conectat
2. Product → Clean Build Folder (⇧⌘K)
3. Product → Build (⌘B)

Aceasta va oferi mai multe detalii despre eroare.

### 2. Curățare completă și rebuild
```bash
cd mobile

# Oprește toate procesele
killall Xcode 2>/dev/null || true
killall -9 com.apple.CoreSimulator.CoreSimulatorService 2>/dev/null || true

# Curățare completă
rm -rf ios/build
rm -rf ios/Pods
rm -rf ios/Podfile.lock
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# Reinstalare pods
cd ios
pod install
cd ..

# Rebuild
npx expo run:ios --device
```

### 3. Verificare asset catalogs
Dacă problema persistă, poate fi un asset catalog corupt:

```bash
cd mobile/ios/RIVA/Images.xcassets

# Verifică dacă toate fișierele există
ls -la AppIcon.appiconset/
ls -la SplashScreenLegacy.imageset/
```

### 4. Soluție alternativă: Build fără asset catalogs (temporar)
Dacă nimic nu funcționează, poți încerca să construiești fără asset catalogs temporar pentru a verifica dacă problema este acolo.

### 5. Verificare versiune Xcode
Asigură-te că ai o versiune recentă de Xcode:
```bash
xcodebuild -version
```

Dacă ai o versiune beta sau veche, poate cauza probleme.

## Note importante
- Mapbox este acum configurat corect (nu mai apare warning-ul)
- Problema este cu build-ul iOS în general, nu specifică Mapbox
- Eroarea apare la compilarea asset catalogs, nu la instalarea dependențelor
