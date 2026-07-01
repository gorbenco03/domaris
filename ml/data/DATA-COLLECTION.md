# Ghid de colectare a datelor pentru modelul AVM (Riva-AVM v1)

Completează un rând per **tranzacție de vânzare reală închisă**. Pune fișierul la
`ml/data/real_transactions.csv` și rulează `python src/train.py --data data/real_transactions.csv`.

## Coloane

### ✅ Obligatorii (trebuie completate)
| Coloană | Tip | Exemplu | Note |
|---|---|---|---|
| `transaction_date` | dată `YYYY-MM-DD` | 2025-03-14 | data închiderii tranzacției |
| `city` | text | Chisinau | doar: Chisinau, Balti, Cahul, Ungheni, Orhei, Straseni |
| `neighborhood` | text | Botanica | cartierul/zona |
| `property_type` | text | APARTMENT | doar: APARTMENT, HOUSE, STUDIO |
| `rooms` | întreg 0–10 | 2 | 0 = studio |
| `surface_sqm` | număr 10–1000 | 52 | suprafața în mp |
| `is_furnished` | true/false | true | mobilat sau nu |
| **`sale_price_eur`** | număr | 47500 | **PREȚUL REAL de vânzare în EUR — ținta. NU preț cerut!** |

### 🟡 Opționale (cresc precizia; pot fi goale)
| Coloană | Tip | Exemplu |
|---|---|---|
| `floor` | întreg 0–30 | 4 |
| `total_floors` | întreg 1–30 | 9 |
| `year_built` | an 1900–2025 | 1987 |
| `amenities_list` | text separat cu `\|` | parking\|elevator\|balcony |
| `lat` / `lng` | GPS (4 zecimale) | 46.9898 / 28.8560 |

Dotări valide (`amenities_list`): parking, elevator, balcony, garage, storage, security, interphone, gas, internet

### ⚙️ Auto / metadate (lasă gol dacă nu știi — se pot calcula/completa)
| Coloană | Note |
|---|---|
| `transaction_id` | orice id unic (sau lasă gol, se generează) |
| `amenities_count` | numărul de dotări (se poate calcula din `amenities_list`) |
| `price_per_sqm_eur` | `sale_price_eur / surface_sqm` (doar pentru validare) |
| `data_source` | internal \| partner \| cadastru |
| `is_verified` | true/false — tranzacție verificată de tine |

## Reguli de aur
1. **`sale_price_eur` = prețul real la care s-a vândut**, nu prețul cerut/din anunț. Asta e diferența care face modelul corect. (Prețurile cerute supraestimează sistematic.)
2. **Volum minim util: ~500 rânduri**; bun: 2.000–5.000; foarte bun: 5.000+. Mai multe date pe oraș/cartier = predicții mai bune acolo.
3. **Consecvență**: aceleași denumiri de orașe/cartiere/tip peste tot (vezi valorile valide).
4. **Fără date personale** ale vânzătorului/cumpărătorului — doar atributele proprietății + preț (GDPR).
5. **Distribuie în timp**: include tranzacții din mai multe luni (modelul folosește split temporal la validare).

## De unde iei datele
- **Cel mai bun:** tranzacții închise reale — propria platformă (când ai vânzări), agenții imobiliare partenere, notari, cadastru.
- **De evitat ca țintă:** anunțurile de pe 999.md/OLX = prețuri *cerute*, nu reale (utile doar ca aproximare grosieră).
