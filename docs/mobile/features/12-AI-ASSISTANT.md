# 🤖 Feature: Asistent AI Inteligent

**ID Feature:** AI-001  
**Prioritate:** P0 - Critical (Diferențiator Cheie)  
**Estimare:** 4-6 săptămâni  
**Dependențe:** AUTH-001, LISTING-001, SEARCH-001, OpenAI/Anthropic API

---

## 📋 Cuprins

1. [Viziune și Obiective](#viziune-și-obiective)
2. [Cazuri de Utilizare](#cazuri-de-utilizare)
3. [AI pentru Căutători](#ai-pentru-căutători)
4. [AI pentru Proprietari](#ai-pentru-proprietari)
5. [Arhitectura AI](#arhitectura-ai)
6. [Model de Date](#model-de-date)
7. [Specificații Tehnice](#specificații-tehnice)
8. [UI/UX Guidelines](#uiux-guidelines)
9. [Securitate și Etică](#securitate-și-etică)
10. [Criterii de Acceptanță](#criterii-de-acceptanță)

---

## 🎯 Viziune și Obiective

### Viziune

Asistentul AI IMOBI reprezintă **diferențiatorul cheie** al platformei. În loc să navigheze prin sute de filtre și liste, utilizatorii pot pur și simplu să **converseze** cu AI-ul pentru a găsi exact ce caută sau pentru a-și optimiza anunțurile.

### Propunere de Valoare

| Pentru Căutători                                       | Pentru Proprietari                                     |
| ------------------------------------------------------ | ------------------------------------------------------ |
| "Descrie-mi ce cauți și îți găsesc opțiunile perfecte" | "Analizez anunțul tău și îți spun cum să-l optimizezi" |
| Conversație naturală, nu formulare                     | Sugestii bazate pe date reale de piață                 |
| Recomandări personalizate                              | Preț optimal bazat pe comparații                       |
| Învață preferințele în timp                            | Descrieri generate automat                             |

### Obiective Măsurabile

| Metrică                                      | Target  |
| -------------------------------------------- | ------- |
| Utilizatori care folosesc AI                 | > 60%   |
| Satisfacție conversații AI                   | > 4.5/5 |
| Conversie AI → Contact                       | > 25%   |
| Timp economisit la creare anunț              | -50%    |
| Îmbunătățire rată contact după optimizare AI | +30%    |

### 💰 Eficiență Costuri (Estimări)

- **Model:** DigitalOcean GPT-oss-120b (sau similar)
- **Preț Input:** $0.10 / 1M tokens
- **Preț Output:** $0.70 / 1M tokens
- **Cost mediu per utilizator/lună:** < $0.05

---

## 👤 Cazuri de Utilizare

### Use Case 1: Căutător conversează cu AI

```
Căutător: "Caut un apartament cu 2-3 camere în București,
          undeva liniștit dar aproape de metrou.
          Buget cam 80-100k euro."

AI: "Am înțeles! Cauți un apartament cu 2-3 camere în București,
     într-o zonă liniștită dar cu acces facil la metrou,
     cu buget între 80.000€ și 100.000€.

     🏠 Am găsit 12 proprietăți potrivite pentru tine:

     📍 Top 3 recomandări:

     1. Apartament 3 camere - Drumul Taberei
        85.000€ · 68mp · Etaj 3 · La 5 min de metrou
        ⭐ Potrivire 95% - Zonă foarte liniștită

     2. Apartament 2 camere - Titan
        78.000€ · 55mp · Etaj 2 · La 3 min de metrou
        ⭐ Potrivire 92% - Renovat recent

     3. Apartament 3 camere - Tineretului
        98.000€ · 72mp · Etaj 5 · La 2 min de metrou
        ⭐ Potrivire 88% - Premium, dar la limita bugetului

     Vrei să vezi detalii despre vreuna?
     Sau să filtrez după alte criterii?"

Căutător: "Prima arată bine. Are balcon?"

AI: "Da! Apartamentul din Drumul Taberei are un balcon
     închis de 8mp care dă spre curtea interioară -
     deci foarte liniștit.

     📸 Proprietarul a încărcat 15 fotografii.
     ✓ Verificat - proprietar cu identitate confirmată.

     Vrei să programezi o vizionare sau să contactezi proprietarul?"
```

### Use Case 2: Proprietar primește analiză

```
[Proprietar finalizează crearea anunțului]

AI: "🔍 Am analizat anunțul tău. Iată recomandările mele:

     📊 ANALIZA PREȚULUI
     ━━━━━━━━━━━━━━━━━━━
     Prețul tău: 120.000€
     Preț mediu zonă (proprietăți similare): 98.000€
     Interval recomandat: 95.000€ - 105.000€

     ⚠️ Prețul tău este cu ~22% peste media zonei.
     Acest lucru poate reduce vizibilitatea cu până la 40%.

     📝 DESCRIERE
     ━━━━━━━━━━━━
     ✓ Lungime OK (320 caractere)
     ⚠️ Lipsesc: anul renovării, tip încălzire
     💡 Sugestie: Adaugă detalii despre vecinătate

     📸 FOTOGRAFII
     ━━━━━━━━━━━━━
     ✓ 8 fotografii încărcate
     ⚠️ Lipsesc poze cu: bucătărie, baie
     💡 Anunțurile cu poze complete au +60% contacte

     🎯 SCOR ANUNȚ: 72/100
     Cu îmbunătățirile sugerate poți ajunge la 95/100

     Vrei să aplic sugestiile automat sau preferi să editezi manual?"
```

### Use Case 3: AI generează descriere optimizată

```
Proprietar: "Poți să-mi scrii o descriere mai bună?"

AI: "Sigur! Bazat pe informațiile proprietății tale,
     iată o descriere optimizată:

     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

     🏠 Apartament spațios cu 3 camere în inima
     cartierului Drumul Taberei, la doar 5 minute
     de stația de metrou Favorit.

     ✨ Caracteristici principale:
     • 75 mp utili, compartimentare modernă
     • Renovat complet în 2023
     • Încălzire în pardoseală
     • Balcon generos (8 mp) cu vedere la spații verzi
     • 2 băi - una cu cadă, una cu duș
     • Bucătărie separată, complet utilată
     • Parcare inclusă în preț

     📍 Locație excelentă:
     • Metrou Favorit - 5 min pe jos
     • Parc IOR - 10 min
     • Școli și grădinițe în proximitate
     • Magazine și farmacii la parter

     Ideal pentru familie sau investiție!

     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

     Această descriere are +45% mai multe cuvinte cheie
     căutate și urmează best practices SEO.

     [Aplică această descriere] [Editează] [Încearcă alta]"
```

---

## 🔍 AI pentru Căutători

### Funcționalități

#### 1. Conversație Naturală

```typescript
interface AIConversation {
  id: string;
  userId: string;
  messages: AIMessage[];
  context: SearchContext;
  extractedPreferences: UserPreferences;
  suggestedProperties: string[]; // Property IDs
  createdAt: Date;
  updatedAt: Date;
}

interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  metadata?: {
    propertiesShown?: string[];
    actionTaken?: string;
    confidence?: number;
  };
  createdAt: Date;
}

interface SearchContext {
  transactionType?: "SALE" | "RENT";
  propertyTypes?: string[];
  locations?: string[];
  priceRange?: { min?: number; max?: number };
  areaRange?: { min?: number; max?: number };
  rooms?: { min?: number; max?: number };
  amenities?: string[];
  priorities?: string[]; // ["quiet", "metro", "parking"]
  dealBreakers?: string[]; // ["no_ground_floor", "no_last_floor"]
}
```

#### 2. Extragere Inteligentă a Preferințelor

AI-ul extrage automat informații din conversație:

| Input Utilizator    | Extragere AI                                  |
| ------------------- | --------------------------------------------- |
| "aproape de metrou" | `proximity: { metro: "< 10 min" }`            |
| "zonă liniștită"    | `environment: "quiet"`                        |
| "pentru familie"    | `suitable_for: ["family"], rooms: { min: 3 }` |
| "investiție"        | `purpose: "investment", roi_important: true`  |
| "nu la parter"      | `dealBreakers: ["ground_floor"]`              |
| "cam 100k"          | `priceRange: { max: 110000 }`                 |

#### 3. Recomandări Personalizate

```typescript
interface PropertyRecommendation {
  propertyId: string;
  matchScore: number; // 0-100
  matchReasons: MatchReason[];
  potentialConcerns: string[];
}

interface MatchReason {
  factor: string;
  description: string;
  weight: number;
}

// Exemplu
const recommendation: PropertyRecommendation = {
  propertyId: "uuid",
  matchScore: 95,
  matchReasons: [
    {
      factor: "location",
      description: "La 5 min de metrou Favorit",
      weight: 30,
    },
    { factor: "price", description: "Cu 10% sub bugetul maxim", weight: 25 },
    { factor: "quiet", description: "Zonă rezidențială liniștită", weight: 20 },
    {
      factor: "size",
      description: "75mp - potrivit pentru familie",
      weight: 15,
    },
    {
      factor: "amenities",
      description: "Are toate dotările dorite",
      weight: 10,
    },
  ],
  potentialConcerns: ["Etaj 5 fără lift - ai menționat că preferi etaje joase"],
};
```

#### 4. Învățare din Comportament

```typescript
interface UserBehaviorSignals {
  userId: string;

  // Proprietăți vizualizate
  viewedProperties: {
    propertyId: string;
    duration: number; // secunde
    scrollDepth: number; // 0-100%
    photosViewed: number;
  }[];

  // Acțiuni
  favorited: string[];
  contacted: string[];
  viewingsBooked: string[];

  // Feedback explicit
  liked: string[];
  disliked: string[];
  dislikeReasons?: { propertyId: string; reason: string }[];
}
```

---

## 🏠 AI pentru Proprietari

### Funcționalități

#### 1. Analiză Automată la Creare Anunț

```typescript
interface ListingAnalysis {
  propertyId: string;
  overallScore: number; // 0-100

  priceAnalysis: {
    suggestedPrice: number;
    priceRange: { min: number; max: number };
    currentVsMarket: number; // % diferență
    comparableProperties: string[];
    confidence: number;
    reasoning: string;
  };

  descriptionAnalysis: {
    score: number;
    length: "too_short" | "optimal" | "too_long";
    missingKeywords: string[];
    suggestions: string[];
    seoScore: number;
  };

  photosAnalysis: {
    score: number;
    count: number;
    missingRooms: string[];
    qualityIssues: string[];
    suggestions: string[];
  };

  completenessScore: number;
  missingFields: string[];

  marketInsights: {
    demandLevel: "low" | "medium" | "high";
    avgDaysOnMarket: number;
    competitionLevel: number;
    bestTimeToList: string;
  };

  recommendations: AIRecommendation[];
}

interface AIRecommendation {
  type: "price" | "description" | "photos" | "amenities" | "timing";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  impact: string; // "Poate crește contactele cu 30%"
  action?: {
    type: "auto_apply" | "manual_edit" | "add_photos";
    payload?: any;
  };
}
```

#### 2. Generare Descriere Optimizată

```typescript
interface DescriptionGeneratorInput {
  propertyId: string;
  propertyData: Property;
  style: "professional" | "friendly" | "luxurious" | "investment";
  language: "ro" | "en";
  targetAudience?:
    | "families"
    | "young_professionals"
    | "investors"
    | "students";
  highlightFeatures?: string[];
  tone?: "formal" | "casual";
}

interface GeneratedDescription {
  content: string;
  wordCount: number;
  keywordsIncluded: string[];
  seoScore: number;
  readabilityScore: number;
  variations?: string[]; // Alternative versions
}
```

#### 3. Sugestii de Preț Inteligente

```typescript
interface PriceSuggestion {
  basePrice: number;

  adjustments: {
    factor: string;
    impact: number;
    reasoning: string;
  }[];

  finalSuggestion: {
    conservative: number; // Vânzare rapidă
    optimal: number; // Echilibrat
    ambitious: number; // Maximizare profit
  };

  marketContext: {
    avgPricePerSqm: number;
    recentSales: {
      address: string;
      price: number;
      pricePerSqm: number;
      soldDate: Date;
      daysOnMarket: number;
    }[];
    pricetrend: "rising" | "stable" | "falling";
    percentChange30d: number;
  };

  confidence: number;
  dataPoints: number; // Câte proprietăți au fost analizate
}
```

#### 4. Optimizare Continuă

```typescript
interface ListingOptimizationAlert {
  propertyId: string;
  alertType:
    | "price_adjustment"
    | "market_change"
    | "competitor_update"
    | "performance_drop";

  message: string;
  suggestion: string;
  urgency: "low" | "medium" | "high";

  data?: {
    currentViews: number;
    expectedViews: number;
    competitorPrices?: number[];
    marketTrendChange?: number;
  };
}
```

---

## 🏗️ Arhitectura AI

### Componente

```
┌─────────────────────────────────────────────────────────────────┐
│                        MOBILE APP                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  AI Chat    │  │  Listing    │  │  Analysis   │              │
│  │  Interface  │  │  Wizard     │  │  Dashboard  │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
└─────────┼────────────────┼────────────────┼─────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AI GATEWAY SERVICE                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Prompt     │  │  Context    │  │  Response   │              │
│  │  Builder    │  │  Manager    │  │  Parser     │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└────────────────────────────────────┬────────────────────────────┘
                                     │
          ┌──────────────────────────┼──────────────────────────┐
          │                          │                          │
          ▼                          ▼                          ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│    LLM API      │      │  Property DB    │      │   Market Data   │
│ (OpenAI/Claude) │      │  (Search Index) │      │    Service      │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

### Flow Conversație

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  User    │────▶│ AI Gateway   │────▶│ Context      │
│  Message │     │              │     │ Enrichment   │
└──────────┘     └──────────────┘     └──────────────┘
                                              │
                      ┌───────────────────────┘
                      ▼
              ┌──────────────┐
              │ Prompt       │
              │ Construction │
              └──────────────┘
                      │
                      ▼
              ┌──────────────┐     ┌──────────────┐
              │ LLM API      │────▶│ Response     │
              │ Call         │     │ Processing   │
              └──────────────┘     └──────────────┘
                                          │
                      ┌───────────────────┘
                      ▼
              ┌──────────────┐     ┌──────────────┐
              │ Property     │────▶│ Final        │
              │ Search       │     │ Response     │
              └──────────────┘     └──────────────┘
```

---

## 📊 Model de Date

### AI Conversation

```typescript
interface AIConversation {
  id: string;
  userId: string;
  type: "search_assistant" | "listing_assistant" | "general";

  messages: AIMessage[];

  context: {
    searchPreferences?: SearchContext;
    currentPropertyId?: string;
    activeListingId?: string;
  };

  metadata: {
    messagesCount: number;
    propertiesSuggested: number;
    propertiesViewed: number;
    conversionsCount: number; // Contacte/vizionări rezultate
  };

  status: "active" | "archived";

  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
}

interface AIMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";

  content: string;

  // Pentru mesaje assistant
  structuredContent?: {
    text?: string;
    properties?: PropertySummary[];
    analysis?: ListingAnalysis;
    suggestions?: AIRecommendation[];
    actions?: AIAction[];
  };

  // Metadata procesare
  processing?: {
    model: string;
    promptTokens: number;
    completionTokens: number;
    latencyMs: number;
  };

  createdAt: Date;
}

interface AIAction {
  type:
    | "view_property"
    | "contact_owner"
    | "book_viewing"
    | "apply_suggestion"
    | "edit_listing";
  label: string;
  payload: Record<string, any>;
}
```

### AI Analysis Cache

```typescript
interface PropertyAIAnalysis {
  propertyId: string;

  // Cache analysis pentru performanță
  analysis: ListingAnalysis;

  // Când a fost generat
  generatedAt: Date;

  // Trigger events pentru regenerare
  invalidatedBy?: "price_change" | "market_update" | "manual" | "schedule";

  // TTL
  expiresAt: Date;
}
```

---

## ⚙️ Specificații Tehnice

### LLM Integration

```typescript
// config/ai.ts
interface AIConfig {
  provider: "openai" | "anthropic" | "azure";
  model: {
    chat: "gpt-4o" | "claude-3-5-sonnet";
    analysis: "gpt-4o" | "claude-3-5-sonnet";
    embedding: "text-embedding-3-small";
  };

  limits: {
    maxTokensPerRequest: number;
    maxConversationHistory: number;
    rateLimitPerUser: number; // requests per minute
  };

  prompts: {
    searchAssistant: string;
    listingAnalyzer: string;
    descriptionGenerator: string;
    priceEstimator: string;
  };
}
```

### System Prompts

```typescript
const SEARCH_ASSISTANT_PROMPT = `
Ești IMOBI AI, asistentul imobiliar inteligent care ajută utilizatorii
să găsească proprietatea perfectă în România.

REGULI:
1. Răspunde întotdeauna în limba română, prietenos dar profesional
2. Extrage preferințele utilizatorului din conversație
3. Nu inventa proprietăți - folosește doar datele furnizate
4. Când sugerezi proprietăți, explică de ce sunt potrivite
5. Întreabă clarificări când informațiile sunt incomplete
6. Nu discuta prețuri specific - direcționează către proprietar
7. Încurajează programarea vizionărilor

CONTEXT DISPONIBIL:
- Lista proprietăților disponibile (furnizată în fiecare request)
- Preferințele extrase până acum
- Istoricul conversației

FORMAT RĂSPUNS:
- Folosește emoji-uri pentru claritate
- Structurează proprietățile clar
- Include întotdeauna un CTA (call to action)
`;

### 4. Servicii Auxiliare (Viitor)
- Fotografii profesionale: 49-99€
- Video tour/3D scan: 79-149€
- Verificare proprietate prioritară: 19.99€
- Consultanță prețare: 29.99€

### 📈 Eficiența Costurilor AI (DigitalOcean GPT-oss-120b)

Bazat pe tarifele de **$0.10 / 1M input** și **$0.70 / 1M output**:

| Activitate | Cost unitar (est.) | ROI |
|------------|-------------------|-----|
| Conversație Căutător (5 mesaje) | ~$0.003 | Mare (Conversie) |
| Analiză Anunț + Sugestii Preț | ~$0.001 | Mare (Retenție) |
| Generare Descriere SEO | ~$0.001 | Mare (Calitate) |

*Costul total pentru 1,000 de utilizatori activi este estimat la sub **$20/lună**, oferind o marjă de profit excelentă pentru subscripții.*

---

const LISTING_ANALYZER_PROMPT = `
Ești IMOBI AI, expertul în optimizarea anunțurilor imobiliare.

TASK: Analizează anunțul furnizat și oferă recomandări concrete.

ANALIZA INCLUDE:
1. PREȚ: Compară cu proprietăți similare din zonă
2. DESCRIERE: Verifică completitudinea și optimizarea SEO
3. FOTOGRAFII: Evaluează calitatea și completitudinea
4. COMPLETITUDINE: Identifică câmpurile lipsă

FORMAT RĂSPUNS (JSON):
{
  "overallScore": number,
  "priceAnalysis": {...},
  "descriptionAnalysis": {...},
  "photosAnalysis": {...},
  "recommendations": [...]
}

REGULI:
- Fii constructiv, nu critic
- Oferă sugestii acționabile
- Cuantifică impactul potențial al îmbunătățirilor
- Prioritizează recomandările după impact
`;
```

### Streaming Response

```typescript
// Pentru UX fluidă, folosim streaming
interface AIStreamConfig {
  onToken: (token: string) => void;
  onComplete: (fullResponse: AIMessage) => void;
  onError: (error: Error) => void;
  onPropertyFound?: (property: PropertySummary) => void;
}

const streamAIResponse = async (
  conversationId: string,
  userMessage: string,
  config: AIStreamConfig,
) => {
  const response = await fetch("/api/v1/ai/chat/stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ conversationId, message: userMessage }),
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader!.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = JSON.parse(line.slice(6));

        if (data.type === "token") {
          config.onToken(data.content);
        } else if (data.type === "property") {
          config.onPropertyFound?.(data.property);
        } else if (data.type === "complete") {
          config.onComplete(data.message);
        }
      }
    }
  }
};
```

---

## 🎨 UI/UX Guidelines

### AI Chat Interface

```
┌─────────────────────────────────────┐
│  🤖 IMOBI AI            [Istoric]  │
├─────────────────────────────────────┤
│                                     │
│  Bună! Sunt IMOBI AI, asistentul   │
│  tău imobiliar. 🏠                  │
│                                     │
│  Spune-mi ce cauți și îți găsesc   │
│  cele mai potrivite opțiuni!        │
│                                     │
│  Poți să-mi spui, de exemplu:       │
│  • "Caut apartament 2 camere..."    │
│  • "Vreau casă cu grădină..."       │
│  • "Ceva aproape de centru..."      │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  [User]: Caut apartament cu 2-3    │
│  camere, în București, aproape de   │
│  metrou, cam 80-90k euro           │
│                                     │
│  [AI]: Am înțeles perfect! 🎯       │
│                                     │
│  Am găsit 8 apartamente potrivite:  │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ ⭐ 95% Potrivire            │    │
│  │ [📷] Apt 3 cam Drumul Tab.  │    │
│  │     85.000€ · 68mp          │    │
│  │     🚇 5 min metrou         │    │
│  │     [Vezi] [💬 Contact]      │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ ⭐ 92% Potrivire            │    │
│  │ [📷] Apt 2 cam Titan        │    │
│  │     78.000€ · 55mp          │    │
│  │     🚇 3 min metrou         │    │
│  │     [Vezi] [💬 Contact]      │    │
│  └─────────────────────────────┘    │
│                                     │
│  Vrei să vezi mai multe sau să     │
│  filtrăm după alte criterii?        │
│                                     │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐    │
│  │ Scrie mesajul tău...    🎤 │    │
│  └─────────────────────────────┘    │
│                                     │
│  💡 Sugestii:                       │
│  [Cu parcare] [Renovat] [Mobilat]   │
│                                     │
└─────────────────────────────────────┘
```

### Listing Analysis Widget

```
┌─────────────────────────────────────┐
│  🤖 Analiză AI                      │
├─────────────────────────────────────┤
│                                     │
│  Scor Anunț: ████████░░ 78/100     │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ ⚠️ PREȚ                     │    │
│  │                             │    │
│  │ Prețul tău: 120.000€        │    │
│  │ Recomandat: 95-105.000€     │    │
│  │                             │    │
│  │ Ești cu 22% peste piață.    │    │
│  │ Acest lucru poate reduce    │    │
│  │ vizibilitatea cu 40%.       │    │
│  │                             │    │
│  │ [Ajustează prețul]          │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 💡 DESCRIERE                │    │
│  │                             │    │
│  │ Descrierea poate fi         │    │
│  │ îmbunătățită.               │    │
│  │                             │    │
│  │ [Generează descriere AI]    │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 📸 FOTOGRAFII               │    │
│  │                             │    │
│  │ ✓ 8 poze încărcate          │    │
│  │ ⚠️ Lipsă: bucătărie, baie   │    │
│  │                             │    │
│  │ [Adaugă fotografii]         │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

---

## 🔒 Securitate și Etică

### Reguli AI

1. **Nu inventează proprietăți** - Răspunde doar cu date reale
2. **Nu face promisiuni** - Nu garantează prețuri sau rezultate
3. **Protejează datele** - Nu expune informații sensibile
4. **Transparență** - Specifică când informațiile sunt estimări
5. **Non-discriminare** - Nu discriminează utilizatori

### Rate Limiting

```typescript
const AI_RATE_LIMITS = {
  chatMessagesPerMinute: 10,
  analysisPerHour: 20,
  descriptionGenerationsPerDay: 50,
};
```

### Content Moderation

```typescript
// Verificare input utilizator înainte de procesare LLM
const moderateContent = async (content: string): Promise<boolean> => {
  // Verifică pentru conținut inadecvat, spam, phishing
  const result = await openai.moderations.create({ input: content });
  return !result.results[0].flagged;
};
```

---

## ✅ Criterii de Acceptanță

### AI Chat (Căutători)

- [x] Conversație fluidă în limba română
- [x] Extragere corectă preferințe din text natural
- [x] Recomandări relevante (> 80% potrivire percepută)
- [x] Răspuns în < 3 secunde
- [x] Deep linking la proprietăți
- [x] Posibilitate programare vizionare din chat

### AI Analysis (Proprietari)

- [x] Analiză automată la creare anunț
- [x] Sugestie preț bazată pe date reale
- [x] Generare descriere în < 5 secunde
- [x] Scor calitate anunț vizibil
- [x] Recomandări acționabile

### Performance

- [x] Latency chat < 2s (first token)
- [x] Latency analysis < 5s
- [x] Rate limiting funcțional
- [x] Fallback la erori API

---

## 🔌 API Endpoints

```
# Conversații AI
POST   /api/v1/ai/conversations
GET    /api/v1/ai/conversations
GET    /api/v1/ai/conversations/:id
DELETE /api/v1/ai/conversations/:id

# Chat
POST   /api/v1/ai/chat
POST   /api/v1/ai/chat/stream

# Analiză Listări
POST   /api/v1/ai/analyze-listing
GET    /api/v1/ai/listings/:id/analysis

# Generare Conținut
POST   /api/v1/ai/generate-description
POST   /api/v1/ai/suggest-price

# Feedback
POST   /api/v1/ai/feedback
```

---

**Document Status:** Draft  
**Ultima actualizare:** Ianuarie 2026  
**Prioritate:** 🔴 CRITICAL - Diferențiator cheie al platformei
