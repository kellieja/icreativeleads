// Apollo.io provider. Uses the Organization Search REST API, filtered by NAICS
// code and HQ location. Requires APOLLO_API_KEY.
//
// Docs: https://docs.apollo.io/reference/organization-search
// Note: contact/people enrichment in Apollo consumes credits and uses a
// separate endpoint; this provider returns firmographics + any executives that
// come back on the organization record.

import type { Provider, SearchParams, ProviderResult, Company } from '../types';
import { findCountry } from '../data/countries';
import { naicsTitle } from '../data/naics';

const API_BASE = 'https://api.apollo.io/api/v1';

function apiKey(): string | undefined {
  return process.env.APOLLO_API_KEY?.trim() || undefined;
}

function normalizeOrg(org: any): Company {
  return {
    id: org.id ?? org.organization_id ?? org.website_url ?? org.name,
    name: org.name,
    website: org.website_url || org.primary_domain,
    industry: org.industry,
    description: org.short_description || org.seo_description,
    city: org.city,
    state: org.state,
    country: org.country,
    phone: org.phone || org.sanitized_phone,
    revenue: org.annual_revenue_printed || (org.annual_revenue ? `$${org.annual_revenue}` : undefined),
    employeeCount: org.estimated_num_employees ? String(org.estimated_num_employees) : undefined,
    foundedYear: org.founded_year ? String(org.founded_year) : undefined,
    ticker: org.publicly_traded_symbol,
    socialMedia: {
      linkedin: org.linkedin_url,
      twitter: org.twitter_url,
      facebook: org.facebook_url,
    },
    source: 'apollo',
    sourceUrl: org.linkedin_url,
  };
}

export const apolloProvider: Provider = {
  key: 'apollo',
  label: 'Apollo.io',
  description: 'Licensed B2B database. NAICS + country filters; firmographics, revenue, headcount.',
  configHint: 'Set APOLLO_API_KEY in your environment (Apollo paid plan required for the search API).',
  isConfigured: () => !!apiKey(),

  async search(params: SearchParams): Promise<ProviderResult> {
    const key = apiKey();
    if (!key) throw new Error('Apollo provider is not configured (missing APOLLO_API_KEY).');

    const country = findCountry(params.countryCode);
    const body: Record<string, unknown> = {
      page: params.page ?? 1,
      per_page: Math.min(params.limit ?? 25, 100),
    };
    if (params.naicsCode) body.organization_naics_codes = [params.naicsCode];
    if (country) body.organization_locations = [country.name];
    if (params.keywords) body.q_organization_name = params.keywords;

    const res = await fetch(`${API_BASE}/mixed_companies/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'x-api-key': key,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Apollo API error ${res.status}: ${text.slice(0, 300)}`);
    }
    const data: any = await res.json();
    const orgs: any[] = data.organizations ?? data.accounts ?? [];
    const companies = orgs.map((o) => {
      const c = normalizeOrg(o);
      if (!c.naicsCode && params.naicsCode) {
        c.naicsCode = params.naicsCode;
        c.naicsLabel = naicsTitle(params.naicsCode);
      }
      if (country) c.countryCode = country.code;
      return c;
    });

    return {
      companies,
      total: data.pagination?.total_entries,
    };
  },
};
