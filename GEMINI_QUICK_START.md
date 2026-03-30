# Gemini AI - Quick Start Guide

## 🎯 Get Started in 3 Steps

### Step 1: Add API Key (2 minutes)

1. Get your free API key: https://makersuite.google.com/app/apikey
2. Open `.env` file in project root
3. Add this line:
   ```
   VITE_GEMINI_API_KEY=your_api_key_here
   ```
4. Save and restart dev server

### Step 2: Run Database Migration (1 minute)

1. Open Supabase Dashboard → SQL Editor
2. Copy and run: `supabase/migration_brand_config.sql`
3. Verify success ✅

### Step 3: Test AI Quote Generation (1 minute)

1. Run `npm run dev`
2. Navigate to Chat page
3. Type: **"Wire 2 bedroom flat in Ikeja with 10 sockets and 6 lights"**
4. Press Send
5. Watch AI generate a complete quotation! 🎉

---

## ✨ Key Features Now Active

| Feature | Description |
|---------|-------------|
| 📝 **Text Descriptions** | Natural Nigerian English supported |
| 📸 **Image Upload** | Upload up to 5 photos of job site |
| 💰 **Smart Pricing** | Real Lagos/Abuja market rates |
| ❓ **Clarifying Questions** | AI asks for details when needed |
| 🎯 **Confidence Scores** | Know how accurate the quote is |
| ✏️ **Edit & Regenerate** | Refine quotes iteratively |
| 💾 **Save & Export** | Store quotes or download PDF |

---

## 🗣️ Example Prompts to Try

### Electrical
```
"Complete electrical installation for 3-bedroom duplex in Lekki.
Need distribution board, 15 sockets, 12 ceiling lights, and security lights."
```

### Plumbing
```
"Install new plumbing for 2 bathrooms and 1 kitchen in Ikeja.
Include all pipes, fittings, and water heater installation."
```

### Painting
```
"Paint interior of 2-bedroom flat - sitting room, bedrooms, kitchen.
Walls are in good condition. Location: Ajah."
```

### Building
```
"Build perimeter fence 50 meters long, 2 meters high with pillars.
Block fence with plastering. Victoria Island."
```

### Carpentry
```
"Kitchen cabinets for 4x3 meter kitchen, 6 wardrobes for 3 bedrooms.
Marine plywood, standard quality. Surulere."
```

---

## 📸 Image Upload Tips

1. Click the **camera icon** in chat input
2. Select clear, well-lit photos showing:
   - Overall space/property
   - Existing installations
   - Problem areas
   - Measurements (if visible)
3. Preview appears above input - remove unwanted images with ✖️
4. Max 5 images per request

---

## ⚠️ Troubleshooting

| Issue | Quick Fix |
|-------|-----------|
| "API key not configured" | Check `.env` file, restart dev server |
| Low confidence score | Add more details or answer AI's questions |
| Slow generation | Reduce number of images, check internet |
| Wrong prices | Specify location and quality level clearly |

---

## 📖 Full Documentation

For detailed information, see:
- **Complete Guide**: [GEMINI_INTEGRATION_GUIDE.md](GEMINI_INTEGRATION_GUIDE.md)
- **System Design**: [GEMINI_AI_SYSTEM_DESIGN.md](GEMINI_AI_SYSTEM_DESIGN.md)
- **Setup Instructions**: [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md)

---

## 🎉 What's Next?

After your first AI-generated quote:

1. ✏️ **Edit the quote** in QuoteEditor if needed
2. 💾 **Save to database** for future reference
3. 📄 **Export as PDF** to send to client
4. 🔁 **Try voice notes** (mock for now, real soon!)
5. 🎨 **Customize branding** in Brand Settings

---

**Ready to revolutionize your quotations? Start chatting with OtoQuote AI now!** 🚀
