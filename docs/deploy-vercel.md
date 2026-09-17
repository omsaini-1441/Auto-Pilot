# Deploy to Vercel

Outreach uses **Postgres** (not SQLite) so it works on Vercel’s serverless filesystem.

## 1. Create a free Postgres database (Neon)

1. Go to [https://neon.tech](https://neon.tech) and sign up.
2. Create a project (region close to you is fine).
3. Copy the **connection string** (URI). It looks like:

```text
postgresql://USER:PASSWORD@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require
```

Optional: in Neon, enable **connection pooling** and use the **pooled** URL for Vercel (`-pooler` in the host). Either works for this small solo app.

## 2. Push your code to GitHub

Repo should already be on GitHub (`omsaini-1441/Auto-Pilot`). Commit deploy changes if you haven’t:

```bash
git add .
git status
# then commit + push when ready
```

## 3. Import the project on Vercel

1. Go to [https://vercel.com](https://vercel.com) → **Add New…** → **Project**.
2. Import **Auto-Pilot** from GitHub (use the same GitHub account / `github-personal` if needed).
3. Framework: **Next.js** (auto-detected).
4. **Do not deploy yet** — add env vars first (or add them and redeploy).

## 4. Set environment variables

In Vercel → Project → **Settings** → **Environment Variables**, add for **Production** (and Preview if you want):

| Name | Value |
|---|---|
| `DATABASE_URL` | Neon connection string from step 1 |
| `AUTH_SECRET` | **Required.** ≥32 random chars. `openssl rand -base64 48` |
| `APP_URL` | Your Vercel URL, e.g. `https://your-app.vercel.app` |
| `RESEND_API_KEY` | Optional but needed for production forgot-password emails |
| `EMAIL_FROM` | Optional. Verified sender on Resend |
| `GEMINI_API_KEY` | From Google AI Studio |
| `GEMINI_MODEL` | `gemini-3.5-flash-lite` |

Do **not** set `SOLO_EMAIL` / `SOLO_PASSWORD` — accounts are created via **`/signup`**. Login fields are never prefilled.

### Auth hardening (already in the app)

- Production refuses weak/missing `AUTH_SECRET`
- Login / signup are rate-limited (lockout after repeated failures)
- No default credentials and no email prefill
- Sessions last 7 days; cookies are `httpOnly` + `secure` in production
- All routes except auth pages require a valid session cookie

**Do not** leave `AUTH_SECRET` as anything containing `change-in-production` or `dev-secret` on Vercel.

## 5. Deploy

Click **Deploy**. The build runs:

```text
prisma generate → prisma migrate deploy → next build
```

That creates tables on Neon automatically from `prisma/migrations`.

## 6. First login

1. Open your Vercel URL (e.g. `https://auto-pilot-….vercel.app`).
2. Go to **Create account** (`/signup`) and register with your email + password (≥12 chars).
3. Fill **Profile**, add a job, test extract + drafts.

## Local development after this change

SQLite local `file:./dev.db` no longer matches the schema. Point local `.env` at the **same Neon DB** (or a Neon branch):

```env
DATABASE_URL="postgresql://…?sslmode=require"
AUTH_SECRET="…"
GEMINI_API_KEY="…"
GEMINI_MODEL="gemini-3.5-flash-lite"
```

Then:

```bash
npx prisma migrate deploy
npx prisma generate
npm run dev
```

Create an account at `/signup` (or sign in if you already have one).

## Troubleshooting

| Issue | Fix |
|---|---|
| Build fails on `migrate deploy` | Check `DATABASE_URL` is set and Neon allows connections |
| `Unauthorized` / can’t log in | Confirm `AUTH_SECRET` on Vercel; create an account via `/signup` |
| Gemini extract fails | Confirm `GEMINI_API_KEY` + model id still valid |
| Old local SQLite data missing | Expected — data lived in `dev.db`; start fresh on Postgres or export/import manually |

## Notes

- Keep `.env` out of git (already gitignored). Only `.env.example` is committed.
- Password changes: use **Forgot password** (needs Resend in production).
- Custom domain: Vercel → Project → Domains.
