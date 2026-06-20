import React, { useState } from 'react';
import { searchCompanies, getCompanyDetails } from './services/geminiService';
import { CompanySearchResult, CompanyProfile, SearchCriteria } from './types';
import SearchBar from './components/SearchBar';
import ResultsList from './components/ResultsList';
import CompanyProfileComponent from './components/CompanyProfile';
import LoadingSpinner from './components/LoadingSpinner';
import Icon from './components/Icon';
import BulkUrlFinder from './components/BulkUrlFinder';

type Tab = 'search' | 'urls';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('search');
  const [searchResults, setSearchResults] = useState<CompanySearchResult[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [lastSearchCriteria, setLastSearchCriteria] = useState<SearchCriteria | null>(null);
  // Fix: Add state to persist the search mode (Deep Search) across API calls.
  const [wasLastSearchInThinkingMode, setWasLastSearchInThinkingMode] = useState<boolean>(false);

  const handleSearch = async (criteria: SearchCriteria, isThinkingMode: boolean) => {
    setIsLoading(true);
    setIsThinking(isThinkingMode);
    setError(null);
    setSelectedCompany(null);
    setHasSearched(true);
    setLastSearchCriteria(criteria); // Save search criteria
    // Fix: Save the thinking mode from the search to use for subsequent detail fetches.
    setWasLastSearchInThinkingMode(isThinkingMode);
    try {
      const results = await searchCompanies(criteria, isThinkingMode);
      setSearchResults(results);
    } catch (err) {
      setError('An error occurred while searching. Please try again.');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
      setIsThinking(false);
    }
  };

  const handleSelectCompany = async (company: CompanySearchResult) => {
    // Determine if the original search was in thinking mode to maintain consistency
    // For this app, we'll assume the same mode as the last search. A more complex app might store this state differently.
    // Fix: Use the persisted search mode instead of the transient 'isThinking' UI state.
    const isThinkingMode = wasLastSearchInThinkingMode;
    const buyerIntentTopic = lastSearchCriteria?.buyerIntentTopic;
    setIsLoading(true);
    setIsThinking(isThinkingMode)
    setError(null);
    try {
      const profile = await getCompanyDetails(company, isThinkingMode, buyerIntentTopic);
      setSelectedCompany(profile);
    } catch (err) {
      setError('An error occurred while fetching company details. Please try again.');
      setSelectedCompany(null);
    } finally {
      setIsLoading(false);
      setIsThinking(false);
    }
  };

  const handleBackToResults = () => {
    setSelectedCompany(null);
  };
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="mt-8 text-center">
          <LoadingSpinner />
          {isThinking && <p className="mt-4 text-lg text-primary font-semibold animate-pulse">Thinking... this may take a moment.</p>}
        </div>
      );
    }
    if (error) {
      return <div className="mt-8 p-4 text-center text-red-600 bg-red-100 rounded-md">{error}</div>;
    }
    if (selectedCompany) {
      return <CompanyProfileComponent company={selectedCompany} onBack={handleBackToResults} />;
    }
    if (hasSearched) {
      return <ResultsList results={searchResults} onSelect={handleSelectCompany} />;
    }
    return (
        <div className="text-center py-16 px-4 bg-white rounded-xl border border-slate-200">
            <Icon icon="briefcase" className="w-24 h-24 text-slate-300 mx-auto" />
            <h2 className="mt-6 text-3xl font-bold text-slate-800">Unlock Business Intelligence</h2>
            <p className="mt-2 text-lg text-slate-500 max-w-2xl mx-auto">
                Use the filters above to find companies and discover detailed profiles, key contacts, and valuable insights.
            </p>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-slate-800 shadow-md sticky top-0 z-10">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 md:px-8 py-4">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">IntelliLeads</h1>
        </div>
      </header>
      <main className="container mx-auto max-w-7xl p-4 sm:p-6 md:p-8">
        <div className="mb-8 flex gap-2 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('search')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              activeTab === 'search'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Company Search
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('urls')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              activeTab === 'urls'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Bulk URL Finder
          </button>
        </div>

        {activeTab === 'search' ? (
          <>
            <div className="bg-white p-6 rounded-xl shadow-sm mb-8 border border-slate-200">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Company Search</h2>
                <SearchBar onSearch={handleSearch} isLoading={isLoading} />
            </div>
            {renderContent()}
          </>
        ) : (
          <BulkUrlFinder />
        )}
      </main>
    </div>
  );
};

export default App;