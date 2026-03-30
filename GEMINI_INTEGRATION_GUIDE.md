# Gemini AI Integration Guide

## Overview

Quote Master Pro now features **AI-powered quotation generation** using Google's Gemini 1.5 Flash model. This guide explains how to set up, use, and understand the AI features.

---

## ✅ What's Been Implemented

### 1. **Multimodal AI Quote Generation**
- **Text Input**: Describe jobs in natural Nigerian English (e.g., "I wan wire 3 bedroom flat for Lekki")
- **Image Input**: Upload up to 5 photos of the job site for visual analysis
- **Combined Processing**: Gemini analyzes both text and images together

### 2. **Nigerian Market Intelligence**
- Comprehensive pricing database for Lagos/Abuja markets
- Support for 5 major trades:
  - Electrical work
  - Plumbing
  - Building/Construction
  - Painting
  - Carpentry
- Realistic price ranges based on actual market rates

### 3. **Smart Features**
- **Clarifying Questions**: AI asks for more details when job description is vague
- **Confidence Scoring**: Shows confidence level (high/medium/low) for generated quotes
- **Conversation Context**: Remembers previous messages in the chat session
- **Editable Quotes**: User can modify quotes and regenerate

### 4. **Image Upload UI**
- Click camera icon to select images
- Preview thumbnails with remove buttons
- Badge showing number of selected images
- Maximum 5 images per request

---

## 🚀 Setup Instructions

### Step 1: Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the generated key

### Step 2: Configure Environment

1. Open your `.env` file in the project root
2. Add your API key:

```env
VITE_GEMINI_API_KEY=your_actual_api_key_here
```

