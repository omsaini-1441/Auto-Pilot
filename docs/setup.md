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

Create an account at **`/signup`**, then sign in at **`/login`**. Use **Forgot password** to reset (dev shows a reset link; production needs `RESEND_API_KEY` + `APP_URL`).

## Environment variables

| Variable | Purpose | Example |
|---|---|---|
| `PORT` | Dev/server listen port | `3000` |
| `APP_URL` | Public site URL (reset links) | `http://localhost:3000` |
| `DATABASE_URL` | Postgres connection string | Neon URI |
| `AUTH_SECRET` | Session signing (≥32 chars in prod) | random |
| `RESEND_API_KEY` | Optional email for forgot-password | Resend key |
| `EMAIL_FROM` | From address for reset emails | `Outreach <…>` |
| `GEMINI_API_KEY` | AI extract / templates | AI Studio |
| `GEMINI_MODEL` | Model id | `gemini-3.5-flash-lite` |

### Without Gemini

You can still use the full pipeline. On Add job, skip **Extract with AI** and type company / role / location yourself.

### Accounts

Create an account at **`/signup`** (email + password, min 12 characters). Sign in at **`/login`**. There is no env-based default user and no email prefill.

Use **Forgot password** to reset (dev shows a reset link; production needs `RESEND_API_KEY` + `APP_URL`).

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
