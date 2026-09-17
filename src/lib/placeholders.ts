export type PlaceholderContext = {
  first_name?: string;
  full_name?: string;
  email?: string;
  title?: string;
  company?: string;
  role?: string;
  location?: string;
  my_name?: string;
  my_headline?: string;
  my_linkedin?: string;
  my_portfolio?: string;
  my_phone?: string;
  my_summary?: string;
  my_skills?: string;
};

/** Map bracket labels like [person name] to context keys */
const BRACKET_ALIASES: Record<string, keyof PlaceholderContext> = {
  "person name": "full_name",
  "full name": "full_name",
  name: "full_name",
  "first name": "first_name",
  "company name": "company",
  company: "company",
  role: "role",
  "job role": "role",
  location: "location",
  title: "title",
  email: "email",
  "my name": "my_name",
  "my headline": "my_headline",
  "my linkedin": "my_linkedin",
  "my portfolio": "my_portfolio",
  "my phone": "my_phone",
  "my summary": "my_summary",
  "my skills": "my_skills",
};

function fillBrackets(html: string, ctx: PlaceholderContext): string {
  return html.replace(/\[([^\]]+)\]/g, (match, raw: string) => {
    const key = BRACKET_ALIASES[raw.trim().toLowerCase()];
    if (!key) return match;
    const val = ctx[key];
    return val != null && String(val).trim() ? String(val) : match;
  });
}

/** {{token}} replace + [person name] / [company name] brackets. */
export function fillPlaceholders(html: string, ctx: PlaceholderContext): string {
  let out = html;

  // Conditional blocks: {{#key}}...{{/key}}
  out = out.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, key: string, inner: string) => {
    const val = ctx[key as keyof PlaceholderContext];
    if (val && String(val).trim()) {
      return fillPlaceholders(inner, ctx);
    }
    return "";
  });

  out = out.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const val = ctx[key as keyof PlaceholderContext];
    return val != null ? String(val) : "";
  });

  out = fillBrackets(out, ctx);
  return out;
}

export function htmlToPlain(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

export const PLACEHOLDER_HELP = [
  "[person name]",
  "[company name]",
  "[role]",
  "[location]",
  "[title]",
  "[my name]",
  "[my headline]",
  "{{first_name}}",
  "{{company}}",
  "{{role}}",
  "{{#location}} … {{/location}}",
];
