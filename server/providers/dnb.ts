// Dun & Bradstreet (dnb.com) business-directory scraper.
//
// IMPORTANT / READ ME:
//  - dnb.com sits behind enterprise bot protection and returns HTTP 403 to
//    plain datacenter requests. Scraping it also runs against D&B's Terms of
//    Service (their directory data is a licensed product).
//  - To have any chance of working in production you must route requests through
//    a rendering/anti-bot gateway (ScrapingBee, ScraperAPI, Bright Data, Zyte,
//    etc.). Configure DNB_SCRAPER_GATEWAY for that. Without it, this provider
//    will almost always fail with 403 — by design, not a bug.
//  - Prefer the licensed `apollo` / `explorium` providers for reliable data.
//
// This module is intentionally defensive: D&B markup changes and varies by
// page, so parsing uses multiple selector fallbacks and reports warnings rather
// than throwing on partial extraction.

import * as cheerio from 'cheerio';
import type { Provider, SearchParams, ProviderResult, Company } from '../types';
import { findCountry } from '../data/countries';
import { sectorForCode, naicsTitle } from '../data/naics';

const BASE = 'https://www.dnb.com/business-directory';

const DEFAULT_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

/**
 * Wrap a target URL in the configured anti-bot gateway, if any.
 * DNB_SCRAPER_GATEWAY may contain a `{url}` placeholder (URL-encoded target is
 * substituted). If it ends with `=` we append the encoded URL. Otherwise the
 * target is used directly (no gateway).
 */
function gatewayUrl(target: string): string {
  const gw = process.env.DNB_SCRAPER_GATEWAY?.trim();
  if (!gw) return target;
  if (gw.includes('{url}')) return gw.replace('{url}', encodeURIComponent(target));
  if (gw.endsWith('=')) return gw + encodeURIComponent(target);
  return gw + target;
}

async function fetchHtml(target: string): Promise<{ html: string; status: number }> {
  const res = await fetch(gatewayUrl(target), {
    headers: {
      'User-Agent': process.env.DNB_USER_AGENT?.trim() || DEFAULT_UA,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    redirect: 'follow',
  });
  const html = await res.text();
  return { html, status: res.status };
}

/** Build the directory listing URL for a NAICS sector + country (+ optional region). */
function listingUrl(params: SearchParams): { url: string; warnings: string[] } {
  const warnings: string[] = [];
  const country = findCountry(params.countryCode);
  const slug = country?.dnbSlug ?? 'us';
  if (!country) warnings.push(`Unknown country "${params.countryCode}", defaulting to US.`);

  let industrySlug = 'all-industries';
  if (params.naicsCode) {
    const sector = sectorForCode(params.naicsCode);
    if (sector) {
      industrySlug = sector.dnbSlug;
      if (params.naicsCode.length > 2) {
        warnings.push(
          `D&B directory browses by 2-digit sector; using "${sector.title}" for NAICS ${params.naicsCode}.`,
        );
      }
    } else {
      warnings.push(`No D&B industry mapping for NAICS ${params.naicsCode}; browsing all industries.`);
    }
  }

  const region = params.region ? `.${params.region.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : '';
  const url = `${BASE}/company-information.${industrySlug}.${slug}${region}.html`;
  return { url, warnings };
}

function cleanText(s: string | undefined): string | undefined {
  const t = s?.replace(/\s+/g, ' ').trim();
  return t || undefined;
}

/** Parse a D&B listing page into company stubs. */
function parseListing(html: string, sourceUrl: string): Company[] {
  const $ = cheerio.load(html);
  const companies: Company[] = [];
  const seen = new Set<string>();

  // D&B company links point at company-profiles pages. Anchor with this href is
  // the most stable hook across their layout variants.
  $('a[href*="company-profiles"]').each((_, el) => {
    const $a = $(el);
    const href = $a.attr('href') || '';
    const name = cleanText($a.text());
    if (!name || name.length < 2) return;
    const abs = href.startsWith('http') ? href : `https://www.dnb.com${href.startsWith('/') ? '' : '/'}${href}`;
    if (seen.has(abs)) return;
    seen.add(abs);

    // The card/row containing the link often holds location + revenue metadata.
    const $card = $a.closest('li, tr, .company, .col-md-6, .search-result, div');
    const cardText = cleanText($card.text()) || '';

    // Best-effort location: text after the name, commonly "City, ST".
    const locMatch = cardText.replace(name, '').match(/([A-Za-z .'-]+),\s*([A-Za-z]{2,})/);
    const revMatch = cardText.match(/(?:Revenue|Sales)[:\s]*\$?([\d.,]+\s*(?:[KMB]|million|billion)?)/i);
    const empMatch = cardText.match(/([\d,]+)\s*(?:employees|Employees)/);

    companies.push({
      id: abs,
      name,
      city: locMatch ? cleanText(locMatch[1]) : undefined,
      state: locMatch ? cleanText(locMatch[2]) : undefined,
      revenue: revMatch ? `$${revMatch[1].trim()}` : undefined,
      employeeCount: empMatch ? empMatch[1] : undefined,
      source: 'dnb',
      sourceUrl: abs,
    });
  });

  return companies;
}

/** Parse a single company-profiles page into a fuller record. */
function parseProfile(html: string, base: Company): Company {
  const $ = cheerio.load(html);
  const out: Company = { ...base };

  // Try JSON-LD first — D&B profile pages frequently embed Organization schema.
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).contents().text());
      const org = Array.isArray(json) ? json.find((j) => /Organization|Corporation/i.test(j['@type'])) : json;
      if (!org) return;
      out.name = out.name || org.name;
      out.website = out.website || org.url;
      out.phone = out.phone || org.telephone;
      out.description = out.description || org.description;
      const addr = org.address;
      if (addr) {
        out.address = out.address || cleanText(addr.streetAddress);
        out.city = out.city || addr.addressLocality;
        out.state = out.state || addr.addressRegion;
        out.country = out.country || addr.addressCountry;
      }
    } catch {
      /* ignore malformed ld+json */
    }
  });

  const bodyText = cleanText($('body').text()) || '';
  if (!out.revenue) {
    const m = bodyText.match(/(?:Revenue|Sales)[:\s]*\$?([\d.,]+\s*(?:[KMB]|million|billion)?)/i);
    if (m) out.revenue = `$${m[1].trim()}`;
  }
  if (!out.employeeCount) {
    const m = bodyText.match(/([\d,]+)\s*Employees/i);
    if (m) out.employeeCount = m[1];
  }
  const duns = bodyText.match(/D-?U-?N-?S(?:\s*Number)?[:\s]*([\d-]{9,})/i);
  if (duns) out.duns = duns[1];

  // Executives / key principals are usually in a "Key Principal" or contacts block.
  const contacts: NonNullable<Company['contacts']> = [];
  $('*:contains("Key Principal"), *:contains("CEO"), *:contains("Chief Executive")').each((_, el) => {
    const t = cleanText($(el).text());
    const m = t?.match(/(?:Key Principal|CEO|Chief Executive Officer)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z.]+){1,2})/);
    if (m && !contacts.some((c) => c.name === m[1])) {
      contacts.push({ name: m[1], title: /CEO|Chief Executive/i.test(t!) ? 'CEO' : 'Key Principal' });
    }
  });
  if (contacts.length) out.contacts = contacts;

  return out;
}

