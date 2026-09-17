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
| `AUTH_SECRET` | **Required.** ≥32 random chars. Generate: `openssl rand -base64 48` |
| `SOLO_PASSWORD` | **Required.** ≥12 chars, not `outreach`. This is your site login. |
| `GEMINI_API_KEY` | From [Google AI Studio](https://aistudio.google.com/apikey) |
| `GEMINI_MODEL` | `gemini-3.5-flash-lite` (or whatever you use) |

### Auth hardening (already in the app)

- Production refuses weak/missing `AUTH_SECRET` or `SOLO_PASSWORD`
- Login is rate-limited (lockout after repeated failures)
- No default-password hint on the public login page
- Sessions last 7 days; cookies are `httpOnly` + `secure` in production
- All routes except `/login` require a valid session cookie

**Do not** leave `AUTH_SECRET` as anything containing `change-in-production` or `dev-secret` on Vercel.

## 5. Deploy

Click **Deploy**. The build runs:

```text
prisma generate → prisma migrate deploy → next build
```

That creates tables on Neon automatically from `prisma/migrations`.

## 6. First login

1. Open your Vercel URL (e.g. `https://auto-pilot-….vercel.app`).
2. Log in with `SOLO_PASSWORD`.
3. Fill **Profile**, add a job, test extract + drafts.

## Local development after this change

SQLite local `file:./dev.db` no longer matches the schema. Point local `.env` at the **same Neon DB** (or a Neon branch):

```env
DATABASE_URL="postgresql://…?sslmode=require"
AUTH_SECRET="…"
SOLO_PASSWORD="…"
GEMINI_API_KEY="…"
GEMINI_MODEL="gemini-3.5-flash-lite"
```

Then:

```bash
npx prisma migrate deploy
npx prisma generate
npm run dev
```

## Troubleshooting

| Issue | Fix |
|---|---|
| Build fails on `migrate deploy` | Check `DATABASE_URL` is set and Neon allows connections |
| `Unauthorized` / can’t log in | Confirm `AUTH_SECRET` + `SOLO_PASSWORD` on Vercel; redeploy after changing them |
| Gemini extract fails | Confirm `GEMINI_API_KEY` + model id still valid |
| Old local SQLite data missing | Expected — data lived in `dev.db`; start fresh on Postgres or export/import manually |

## Notes

- Keep `.env` out of git (already gitignored). Only `.env.example` is committed.
- Changing `SOLO_PASSWORD` on Vercel does **not** update an already-seeded user hash. For a fresh Neon DB that’s fine (first login seeds it). To reset password on an existing DB, wipe the `User` row or recreate the Neon database.
- Custom domain: Vercel → Project → Domains.
