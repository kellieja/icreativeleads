import React, { useState } from 'react';
import { findCompanyUrls } from '../services/geminiService';
import { CompanyUrlResult } from '../types';
import Icon from './Icon';
import LoadingSpinner from './LoadingSpinner';

const BulkUrlFinder: React.FC = () => {
  const [input, setInput] = useState('');
  const [results, setResults] = useState<CompanyUrlResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);
  const [copied, setCopied] = useState(false);

  const names = input
    .split('\n')
    .map(n => n.trim())
    .filter(Boolean);

  const handleFind = async () => {
    if (names.length === 0) return;
    setIsLoading(true);
    setError(null);
    setHasRun(true);
    setCopied(false);
    try {
      const data = await findCompanyUrls(names);
      setResults(data);
    } catch (err) {
      setError('An error occurred while finding URLs. Please try again.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setInput('');
    setResults([]);
    setHasRun(false);
    setError(null);
    setCopied(false);
  };

  const handleCopy = () => {
    const text = results
      .filter(r => r.found && r.url)
      .map(r => `${r.name}\t${r.url}`)
      .join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleExportCsv = () => {
    const escape = (value: string) => `"${(value ?? '').replace(/"/g, '""')}"`;
    const header = 'Company Name,Website URL\n';
    const rows = results
      .map(r => `${escape(r.name)},${escape(r.found ? r.url : '')}`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'company-urls.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const foundCount = results.filter(r => r.found && r.url).length;

  return (
    <div>
      <div className="bg-white p-6 rounded-xl shadow-sm mb-8 border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-1">Bulk URL Finder</h2>
        <p className="text-slate-500 mb-4">
          Paste a list of company names (one per line) to look up their official website links.
        </p>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          rows={8}
          placeholder={'Acme Corporation\nStripe\nNotion\nFigma'}
          className="w-full px-4 py-3 text-slate-800 bg-slate-50 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-light focus:border-primary-light transition font-mono text-sm"
          disabled={isLoading}
        />
        <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="text-sm text-slate-500">
            {names.length} {names.length === 1 ? 'company' : 'companies'} ready
          </span>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleClear}
              disabled={isLoading || (!input && results.length === 0)}
              className="px-5 py-3 text-slate-600 font-semibold bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleFind}
              disabled={isLoading || names.length === 0}
              className="flex-1 sm:flex-none px-8 py-3 text-white font-semibold bg-gradient-to-r from-primary to-primary-light rounded-lg shadow-md hover:from-primary-light hover:to-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light disabled:from-slate-400 disabled:to-slate-300 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? 'Finding...' : 'Find URLs'}
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="mt-8 text-center">
          <LoadingSpinner />
        </div>
      )}

      {!isLoading && error && (
        <div className="mt-8 p-4 text-center text-red-600 bg-red-100 rounded-md">{error}</div>
      )}

      {!isLoading && !error && hasRun && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 p-4 border-b border-slate-200">
            <p className="text-sm font-medium text-slate-600">
              Found {foundCount} of {results.length} websites
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                disabled={foundCount === 0}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Icon icon={copied ? 'check-circle' : 'globe'} className="w-4 h-4" />
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={results.length === 0}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Icon icon="download" className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>

          {results.length === 0 ? (
            <div className="p-6 text-center text-slate-500">No results found.</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {results.map((result, index) => (
                <li
                  key={`${result.name}-${index}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
                >
                  <span className="font-medium text-slate-800 truncate">{result.name}</span>
                  {result.found && result.url ? (
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-primary hover:text-primary-dark hover:underline truncate max-w-[60%]"
                    >
                      <Icon icon="globe" className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{result.url}</span>
                    </a>
                  ) : (
                    <span className="text-sm text-slate-400 italic flex-shrink-0">Not found</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default BulkUrlFinder;
