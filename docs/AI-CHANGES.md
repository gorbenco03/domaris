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
