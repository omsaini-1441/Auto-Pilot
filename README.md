# Outreach

Mobile-first solo job outreach tool: capture hiring signal → dump contacts → rich-text drafts → copy into Gmail.

## Docs

Full write-ups live in **[docs/](./docs/README.md)**:

- [Overview](./docs/overview.md) — what & why
- [Tech stack](./docs/tech-stack.md) — Next.js, Prisma, TipTap, Gemini
- [Workflow](./docs/workflow.md) — job → contacts → draft → Gmail
- [Apollo](./docs/apollo.md) — account rotate + people search redirect
- [Deploy to Vercel](./docs/deploy-vercel.md) — Neon Postgres + env vars
- [Setup](./docs/setup.md) — install & env
- [Data model](./docs/data-model.md) — entities & APIs

## Quick start

Uses **Postgres** (Neon free tier is fine). Set `DATABASE_URL` in `.env`, then:

```bash
npm install
npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Create an account at `/signup` (email + password, min 12 characters).

## Deploy

See **[docs/deploy-vercel.md](./docs/deploy-vercel.md)** for the full Vercel + Neon checklist.

## Setup Gemini extract

1. Create an API key in [Google AI Studio](https://aistudio.google.com/apikey).
2. Put it in `.env`:

```env
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-3.5-flash-lite
```

Without a key, you can still fill company/role/location manually.

## Flow

1. **Add job** — paste URL and/or job text → Extract with AI → confirm fields.
2. **Dump contacts** — `Name, email@x.com, Title` lines.
3. **Generate drafts** from a rich template.
4. **Rich copy** → paste into Gmail (formatting preserved). Open Gmail compose for To/subject.

## Stack

Next.js App Router, Prisma + SQLite, TipTap, Gemini Flash.
