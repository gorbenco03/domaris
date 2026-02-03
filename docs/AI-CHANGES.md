# AI Changes Audit (Backend + Mobile)

This document summarizes **all AI-related code changes** introduced recently:

- What was added
- What was modified
- New API endpoints
- How the new Conversational Agent works (Tier 0/1/2)
- How the AVM / price recommendation works
- How to test

---

## 1. High-level outcome

### 1.1 Conversational Real Estate Agent (NEW)
A new **AI Gateway / Orchestration layer** was introduced in the backend to avoid scattering LLM calls across the codebase.

Key properties:
- **Multi-tier routing for cost control**
  - **Tier 0**: deterministic rules (free)
  - **Tier 1**: cheap model classification + tool-calling (`gpt-4o-mini`)
  - **Tier 2**: strong model (`gpt-4o`) only when necessary
- **Tool-based architecture**: the model does not query the DB directly; it invokes allowlisted tools.
- **Structured preference memory** per conversation (currently **in-memory**, TTL ~6h).

### 1.2 AVM / Price Recommendation Engine (NEW)
A new valuation engine was added that is **deterministic/statistical-first**.

Key properties:
- Computes:
  - recommended price
  - price range
  - confidence
  - liquidity score
  - deal attractiveness
- Uses LLM **only** for an explanation layer.
- LLM is explicitly instructed: **never invent numbers**.

---

## 2. Backend changes

### 2.1 New files added

#### AI types
- `backend/src/app/modules/ai/types/index.ts`
  - Shared types for:
    - `ConversationState`, `UserPreferences`
    - `Intent`, routing tiers
    - tool contracts (`ToolCall`, `ToolResult`)
    - AVM types (`AVMInput`, `AVMResult`, `AVMExplanation`)

#### Tool schemas + tool execution
- `backend/src/app/modules/ai/tools/definitions.ts`
  - Central allowlist of tools (OpenAI tool schema export)

- `backend/src/app/modules/ai/tools/executor.ts`
  - Executes tool calls securely (search, mortgage, compare, etc.)
  - Merges tool inputs with structured preferences

#### Multi-tier routing
- `backend/src/app/modules/ai/router/intent-router.ts`
  - Tier 0 regex rules
  - Tier 1 cheap classifier (`gpt-4o-mini`) returning JSON
  - Escalation to Tier 2 when confidence is low or request is complex

#### AI Gateway
- `backend/src/app/modules/ai/gateway/ai-gateway.service.ts`
  - Central orchestration of:
    - intent routing
    - preference updates
    - tool calling
    - response generation
    - telemetry stats

#### AVM Engine
- `backend/src/app/modules/ai/avm/valuation-engine.ts`
  - Comparable-based valuation + adjustments
  - Explanation generator (LLM) that uses only precomputed numbers
  - In-memory 24h cache

### 2.2 Files modified

#### Nest module wiring
- `backend/src/app/modules/ai/ai.module.ts`
  - Added providers:
    - `AIGatewayService`
    - `IntentRouter`
    - `ToolExecutor`
    - `ValuationEngine`
  - Keeps `AIService` for backward compatibility

#### AI controller endpoints
- `backend/src/app/modules/ai/ai.controller.ts`
  - **Kept legacy endpoints**
  - **Added new endpoints** under `/ai/agent/*`

---

## 3. Backend API - new endpoints

### 3.1 Conversational Agent

#### `POST /ai/agent/chat`
Public endpoint.

Request body:
```json
{
  "message": "Caut apartament 2 camere în Botanica sub 400€",
  "conversationId": "optional-uuid",
  "context": {
    "tone": "friendly",
    "language": "ro",
    "maxResults": 5
  }
}
```

Response shape (high level):
```json
{
  "conversationId": "uuid",
  "message": "...",
  "properties": [],
  "intent": { "type": "search", "confidence": 0.9, "tier": 1 },
  "toolsUsed": ["search_properties"],
  "suggestedActions": [],
  "debug": { "tier": 1, "latencyMs": 450, "cached": false }
}
```

