// Deterministic demo provider. Requires no API key or network access so the app
// is fully functional out of the box. Data is synthetic but shaped exactly like
// real provider output, which keeps the UI and export paths exercised.

import type { Provider, SearchParams, ProviderResult, Company } from '../types';
import { findCountry } from '../data/countries';
import { naicsTitle, sectorForCode } from '../data/naics';

const SUFFIXES = ['Holdings', 'Group', 'Industries', 'Solutions', 'Systems', 'Partners', 'Labs', 'Global', 'Technologies', 'Corp'];
const ROOTS = ['Apex', 'Vertex', 'Northwind', 'Blue Harbor', 'Stonebridge', 'Cobalt', 'Meridian', 'Summit', 'Ironclad', 'Brightwave', 'Cedar', 'Quanta', 'Riverstone', 'Lumen', 'Pinnacle'];
const FIRST = ['James', 'Maria', 'David', 'Sarah', 'Michael', 'Linda', 'Robert', 'Emily', 'Daniel', 'Aisha'];
const LAST = ['Carter', 'Nguyen', 'Patel', 'Johnson', 'Garcia', 'Müller', 'Rossi', 'Kim', 'Okafor', 'Andersson'];
const TITLES = ['Chief Executive Officer', 'Chief Financial Officer', 'VP of Sales', 'Head of Marketing', 'Chief Technology Officer'];

// Simple deterministic PRNG so the same query yields the same companies.
function seeded(seedStr: string) {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

const CITIES: Record<string, [string, string][]> = {
  US: [['San Francisco', 'CA'], ['Austin', 'TX'], ['Chicago', 'IL'], ['Boston', 'MA'], ['Denver', 'CO']],
  GB: [['London', 'England'], ['Manchester', 'England'], ['Edinburgh', 'Scotland']],
  DE: [['Berlin', 'Berlin'], ['Munich', 'Bavaria'], ['Hamburg', 'Hamburg']],
};

function buildCompany(rng: () => number, params: SearchParams, i: number): Company {
  const country = findCountry(params.countryCode);
  const cities = CITIES[country?.code ?? 'US'] ?? [['Metro City', 'Region']];
  const [city, state] = pick(rng, cities);
  const name = `${pick(rng, ROOTS)} ${pick(rng, SUFFIXES)}`;
  const domain = name.toLowerCase().replace(/[^a-z]+/g, '') + '.com';
  const industry = (params.naicsCode && naicsTitle(params.naicsCode)) ||
    (params.naicsCode && sectorForCode(params.naicsCode)?.title) || 'Diversified Business';
  const empBuckets = ['11-50', '51-200', '201-500', '501-1,000', '1,001-5,000'];
  const revBuckets = ['$1M-$10M', '$10M-$50M', '$50M-$100M', '$100M-$500M'];

  const contacts = Array.from({ length: 3 }).map((_, c) => {
    const fn = pick(rng, FIRST);
    const ln = pick(rng, LAST);
    return {
      name: `${fn} ${ln}`,
      title: TITLES[c % TITLES.length],
      email: `${fn[0].toLowerCase()}.${ln.toLowerCase().replace(/[^a-z]/g, '')}@${domain}`,
    };
  });

  return {
    id: `demo-${params.naicsCode ?? 'any'}-${params.countryCode ?? 'xx'}-${i}`,
    name,
    website: domain,
    industry,
    naicsCode: params.naicsCode,
    naicsLabel: typeof industry === 'string' ? industry : undefined,
    description: `${name} is a ${industry.toLowerCase()} company headquartered in ${city}. (Demo data — connect a real provider for live records.)`,
    city,
    state,
    country: country?.name ?? 'United States',
    countryCode: country?.code ?? 'US',
    phone: `+1 (${200 + Math.floor(rng() * 700)}) 555-${1000 + Math.floor(rng() * 8999)}`,
    revenue: pick(rng, revBuckets),
    employeeCount: pick(rng, empBuckets),
    foundedYear: String(1980 + Math.floor(rng() * 44)),
    contacts,
    socialMedia: { linkedin: `https://www.linkedin.com/company/${domain.replace('.com', '')}` },
    source: 'demo',
  };
}

export const demoProvider: Provider = {
  key: 'demo',
  label: 'Demo (synthetic)',
  description: 'Key-free synthetic data shaped like real records. Great for trying the UI and export.',
  isConfigured: () => true,
  async search(params: SearchParams): Promise<ProviderResult> {
    const limit = Math.min(params.limit ?? 25, 100);
    const rng = seeded(`${params.countryCode}|${params.naicsCode}|${params.keywords}|${params.page ?? 1}`);
    const companies = Array.from({ length: limit }).map((_, i) => buildCompany(rng, params, i));
    return { companies, total: limit, warnings: ['Demo provider: data is synthetic.'] };
  },
  async getDetails(company: Company): Promise<Company> {
    return company; // demo records are already complete
  },
};
