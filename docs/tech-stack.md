# Tech stack

## At a glance

| Layer | Choice | Role |
|---|---|---|
| App framework | **Next.js** (App Router) | UI + API routes in one codebase |
| Language | **TypeScript** | Type-safe app and APIs |
| Styling | **Tailwind CSS** | Mobile-friendly layout and theming |
| Database | **SQLite** via **Prisma** | Local solo store; easy to swap to Postgres later |
| Auth | Cookie session (**jose** + **bcryptjs**) | Solo password; no OAuth required for MVP |
| Rich text | **TipTap** | HTML email templates (bold, lists, links, …) |
| AI extract | **Google Gemini** (`@google/generative-ai`) | Structured company / role / location from URL or text |
| Mail handoff | Clipboard + Gmail compose URL | You send from personal Gmail |

## Why these choices

### Next.js App Router
One project for pages and `/api/*` routes. Good enough for a personal tool and for a future Vercel deploy. Mobile web + PWA manifest without a separate native app.

### Prisma + SQLite
Zero cloud DB setup to get rolling. Schema already models User, Profile, Job, Contact, Template, Draft. `DATABASE_URL` can move to Postgres when you outgrow a local file.

### TipTap
Templates must be **HTML**, not plain text, so rich copy into Gmail keeps formatting. TipTap gives a small mobile-usable editor (bold, italic, underline, lists, links).

### Gemini (Flash by default)
Only AI feature in MVP: turn a job link / paste into structured fields. Flash is cheap / free-tier friendly for tiny JSON extracts. Model id is env-configurable (`GEMINI_MODEL`) so you can point at Pro if your API access allows it.

**Note:** A consumer “Gemini Pro” chat subscription is not the same as Developer API quota. The app uses an **AI Studio API key**.

### Solo password auth
For one user, magic-link / Google OAuth is overkill. A hashed password in SQLite + signed HTTP-only cookie is enough. Change `SOLO_PASSWORD` and `AUTH_SECRET` in `.env`.

## Main folders

```
src/
  app/           # Pages + API routes
    api/         # auth, jobs, extract, templates, drafts, profile
    jobs/        # Add job + job workspace (contacts → drafts)
    templates/   # Rich template editor
    profile/     # Your details for {{my_*}} placeholders
  components/    # Nav, TipTap editor
  lib/           # db, auth, gemini, placeholders, clipboard, gmail helpers
prisma/          # Schema + migrations
docs/            # You are here
```

## Env vars (summary)

See [Setup](./setup.md) for full detail.

- `DATABASE_URL` — SQLite file path
- `AUTH_SECRET` — session signing
- `SOLO_PASSWORD` — login password
- `GEMINI_API_KEY` — optional; without it, fill job fields manually
- `GEMINI_MODEL` — e.g. `gemini-2.0-flash`

## Intentional non-choices

| Not using (MVP) | Why |
|---|---|
| Gmail API send | Complexity + still capped by Gmail; manual Send is fine |
| Resend / SendGrid | Wrong trust model for cold intros from an app domain |
| LinkedIn scrapers | Brittle, ToS risk; paste + AI is enough |
| Postgres / Neon | Optional later; SQLite is fine solo |
