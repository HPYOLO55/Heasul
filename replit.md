# GlowUp AI

A luxury AI-powered personal glow-up coach. Upload a selfie, get a detailed Gemini Vision analysis of your skin, hair, posture, style, and more — then track your daily wellness missions, streak, XP, and transformation progress.

## Run & Operate

- `pnpm --filter @workspace/glowup-ai run dev` — run the frontend (port from $PORT)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (auto-provisioned)
- Required env: `GEMINI_API_KEY` — Google Gemini API key (get free at aistudio.google.com)
- Auto-provisioned: `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind v4, Framer Motion, Recharts, Wouter
- Auth: Clerk (Replit-managed, supports Google login)
- AI: Google Gemini Vision API (gemini-2.0-flash) via user's own GEMINI_API_KEY
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (zod/v4), drizzle-zod
- API codegen: Orval (from OpenAPI spec)

## Where things live

- `artifacts/glowup-ai/` — React + Vite frontend (dark luxury mobile-first UI)
- `artifacts/api-server/` — Express 5 API server
- `artifacts/api-server/src/lib/gemini.ts` — Gemini Vision API integration
- `artifacts/api-server/src/lib/xp.ts` — XP/level/achievement logic
- `artifacts/api-server/src/middlewares/requireAuth.ts` — Clerk auth + JIT user provisioning
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/db/src/schema/` — Drizzle schema: users, analyses, missions, progressPhotos, achievements, dailyLogs

## Architecture decisions

- Clerk handles auth; users are JIT-provisioned in the DB on first authenticated request using clerkId
- Images are passed as base64 data URLs (compressed on client to max 800px/quality 0.8 before upload)
- Gemini API called server-side with user's own GEMINI_API_KEY — no Replit AI integration
- XP levels: 1 (0), 2 (500), 3 (1500), 4 (3000), 5 (5000+)
- Daily missions auto-generated for each user per day if none exist
- Progress photos stored as base64 in the DB (fine for dev, consider object storage for scale)

## Product

- Landing page for signed-out users → sign up/in with Clerk
- Dashboard: glow score ring, streak, daily missions, water/sleep quick-log
- Camera: upload or capture selfie → Gemini analyzes → detailed report
- Report: per-category scores (Skin, Hair, Eyes, Smile, Face Shape, Posture, Outfit, Lifestyle)
- Progress: recharts history for glow score, water, sleep + progress photo timeline
- Routine: morning/evening/weekly steps from latest analysis
- Missions: 5 daily missions with XP rewards + level progression
- Achievements: 10 achievement types, unlocked by actions and milestones
- Profile: edit name, age, gender, height, weight

## User preferences

_Populate as you build._

## Gotchas

- Always run `pnpm run typecheck:libs` after changing any `lib/*` schema before checking artifact typecheck
- After OpenAPI spec changes, run codegen before building routes: `pnpm --filter @workspace/api-spec run codegen`
- Clerk warning about "development keys" in the browser console is expected and harmless in dev
- `zod.looseObject` doesn't exist in zod v3 — avoid bare `type: object` with no properties in the OpenAPI spec; always give objects at least one `$ref`-ed schema or explicit properties
