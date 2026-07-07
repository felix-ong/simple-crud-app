# ❖ Quest Log

A gamified to-do app where tasks are **quests**. Complete one and it seals with a
gold burst, its XP flows into your bar, you level up, and your daily streak stays alive.
One shared list, no login — built to be **easily hostable on Vercel** with a persistent
**Neon** Postgres database.

**Live:** https://simple-crud-app-iota.vercel.app

---

## Stack

- **Next.js 15** (App Router) + **TypeScript** — server components read from the database,
  Server Actions handle every mutation, so credentials never reach the browser.
- **Neon Postgres** via `@neondatabase/serverless` (HTTP driver, ideal for serverless).
- **Drizzle ORM** for a type-safe schema and migrations.
- **canvas-confetti** + the Web Audio API for the completion reward moment.
- **Tailwind v4** for layout, with a bespoke CSS layer for the palette and animations.

## How it plays

- Each quest earns XP by priority — **Minor** (✦10), **Standard** (✦20), **Epic** (✦40).
- Levels use a rising curve (`100 × level` XP to clear each), so early levels come fast.
- Your **streak** counts consecutive days with at least one completion. Miss a day and it
  resets; the longest streak is always remembered.
- Completing a quest is instant and optimistic; re-opening one refunds its XP (never below
  zero) and leaves your streak intact.

Level and progress are always **derived** from lifetime XP (`lib/leveling.ts`), so the
server and client can't drift out of sync.

## Run it locally

```bash
# 1. Install
npm install

# 2. Create a free Postgres database at https://neon.tech, copy the connection
#    string, and put it in .env.local:
#      DATABASE_URL="postgresql://…@…neon.tech/…?sslmode=require"
cp .env.example .env.local   # then paste your string in

# 3. Create the tables, then start the app
npm run db:push
npm run dev                  # → http://localhost:3000
```

If you open the app before the database is ready, it shows a friendly setup screen
instead of crashing.

## Deploy to Vercel

1. Push this repo to GitHub and **Import** it in Vercel — or run `npx vercel`.
2. Add `DATABASE_URL` as an environment variable (Project → Settings → Environment
   Variables), **or** add Neon from the Vercel Marketplace to have it injected automatically.
3. Run `npm run db:push` once against that database to create the tables.
4. Deploy. That's it.

> This app is deployed exactly this way — `DATABASE_URL` set for Production/Preview/Development,
> schema pushed to Neon, `vercel --prod`.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `start` | Production build / serve |
| `npm run db:push` | Push the schema straight to the database (fastest setup) |
| `npm run db:generate` / `db:migrate` | Generate & apply SQL migration files (reproducible path) |
| `npm run db:studio` | Browse the data in Drizzle Studio |

## Project layout

```
app/
  actions.ts     Server Actions — CRUD + XP/streak mutations
  page.tsx       Server component: read quests + stats (setup screen on DB failure)
  layout.tsx     Fonts (Cinzel / Manrope / Space Mono) + metadata
  globals.css    Design tokens, layout, the completion-reward animations
components/
  QuestLog.tsx   Optimistic list + reward orchestration
  QuestItem.tsx  A quest row: seal checkbox, inline edit, delete
  StatusBar.tsx  Level, animated XP bar, streak flame
  AddQuest.tsx   New-quest input + priority picker
  SoundToggle.tsx / SetupNotice.tsx
lib/
  schema.ts      Drizzle tables (quests, player_stats)
  db.ts          Lazy Neon + Drizzle client
  leveling.ts    XP-per-priority, levelFromXp(), streak rules  ← single source of truth
  reward.ts      Confetti bursts (reduced-motion aware)
  sound.ts       Synthesized SFX, muteable, off by default
```

## Accessibility & polish

Keyboard-operable throughout with visible focus, `prefers-reduced-motion` respected
(bursts and ticks become instant), and sound is synthesized, muteable, and off until
you turn it on.
