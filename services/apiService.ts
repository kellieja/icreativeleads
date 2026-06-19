import { Company, Meta, SearchParams, SearchResponse } from '../types';

// All calls hit the scraper backend via the Vite dev proxy (/api -> :4000).

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  }
  return data as T;
}

export async function getMeta(): Promise<Meta> {
  const res = await fetch('/api/meta');
  if (!res.ok) throw new Error('Failed to load reference data. Is the backend running (npm run server)?');
  return res.json();
}

export async function search(params: SearchParams): Promise<SearchResponse> {
  return postJson<SearchResponse>('/api/search', params);
}

export async function getDetails(provider: string, company: Company): Promise<Company> {
  return postJson<Company>('/api/company', { provider, company });
}

/** Trigger a CSV/JSON download of the given companies. */
export async function exportCompanies(companies: Company[], format: 'csv' | 'json'): Promise<void> {
  const res = await fetch('/api/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ companies, format }),
  });
  if (!res.ok) throw new Error('Export failed.');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `leads_${new Date().toISOString().slice(0, 10)}.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
