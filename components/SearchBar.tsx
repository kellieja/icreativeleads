import React, { useState } from 'react';
import { SearchCriteria } from '../types';

interface SearchBarProps {
  onSearch: (criteria: SearchCriteria, isThinkingMode: boolean) => void;
  isLoading: boolean;
}

const employeeCountOptions = ["Any", "1-10", "11-50", "51-200", "201-500", "501-1,000", "1,001-5,000", "5,001+"];
const revenueOptions = ["Any", "$0-$1M", "$1M-$10M", "$10M-$50M", "$50M-$100M", "$100M-$500M", "$500M+"];
const buyerIntentOptions = ["Any", "Low", "Medium", "High", "Very High"];

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const [criteria, setCriteria] = useState<SearchCriteria>({
    keywords: '',
    industry: '',
    location: '',
    employeeCount: 'Any',
    revenue: 'Any',
    buyerIntent: 'Any',
    buyerIntentTopic: '',
  });
  const [isThinkingMode, setIsThinkingMode] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCriteria(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(criteria, isThinkingMode);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label htmlFor="keywords" className="block text-sm font-medium text-slate-600 mb-1">Company Name or Keywords</label>
        <input
          type="text"
          id="keywords"
          name="keywords"
          value={criteria.keywords}
          onChange={handleChange}
          placeholder="e.g., 'Acme Corp', 'AI startups'"
          className="w-full px-4 py-2 text-slate-800 bg-slate-50 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-light focus:border-primary-light transition"
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label htmlFor="industry" className="block text-sm font-medium text-slate-600 mb-1">Industry</label>
          <input
            type="text"
            id="industry"
            name="industry"
            value={criteria.industry}
            onChange={handleChange}
            placeholder="e.g., 'SaaS'"
            className="w-full px-4 py-2 text-slate-800 bg-slate-50 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-light focus:border-primary-light transition"
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-slate-600 mb-1">Location</label>
          <input
            type="text"
            id="location"
            name="location"
            value={criteria.location}
            onChange={handleChange}
            placeholder="e.g., 'San Francisco'"
            className="w-full px-4 py-2 text-slate-800 bg-slate-50 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-light focus:border-primary-light transition"
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="employeeCount" className="block text-sm font-medium text-slate-600 mb-1">Employee Count</label>
          <select
            id="employeeCount"
            name="employeeCount"
            value={criteria.employeeCount}
            onChange={handleChange}
            className="w-full px-4 py-2 text-slate-800 bg-slate-50 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-light focus:border-primary-light transition appearance-none"
            disabled={isLoading}
          >
            {employeeCountOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="revenue" className="block text-sm font-medium text-slate-600 mb-1">Annual Revenue</label>
          <select
            id="revenue"
            name="revenue"
            value={criteria.revenue}
            onChange={handleChange}
            className="w-full px-4 py-2 text-slate-800 bg-slate-50 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-light focus:border-primary-light transition appearance-none"
            disabled={isLoading}
          >
            {revenueOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="buyerIntent" className="block text-sm font-medium text-slate-600 mb-1">Buyer Intent Level</label>
          <select
            id="buyerIntent"
            name="buyerIntent"
            value={criteria.buyerIntent}
            onChange={handleChange}
            className="w-full px-4 py-2 text-slate-800 bg-slate-50 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-light focus:border-primary-light transition appearance-none"
            disabled={isLoading}
          >
            {buyerIntentOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
         <div>
          <label htmlFor="buyerIntentTopic" className="block text-sm font-medium text-slate-600 mb-1">Intent Topic</label>
          <input
            type="text"
            id="buyerIntentTopic"
            name="buyerIntentTopic"
            value={criteria.buyerIntentTopic}
            onChange={handleChange}
            placeholder="e.g., 'CRM Software'"
            className="w-full px-4 py-2 text-slate-800 bg-slate-50 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-light focus:border-primary-light transition"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 group relative cursor-pointer">
          <label htmlFor="thinking-mode" className="text-sm font-medium text-slate-700 select-none">
            Deep Search
          </label>
          <button
            type="button" // Prevent form submission
            id="thinking-mode"
            onClick={() => setIsThinkingMode(!isThinkingMode)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              isThinkingMode ? 'bg-primary' : 'bg-slate-300'
            }`}
            aria-pressed={isThinkingMode}
          >
            <span
              aria-hidden="true"
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                isThinkingMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
          <div className="absolute bottom-full mb-2 w-60 bg-slate-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            Enable for complex queries. Uses a more advanced model and may take longer.
          </div>
        </div>
        <button
          type="submit"
          className="w-full sm:w-auto px-8 py-3 text-white font-semibold bg-gradient-to-r from-primary to-primary-light rounded-lg shadow-md hover:from-primary-light hover:to-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light disabled:from-slate-400 disabled:to-slate-300 disabled:cursor-not-allowed transition-all"
          disabled={isLoading}
        >
          {isLoading ? 'Searching...' : 'Find Companies'}
        </button>
      </div>
    </form>
  );
};

export default SearchBar;