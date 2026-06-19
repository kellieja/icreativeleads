// Frontend types — mirror the scraper backend's normalized shapes.

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

export interface Company {
  id: string;
  name: string;
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
  duns?: string;
  ticker?: string;

  contacts?: Contact[];
  socialMedia?: SocialMedia;

  source: string;
  sourceUrl?: string;
}

export interface SearchParams {
  provider: string;
  countryCode?: string;
  naicsCode?: string;
  keywords?: string;
  region?: string;
  limit?: number;
}

export interface ProviderMeta {
  key: string;
  label: string;
  description: string;
  configured: boolean;
  configHint?: string;
}

export interface NaicsCode {
  code: string;
  title: string;
  sector?: string;
}

export interface Meta {
  countries: { code: string; name: string }[];
  naicsSectors: { code: string; title: string }[];
  naicsCommon: NaicsCode[];
  providers: ProviderMeta[];
}

export interface SearchResponse {
  provider: string;
  companies: Company[];
  total?: number;
  warnings?: string[];
}
