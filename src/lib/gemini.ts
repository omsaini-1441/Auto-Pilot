import { GoogleGenerativeAI } from "@google/generative-ai";

export type JobExtract = {
  company: string;
  role: string;
  location: string;
  confidence: "high" | "medium" | "low";
  notes: string;
};

async function fetchPageText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; OutreachBot/1.0; +https://localhost)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 0 },
    });
    if (!res.ok) return "";
    const html = await res.text();
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "";
    const ogTitle =
      html.match(/property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1] ??
      html.match(/content=["']([^"']+)["'][^>]*property=["']og:title["']/i)?.[1] ??
      "";
    const ogDesc =
      html.match(/property=["']og:description["'][^>]*content=["']([^"']+)["']/i)?.[1] ??
      "";
    const stripped = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 6000);
    return [`URL: ${url}`, `Title: ${title}`, `OG: ${ogTitle}`, `Desc: ${ogDesc}`, stripped]
      .filter(Boolean)
      .join("\n");
  } catch {
    return "";
  }
}

export async function extractJobDetails(input: {
  sourceUrl?: string;
  sourceText?: string;
}): Promise<JobExtract & { fetchedSnippet: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelId = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

  let fetchedSnippet = "";
  if (input.sourceUrl?.trim()) {
    fetchedSnippet = await fetchPageText(input.sourceUrl.trim());
  }

  const blob = [
    input.sourceUrl ? `Source URL: ${input.sourceUrl}` : "",
    input.sourceText ? `Pasted text:\n${input.sourceText}` : "",
    fetchedSnippet ? `Fetched page content:\n${fetchedSnippet}` : "",
  ]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 12000);

  if (!blob.trim()) {
    return {
      company: "",
      role: "",
      location: "",
      confidence: "low",
      notes: "No URL or text provided.",
      fetchedSnippet: "",
    };
  }

  if (!apiKey) {
    // Heuristic fallback without AI
    const companyGuess =
      input.sourceUrl?.match(/(?:\/\/|www\.)([^./]+)\./)?.[1]?.replace(/-/g, " ") ?? "";
    return {
      company: companyGuess ? capitalize(companyGuess) : "",
      role: "",
      location: "",
      confidence: "low",
      notes: "GEMINI_API_KEY missing — fill fields manually or add a key.",
      fetchedSnippet,
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelId,
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt = `Extract hiring details from the job posting material below.
Return ONLY JSON with keys:
company (string), role (string), location (string), confidence ("high"|"medium"|"low"), notes (string, brief).
If unknown, use empty string for that field. Location can be Remote / city / country.
Material:
---
${blob}
---`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text) as Partial<JobExtract>;
    return {
      company: String(parsed.company ?? ""),
      role: String(parsed.role ?? ""),
      location: String(parsed.location ?? ""),
      confidence: (parsed.confidence as JobExtract["confidence"]) || "medium",
      notes: String(parsed.notes ?? ""),
      fetchedSnippet,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Extract failed";
    return {
      company: "",
      role: "",
      location: "",
      confidence: "low",
      notes: message,
      fetchedSnippet,
    };
  }
}

function capitalize(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

export type GeneratedTemplate = {
  name: string;
  subject: string;
  bodyHtml: string;
  notes: string;
};

/** AI cold-email template using [person name] / [company name] markers. */
export async function generateOutreachTemplate(input: {
  company?: string;
  role?: string;
  location?: string;
  notes?: string;
  myName?: string;
  myHeadline?: string;
  tone?: string;
}): Promise<GeneratedTemplate> {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelId = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

  if (!apiKey) {
    return {
      name: "AI draft (manual fallback)",
      subject: "Quick note — [role] at [company name]",
      bodyHtml: `<p>Hi [person name],</p>
<p>I saw that <strong>[company name]</strong> is hiring for <strong>[role]</strong>.</p>
<p>I'm [my name] — I'd love to briefly connect about the role.</p>
<p>Would you be open to a short chat?</p>
<p>Thanks,<br/>[my name]</p>`,
      notes: "GEMINI_API_KEY missing — saved a starter template you can edit.",
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelId,
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt = `Write a short cold outreach email TEMPLATE for a job seeker.
Return ONLY JSON: { "name": string, "subject": string, "bodyHtml": string, "notes": string }.

Rules:
- Keep it human, concise (120-180 words max body), no spammy hype.
- Use EXACT placeholders in square brackets where personalization goes:
  [person name], [company name], [role], [location], [my name], [my headline]
- bodyHtml must be simple HTML: <p>, <strong>, <br/> only. No markdown.
- subject can also use those brackets.
- Do NOT invent real person names; always use brackets.
- Tone: ${input.tone || "professional warm"}.
Context:
company=${input.company || ""}
role=${input.role || ""}
location=${input.location || ""}
notes=${input.notes || ""}
sender_name=${input.myName || "[my name]"}
sender_headline=${input.myHeadline || ""}`;

  try {
    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text()) as Partial<GeneratedTemplate>;
    return {
      name: String(parsed.name || "AI cold intro"),
      subject: String(parsed.subject || "Quick note — [role] at [company name]"),
      bodyHtml: String(parsed.bodyHtml || "<p>Hi [person name],</p><p></p><p>[my name]</p>"),
      notes: String(parsed.notes || ""),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI generate failed";
    return {
      name: "AI draft (failed)",
      subject: "Quick note — [role] at [company name]",
      bodyHtml: `<p>Hi [person name],</p><p>I noticed [company name] is hiring for [role].</p><p>Best,<br/>[my name]</p>`,
      notes: message,
    };
  }
}
