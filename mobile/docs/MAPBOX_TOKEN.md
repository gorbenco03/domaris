# Mapbox 401 – Invalid Token

Eroarea **`HTTP status code 401. Not Authorized - Invalid Token`** la încărcarea stilului `mapbox://styles/mapbox/streets-v11` apare când tokenul public (cel din `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`) este invalid, expirat sau fără permisiuni.

## Ce poți face

### 1. Verifică tokenul în Mapbox

1. Intră pe [Mapbox Account → Access tokens](https://account.mapbox.com/access-tokens/).
2. Verifică dacă tokenul pe care îl folosești (cel care începe cu `pk.`) există și este **Active**.
3. Dacă e șters sau expirat, creează unul nou.

### 2. Creează un token public valid

1. În [Access tokens](https://account.mapbox.com/access-tokens/), apasă **Create a token**.
2. **Public URL** (opțional): poți lăsa gol pentru development.
3. La **Token scopes** bifează cel puțin:
   - **styles:read** (necesar pentru `streets-v11` și alte stiluri)
   - **fonts:read**
   - Sau folosește **Default public** (toate scope-urile publice).
4. Salvează și copiază noul token (începe cu `pk.`).

### 3. Actualizează tokenul în proiect

În **`mobile/.env.local`**:

```env
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.TOKENUL_TAU_NOU
```

### 4. Repornește Metro

După ce modifici `.env.local`, repornește serverul Expo (Ctrl+C, apoi `npx expo start`).

---

## Rezumat

- **401** = token invalid / expirat / fără permisiuni.
- Folosește întotdeauna un **public token** (`pk....`) pentru app, nu secret key (`sk....`).
- Pentru stiluri Mapbox (ex. `streets-v11`) tokenul trebuie să aibă **styles:read** (sau Default public).
