# 📊 Modele de Date

**Versiune:** 1.0.0  
**Data:** Ianuarie 2026

---

## 🗂️ Diagrama Relații Entități

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │       │   Property  │       │  Viewing    │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id          │───┐   │ id          │───┬───│ id          │
│ email       │   │   │ ownerId     │   │   │ propertyId  │
│ phone       │   └──>│ title       │   │   │ seekerId    │
│ firstName   │       │ description │   │   │ ownerId     │
│ lastName    │       │ type        │   │   │ slot        │
│ avatar      │       │ status      │   │   │ status      │
│ role        │       │ location    │   │   └─────────────┘
│ verified    │       │ price       │   │
└─────────────┘       └─────────────┘   │   ┌─────────────┐
      │                     │           │   │   Message   │
      │  ┌──────────────────┘           │   ├─────────────┤
      │  │                              └───│ id          │
      │  │   ┌─────────────┐                │ convId      │
      │  │   │  Favorite   │                │ senderId    │
      │  │   ├─────────────┤                │ content     │
      │  └──>│ id          │                │ type        │
      │      │ userId      │                │ status      │
      └─────>│ propertyId  │                └─────────────┘
             │ listId      │
             └─────────────┘
```

---

## 👤 User

```typescript
interface User {
  // Identificare
  id: string; // UUID

  // Autentificare
  email: string; // Unic, indexed
  emailVerified: boolean;
  phone?: string; // Format internațional
  phoneVerified: boolean;
  passwordHash?: string; // bcrypt/argon2

  // OAuth
  googleId?: string;
  appleId?: string;
  facebookId?: string;

  // Profil
  firstName: string;
  lastName: string;
  displayName?: string;
  avatar?: string; // URL S3
  bio?: string; // Max 500 chars

  // Locație
  location?: {
    city: string;
    county: string;
    country: string;
  };

  // Rol
  role: "OWNER" | "SEEKER" | "BOTH";

  // Verificare
  verificationLevel: 0 | 1 | 2 | 3;
  identityVerifiedAt?: Date;

  // Rating
  rating?: {
    average: number; // 1-5
    count: number;
  };

  // Setări
  preferences: UserPreferences;
  notificationSettings: NotificationSettings;

  // Status
  status: "active" | "suspended" | "deleted";
  lastActiveAt?: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

interface UserPreferences {
  language: "ro" | "en";
  theme: "light" | "dark" | "system";
  currency: "EUR" | "RON";
  defaultSearchFilters?: SearchFilters;
}

interface NotificationSettings {
  push: {
    enabled: boolean;
    messages: boolean;
    viewings: boolean;
    propertyAlerts: boolean;
    priceChanges: boolean;
    marketing: boolean;
  };
  email: {
    digest: "none" | "daily" | "weekly";
    transactional: boolean;
    marketing: boolean;
  };
}
```

---

## 🏠 Property

```typescript
interface Property {
  // Identificare
  id: string; // UUID
  ownerId: string; // FK -> User
  slug: string; // URL-friendly, unique

  // Bază
  title: string; // Max 100 chars
  description: string; // Max 5000 chars

  // Tip
  transactionType: "SALE" | "RENT";
  propertyType: PropertyType;

  // Locație
  location: {
    country: string;
    county: string;
    city: string;
    neighborhood?: string;
    street?: string;
    streetNumber?: string;
    building?: string;
    floor?: number;
    apartment?: string;
    postalCode?: string;
    coordinates: {
      lat: number;
      lng: number;
      accuracy: "EXACT" | "APPROXIMATE" | "NEIGHBORHOOD";
    };
  };

  // Caracteristici
  characteristics: {
    totalArea: number; // mp
    usableArea?: number;
    landArea?: number;
    rooms?: number;
    bedrooms?: number;
    bathrooms?: number;
    balconies?: number;
    yearBuilt?: number;
    floor?: number;
    totalFloors?: number;
    orientation?: string[];
    parking?: {
      type: "GARAGE" | "OUTDOOR" | "UNDERGROUND" | "NONE";
      spots?: number;
    };
    amenities: string[]; // Lista de amenities IDs
    utilities: string[];
  };

  // Preț
  pricing: {
    price: number;
    currency: "EUR" | "RON";
    pricePerSqm?: number;
    negotiable: boolean;
    rentDetails?: {
      depositMonths: number;
      utilitiesIncluded: boolean;
      minimumPeriodMonths?: number;
    };
  };

