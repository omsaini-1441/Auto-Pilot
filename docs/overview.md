# Overview

## What is this?

**Outreach** (repo: Auto-Pilot) is a **mobile-first, solo** tool for the tedious middle of cold job outreach:

1. You found a job posting somewhere.
2. You found people / emails elsewhere (Apollo, LinkedIn, etc.).
3. You still need a clean draft — on your phone — without fighting a laptop-only flow.

This app is a **draft prep machine**, not a mailer and not a job scraper.

## Problem it solves

On a laptop the loop is manageable: find job → find emails → fill a template → send from Gmail.

Away from a desk, that becomes painful: copying names, rewriting the same email, losing formatting when you paste on mobile.

Outreach keeps the loop short on a phone:

- Capture **who / where / what** is hiring (company, role, location).
- Dump **name + email** contacts you already found.
- Fill a **rich-text template**.
- **Rich-copy** into Gmail and hit Send yourself.

## Product principles

- **Mobile first** — thumb-friendly steps; PWA-ready layout.
- **You send mail** — no auto-send, no bulk cold-email infra.
- **Manual contacts** — no paid email discovery inside the app (for now).
- **AI only where it helps** — extract company / role / location from a link or text dump.
- **Formatting matters** — drafts are HTML; copy preserves bold, lists, links when pasting into Gmail.
- **Solo / free-tier friendly** — SQLite locally, personal Gmail, Gemini Flash free API for extract.

## What’s in scope (MVP)

| Area | Included |
|---|---|
| Job capture | Paste URL and/or job text → AI (or manual) company / role / location |
| Contacts | Paste dump (`Name, email, Title`) |
| Templates | Rich editor + `{{placeholders}}` |
| Drafts | Per contact, from template + job + profile |
| Handoff | Rich clipboard copy + open Gmail compose (To / subject) |
| Profile | Your name / headline / links for templates; `autofillJson` reserved for a future browser extension |
| Auth | Simple solo password gate |

## What’s out of scope (for now)

- Scraping LinkedIn (or any site) at scale
- Built-in Apollo / Hunter-style email finding
- Sending email from the app (SMTP, Gmail API send, Resend, etc.)
- Multi-user SaaS / teams
- Chrome autofill extension UI (schema is ready; product comes later)

## Success criteria

On a phone, in a couple of minutes:

**Paste job → dump a few contacts → pick template → rich copy → paste in Gmail → Send**

…without needing a laptop for the draft step.
