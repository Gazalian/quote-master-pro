# OtoQuote AI - Gemini Integration System Design

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER INPUT LAYER                            │
│  • Chat text (free-form, Nigerian English)                      │
│  • Images (site photos, materials, sketches)                     │
│  • Voice notes (future: transcribed to text)                     │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                  PRE-PROCESSING LAYER                            │
│  • Text normalization                                            │
│  • Image optimization (resize, compress)                         │
│  • Context extraction from previous messages                     │
│  • User profile & pricing history retrieval                      │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                  PROMPT ENGINEERING LAYER                        │
│  • Nigerian context injection                                    │
│  • Market pricing guidelines                                     │
│  • Trade-specific templates                                      │
│  • Structured output schema definition                           │
│  • Few-shot examples for consistency                             │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GEMINI API LAYER                              │
│  • Model: gemini-1.5-flash (fast, multimodal)                   │
│  • Fallback: gemini-1.5-pro (complex jobs)                      │
│  • Temperature: 0.7 (balance creativity & accuracy)              │
│  • Max tokens: 8000                                              │
│  • Response format: JSON                                         │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                  OUTPUT PROCESSING LAYER                         │
│  • JSON parsing & validation                                     │
│  • Price reasonableness checks                                   │
│  • Nigerian market price alignment                               │
│  • Category standardization                                      │
│  • Fallback to clarifying questions if unclear                   │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                  QUOTATION OBJECT LAYER                          │
│  • Structured Quote interface                                    │
│  • Editable in UI (QuoteEditor)                                  │
│  • Auto-save to price_log (learning)                             │
│  • Brand settings applied                                        │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    USER FEEDBACK LAYER                           │
│  • User edits tracked                                            │
│  • Price adjustments logged                                      │
│  • Feedback stored for model improvement                         │
│  • Personalized pricing patterns learned                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Input → Processing

```typescript
interface GeminiInput {
  userMessage: string;              // "I want to wire a 3-bedroom flat"
  images: ImageFile[];              // Site photos, layouts
  conversationHistory: Message[];   // Previous chat context
  userProfile: {
    trade: string;                  // "Electrician"
    location: string;               // "Lagos"
    previousJobs: PriceLogEntry[];  // Historical pricing data
  };
}
```

### 2. Gemini Prompt Structure

```
SYSTEM CONTEXT:
You are OtoQuote AI, a Nigerian tradesperson's digital assistant.
You help electricians, plumbers, builders, carpenters, and painters
create professional quotations.

USER PROFILE:
Trade: {user.trade}
Location: {user.location}
Experience: {user.jobCount} jobs completed

NIGERIAN MARKET CONTEXT:
- Currency: ₦ (Naira)
- Include labour charges separately
- Common categories: Materials, Labour, Transportation, Miscellaneous
- Realistic Lagos/Abuja/Port Harcourt pricing
- VAT not typically included in artisan quotes

TASK:
Generate a professional quotation for:

USER REQUEST:
"{userMessage}"

IMAGES PROVIDED:
{imageAnalysis}

INSTRUCTIONS:
1. Break down the job into clear categories
2. List ALL items needed (materials + labour)
3. Use realistic Nigerian market prices
4. Be specific with quantities and units
5. Include transportation if materials are heavy/bulky
6. Add miscellaneous for unforeseen costs (10%)

OUTPUT FORMAT (JSON):
{schema}
```

### 3. Output Schema

```typescript
interface GeminiQuotationOutput {
  projectTitle: string;
  confidence: "high" | "medium" | "low";
  clarifyingQuestions?: string[];
  categories: QuoteCategory[];
  estimatedDuration?: string;
  notes?: string[];
  grandTotal: number;
}

interface QuoteCategory {
  id: string;
  name: string; // "Materials", "Labour", "Transportation"
  items: QuoteItem[];
  subtotal: number;
}

interface QuoteItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string; // "meters", "bags", "trips", "days"
  unitPrice: number;
  total: number;
  source: "ai_estimate" | "market_average";
  reasoning?: string; // Why this item/price
}
```

---

## Nigerian Pricing Intelligence

### Trade-Specific Price Ranges (Lagos Market)

#### Electrical Work
```typescript
const ELECTRICAL_PRICING = {
  materials: {
    "16mm_cable": { min: 15000, max: 25000, unit: "roll" },
    "2.5mm_cable": { min: 8000, max: 12000, unit: "roll" },
    "4mm_cable": { min: 10000, max: 15000, unit: "roll" },
    "socket_outlet": { min: 500, max: 1000, unit: "piece" },
    "switch": { min: 400, max: 800, unit: "piece" },
    "mcb_breaker": { min: 2000, max: 4000, unit: "piece" },
    "distribution_board": { min: 15000, max: 35000, unit: "unit" },
    "conduit_pipe": { min: 600, max: 1200, unit: "length" },
  },
  labour: {
    "bedroom_wiring": { min: 40000, max: 80000, unit: "room" },
    "installation_per_point": { min: 2000, max: 5000, unit: "point" },
    "distribution_board_installation": { min: 25000, max: 50000, unit: "job" },
  },
  logistics: {
    "transportation": { min: 5000, max: 20000, unit: "trip" },
    "mobilization": { min: 10000, max: 30000, unit: "job" },
  }
};
```

