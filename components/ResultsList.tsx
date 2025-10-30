import React from 'react';
import { CompanySearchResult } from '../types';
import Icon from './Icon';

interface ResultsListProps {
  results: CompanySearchResult[];
  onSelect: (company: CompanySearchResult) => void;
}

const ResultsList: React.FC<ResultsListProps> = ({ results, onSelect }) => {
  if (results.length === 0) {
    return <div className="p-4 text-center text-slate-500">No results found.</div>;
  }

  return (
    <div className="space-y-4">
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
    </div>
  );
};

export default ResultsList;