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

/** Simple {{token}} replace. Also strips {{#location}}...{{/location}} blocks when empty. */
export function fillPlaceholders(html: string, ctx: PlaceholderContext): string {
  let out = html;

  // Conditional blocks: {{#key}}...{{/key}}
  out = out.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, key: string, inner: string) => {
    const val = ctx[key as keyof PlaceholderContext];
    if (val && String(val).trim()) return inner.replace(/\{\{(\w+)\}\}/g, (__, k) => String(ctx[k as keyof PlaceholderContext] ?? ""));
    return "";
  });

  out = out.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const val = ctx[key as keyof PlaceholderContext];
    return val != null ? String(val) : "";
  });

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
  "{{first_name}}",
  "{{full_name}}",
  "{{email}}",
  "{{title}}",
  "{{company}}",
  "{{role}}",
  "{{location}}",
  "{{my_name}}",
  "{{my_headline}}",
  "{{my_linkedin}}",
  "{{my_portfolio}}",
  "{{my_phone}}",
  "{{my_summary}}",
  "{{my_skills}}",
  "{{#location}} … {{/location}}",
];
