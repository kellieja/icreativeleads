import React from 'react';
import { CompanySearchResult } from '../types';
import Icon from './Icon';

interface ResultsListProps {
  results: CompanySearchResult[];
  onSelect: (company: CompanySearchResult) => void;
  onExportCsv: () => void;
  onGetMore: () => void;
  isLoadingMore: boolean;
}

const ResultsList: React.FC<ResultsListProps> = ({ results, onSelect, onExportCsv, onGetMore, isLoadingMore }) => {
  if (results.length === 0) {
    return <div className="p-4 text-center text-slate-500">No results found.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <p className="text-sm font-medium text-slate-600">
          {results.length} {results.length === 1 ? 'company' : 'companies'} found
        </p>
        <button
          type="button"
          onClick={onExportCsv}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <Icon icon="download" className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {results.map((company, index) => (
        <div
          key={`${company.name}-${index}`}
          onClick={() => onSelect(company)}
          className="group p-5 bg-white rounded-xl border border-slate-200 hover:border-primary-light hover:animate-lift cursor-pointer transition-colors animate-fade-in-up"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-slate-800 group-hover:text-primary-dark transition-colors">{company.name}</h3>
              <p className="text-md text-primary mt-1 font-medium">{company.industry}</p>
              <div className="flex items-center mt-3 text-sm text-slate-500">
                <Icon icon="globe" className="w-4 h-4 mr-2" />
                <span>{`${company.location.city}, ${company.location.state}, ${company.location.country}`}</span>
              </div>
            </div>
            <div className="text-slate-300 group-hover:text-primary transition-colors">
                <Icon icon="chevron-right" className="w-6 h-6" />
            </div>
          </div>
        </div>
      ))}

      <div className="pt-2 flex justify-center">
        <button
          type="button"
          onClick={onGetMore}
          disabled={isLoadingMore}
          className="px-8 py-3 text-primary font-semibold bg-white border border-primary/30 rounded-lg shadow-sm hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoadingMore ? 'Finding more leads…' : 'Get More Leads'}
        </button>
      </div>
    </div>
  );
};

export default ResultsList;
