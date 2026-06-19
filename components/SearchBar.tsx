import React, { useMemo, useState } from 'react';
import { Meta, SearchParams } from '../types';

interface SearchBarProps {
  meta: Meta | null;
  onSearch: (params: SearchParams) => void;
  isLoading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ meta, onSearch, isLoading }) => {
  const [provider, setProvider] = useState('demo');
  const [countryCode, setCountryCode] = useState('US');
  const [naics, setNaics] = useState(''); // raw input; leading token is the code
  const [keywords, setKeywords] = useState('');
  const [limit, setLimit] = useState(25);

  // Combined NAICS options: 2-digit sectors first, then curated detailed codes.
  const naicsOptions = useMemo(() => {
    if (!meta) return [];
    const sectors = meta.naicsSectors.map((s) => ({ code: s.code, title: `${s.title} (sector)` }));
    return [...sectors, ...meta.naicsCommon];
  }, [meta]);

  const selectedProvider = meta?.providers.find((p) => p.key === provider);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const naicsCode = naics.trim().split(/[\s—-]/)[0].replace(/[^0-9]/g, '') || undefined;
    onSearch({ provider, countryCode, naicsCode, keywords: keywords.trim() || undefined, limit });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label htmlFor="provider" className="block text-sm font-medium text-slate-600 mb-1">Data Source</label>
          <select
            id="provider"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-full px-4 py-2 text-slate-800 bg-slate-50 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-light transition appearance-none"
            disabled={isLoading}
          >
            {meta?.providers.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}{p.configured ? '' : ' — not configured'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="country" className="block text-sm font-medium text-slate-600 mb-1">Country</label>
          <select
            id="country"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="w-full px-4 py-2 text-slate-800 bg-slate-50 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-light transition appearance-none"
            disabled={isLoading}
          >
            {meta?.countries.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="naics" className="block text-sm font-medium text-slate-600 mb-1">NAICS Category</label>
          <input
            id="naics"
            list="naics-list"
            value={naics}
            onChange={(e) => setNaics(e.target.value)}
            placeholder="Type or pick (e.g. 5112 Software)"
            className="w-full px-4 py-2 text-slate-800 bg-slate-50 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-light transition"
            disabled={isLoading}
          />
          <datalist id="naics-list">
            {naicsOptions.map((o) => (
              <option key={o.code} value={`${o.code} — ${o.title}`} />
            ))}
          </datalist>
        </div>

        <div>
          <label htmlFor="keywords" className="block text-sm font-medium text-slate-600 mb-1">Keyword / Name (optional)</label>
          <input
            id="keywords"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="e.g. 'logistics'"
            className="w-full px-4 py-2 text-slate-800 bg-slate-50 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-light transition"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="limit" className="block text-sm font-medium text-slate-600 mb-1">Max Results</label>
          <select
            id="limit"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="w-full px-4 py-2 text-slate-800 bg-slate-50 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-light transition appearance-none"
            disabled={isLoading}
          >
            {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            className="w-full px-8 py-2.5 text-white font-semibold bg-gradient-to-r from-primary to-primary-light rounded-lg shadow-md hover:from-primary-light hover:to-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light disabled:from-slate-400 disabled:to-slate-300 disabled:cursor-not-allowed transition-all"
            disabled={isLoading}
          >
            {isLoading ? 'Searching…' : 'Search Directory'}
          </button>
        </div>
      </div>

      {selectedProvider && !selectedProvider.configured && (
        <p className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          <strong>{selectedProvider.label}</strong> isn't configured. {selectedProvider.configHint}
        </p>
      )}
    </form>
  );
};

export default SearchBar;
