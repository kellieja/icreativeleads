// Shared types for the scraper backend.
// The normalized `Company` shape is what every provider must return and what
// the frontend consumes directly.

export interface Contact {
  name: string;
  title: string;
  email?: string;
  phone?: string;
  linkedin?: string;
}

export interface SocialMedia {
  linkedin?: string;
  twitter?: string;
  facebook?: string;
}

/** A single normalized company record. Search returns partials; details fill the rest. */
export interface Company {
  /** Stable id within a provider (duns number, apollo id, slug, etc.). */
  id: string;
  name: string;
  /** Bare domain or full url, e.g. "acme.com" or "https://acme.com". */
  website?: string;
  industry?: string;
  naicsCode?: string;
  naicsLabel?: string;
  description?: string;

  city?: string;
  state?: string;
  country?: string;
  countryCode?: string;
  address?: string;
  phone?: string;

  revenue?: string;
  employeeCount?: string;
  foundedYear?: string;
  /** D&B specific identifier when available. */
  duns?: string;
  /** Stock ticker for public companies. */
  ticker?: string;

  contacts?: Contact[];
  socialMedia?: SocialMedia;

  /** Which provider produced this record. */
  source: string;
  /** Link back to the source profile page when available. */
  sourceUrl?: string;
}

export interface SearchParams {
  /** ISO Alpha-2 country code, e.g. "US". */
  countryCode?: string;
  /** NAICS code (2-6 digits). */
  naicsCode?: string;
  /** Free-text keyword / company name. */
  keywords?: string;
  /** State / region name or code (optional refinement). */
  region?: string;
  /** Max results to return. */
  limit?: number;
  /** Page (1-based) for providers that paginate. */
  page?: number;
}

export interface ProviderResult {
  companies: Company[];
  /** Total available if the provider reports it. */
  total?: number;
  /** Non-fatal warnings (e.g. partial scrape, mapping fallbacks). */
  warnings?: string[];
}

export interface Provider {
  /** Stable key used in the API, e.g. "dnb". */
  key: string;
  /** Human label for the UI. */
  label: string;
  /** Short description shown in the UI. */
  description: string;
  /** True when the provider is usable in the current environment (key present, etc.). */
  isConfigured(): boolean;
  /** Reason the provider is not configured, for surfacing to the user. */
  configHint?: string;
  /** Run a directory search. */
  search(params: SearchParams): Promise<ProviderResult>;
  /** Enrich a single company with full detail. Optional; falls back to the search record. */
  getDetails?(company: Company): Promise<Company>;
}