  // Media
  media: {
    photos: PropertyPhoto[];
    videos?: PropertyVideo[];
    virtualTourUrl?: string;
    floorPlanUrl?: string;
  };

  // Status
  status: PropertyStatus;
  moderationStatus: "pending" | "approved" | "rejected";
  moderationNote?: string;

  // Promovare
  boost?: {
    type: string;
    expiresAt: Date;
  };

  // Statistici
  stats: {
    views: number;
    uniqueViews: number;
    favorites: number;
    contacts: number;
    shares: number;
  };

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  expiresAt?: Date;
}

type PropertyType =
  | "APARTMENT"
  | "HOUSE"
  | "STUDIO"
  | "PENTHOUSE"
  | "DUPLEX"
  | "LAND"
  | "COMMERCIAL"
  | "OFFICE"
  | "PARKING"
  | "STORAGE";

type PropertyStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "ACTIVE"
  | "PAUSED"
  | "SOLD"
  | "RENTED"
  | "EXPIRED"
  | "REJECTED";

interface PropertyPhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  order: number;
  caption?: string;
  room?: string;
  isPrimary: boolean;
}
```

---

## 💬 Conversation & Message

```typescript
interface Conversation {
  id: string;
  propertyId: string;
  participants: {
    ownerId: string;
    seekerId: string;
  };
  status: "active" | "archived" | "blocked";
  lastMessageAt?: Date;
  unreadCount: {
    [userId: string]: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: "text" | "image" | "viewing_request" | "system";
  content: string;
  metadata?: {
    imageUrl?: string;
    thumbnailUrl?: string;
    viewingId?: string;
  };
  status: "sending" | "sent" | "delivered" | "read" | "failed";
  readAt?: Date;
  createdAt: Date;
}
```

---

## 📅 Viewing

```typescript
interface Viewing {
  id: string;
  propertyId: string;
  ownerId: string;
  seekerId: string;

  requestedSlots: TimeSlot[];
  confirmedSlot?: TimeSlot;
  duration: number; // minutes

  status: ViewingStatus;
  notes?: string;
  meetingPoint?: string;

  feedback?: {
    owner?: ViewingFeedback;
    seeker?: ViewingFeedback;
  };

