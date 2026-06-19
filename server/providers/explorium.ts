// Explorium provider (the engine behind "Vibe Prospecting"). Uses the Explorium
// business-data REST API filtered by NAICS category and country. Requires
// EXPLORIUM_API_KEY.
//
// Endpoint/field names follow Explorium's public business API. Depending on your
// plan the exact paths may differ slightly — they are centralized here and in
// the env vars below so they are easy to adjust.

import type { Provider, SearchParams, ProviderResult, Company } from '../types';
import { findCountry } from '../data/countries';
import { naicsTitle } from '../data/naics';

const API_BASE = process.env.EXPLORIUM_API_BASE?.trim() || 'https://api.explorium.ai/v1';

function apiKey(): string | undefined {
  return process.env.EXPLORIUM_API_KEY?.trim() || undefined;
}

function normalizeBusiness(b: any): Company {
  const data = b.data ?? b; // some endpoints nest under `data`
  return {
    id: data.business_id ?? data.id ?? data.name,
    name: data.name ?? data.business_name,
    website: data.website || data.domain,
    industry: data.naics_description || data.linkedin_industry || data.industry,
    naicsCode: data.naics ? String(data.naics) : undefined,
    naicsLabel: data.naics_description,
    description: data.business_description || data.description,
    city: data.city,
    state: data.region || data.state,
    country: data.country_name || data.country,
    countryCode: data.country_code,
    revenue: data.revenue_range || data.yearly_revenue_range,
    employeeCount: data.number_of_employees_range || data.size_range,
    foundedYear: data.founded_year ? String(data.founded_year) : undefined,
    phone: data.phone_number,
    ticker: data.ticker,
    socialMedia: {
      linkedin: data.linkedin,
      twitter: data.twitter,
      facebook: data.facebook,
    },
    source: 'explorium',
  };
}

export const exploriumProvider: Provider = {
  key: 'explorium',
  label: 'Explorium (Vibe Prospecting)',
  description: 'Licensed data: companies + prospects with emails, NAICS + country filters, firmographic stats.',
  configHint: 'Set EXPLORIUM_API_KEY in your environment.',
  isConfigured: () => !!apiKey(),

  async search(params: SearchParams): Promise<ProviderResult> {
    const key = apiKey();
    if (!key) throw new Error('Explorium provider is not configured (missing EXPLORIUM_API_KEY).');

    const country = findCountry(params.countryCode);
    const filters: Record<string, unknown> = {};
    if (country) filters.country_code = { values: [country.code] };
    if (params.naicsCode) filters.naics_category = { values: [params.naicsCode] };
    if (params.keywords) filters.business_name = { values: [params.keywords] };

    const res = await fetch(`${API_BASE}/businesses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
        api_key: key, // Explorium accepts either header depending on plan
      },
      body: JSON.stringify({
        mode: 'full',
        size: Math.min(params.limit ?? 25, 100),
        page_size: Math.min(params.limit ?? 25, 100),
        page: params.page ?? 1,
        filters,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Explorium API error ${res.status}: ${text.slice(0, 300)}`);
    }
    const json: any = await res.json();
    const rows: any[] = json.data ?? json.businesses ?? json.results ?? [];
    const companies = rows.map((r) => {
      const c = normalizeBusiness(r);
      if (!c.naicsCode && params.naicsCode) {
        c.naicsCode = params.naicsCode;
        c.naicsLabel = naicsTitle(params.naicsCode);
      }
      if (!c.countryCode && country) c.countryCode = country.code;
      return c;
    });

    return { companies, total: json.total_results ?? json.total };
  },
};
