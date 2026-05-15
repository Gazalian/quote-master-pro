# OtoQuote AI

AI-powered quotation app for Nigerian tradespeople. Talk to it in natural
language (or attach a site photo), get a professional itemised quote, edit,
brand, export, and convert to an invoice.

## Architecture

```
┌─────────────────────────────┐    HTTPS + JWT     ┌──────────────────────────┐
│  Frontend (src/)            │ ─────────────────▶ │  Backend (backend/)      │
│  React 18 + Vite + TS       │                    │  Fastify + TS            │
│  Supabase JS (auth only)    │                    │  - Verifies JWT          │
│  React Query (cache)        │                    │  - Builds AI prompt      │
│                             │                    │  - Calls Gemini          │
└─────────────────────────────┘                    │  - Atomic RPC dispatch   │
                                                   └────┬─────────────────────┘
                                                        │
                                       ┌────────────────┴─────────────────┐
                                       ▼                                  ▼
                              ┌──────────────────┐               ┌────────────────┐
                              │ Supabase         │               │ Google Gemini  │
                              │ Postgres + RLS   │               │ (key NEVER     │
                              │ Auth             │               │  leaves server)│
                              │ Edge Functions   │               └────────────────┘
                              └──────────────────┘
```

**Design rules:**
- The browser holds **no** AI secrets and **no** business logic.
- Frontend → Backend → Supabase / Gemini. No direct Gemini calls from the SPA.
- All point deductions and quote saves go through one atomic Postgres RPC
  (`save_quote_with_points`).
- One `GET /api/user/bootstrap` call returns profile + brand + pricing +
  preferences. React Query caches it; mutations invalidate it.

## Repo layout

```
.
├── src/                   # React frontend (Vite, TS)
│   ├── pages/             # Route components
│   ├── components/        # Shared components (UI, templates, editors)
│   ├── hooks/             # React Query hooks (useBootstrap, useQuotes, ...)
│   └── lib/
│       ├── apiClient.ts   # Typed fetch wrapper for the backend
│       ├── AuthContext.tsx
│       └── supabase.ts    # Client for auth only — never bypasses backend
├── backend/               # Fastify backend (Node 20, TS) — see backend/README.md
├── supabase/              # SQL migrations
└── public/
```

## First-time setup

```bash
# 1. Frontend
cp .env.local.example .env.local
#   fill VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_BASE_URL
npm install
npm run dev                 # http://localhost:8080

# 2. Backend (separate terminal)
cd backend
cp .env.example .env
#   fill SUPABASE_*, GEMINI_API_KEY, etc.
npm install
npm run dev                 # http://localhost:3001
```

The backend refuses to start with missing / invalid env vars. The frontend
falls back to a placeholder Supabase client and warns in the console.

## Secrets that previously leaked

The pre-refactor `.env` was committed to git and contained:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GEMINI_API_KEY`   ← **rotate immediately**

The Gemini key was also shipped to every browser (Vite `VITE_*` prefix bundles
into the client JS). Anyone with a copy of the deployed bundle has it.

**Action items before going live:**
1. Rotate the Gemini API key (the old one is compromised).
2. Rotate the Supabase anon key.
3. Re-deploy with the new keys configured in (a) Vercel env vars for the
   frontend, (b) your backend host env vars.
4. `.env` is now gitignored — never check it back in.

## Database

Schema lives at [supabase/migration_phase1_hardening.sql](supabase/migration_phase1_hardening.sql)
plus the earlier migration files. The Phase 1 migration is already applied to
project `lczgjuaokmzgynrczziy`. Re-running is safe (every statement is
idempotent).

Key DB objects added in this refactor:
- `deduct_points(uuid, int, text, text)` — atomic, CHECK-constrained
- `save_quote_with_points(...)` — atomic save + point deduction
- `get_user_bootstrap()` — one call returns profile + brand + pricing + prefs
- `get_quotation_list(limit, offset, status)` — list view without heavy JSONB
- 8 composite indexes on `(user_id, created_at DESC)` style hot paths

## Scripts

| Command               | What it does |
| --------------------- | ------------ |
| `npm run dev`         | Vite dev server (frontend) |
| `npm run build`       | Production build of frontend |
| `npm run test`        | Run Vitest tests |
| `cd backend && npm run dev`  | Fastify dev server with tsx watch |
| `cd backend && npm run build` | Compile TS → JS in `backend/dist/` |
| `cd backend && npm start`     | Run compiled backend |

## Deployment

- **Frontend**: any static host (Vercel set up in `vercel.json`)
- **Backend**: any Node 20 host (Render / Fly / Railway / Fargate)
- **Database**: Supabase managed Postgres
- **Cron**: Supabase Edge Function `recalculate-regional-prices` runs daily
