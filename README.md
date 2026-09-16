# Outreach

Mobile-first solo job outreach tool: capture hiring signal → dump contacts → rich-text drafts → copy into Gmail.

## Quick start

```bash
npm install
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Default password: `outreach` (from `.env` `SOLO_PASSWORD`).

## Setup Gemini extract

1. Create an API key in [Google AI Studio](https://aistudio.google.com/apikey).
2. Put it in `.env`:

```env
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-2.0-flash
```

Without a key, you can still fill company/role/location manually.

## Flow

1. **Add job** — paste URL and/or job text → Extract with AI → confirm fields.
2. **Dump contacts** — `Name, email@x.com, Title` lines.
3. **Generate drafts** from a rich template.
4. **Rich copy** → paste into Gmail (formatting preserved). Open Gmail compose for To/subject.

## Stack

Next.js App Router, Prisma + SQLite, TipTap, Gemini Flash.
