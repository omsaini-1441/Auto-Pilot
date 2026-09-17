# Setup

## Requirements

- Node.js 20+ recommended
- npm
- (Optional) Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

## Install

```bash
npm install
cp .env.example .env   # Windows: copy .env.example .env
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Default login password: **`outreach`** (override with `SOLO_PASSWORD`).

## Environment variables

Copy from `.env.example`:

| Variable | Purpose | Example |
|---|---|---|
| `DATABASE_URL` | Prisma DB | `file:./dev.db` |
| `AUTH_SECRET` | Signs the session cookie | long random string |
| `SOLO_PASSWORD` | Login password | `outreach` |
| `GEMINI_API_KEY` | AI job extract | from AI Studio |
| `GEMINI_MODEL` | Model id | `gemini-3.5-flash-lite` (free-tier friendly) |

### Without Gemini

You can still use the full pipeline. On Add job, skip **Extract with AI** and type company / role / location yourself. Extract may also guess a weak company name from the URL host.

### Changing the password after first run

The first login seeds a user with a hash of `SOLO_PASSWORD`. Changing `.env` later does **not** automatically update an existing hash. For local solo use, easiest reset is delete `prisma/dev.db` and re-run `npx prisma migrate dev` (wipes data), or update the password hash in code/DB deliberately.

## Useful scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm run db:migrate` | Prisma migrate |
| `npm run db:push` | Push schema without migration files |

## Deploy notes (later)

- Hosting: Vercel (or similar) works with Next.js.
- SQLite on serverless is awkward; switch `DATABASE_URL` to Postgres (Neon/Supabase/etc.) before serious cloud deploy.
- Set the same env vars in the host dashboard; never commit `.env`.

## Phone testing

- Same Wi‑Fi: open the Network URL printed by `next dev` (e.g. `http://192.168.x.x:3000`).
- Use Chrome → Add to Home Screen for a more app-like feel (`manifest.webmanifest` is included).