export const dnbProvider: Provider = {
  key: 'dnb',
  label: 'D&B Business Directory (scraper)',
  description: 'Scrapes dnb.com/business-directory. Needs an anti-bot gateway; against D&B ToS. Best-effort.',
  configHint:
    'dnb.com blocks plain requests (403). Set DNB_SCRAPER_GATEWAY to a rendering/proxy gateway (ScrapingBee, ScraperAPI, Bright Data, Zyte) for it to work.',
  isConfigured: () => true, // technically runnable, but see configHint

  async search(params: SearchParams): Promise<ProviderResult> {
    const { url, warnings } = listingUrl(params);
    const { html, status } = await fetchHtml(url);

    if (status === 403 || status === 429) {
      throw new Error(
        `D&B returned HTTP ${status} (bot protection). Configure DNB_SCRAPER_GATEWAY with a rendering/proxy ` +
          `service, or use the apollo/explorium providers. URL: ${url}`,
      );
    }
    if (status >= 400) {
      throw new Error(`D&B request failed with HTTP ${status}. URL: ${url}`);
    }

    let companies = parseListing(html, url);
    if (params.keywords) {
      const kw = params.keywords.toLowerCase();
      companies = companies.filter((c) => c.name.toLowerCase().includes(kw));
    }
    companies = companies.slice(0, Math.min(params.limit ?? 25, 100)).map((c) => ({
      ...c,
      country: findCountry(params.countryCode)?.name,
      countryCode: params.countryCode,
      naicsCode: params.naicsCode,
      naicsLabel: params.naicsCode ? naicsTitle(params.naicsCode) : undefined,
    }));

    if (companies.length === 0) {
      warnings.push('No companies parsed from the listing page (markup may have changed or page was blocked).');
    }
    return { companies, warnings };
  },

  async getDetails(company: Company): Promise<Company> {
    if (!company.sourceUrl) return company;
    const { html, status } = await fetchHtml(company.sourceUrl);
    if (status >= 400) return company; // return the stub rather than failing the whole request
    return parseProfile(html, company);
  },
};