3. **Important**: Never commit the `.env` file to git (it's already in `.gitignore`)

### Step 3: Install Dependencies (Already Done)

The following packages are already installed:
```bash
npm install @google/generative-ai
```

### Step 4: Run Database Migration

1. Open your Supabase dashboard
2. Go to **SQL Editor**
3. Run the migration script: `supabase/migration_brand_config.sql`
4. This ensures all required database columns exist

### Step 5: Start Development Server

```bash
npm run dev
```

The AI features will now be active on the Chat page!

---

## 📱 How to Use AI Quote Generation

### Basic Workflow

1. **Navigate to Chat Page**
   - Click the "Chat" icon in the bottom navigation

2. **Describe the Job**
   - Type in natural language (English or Nigerian English)
   - Examples:
     - "I need to wire a 3-bedroom flat in Lekki"
     - "Paint 2 bedroom apartment, sitting room and kitchen"
     - "Install new plumbing for duplex in Ikoyi"

3. **Add Images (Optional)**
   - Click the camera icon
   - Select photos from device/gallery
   - You'll see thumbnails appear above the input
   - Remove unwanted images by clicking the X button

4. **Send Request**
   - Press the send button or hit Enter
   - AI will analyze your request and images
   - Wait for quote generation (typically 3-10 seconds)

5. **Review Generated Quote**
   - Quote appears in the right panel (desktop) or below (mobile)
   - Check all items, quantities, and prices
   - Note the confidence level if shown

6. **Edit and Regenerate (If Needed)**
   - Click the edit icon on your original message
   - Modify your description
   - AI will regenerate the quote with new parameters

7. **Save or Export**
   - Click "Save Quote" to store in database
   - Click "Export PDF" to download client-ready document

### Clarifying Questions

If your job description is too vague, the AI will ask clarifying questions:

**Example:**
```
User: "I need electrical work"

AI: "I need a bit more information:
1. What type of property? (flat, duplex, commercial, etc.)
2. How many rooms need wiring?
3. Any specific fixtures or appliances to install?
4. What is your location?"
```

Simply answer these questions in your next message, and the AI will generate an accurate quote.

---

## 🧠 How It Works

### Technical Architecture

```
User Input (Text + Images)
    ↓
ChatPage Component
    ↓
generateQuoteWithAI()
    ↓
geminiService.generateQuoteWithGemini()
    ↓
┌─────────────────────────────────────┐
│  Gemini 1.5 Flash API Processing   │
│  - Analyze text description         │
│  - Process uploaded images          │
│  - Access Nigerian pricing DB       │
│  - Consider conversation history    │
│  - Apply trade-specific templates   │
└─────────────────────────────────────┘
    ↓
Structured JSON Response
    ↓
Parse & Validate
    ↓
Create Quote Object
    ↓
Display in QuoteCard Component
```

### Prompt Engineering

The system uses carefully crafted prompts that include:

1. **System Context**: Defines AI as Nigerian quotation expert
2. **Nigerian Market Knowledge**: Embedded pricing database
3. **Trade-Specific Templates**: Different prompts for electricians, plumbers, etc.
4. **Location Context**: Lagos/Abuja pricing considerations
5. **Structured Output**: Enforces JSON format with required fields

**Example System Prompt (Electrician):**
```
You are an expert Nigerian electrical contractor AI assistant helping to generate quotations...

NIGERIAN PRICING CONTEXT (Lagos/Abuja rates):

MATERIALS:
- 16mm single-core cable: ₦18,000 - ₦25,000 per roll
- 13A socket: ₦500 - ₦1,200 each
- Distribution board (12-way): ₦25,000 - ₦45,000
...

LABOUR:
- Complete bedroom wiring: ₦40,000 - ₦80,000 per room
- Socket point installation: ₦2,500 - ₦5,500 per point
...
```

### Image Processing

When images are uploaded:

1. **File Conversion**: Images converted to base64 format
2. **Multimodal API**: Sent to Gemini 1.5 Flash (supports images)
3. **Visual Analysis**: AI extracts information like:
   - Property size and layout
   - Current electrical/plumbing state
   - Wall conditions (for painting)
   - Visible fixtures and fittings
   - Space measurements (estimated)

4. **Context Integration**: Visual info combined with text description

---

## 💡 Example Use Cases

### Use Case 1: Electrical Installation

**User Input:**
```
"3 bedroom flat in Ikeja. Need complete rewiring, new distribution board,
15 socket points, 10 ceiling lights, and stabilizer installation."
```

**Images**: Photos of existing electrical panel and rooms

**AI Output:**
```json
{
  "groups": [
    {
      "name": "Materials",
      "items": [
        { "name": "16mm Single-Core Cable", "qty": 4, "unit": "roll", "unitPrice": 22000 },
        { "name": "13A Socket", "qty": 15, "unit": "piece", "unitPrice": 800 },
        { "name": "Distribution Board (12-way)", "qty": 1, "unit": "unit", "unitPrice": 35000 },
        ...
      ]
    },
    {
      "name": "Labour",
      "items": [
        { "name": "Complete Bedroom Wiring", "qty": 3, "unit": "room", "unitPrice": 60000 },
        ...
      ]
    }
  ],
  "confidence": "high",
  "clientName": "Ikeja Property Owner"
}
```

### Use Case 2: Painting Job (with clarifying questions)

**User Input (Vague):**
```
"I want to paint my house"
```

**AI Response:**
```
I need a bit more information:
1. How many rooms need painting?
2. Interior, exterior, or both?
3. What is the current state of the walls?
4. Any ceiling painting required?
5. What is your location?
```

**User Follow-up:**
```
"2 bedrooms, sitting room, kitchen. Interior only.
Walls are good, just need fresh paint. No ceiling. I'm in Ajah."
```

**AI Output**: Complete quotation with materials and labour

---

## 🎯 Best Practices

### For Accurate Quotes

1. **Be Specific**: Include property type, number of rooms, location
2. **Mention Quality Level**: Budget, standard, or premium materials
3. **Upload Clear Photos**: Well-lit images showing the full scope
4. **Specify Timeline**: Urgent jobs may affect pricing
5. **Note Special Requirements**: Access restrictions, working hours, etc.

### Input Examples (Good vs Bad)

**❌ Too Vague:**
- "Need electrical work"
- "Paint job"
- "Fix plumbing"

**✅ Good Descriptions:**
- "Rewire 3-bedroom flat in Lekki with new DB, 20 sockets, 12 lights, and security lights"
- "Paint interior of 2-bedroom apartment - sitting room, bedrooms, kitchen. Walls in good condition. Ajah area."
- "Install new bathroom plumbing for duplex - 2 bathrooms, 1 guest toilet. Include fittings and labor. Ikoyi."

### Managing Costs

The AI uses these pricing strategies:

1. **Market Range**: Provides mid-range pricing by default
2. **Quality Tiers**: Adjusts based on location and property type
3. **Bulk Discounts**: Applies for larger quantities
4. **Logistics**: Adds transportation based on location
5. **Contingency**: Builds in 5-10% buffer for unexpected costs

---

## 🔧 Customization Options

### Adjust User's Trade (Future Enhancement)

Currently set to "general", but you can modify in [ChatPage.tsx:174](src/pages/ChatPage.tsx#L174):

```typescript
const response = await generateQuoteWithGemini(
  {
    userMessage: prompt,
    images: images.length > 0 ? images : undefined,
    userTrade: "electrician", // Change this based on user profile
    userLocation: "Lagos",
  },
  user.id
);
```

### Add Custom Pricing

Edit [src/lib/nigerianPricing.ts](src/lib/nigerianPricing.ts) to add your own prices:

```typescript
export const ELECTRICAL_PRICING: TradePricing = {
  materials: {
    "custom_item_name": price(minPrice, maxPrice, "unit"),
    // Add more items
  },
  // ...
};
```

### Modify AI Behavior

Edit [src/lib/geminiService.ts](src/lib/geminiService.ts#L120) to adjust:

- **Temperature**: Control creativity (0.0 = deterministic, 1.0 = creative)
- **Max Tokens**: Limit response length
- **System Prompt**: Change AI personality and expertise

```typescript
generationConfig: {
  temperature: 0.7, // Adjust between 0.0 and 1.0
  maxOutputTokens: 8000,
}
```

---

## 🐛 Troubleshooting

### Issue 1: "Gemini API key not configured"

**Solution:**
1. Verify `.env` file exists in project root
2. Check the key is named exactly: `VITE_GEMINI_API_KEY`
3. Restart the dev server after adding the key
4. Ensure no spaces or quotes around the key value

### Issue 2: "API quota exceeded"

**Solution:**
1. Check your Google AI Studio quota limits
2. Wait for quota reset (usually daily)
3. Consider upgrading to paid tier for higher limits
4. Temporarily use mock generation as fallback

### Issue 3: Low confidence scores

**Reasons:**
- Vague job description
- Unusual or rare job type
- Conflicting information in text vs images
- Location outside Lagos/Abuja pricing data

**Solution:**
- Provide more details
- Answer clarifying questions
- Upload clearer, more comprehensive images
- Manually review and adjust prices

### Issue 4: Images not uploading

**Solution:**
1. Check image format (JPG, PNG supported)
2. Ensure image size < 5MB each
3. Try uploading one image at a time
4. Check browser console for errors

### Issue 5: Slow generation

**Expected Duration:**
- Text-only: 3-5 seconds
- With 1-2 images: 5-8 seconds
- With 3-5 images: 8-15 seconds

**If slower:**
- Check internet connection
- Reduce number of images
- Try during off-peak hours

---

## 📊 API Usage & Costs

### Free Tier Limits

Google AI Studio free tier includes:
- **60 requests per minute**
- **1,500 requests per day**
- Gemini 1.5 Flash is optimized for cost-efficiency

### Cost Optimization Tips

1. **Batch Similar Jobs**: Generate multiple quotes in one session
2. **Reduce Image Count**: 1-2 clear images often sufficient
3. **Reuse Quotes**: Save and duplicate similar jobs
4. **Cache Conversations**: Use chat history for iterations instead of new sessions

---

## 🔒 Security & Privacy

### Data Handling

- **User Data**: Not stored in Gemini servers beyond request processing
- **Images**: Temporarily processed, not retained by Google AI
- **Quotes**: Stored in your Supabase database with full RLS protection
- **API Keys**: Never exposed to client-side (loaded via Vite env variables)

### Best Practices

1. **Never share your API key** in screenshots, logs, or commits
2. **Rotate keys** if accidentally exposed
3. **Use RLS policies** to protect user quotes in Supabase
4. **Sanitize inputs** before sending to AI (already implemented)

---

## 🚀 Future Enhancements

### Planned Features

1. **Learning from Edits**: Track user modifications to improve future quotes
2. **Voice Input**: Describe jobs using voice notes
3. **Trade Selection**: Auto-detect job type from description
4. **Price History**: Show trending prices over time
5. **Multi-Currency**: Support USD, EUR alongside NGN
6. **Offline Mode**: Cache common items for offline quote generation
7. **Template Library**: Pre-built templates for common job types
8. **Competitor Analysis**: Compare your pricing with market rates

---

## 📚 Additional Resources

- **Gemini API Docs**: https://ai.google.dev/docs
- **Nigerian Pricing Research**: See [src/lib/nigerianPricing.ts](src/lib/nigerianPricing.ts)
- **System Design**: See [GEMINI_AI_SYSTEM_DESIGN.md](GEMINI_AI_SYSTEM_DESIGN.md)
- **Implementation Summary**: See [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)

---

## 🆘 Support

If you encounter issues:

1. Check this guide first
2. Review browser console for errors
3. Verify API key configuration
4. Test with simple text-only request
5. Check Gemini API status: https://status.cloud.google.com/

---

**Last Updated**: March 25, 2026
**Version**: 1.0
**Gemini Model**: gemini-1.5-flash
