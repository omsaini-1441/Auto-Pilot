# Setup

## Requirements

- Node.js 20+ recommended
- npm
- A **Postgres** database ([Neon](https://neon.tech) free tier is enough)
- (Optional) Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

## Install

```bash
npm install
cp .env.example .env   # Windows: copy .env.example .env
```

Edit `.env` — set `DATABASE_URL` to your Neon (or other Postgres) URL, then:

```bash
npx prisma migrate deploy
npx prisma generate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Default login password: **`outreach`** (override with `SOLO_PASSWORD`).

## Environment variables

| Variable | Purpose | Example |
|---|---|---|
| `DATABASE_URL` | Postgres connection string | `postgresql://…?sslmode=require` |
| `AUTH_SECRET` | Signs the session cookie | long random string |
| `SOLO_PASSWORD` | Login password | `outreach` |
| `GEMINI_API_KEY` | AI job extract / templates | from AI Studio |
| `GEMINI_MODEL` | Model id | `gemini-3.5-flash-lite` |

### Without Gemini

You can still use the full pipeline. On Add job, skip **Extract with AI** and type company / role / location yourself.

### Changing the password after first run

The first login seeds a user with a hash of `SOLO_PASSWORD`. Changing `.env` later does **not** automatically update an existing hash. Easiest reset: delete the `User` row in the DB (or recreate the Neon database) and log in again.

## Useful scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | `prisma generate` + `migrate deploy` + Next build |
| `npm run start` | Run production build |
| `npm run db:deploy` | Apply migrations (`migrate deploy`) |
| `npm run db:migrate` | Create migrations in development |
| `npm run db:push` | Push schema without migration files |

## Deploy

See **[deploy-vercel.md](./deploy-vercel.md)**.

## Phone testing

- Same Wi‑Fi: open the Network URL printed by `next dev`.
- Or use your Vercel URL after deploy.
