// ISO 3166-1 alpha-2 country list used for the country picker and provider
// query mapping. `dnbSlug` is the path segment D&B uses in business-directory
// URLs (lowercased country, a handful differ from the ISO code).

export interface Country {
  code: string; // ISO alpha-2
  name: string;
  dnbSlug: string; // segment used in dnb.com business-directory paths
}

export const COUNTRIES: Country[] = [
  { code: 'US', name: 'United States', dnbSlug: 'us' },
  { code: 'CA', name: 'Canada', dnbSlug: 'ca' },
  { code: 'GB', name: 'United Kingdom', dnbSlug: 'gb' },
  { code: 'IE', name: 'Ireland', dnbSlug: 'ie' },
  { code: 'AU', name: 'Australia', dnbSlug: 'au' },
  { code: 'NZ', name: 'New Zealand', dnbSlug: 'nz' },
  { code: 'DE', name: 'Germany', dnbSlug: 'de' },
  { code: 'FR', name: 'France', dnbSlug: 'fr' },
  { code: 'ES', name: 'Spain', dnbSlug: 'es' },
  { code: 'IT', name: 'Italy', dnbSlug: 'it' },
  { code: 'NL', name: 'Netherlands', dnbSlug: 'nl' },
  { code: 'BE', name: 'Belgium', dnbSlug: 'be' },
  { code: 'CH', name: 'Switzerland', dnbSlug: 'ch' },
  { code: 'AT', name: 'Austria', dnbSlug: 'at' },
  { code: 'SE', name: 'Sweden', dnbSlug: 'se' },
  { code: 'NO', name: 'Norway', dnbSlug: 'no' },
  { code: 'DK', name: 'Denmark', dnbSlug: 'dk' },
  { code: 'FI', name: 'Finland', dnbSlug: 'fi' },
  { code: 'PT', name: 'Portugal', dnbSlug: 'pt' },
  { code: 'PL', name: 'Poland', dnbSlug: 'pl' },
  { code: 'IN', name: 'India', dnbSlug: 'in' },
  { code: 'SG', name: 'Singapore', dnbSlug: 'sg' },
  { code: 'JP', name: 'Japan', dnbSlug: 'jp' },
  { code: 'CN', name: 'China', dnbSlug: 'cn' },
  { code: 'HK', name: 'Hong Kong', dnbSlug: 'hk' },
  { code: 'AE', name: 'United Arab Emirates', dnbSlug: 'ae' },
  { code: 'ZA', name: 'South Africa', dnbSlug: 'za' },
  { code: 'BR', name: 'Brazil', dnbSlug: 'br' },
  { code: 'MX', name: 'Mexico', dnbSlug: 'mx' },
  { code: 'AR', name: 'Argentina', dnbSlug: 'ar' },
];

const BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]));

export function findCountry(code?: string): Country | undefined {
  if (!code) return undefined;
  return BY_CODE.get(code.toUpperCase());
}
