# Data model

High-level map of what the app stores. Source of truth: `prisma/schema.prisma`.

## Entity diagram

```text
User
 ├── Profile          (1:1)   your details + autofillJson
 ├── Template[]               rich HTML email templates
 └── Job[]
      ├── Contact[]          people to email for this job
      └── Draft[]            rendered subject/body per contact
           └── links Template (optional)
```

## Entities

### User
Solo account. Seeded on first run (`solo@local`) with password hash from `SOLO_PASSWORD`.

### Profile
Fields used in templates as `{{my_*}}`:

- `fullName`, `headline`, `linkedIn`, `portfolio`, `phone`, `summary`, `skills`
- `autofillJson` — reserved blob for a future form-autofill browser extension (same DB, separate UI later)

### Job
Hiring signal:

- `sourceUrl`, `sourceText` — what you pasted
- `company`, `role`, `location`, `notes`
- `status` — e.g. `researching` | `drafting` | `outreached`
- `extractMeta` — JSON notes from AI extract

### Contact
Someone to reach for a job:

- `name`, `email`, `title`

### Template
Reusable outreach email:

- `name`, `subject` (can include placeholders)
- `bodyHtml` — TipTap HTML with `{{placeholders}}`
- `isDefault` — preferred when generating drafts

### Draft
Filled email ready to hand off:

- `subject`, `bodyHtml`, `bodyPlain`
- `status` — e.g. `ready` | `copied` | `opened` | `sent_manual`
- Linked to `job`, `contact`, and optionally `template`

## Placeholder tokens

Common tokens the fill engine understands:

```text
{{first_name}} {{full_name}} {{email}} {{title}}
{{company}} {{role}} {{location}}
{{my_name}} {{my_headline}} {{my_linkedin}} {{my_portfolio}}
{{my_phone}} {{my_summary}} {{my_skills}}
```

Optional block (omitted when empty):

```text
{{#location}} in {{location}}{{/location}}
```

## API surface (brief)

| Route | Role |
|---|---|
| `POST /api/auth` | Login / logout |
| `GET/PUT /api/profile` | Profile CRUD |
| `POST /api/extract` | Gemini job extract |
| `GET/POST /api/jobs` | List / create jobs |
| `GET/PATCH/DELETE /api/jobs/[id]` | Job detail |
| `POST /api/jobs/[id]/contacts` | Contact dump |
| `POST /api/jobs/[id]/drafts` | Generate drafts |
| `PATCH /api/drafts/[id]` | Update draft status |
| `GET/POST /api/templates` | Templates |
| `PATCH/DELETE /api/templates/[id]` | Edit template |
