# Apollo notes

## Do we use the Apollo API?

**Not in this MVP.** Reasons:

- **People search API** can be free (0 credits) on eligible accounts, but it **does not return emails**.
- **Emails need enrichment**, which **spends credits** — not free for rotating cold outreach.

So we use a **browser redirect** to Apollo people search (new tab), plus an **account switcher** so you remember which free login to use.

## What the app does

1. **Apollo** tab — save multiple accounts (label + login hint), mark one **active**.
2. On a **job** — **Open Apollo search** opens people search filtered by company name.
3. Toast reminds you which Apollo account to be logged into.
4. Dump emails back into the job when you have them.

## Later (optional)

If you get API keys and paid/credit headroom, we can add enrichment. Until then, redirect + rotate accounts is the free path.
