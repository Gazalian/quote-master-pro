# OtoQuote AI — Backend

Fastify + TypeScript API.  Lives next to the frontend in the same repo for
co-located development; deploys independently.

## Why this exists

The previous architecture put the Gemini API key, prompt construction, retry
logic, points deduction, and several Supabase round-trips in the browser.
This server fixes those by:

- Keeping the Gemini secret server-side
- Constructing the prompt with a cached static half + a per-request dynamic half
- Using Gemini structured output (response schema) — no more regex JSON parsing
- Single retry + fallback model with hard timeout (was: 3 models × 3 retries)
- One `/api/user/bootstrap` call replaces the 4 separate Supabase queries the
  client used to issue on chat open
- Atomic point deduction via the `save_quote_with_points` Postgres RPC
- Per-user rate limiting on AI generation

## Setup

```bash
cd backend
npm install
cp .env.example .env
# fill in the real values for SUPABASE_*, GEMINI_API_KEY, etc.
npm run dev
```

The server will fail fast at boot if any env var is missing.

## Routes

| Method | Path                          | Purpose |
| ------ | ----------------------------- | ------- |
| GET    | `/health/live`                | Liveness probe |
| GET    | `/health/ready`               | Readiness probe |
| GET    | `/api/user/bootstrap`         | One-shot user state (profile + brand + pricing + prefs) |
| POST   | `/api/user/bootstrap/invalidate` | Manual cache flush after profile edit |
| POST   | `/api/quotes/generate`        | Gemini-powered quote draft (rate-limited per user) |
| POST   | `/api/quotes/save`            | Atomic save + point deduction |
| GET    | `/api/quotes`                 | List (lightweight projection) |
| GET    | `/api/quotes/:id`             | Detail (full data) |
| PATCH  | `/api/quotes/:id`             | Update |
| DELETE | `/api/quotes/:id`             | Delete |
| GET    | `/api/chat/sessions`          | List sessions |
| GET    | `/api/chat/sessions/:id`      | Load session |
| PUT    | `/api/chat/sessions/:id`      | Upsert |
| DELETE | `/api/chat/sessions/:id`      | Delete |
| POST   | `/api/invoices`               | Create invoice from quote |
| GET    | `/api/invoices`               | List |

## Auth

Every `/api/*` route requires a Supabase JWT in `Authorization: Bearer <jwt>`.
The middleware verifies the token via `supabase.auth.getUser(jwt)` and attaches
`{ id, email, jwt }` to `req.user`. Direct Supabase reads/writes use a
per-request client built from the JWT so RLS continues to apply.

## Layout

```
src/
├── config/      env validation, supabase clients
├── middleware/  auth, error handler
├── services/    gemini, prompt, user, quote, session, invoice
├── routes/      health, user, quotes, sessions, invoices
├── cache/       in-process TTL cache
├── types/       shared domain types
├── utils/       logger
└── server.ts    Fastify bootstrap + graceful shutdown
```

## Deployment notes

- **Anywhere that runs Node 20+.** Render, Fly.io, Railway, AWS Fargate, etc.
  Vercel Serverless Functions are possible but the Fastify pattern fits better
  on a long-running worker.
- Set `NODE_ENV=production` so structured JSON logs replace pretty-print.
- Set `CORS_ORIGIN` to your deployed frontend's origin (no wildcards).
- Set the rate limits to a sane value for your Gemini quota.
- The in-process cache (`MemoryCache`) is fine for a single instance. Replace
  with Redis when scaling to multiple workers.
