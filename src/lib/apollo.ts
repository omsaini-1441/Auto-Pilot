/** Open Apollo people search for a company (browser redirect — no API). */
export function apolloPeopleSearchUrl(company: string): string {
  const q = company.trim();
  const params = new URLSearchParams();
  if (q) {
    // Apollo accepts organization name filter via hash route query-ish params
    params.set("qOrganizationName", q);
  }
  const qs = params.toString();
  return `https://app.apollo.io/#/people${qs ? `?${qs}` : ""}`;
}

export function apolloHomeUrl(): string {
  return "https://app.apollo.io/#/people";
}
