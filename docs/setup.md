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

Open [http://localhost:3000](http://localhost:3000) (or whatever `PORT` you set).

Login with `SOLO_EMAIL` + `SOLO_PASSWORD`. Use **Forgot password** on `/login` to reset (dev shows a reset link; production needs `RESEND_API_KEY` + `APP_URL`).

## Environment variables

| Variable | Purpose | Example |
|---|---|---|
| `PORT` | Dev/server listen port | `3000` |
| `APP_URL` | Public site URL (reset links) | `http://localhost:3000` |
| `DATABASE_URL` | Postgres connection string | Neon URI |
| `AUTH_SECRET` | Session signing (≥32 chars in prod) | random |
| `SOLO_EMAIL` | Login email | `you@example.com` |
| `SOLO_PASSWORD` | Login password (≥12 in prod) | strong password |
| `RESEND_API_KEY` | Optional email for forgot-password | Resend key |
| `EMAIL_FROM` | From address for reset emails | `Outreach <…>` |
| `GEMINI_API_KEY` | AI extract / templates | AI Studio |
| `GEMINI_MODEL` | Model id | `gemini-3.5-flash-lite` |

### Without Gemini

You can still use the full pipeline. On Add job, skip **Extract with AI** and type company / role / location yourself.

### Changing the password after first run

Login checks the **stored password hash only** (not a live read of `.env` on every attempt). Changing `SOLO_PASSWORD` in `.env` does not unlock an already-seeded account — use **Forgot password**, or if the account was still on the old default `outreach`, the next request rewrites the hash to your configured `SOLO_PASSWORD` once.

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