#### Plumbing Work
```typescript
const PLUMBING_PRICING = {
  materials: {
    "pvc_pipe_4inch": { min: 4000, max: 6000, unit: "length" },
    "pvc_pipe_2inch": { min: 2000, max: 3500, unit: "length" },
    "toilet_wc": { min: 35000, max: 120000, unit: "unit" },
    "sink": { min: 15000, max: 60000, unit: "unit" },
    "shower_mixer": { min: 25000, max: 80000, unit: "unit" },
    "water_pump": { min: 45000, max: 250000, unit: "unit" },
  },
  labour: {
    "bathroom_installation": { min: 60000, max: 150000, unit: "bathroom" },
    "pipe_installation": { min: 15000, max: 40000, unit: "room" },
  }
};
```

#### Building/Construction
```typescript
const BUILDING_PRICING = {
  materials: {
    "cement": { min: 5500, max: 7500, unit: "bag" },
    "sharp_sand": { min: 25000, max: 45000, unit: "trip" },
    "granite": { min: 30000, max: 55000, unit: "trip" },
    "blocks_9inch": { min: 450, max: 650, unit: "piece" },
    "iron_rods_16mm": { min: 6500, max: 9000, unit: "length" },
  },
  labour: {
    "bricklaying": { min: 1500, max: 2500, unit: "sqm" },
    "plastering": { min: 2000, max: 3500, unit: "sqm" },
    "roofing": { min: 3500, max: 6000, unit: "sqm" },
  }
};
```

#### Painting
```typescript
const PAINTING_PRICING = {
  materials: {
    "emulsion_paint": { min: 8000, max: 35000, unit: "bucket" },
    "gloss_paint": { min: 10000, max: 40000, unit: "bucket" },
    "primer": { min: 6000, max: 15000, unit: "bucket" },
    "putty": { min: 4000, max: 8000, unit: "bucket" },
  },
  labour: {
    "painting_per_room": { min: 25000, max: 60000, unit: "room" },
    "pop_ceiling": { min: 4000, max: 8000, unit: "sqm" },
  }
};
```

---

## Prompt Engineering Templates

### Base System Prompt
```
You are OtoQuote AI, Nigeria's leading digital assistant for tradespeople.

YOUR ROLE:
- Help Nigerian electricians, plumbers, builders, carpenters, and painters
- Convert informal job descriptions into professional quotations
- Understand Nigerian English, slang, and local context
- Apply realistic Nigerian market pricing

YOUR KNOWLEDGE:
- Lagos, Abuja, Port Harcourt market rates
- Standard materials used in Nigerian construction
- Typical labour costs for different trades
- Common project scopes and requirements

YOUR OUTPUT:
- Always structured JSON quotations
- Professional but locally relevant language
- Realistic pricing (never too high or too low)
- Include labour, materials, transportation, miscellaneous
- Use ₦ (Naira) for all prices
```

### Few-Shot Examples

#### Example 1: Electrical Work
```json
{
  "input": "I wan wire 2 bedroom for my client house",
  "output": {
    "projectTitle": "Electrical Wiring for 2-Bedroom Apartment",
    "confidence": "high",
    "categories": [
      {
        "name": "Materials",
        "items": [
          {
            "name": "16mm Single Core Cable",
            "quantity": 2,
            "unit": "rolls",
            "unitPrice": 18000,
            "total": 36000,
            "source": "market_average"
          },
          {
            "name": "2.5mm Single Core Cable",
            "quantity": 3,
            "unit": "rolls",
            "unitPrice": 9000,
            "total": 27000
          },
          {
            "name": "Socket Outlets (13A)",
            "quantity": 16,
            "unit": "pieces",
            "unitPrice": 700,
            "total": 11200
          }
        ]
      },
      {
        "name": "Labour",
        "items": [
          {
            "name": "Bedroom Wiring (Complete Installation)",
            "quantity": 2,
            "unit": "rooms",
            "unitPrice": 55000,
            "total": 110000
          }
        ]
      },
      {
        "name": "Transportation",
        "items": [
          {
            "name": "Material Transportation",
            "quantity": 1,
            "unit": "trip",
            "unitPrice": 8000,
            "total": 8000
          }
        ]
      },
      {
        "name": "Miscellaneous",
        "items": [
          {
            "name": "Unforeseen Costs",
            "quantity": 1,
            "unit": "allowance",
            "unitPrice": 15000,
            "total": 15000
          }
        ]
      }
    ],
    "grandTotal": 207200,
    "estimatedDuration": "3-4 days",
    "notes": [
      "Price includes complete installation from distribution board to all points",
      "Materials are standard quality suitable for residential use",
      "Labour covers 2 electricians for estimated duration"
    ]
  }
}
```

