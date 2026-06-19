import React from 'react';
import { Company } from '../types';
import Icon from './Icon';

interface ResultsListProps {
  results: Company[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelect: (company: Company) => void;
}

const locationOf = (c: Company): string =>
  [c.city, c.state, c.country].filter(Boolean).join(', ') || '—';

const ResultsList: React.FC<ResultsListProps> = ({ results, selectedIds, onToggleSelect, onSelect }) => {
  if (results.length === 0) {
    return <div className="p-4 text-center text-slate-500">No results found.</div>;
  }

  return (
    <div className="space-y-3">
      {results.map((company, index) => (
        <div
          key={company.id || `${company.name}-${index}`}
          className="group p-4 bg-white rounded-xl border border-slate-200 hover:border-primary-light transition-colors animate-fade-in-up flex items-start gap-3"
          style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
        >
          <input
            type="checkbox"
            checked={selectedIds.has(company.id)}
            onChange={() => onToggleSelect(company.id)}
            className="mt-1.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
            aria-label={`Select ${company.name} for export`}
          />
          <div className="flex-grow cursor-pointer" onClick={() => onSelect(company)}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-slate-800 group-hover:text-primary-dark transition-colors">
                  {company.name}
                </h3>
                {(company.industry || company.naicsLabel) && (
                  <p className="text-sm text-primary mt-0.5 font-medium">
                    {company.industry || company.naicsLabel}
                    {company.naicsCode ? ` · NAICS ${company.naicsCode}` : ''}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-slate-500">
                  <span className="flex items-center"><Icon icon="globe" className="w-4 h-4 mr-1.5" />{locationOf(company)}</span>
                  {company.employeeCount && <span className="flex items-center"><Icon icon="users" className="w-4 h-4 mr-1.5" />{company.employeeCount}</span>}
                  {company.revenue && <span className="flex items-center"><Icon icon="dollar" className="w-4 h-4 mr-1.5" />{company.revenue}</span>}
                  {company.website && <span className="text-primary truncate max-w-[14rem]">{company.website}</span>}
                </div>
              </div>
              <div className="text-slate-300 group-hover:text-primary transition-colors flex-shrink-0">
                <Icon icon="chevron-right" className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ResultsList;