#### `GET /ai/agent/stats`
Returns basic stats of tier usage + average latency.

### 3.2 AVM / Price Recommendation

#### `POST /ai/agent/valuation`
Public endpoint.

Request body:
```json
{
  "city": "Chișinău",
  "neighborhood": "Botanica",
  "propertyType": "APARTMENT",
  "transactionType": "RENT",
  "rooms": 2,
  "surfaceSqm": 55,
  "floor": 5,
  "totalFloors": 9,
  "yearBuilt": 2010,
  "amenities": ["parcare"],
  "condition": "renovated",
  "isFurnished": true
}
```

Response contains:
- `valuation` (numbers)
- `explanation` (text)

#### `GET /ai/agent/valuation/:listingId`
Runs valuation for an existing listing ID.

---

## 4. Backend tools available to the agent

Tools are defined in `backend/src/app/modules/ai/tools/definitions.ts`.

Currently implemented in `ToolExecutor`:
- `search_properties`
- `get_property_details`
- `calculate_mortgage`
- `estimate_budget`
- `recommend_areas`
- `get_price_estimate` (temporary comparable-based helper; AVM is the recommended path)
- `schedule_viewing` (returns a placeholder success payload for now)
- `save_search` (placeholder success payload for now)
- `compare_properties`

Notes:
- `schedule_viewing` and `save_search` require auth logically, but the current implementation returns placeholders.

---

## 5. Mobile changes

### 5.1 Files modified

#### Endpoints
- `mobile/src/core/api/endpoints.ts`
  - Added:
    - `API_ENDPOINTS.AI.AGENT_CHAT`
    - `API_ENDPOINTS.AI.AGENT_STATS`
    - `API_ENDPOINTS.AI.AGENT_VALUATION`
    - `API_ENDPOINTS.AI.AGENT_VALUATION_LISTING(id)`

#### AI API client
- `mobile/src/features/ai/api/aiApi.ts`
  - Added typed functions:
    - `agentChat()`
    - `getAgentStats()`
    - `getValuation()`
    - `getListingValuation()`

#### AI chat screen
- `mobile/src/features/ai/screens/AIChatScreen.tsx`
  - Switched from legacy `aiApi.chatWithAI()` to `aiApi.agentChat()`
  - Added `conversationId` state to keep the agent memory within the same session

#### IconButton type fix
- `mobile/src/shared/components/IconButton.tsx`
  - Fixed TS type: `style?: StyleProp<ViewStyle>` so arrays of styles are accepted

---

## 6. How to run / test

### 6.1 Backend

Environment:
- `OPENAI_API_KEY` must be set for Tier 1/2 and AVM explanation.
- Without it:
  - Tier 0 still works for simple flows
  - Tier 1/2 model calls will degrade to fallback logic

Manual tests:

1) Agent chat
```bash
curl -X POST http://localhost:3000/ai/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Caut apartament 2 camere în Botanica sub 400€"}'
```

2) AVM
```bash
curl -X POST http://localhost:3000/ai/agent/valuation \
  -H "Content-Type: application/json" \
  -d '{"city":"Chișinău","neighborhood":"Botanica","propertyType":"APARTMENT","transactionType":"RENT","rooms":2,"surfaceSqm":55}'
```

### 6.2 Mobile

- `AIChatScreen` will call `POST /ai/agent/chat`.
- You should see a `conversationId` returned and reused within the session.

---

## 7. Important limitations (current state)

### 7.1 Conversation state storage
- Currently stored **in-memory** in `AIGatewayService` (`Map<string, ConversationState>`).
- If the backend restarts, conversation state is lost.
- TTL is set to ~6h in code, but eviction is not yet actively enforced.

Recommended next step (production): move this to Redis.

### 7.2 AVM caching
- In-memory `Map` cache in `ValuationEngine`, TTL 24h.