---

## Image Processing Strategy

### Gemini Vision Capabilities

```typescript
interface ImageAnalysis {
  spaceType: string;           // "bedroom", "kitchen", "bathroom"
  dimensions: {
    estimated: boolean;
    length?: number;
    width?: number;
    height?: number;
  };
  visibleMaterials: string[];  // ["blocks", "cement", "rods"]
  workRequired: string[];       // ["plastering", "painting", "tiling"]
  condition: string;            // "new construction", "renovation"
  complexity: "simple" | "moderate" | "complex";
}
```

### Image Prompting
```
Analyze this image and identify:
1. Type of space (bedroom, kitchen, construction site, etc.)
2. Approximate dimensions (estimate from visual cues)
3. Current condition (new, renovation, damaged)
4. Work required (what needs to be done)
5. Visible materials or items
6. Complexity level

Be specific about Nigerian construction standards.
```

---

## Error Handling & Clarification

### Confidence Scoring
```typescript
type Confidence = "high" | "medium" | "low";

function determineConfidence(input: GeminiInput): Confidence {
  let score = 100;

  // Reduce score for vague inputs
  if (input.userMessage.length < 10) score -= 30;
  if (!input.images || input.images.length === 0) score -= 20;
  if (input.conversationHistory.length === 0) score -= 10;

  // Increase score for detailed inputs
  if (input.userMessage.includes("bedroom")) score += 10;
  if (input.images && input.images.length > 2) score += 15;

  if (score >= 75) return "high";
  if (score >= 50) return "medium";
  return "low";
}
```

### Clarifying Questions
```typescript
interface ClarifyingQuestions {
  required: boolean;
  questions: string[];
  fallbackQuote?: Quote; // Best-effort estimate
}

// Example
const questions = {
  electrical: [
    "How many rooms need wiring?",
    "Is this new installation or rewiring?",
    "Do you need sockets and switches included?",
    "What is the distance from the meter to the furthest point?"
  ],
  plumbing: [
    "How many bathrooms and toilets?",
    "Is there existing plumbing to work with?",
    "Do you need materials or labour only?",
    "What type of fittings do you prefer (standard or premium)?"
  ],
  building: [
    "What are the dimensions of the building?",
    "How many floors?",
    "What stage is the construction at?",
    "Do you have architectural drawings?"
  ]
};
```

---

## Learning & Personalization

### User Edit Tracking
```typescript
interface QuoteEdit {
  original_item: QuoteItem;
  edited_item: QuoteItem;
  edit_type: "price_change" | "quantity_change" | "item_added" | "item_removed";
  timestamp: string;
  user_id: string;
}

// Store in Supabase
table quote_edits {
  id: uuid;
  user_id: uuid;
  quote_id: uuid;
  original_value: jsonb;
  edited_value: jsonb;
  edit_type: text;
  created_at: timestamp;
}
```

### Price Learning Algorithm
```typescript
function learnUserPricing(userId: string): PricingProfile {
  // Analyze user's historical quotes
  const quotes = getUserQuotes(userId);
  const edits = getUserEdits(userId);

  // Calculate average adjustments
  const avgMarkup = calculateAverageMarkup(edits);
  const preferredSuppliers = extractSupplierPreferences(quotes);
  const commonItems = getFrequentlyUsedItems(quotes);

  return {
    avgMarkup,
    preferredSuppliers,
    commonItems,
    pricingStyle: "budget" | "standard" | "premium"
  };
}
```

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] Install Gemini SDK
- [ ] Create Gemini service module
- [ ] Design prompt templates
- [ ] Build Nigerian pricing database

### Phase 2: Core AI
- [ ] Implement multimodal input handling
- [ ] Build prompt engineering system
- [ ] Create output parser
- [ ] Add validation & error handling

### Phase 3: Intelligence
- [ ] Implement clarifying questions
- [ ] Add confidence scoring
- [ ] Build price reasonableness checks
- [ ] Create fallback logic

### Phase 4: Learning
- [ ] Track user edits
- [ ] Build pricing personalization
- [ ] Store feedback data
- [ ] Create analytics dashboard

### Phase 5: Integration
- [ ] Update ChatPage component
- [ ] Add image upload to chat
- [ ] Connect to QuoteEditor
- [ ] Test with real scenarios

---

## Success Metrics

**Speed:** Quote generation < 10 seconds
**Accuracy:** 80%+ of quotes accepted without major edits
**Coverage:** Handles 90%+ of common Nigerian trade jobs
**Localization:** 100% Nigerian market-appropriate pricing
**User Satisfaction:** 4.5+ star rating from tradespeople

---

**This system transforms OtoQuote AI into a true digital Nigerian tradesperson assistant!**