  createdAt: Date;
  confirmedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
}

type ViewingStatus =
  | "pending"
  | "confirmed"
  | "rescheduled"
  | "cancelled"
  | "completed"
  | "no_show";

interface TimeSlot {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;
}

interface ViewingFeedback {
  rating: 1 | 2 | 3 | 4 | 5;
  interested: boolean;
  comment?: string;
  createdAt: Date;
}
```

---

## ❤️ Favorite

```typescript
interface Favorite {
  id: string;
  userId: string;
  propertyId: string;
  listId?: string;
  notes?: string;
  priceAtSave: number;
  createdAt: Date;
}

interface FavoriteList {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isDefault: boolean;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🔔 Notification

```typescript
interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  imageUrl?: string;
  actionType?:
    | "open_conversation"
    | "open_property"
    | "open_viewing"
    | "open_url";
  actionPayload?: string;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
}

type NotificationType =
  | "new_message"
  | "message_read"
  | "viewing_request"
  | "viewing_confirmed"
  | "viewing_cancelled"
  | "viewing_reminder"
  | "property_alert"
  | "price_change"
  | "property_unavailable"
  | "account_verified"
  | "new_device_login"
  | "promotion";
```

---

## 🤖 AI Entities

```typescript
// ═══════════════════════════════════════════════════════════════
//                    AI CONVERSATION ENTITIES
// ═══════════════════════════════════════════════════════════════

interface AIConversation {
  id: string;
  userId: string;
  type: "search_assistant" | "listing_assistant" | "general";

  messages: AIMessage[];

  // Context conversație
  context: {
    searchPreferences?: SearchContext;
    currentPropertyId?: string;
    activeListingId?: string;
  };

  // Metrici conversație
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

  // Pentru mesaje structurate de la assistant
  structuredContent?: {
    text?: string;
    properties?: PropertySummary[];
    analysis?: ListingAnalysis;
    suggestions?: AIRecommendation[];
    actions?: AIAction[];
  };

  // Metadata procesare LLM
  processing?: {
    model: string; // gpt-4o, claude-3-5-sonnet
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

interface SearchContext {
  transactionType?: "SALE" | "RENT";
  propertyTypes?: string[];
  locations?: string[];
  priceRange?: { min?: number; max?: number };
  areaRange?: { min?: number; max?: number };
  rooms?: { min?: number; max?: number };
  amenities?: string[];
  priorities?: string[]; // ["quiet", "metro", "parking"]
  dealBreakers?: string[]; // ["no_ground_floor"]
}

// ═══════════════════════════════════════════════════════════════
//                    AI ANALYSIS ENTITIES
// ═══════════════════════════════════════════════════════════════

interface ListingAnalysis {
  id: string;
  propertyId: string;
  overallScore: number; // 0-100

  // Analiză preț
  priceAnalysis: {
    suggestedPrice: number;
    priceRange: { min: number; max: number };
    currentVsMarket: number; // % diferență
    comparableProperties: string[]; // IDs
    confidence: number; // 0-1
    reasoning: string;
  };

  // Analiză descriere
  descriptionAnalysis: {
    score: number;
    length: "too_short" | "optimal" | "too_long";
    missingKeywords: string[];
    suggestions: string[];
    seoScore: number;
  };

  // Analiză fotografii
  photosAnalysis: {
    score: number;
    count: number;
    missingRooms: string[];
    qualityIssues: string[];
    suggestions: string[];
  };

  // Completitudine
  completenessScore: number;
  missingFields: string[];

  // Insight-uri piață
  marketInsights: {
    demandLevel: "low" | "medium" | "high";
    avgDaysOnMarket: number;
    competitionLevel: number;
    bestTimeToList: string;
  };

  recommendations: AIRecommendation[];

  generatedAt: Date;
  expiresAt: Date; // Cache TTL
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

// ═══════════════════════════════════════════════════════════════
//                    AI-GENERATED CONTENT
// ═══════════════════════════════════════════════════════════════

interface GeneratedDescription {
  id: string;
  propertyId: string;

  // Input parameters
  style: "professional" | "friendly" | "luxurious" | "investment";
  targetAudience?: "families" | "young_professionals" | "investors";

  // Output
  content: string;
  wordCount: number;
  keywordsIncluded: string[];
  seoScore: number;
  readabilityScore: number;

  // Alternatives
  variations?: string[];

  // Usage tracking
  applied: boolean;
  appliedAt?: Date;

  generatedAt: Date;
}

interface PriceSuggestion {
  id: string;
  propertyId: string;

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
    priceTrend: "rising" | "stable" | "falling";
    percentChange30d: number;
  };

  confidence: number;
  dataPoints: number;

  generatedAt: Date;
}

// ═══════════════════════════════════════════════════════════════
//                    USER BEHAVIOR (pentru AI learning)
// ═══════════════════════════════════════════════════════════════

interface UserBehaviorSignals {
  userId: string;

  // Proprietăți vizualizate
  viewedProperties: {
    propertyId: string;
    duration: number; // secunde
    scrollDepth: number; // 0-100%
    photosViewed: number;
    timestamp: Date;
  }[];

  // Acțiuni
  favorited: string[];
  contacted: string[];
  viewingsBooked: string[];

  // Feedback explicit
  liked: string[];
  disliked: string[];
  dislikeReasons?: {
    propertyId: string;
    reason: string;
  }[];

  // Extragere preferințe
  inferredPreferences?: SearchContext;

  updatedAt: Date;
}
```

---

## 🗄️ Database Indexes

```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_status_created ON users(status, created_at);

-- Properties
CREATE INDEX idx_properties_owner ON properties(owner_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_location ON properties(city, county);
CREATE INDEX idx_properties_type_transaction ON properties(property_type, transaction_type);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_created ON properties(created_at);

-- Full-text search
CREATE INDEX idx_properties_search ON properties USING GIN(to_tsvector('romanian', title || ' ' || description));

-- Conversations
CREATE INDEX idx_conversations_participants ON conversations(owner_id, seeker_id);
CREATE INDEX idx_conversations_property ON conversations(property_id);

-- Messages
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_sender ON messages(sender_id);

-- Favorites
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_property ON favorites(property_id);
```

---

**Document Status:** Draft  
**Ultima actualizare:** Ianuarie 2026
