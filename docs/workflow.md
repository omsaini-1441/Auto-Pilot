# Workflow

How you actually use the app, step by step.

## Big picture

```text
Find job elsewhere          Find people elsewhere
        │                            │
        ▼                            ▼
 ┌──────────────┐            ┌──────────────┐
 │  Add job     │            │ Dump emails  │
 │  (link/text) │            │  into job    │
 └──────┬───────┘            └──────┬───────┘
        │                           │
        └─────────────┬─────────────┘
                      ▼
              ┌───────────────┐
              │ Pick template │
              │ Generate      │
              │ drafts        │
              └───────┬───────┘
                      ▼
              ┌───────────────┐
              │ Rich copy +   │
              │ open Gmail    │
              │ → you Send    │
              └───────────────┘
```

Email **finding** and email **sending** stay outside the app on purpose.

---

## 0. One-time setup

1. Fill **Profile** (name, headline, links) — used as `{{my_name}}`, `{{my_headline}}`, etc.
2. Edit the default **Template** (or create your own) with placeholders.
3. Add `GEMINI_API_KEY` if you want AI extract (optional).

---

## 1. Capture the hiring signal

**Screen:** Add job

1. Paste a **job URL** and/or a **text dump** (LinkedIn post text, careers page copy, etc.).
2. Tap **Extract with AI**.
   - App may try to fetch the URL for title/meta/text.
   - If the site blocks fetch (common on LinkedIn), the pasted text is enough.
3. Confirm or edit **Company**, **Role**, **Location**.
4. Save.

**Outcome:** A Job record you can attach people to.

---

## 2. Dump contacts

**Screen:** Job workspace → “Dump contacts”

Paste one person per line, for example:

```text
Jane Doe, jane@acme.com, Recruiter
Sam Lee <sam@acme.com>
hiring@startup.io
```

Supported shapes: CSV-ish commas, tabs, `Name <email>`, email-only.

Select who should get a draft (checkboxes).

---

## 3. Generate drafts

1. Choose a **template**.
2. Tap **Create drafts**.

The engine fills placeholders from:

| Source | Examples |
|---|---|
| Contact | `{{first_name}}`, `{{full_name}}`, `{{email}}`, `{{title}}` |
| Job | `{{company}}`, `{{role}}`, `{{location}}` |
| Profile | `{{my_name}}`, `{{my_headline}}`, `{{my_linkedin}}`, … |

Conditional blocks like `{{#location}} in {{location}}{{/location}}` drop out when location is empty.

**Outcome:** One HTML draft per selected contact.

---

## 4. Hand off to Gmail

For each draft:

1. **Copy subject** (optional).
2. **Rich copy** — puts HTML + plain text on the clipboard.
3. **Open Gmail compose** — prefills To + subject (body via paste; URL bodies can’t carry reliable HTML).
4. Paste the body in Gmail → check formatting → **Send**.
5. Optionally **Mark sent manually** so the job moves toward “outreached”.

### Why rich copy is the primary path

`mailto:` and Gmail compose URLs strip formatting. On mobile, a shallow text copy also loses bold/lists. HTML clipboard + paste is what keeps the email looking intentional.

---

## Suggested daily loop (phone)

1. Save interesting posts as you see them (paste URL/text when you have a minute).
2. When you have emails from Apollo / elsewhere, dump them onto the matching job.
3. Batch-generate drafts, rich-copy, send from Gmail between meetings.

---

## Status meanings (lightweight)

Jobs / drafts use simple status strings so you know what you already touched:

| Area | Examples |
|---|---|
| Job | `researching` → `drafting` → `outreached` |
| Draft | `ready` → `copied` / `opened` → `sent_manual` |

These are tracking helpers, not a full CRM.
