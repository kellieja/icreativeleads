import type { Company } from './types';

function esc(v: unknown): string {
  const s = v === undefined || v === null ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const COLUMNS: { header: string; get: (c: Company) => unknown }[] = [
  { header: 'Company Name', get: (c) => c.name },
  { header: 'Website', get: (c) => c.website },
  { header: 'Industry', get: (c) => c.industry },
  { header: 'NAICS Code', get: (c) => c.naicsCode },
  { header: 'NAICS Label', get: (c) => c.naicsLabel },
  { header: 'City', get: (c) => c.city },
  { header: 'State/Region', get: (c) => c.state },
  { header: 'Country', get: (c) => c.country },
  { header: 'Address', get: (c) => c.address },
  { header: 'Phone', get: (c) => c.phone },
  { header: 'Revenue', get: (c) => c.revenue },
  { header: 'Employees', get: (c) => c.employeeCount },
  { header: 'Founded', get: (c) => c.foundedYear },
  { header: 'DUNS', get: (c) => c.duns },
  { header: 'Ticker', get: (c) => c.ticker },
  { header: 'Contact Name', get: (c) => c.contacts?.[0]?.name },
  { header: 'Contact Title', get: (c) => c.contacts?.[0]?.title },
  { header: 'Contact Email', get: (c) => c.contacts?.[0]?.email },
  { header: 'Contact Phone', get: (c) => c.contacts?.[0]?.phone },
  { header: 'LinkedIn', get: (c) => c.socialMedia?.linkedin },
  { header: 'Source', get: (c) => c.source },
  { header: 'Source URL', get: (c) => c.sourceUrl },
];

/**
 * Serialize companies to CSV. Emits one row per company; when a company has
 * multiple contacts, extra contacts get their own rows repeating company data.
 */
export function toCsv(companies: Company[]): string {
  const header = COLUMNS.map((c) => c.header).join(',');
  const rows: string[] = [];

  for (const company of companies) {
    const contacts = company.contacts && company.contacts.length ? company.contacts : [undefined];
    contacts.forEach((contact, i) => {
      const withContact: Company = i === 0 ? company : { ...company };
      if (contact && i > 0) withContact.contacts = [contact];
      const line = COLUMNS.map((col) => {
        if (col.header.startsWith('Contact')) {
          const map: Record<string, unknown> = {
            'Contact Name': contact?.name,
            'Contact Title': contact?.title,
            'Contact Email': contact?.email,
            'Contact Phone': contact?.phone,
          };
          return esc(map[col.header]);
        }
        return esc(col.get(withContact));
      }).join(',');
      rows.push(line);
    });
  }

  return [header, ...rows].join('\n');
}
