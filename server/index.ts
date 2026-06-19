import 'dotenv/config'; // load .env (API keys, gateway config) before anything reads process.env
import express from 'express';
import cors from 'cors';
import { COUNTRIES } from './data/countries';
import { NAICS_SECTORS, NAICS_COMMON } from './data/naics';
import { getProvider, providerMeta } from './providers';
import { toCsv } from './csv';
import type { SearchParams, Company } from './types';

const app = express();
app.use(cors());
app.use(express.json({ limit: '4mb' }));

const PORT = Number(process.env.SCRAPER_PORT || process.env.PORT || 4000);

// Reference data + provider availability for the UI.
app.get('/api/meta', (_req, res) => {
  res.json({
    countries: COUNTRIES.map((c) => ({ code: c.code, name: c.name })),
    naicsSectors: NAICS_SECTORS.map((s) => ({ code: s.code, title: s.title })),
    naicsCommon: NAICS_COMMON,
    providers: providerMeta(),
  });
});

// Directory search.
app.post('/api/search', async (req, res) => {
  const { provider: providerKey, ...params } = req.body ?? {};
  const provider = getProvider(providerKey);
  try {
    const result = await provider.search(params as SearchParams);
    res.json({ provider: provider.key, ...result });
  } catch (err) {
    res.status(502).json({
      error: err instanceof Error ? err.message : 'Search failed',
      provider: provider.key,
    });
  }
});

// Enrich a single company with full detail.
app.post('/api/company', async (req, res) => {
  const { provider: providerKey, company } = req.body ?? {};
  const provider = getProvider(providerKey);
  if (!company) return res.status(400).json({ error: 'Missing company payload.' });
  try {
    const detailed = provider.getDetails ? await provider.getDetails(company as Company) : company;
    res.json(detailed);
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Detail fetch failed' });
  }
});

// Export results as CSV or JSON.
app.post('/api/export', (req, res) => {
  const { companies, format } = req.body ?? {};
  if (!Array.isArray(companies)) return res.status(400).json({ error: 'companies[] required.' });
  const stamp = new Date().toISOString().slice(0, 10);
  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="leads_${stamp}.json"`);
    return res.send(JSON.stringify(companies, null, 2));
  }
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="leads_${stamp}.csv"`);
  res.send(toCsv(companies as Company[]));
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`[scraper] API listening on http://localhost:${PORT}`);
  const configured = providerMeta().filter((p) => p.configured).map((p) => p.key);
  console.log(`[scraper] configured providers: ${configured.join(', ')}`);
});
