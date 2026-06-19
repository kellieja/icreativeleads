import React, { useEffect, useMemo, useState } from 'react';
import { getMeta, search, getDetails, exportCompanies } from './services/apiService';
import { Company, Meta, SearchParams } from './types';
import SearchBar from './components/SearchBar';
import ResultsList from './components/ResultsList';
import CompanyProfileComponent from './components/CompanyProfile';
import LoadingSpinner from './components/LoadingSpinner';
import Icon from './components/Icon';

const App: React.FC = () => {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [results, setResults] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [provider, setProvider] = useState('demo');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    getMeta().then(setMeta).catch((e) => setError(e.message));
  }, []);

  const handleSearch = async (params: SearchParams) => {
    setIsLoading(true);
    setError(null);
    setSelectedCompany(null);
    setSelectedIds(new Set());
    setWarnings([]);
    setHasSearched(true);
    setProvider(params.provider);
    try {
      const res = await search(params);
      setResults(res.companies);
      setWarnings(res.warnings ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCompany = async (company: Company) => {
    setSelectedCompany(company);
    // Enrich in the background for providers that support detail fetches.
    try {
      const detailed = await getDetails(provider, company);
      setSelectedCompany((cur) => (cur && cur.id === company.id ? detailed : cur));
    } catch {
      /* keep the stub if enrichment fails */
    }
  };

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const allSelected = results.length > 0 && selectedIds.size === results.length;
  const toggleAll = () =>
    setSelectedIds(allSelected ? new Set() : new Set(results.map((c) => c.id)));

  const companiesToExport = useMemo(
    () => (selectedIds.size ? results.filter((c) => selectedIds.has(c.id)) : results),
    [results, selectedIds],
  );

  const handleExport = (companies: Company[], format: 'csv' | 'json') =>
    exportCompanies(companies, format).catch((e) => setError(e.message));

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="mt-8 text-center">
          <LoadingSpinner />
          <p className="mt-4 text-lg text-primary font-semibold animate-pulse">Searching the directory…</p>
        </div>
      );
    }
    if (selectedCompany) {
      return <CompanyProfileComponent company={selectedCompany} onBack={() => setSelectedCompany(null)} onExport={handleExport} />;
    }
    if (hasSearched) {
      return (
        <div>
          {warnings.length > 0 && (
            <div className="mb-4 p-3 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md">
              {warnings.map((w, i) => <div key={i}>• {w}</div>)}
            </div>
          )}
          {results.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" />
                  Select all
                </label>
                <span className="text-sm text-slate-500">
                  {results.length} results · {selectedIds.size || 'all'} to export
                </span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleExport(companiesToExport, 'csv')} className="text-sm px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-light transition-colors flex items-center gap-2">
                  <Icon icon="download" className="w-4 h-4" /> Export CSV
                </button>
                <button onClick={() => handleExport(companiesToExport, 'json')} className="text-sm px-4 py-2 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2">
                  <Icon icon="download" className="w-4 h-4" /> Export JSON
                </button>
              </div>
            </div>
          )}
          <ResultsList results={results} selectedIds={selectedIds} onToggleSelect={toggleSelect} onSelect={handleSelectCompany} />
        </div>
      );
    }
    return (
      <div className="text-center py-16 px-4 bg-white rounded-xl border border-slate-200">
        <Icon icon="briefcase" className="w-24 h-24 text-slate-300 mx-auto" />
        <h2 className="mt-6 text-3xl font-bold text-slate-800">Scrape the Business Directory</h2>
        <p className="mt-2 text-lg text-slate-500 max-w-2xl mx-auto">
          Pick a country and NAICS category, choose a data source, and pull company names, websites, contacts, and firmographics — then export to CSV or JSON.
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-slate-800 shadow-md sticky top-0 z-10">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 md:px-8 py-4">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">IntelliLeads</h1>
          <p className="text-slate-300 text-sm">Business directory scraper · country + NAICS</p>
        </div>
      </header>
      <main className="container mx-auto max-w-7xl p-4 sm:p-6 md:p-8">
        <div className="bg-white p-6 rounded-xl shadow-sm mb-8 border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Directory Search</h2>
          <SearchBar meta={meta} onSearch={handleSearch} isLoading={isLoading} />
        </div>
        {error && <div className="mb-6 p-4 text-center text-red-700 bg-red-100 rounded-md">{error}</div>}
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
