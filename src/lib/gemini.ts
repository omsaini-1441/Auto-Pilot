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
  const modelId = process.env.GEMINI_MODEL || "gemini-2.0-flash";

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
