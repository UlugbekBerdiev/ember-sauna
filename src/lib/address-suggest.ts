export type PostalAddress = {
  address: string;
  city: string;
  state: string;
  zip: string;
};

export type AddressSuggestion = {
  id: string;
  label: string;
};

const STATE_NAMES: Record<string, string> = {
  alabama: "AL",
  alaska: "AK",
  arizona: "AZ",
  arkansas: "AR",
  california: "CA",
  colorado: "CO",
  connecticut: "CT",
  delaware: "DE",
  "district of columbia": "DC",
  florida: "FL",
  georgia: "GA",
  hawaii: "HI",
  idaho: "ID",
  illinois: "IL",
  indiana: "IN",
  iowa: "IA",
  kansas: "KS",
  kentucky: "KY",
  louisiana: "LA",
  maine: "ME",
  maryland: "MD",
  massachusetts: "MA",
  michigan: "MI",
  minnesota: "MN",
  mississippi: "MS",
  missouri: "MO",
  montana: "MT",
  nebraska: "NE",
  nevada: "NV",
  "new hampshire": "NH",
  "new jersey": "NJ",
  "new mexico": "NM",
  "new york": "NY",
  "north carolina": "NC",
  "north dakota": "ND",
  ohio: "OH",
  oklahoma: "OK",
  oregon: "OR",
  pennsylvania: "PA",
  "rhode island": "RI",
  "south carolina": "SC",
  "south dakota": "SD",
  tennessee: "TN",
  texas: "TX",
  utah: "UT",
  vermont: "VT",
  virginia: "VA",
  washington: "WA",
  "west virginia": "WV",
  wisconsin: "WI",
  wyoming: "WY",
};

export function toStateCode(value: unknown) {
  const text = String(value ?? "").trim().toLowerCase().replace(/\./g, "");
  if (/^[a-z]{2}$/.test(text)) return text.toUpperCase();
  return STATE_NAMES[text] ?? null;
}

export function normalizeQuery(raw: string) {
  const query = raw.replace(/\s+/g, " ").trim();
  if (query.length < 3 || query.length > 80) return null;
  if ([...query].some((char) => char.charCodeAt(0) < 32)) return null;
  return query;
}

export function isMagicKey(value: string) {
  return value.length >= 8 && value.length <= 800 && /^[\w+/=-]+$/.test(value);
}

export function isCompletePostal(value: Partial<PostalAddress> | null | undefined): value is PostalAddress {
  return postalAddress(value?.address, value?.city, value?.state, value?.zip) !== null;
}

export function formatPostalAddress(value: PostalAddress) {
  return `${value.address}, ${value.city}, ${value.state} ${value.zip}`;
}

export function parseManualAddress(raw: string): PostalAddress | null {
  const text = raw.replace(/\s+/g, " ").trim().replace(/,\s*usa$/i, "");
  const match = text.match(/^(.*?)[,\s]+(\d{5}(?:-\d{4})?)$/);
  if (!match) return null;
  const parts = match[1].replace(/,\s*$/, "").split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length < 3) return null;
  const state = toStateCode(parts.pop());
  const city = parts.pop() ?? "";
  return postalAddress(parts.join(", "), city, state, match[2]);
}

export function suggestionsFromEsri(payload: unknown): AddressSuggestion[] {
  const suggestions = record(payload)?.suggestions;
  if (!Array.isArray(suggestions)) return [];
  const results: AddressSuggestion[] = [];
  for (const item of suggestions) {
    const suggestion = record(item);
    if (!suggestion || suggestion.isCollection === true) continue;
    const id = typeof suggestion.magicKey === "string" ? suggestion.magicKey : "";
    const label = typeof suggestion.text === "string" ? suggestion.text.replace(/\s+/g, " ").trim() : "";
    if (!isMagicKey(id) || label.length < 4 || label.length > 180) continue;
    results.push({ id, label });
    if (results.length === 5) break;
  }
  return results;
}

export function addressFromEsri(payload: unknown): PostalAddress | null {
  const candidates = record(payload)?.candidates;
  if (!Array.isArray(candidates)) return null;
  for (const candidate of candidates) {
    const attributes = record(record(candidate)?.attributes);
    if (!attributes) continue;
    const state = toStateCode(attributes.RegionAbbr) ?? toStateCode(attributes.Region);
    const resolved = postalAddress(attributes.StAddr, attributes.City, state, attributes.Postal);
    if (resolved) return resolved;
  }
  return null;
}

export function readSuggestions(payload: unknown): AddressSuggestion[] {
  const suggestions = record(payload)?.suggestions;
  if (!Array.isArray(suggestions)) return [];
  const results: AddressSuggestion[] = [];
  for (const item of suggestions) {
    const suggestion = record(item);
    if (!suggestion) continue;
    const id = typeof suggestion.id === "string" ? suggestion.id : "";
    const label = typeof suggestion.label === "string" ? suggestion.label : "";
    if (!isMagicKey(id) || label.length < 4 || label.length > 180) continue;
    results.push({ id, label });
  }
  return results;
}

export function readResolvedAddress(payload: unknown) {
  const body = record(payload);
  if (!body) return null;
  return postalAddress(body.address, body.city, body.state, body.zip);
}

function postalAddress(address: unknown, city: unknown, state: unknown, zip: unknown): PostalAddress | null {
  const street = clean(address, 120);
  const place = clean(city, 60);
  const region = toStateCode(state);
  const postal = postalCode(zip);
  if (!street || street.length < 4 || !place || place.length < 2 || !region || !postal) return null;
  if (!/[A-Za-z0-9]/.test(street) || !/^[A-Za-z][A-Za-z .'-]*$/.test(place)) return null;
  return { address: street, city: place, state: region, zip: postal };
}

function postalCode(value: unknown) {
  const match = String(value ?? "").trim().match(/^(\d{5})(?:-?(\d{4}))?$/);
  if (!match) return null;
  return match[2] ? `${match[1]}-${match[2]}` : match[1];
}

function clean(value: unknown, max: number) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!text || text.length > max) return null;
  return text;
}

function record(value: unknown) {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}