Recommended next step (production): Redis cache keyed by a stable input fingerprint.

### 7.3 Scheduling / saving search
- Tools exist but return placeholder success objects.
- Integrate with real modules:
  - `viewing` module for schedule requests
  - `saved-search` module for saved searches

---

## 8. Legacy endpoints kept

These were left intact for backward compatibility:
- `POST /ai/chat`
- `POST /ai/estimate-price`
- `POST /ai/analyze-listing`
- `POST /ai/generate-description`
- `GET /ai/property-summary/:propertyId`

---

## 9. Quick sanity checklist

- Verify backend compiles (TypeScript + Nest)
- Confirm `OPENAI_API_KEY` present in backend env
- Confirm `/ai/agent/chat` returns:
  - `conversationId`
  - `message`
  - `intent.tier`
- Confirm mobile screen displays agent `message` and mapped listings

---

## 10. Next improvements (recommended)

- Persist conversation state in Redis (per user + conversationId)
- Add explicit PII redaction before any model call
- Add rate limiting per user for Tier 2
- Add proper integration for:
  - `schedule_viewing`
  - `save_search`
- Add telemetry event table (DB) for model cost + conversions

---

## 11. AI Strategy & Data Flywheel — Real Estate Platform

Mai jos este un document **clar, structurat și gata de pus în documentația tehnică / product**.
Nu este motivational — este **un blueprint real de produs**.

### 11.1 Obiectiv strategic

Scopul nu este doar implementarea unor funcționalități AI, ci construirea unui **data flywheel** care va crea un avantaj competitiv pe termen lung.

Principiul de bază:

```
Better data → Better matching → Better user experience → More usage → Even better data
```

AI-ul devine valoros doar atunci când este alimentat constant de date reale de comportament și intenție.

### 11.2 Cele 3 feature-uri AI prioritare

Acestea trebuie construite în această ordine deoarece creează fundația de date necesară pentru modele din ce în ce mai inteligente.

#### Feature 1 — Conversational AI Real Estate Agent (Intent Collection Engine)

##### Scop

Transformarea search-ului clasic într-o conversație naturală, similară cu interacțiunea cu un agent imobiliar.

Dar obiectivul real nu este chat-ul.

Obiectivul real este **colectarea structurată a intenției cumpărătorilor**.

##### Cum trebuie să funcționeze

Userul nu doar cere un apartament.

AI-ul trebuie să ghideze conversația (natural, nu ca un formular mascat), de exemplu:

- Buget
- Zone preferate
- Număr camere
- Suprafață minimă
- Tip proprietate
- Buy vs Rent
- Credit vs Cash
- Timeline (urgent / explorator)
- Scop (locuință / investiție)

##### Cerință critică — structurarea datelor

După fiecare conversație, trebuie extras un obiect structurat:

```json
{
  "budget_min": 70000,
  "budget_max": 90000,
  "preferred_areas": ["Botanica"],
  "rooms": 2,
  "property_type": "apartment",
  "financing": "mortgage",
  "urgency": "3_months",
  "intent_type": "buy"
}
```

Nu salva doar text brut.

Textul nu scalează.

Structura scalează.

##### Date colectate (aur pur)

- Cerere reală din piață
- Distribuția bugetelor
- Zonele dorite
- Elasticitatea prețului
- Motivele cumpărării

Majoritatea portalurilor nu au aceste date curate.

Acesta poate deveni un moat major.

##### Impact strategic

După 6–12 luni vei putea construi:

- Demand Heatmaps: unde există cumpărători, dar nu există supply
- Smart Alerts: când apare o proprietate compatibilă → notificare instant
- Buyer-Seller Matching: nu mai ai doar listinguri, ai matchmaking

#### Feature 2 — AI Price Advisor (pentru selleri)

##### Scop

Ajută proprietarii să seteze un preț corect folosind:

- Comparabile din platformă
- Tranzacții reale (când vei avea datele statistice)
- Cererea actuală
- Caracteristicile proprietății

##### Cum trebuie gândit (important)

Nu promite „prețul corect”.

Promite: **interval de preț probabil**.

Real estate este zgomotos.

Modelele prea sigure distrug trust-ul.

##### Input-uri pentru model

Structurate:

- Locație
- mp
- etaj
- an construcție
- tip clădire
- număr camere

Behavioral:

- Cerere pentru zonă
- Engagement pe listinguri similare

Future gold:

- Prețuri reale de tranzacționare

##### Computer vision (high ROI)

Analizează pozele pentru a detecta semnale utile (nu perfecțiune):

- Renovated vs vechi
- Calitatea finisajelor
- Luminozitate
- Mobilat / nemobilat

##### UX recomandat

Pe pagina de setare a prețului:

> Preț recomandat: 82,000 – 89,000 €
> Proprietățile similare se vând în medie în 45 zile.

##### Efect strategic ascuns

Prețuri mai corecte → proprietăți se vând mai repede → buyer experience mai bun → marketplace mai activ.

Acesta este un flywheel.

#### Feature 3 — Behavioral Ranking & Matching Engine

Cel mai subestimat feature din marketplace-uri.

Creează diferența dintre portaluri mediocre și produse addictive.

##### Ce trebuie să track-uiești obligatoriu

Listing level:

- Impressions
- CTR
- Save rate
- Inquiry rate
- Share rate
- Dwell time
- Return views

User level:

- Favorite
- Mesaje
- Programări
- Timp pe pagină
- Interacțiuni cu pozele

Track everything.

Storage este ieftin.

Data este priceless.

##### Primul pas nu este ML

Începe cu un scor heuristic:

```
ListingScore =
0.30 * InquiryRate +
0.25 * SaveRate +
0.20 * CTR +
0.15 * DwellTime +
0.10 * Freshness
```

Instant ai un feed mai bun decât majoritatea competitorilor.

Fără AI complex.

##### Evoluția naturală

- Stage 1 — Heuristics (rapid, controlabil)
- Stage 2 — Learning to Rank (după ce ai volum)
- Stage 3 — Personalization (feed diferit pentru fiecare user)

### 11.3 Data infrastructure (non-negotiable)

Dacă sari peste asta, limitezi AI-ul pentru ani.

Construiește un behavioral data pipeline:

```
User Action → Event → Data Warehouse → Models
```

Nu te baza doar pe tool-uri de analytics.

Ai nevoie de acces la raw data.

Tipuri de date strategice:

1) Behavioral data: ce fac userii

2) Intent data: ce spun că vor (chat)

3) Transaction data: ce se cumpără real

Când le combini, ai o vedere completă a pieței: foarte rară și foarte defensibilă.

### 11.4 Roadmap recomandat (90 zile)

Luna 1:

- Tracking complet
- Lansare conversational AI
- Intent extraction

Luna 2:

- Behavioral ranking
- Smart alerts
- Recommended listings

Luna 3:

- AI price advisor
- Demand dashboards
- Seller insights

După acest punct, AI-ul începe să devină diferențiator real.

### 11.5 Greșeală majoră de evitat

Nu construi modele sofisticate prea devreme:

- AVM ultra-complex
- Price prediction hardcore
- Demand forecasting

Fără suficient semnal, optimizezi pe zgomot.

### 11.6 Principiul de aur

Nu construi inteligență pe care nu o poți măsura.

Întreabă mereu:

- Crește acest sistem inquiries?
- Crește conversia?
- Reduce time-to-sell?

Dacă nu poți măsura, nu este încă valoros.

### 11.7 Adevărul pe care puțini îl înțeleg

Primul moat nu este AI.

Primul moat este data.

Modelele pot fi replicate.

Datele nu.

Acesta va fi un document pentru feature-ul următor ce ține de AI.
