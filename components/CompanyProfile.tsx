import React from 'react';
import { CompanyProfile as CompanyProfileType } from '../types';
import Icon from './Icon';
import ContactCard from './ContactCard';
import IntentGauge from './IntentGauge';

interface CompanyProfileProps {
  company: CompanyProfileType;
  onBack: () => void;
}

const InfoItem: React.FC<{ icon: 'building' | 'globe' | 'users' | 'dollar'; label: string; value: string | React.ReactNode }> = ({ icon, label, value }) => (
  <div className="flex items-start">
    <div className="flex-shrink-0 text-primary mt-1">
      <Icon icon={icon} className="w-5 h-5" />
    </div>
    <div className="ml-4">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <div className="text-md font-semibold text-slate-800 break-words">{value}</div>
    </div>
  </div>
);


const CompanyProfile: React.FC<CompanyProfileProps> = ({ company, onBack }) => {

  const handleExportCSV = () => {
    if (!company) return;

    // Helper to escape CSV fields to handle commas, quotes, and newlines
    const escapeCsvField = (field: string | number | undefined): string => {
      const stringField = String(field || '');
      if (/[",\n\r]/.test(stringField)) {
        return `"${stringField.replace(/"/g, '""')}"`;
      }
      return stringField;
    };
  
    const headers = [
      'Company Name', 'Industry', 'Website', 'Revenue', 'Employee Count',
      'City', 'State', 'Country', 'Description',
      'Buyer Intent Score', 'Buyer Intent Summary',
      'Contact Name', 'Contact Title', 'Contact Email'
    ];
  
    const companyData = [
      company.name, company.industry, company.website, company.revenue, company.employeeCount,
      company.location.city, company.location.state, company.location.country, company.description,
      company.buyerIntent.score, company.buyerIntent.summary
    ].map(escapeCsvField);
  
    // Create one row per contact, repeating the company data
    let rows: string[];
    if (company.contacts && company.contacts.length > 0) {
        rows = company.contacts.map(contact => {
            const contactData = [
              contact.name, contact.title, contact.email
            ].map(escapeCsvField);
            return [...companyData, ...contactData].join(',');
        });
    } else {
        // If there are no contacts, export one row with just company data
        const emptyContactData = ['', '', ''].map(escapeCsvField);
        rows = [[...companyData, ...emptyContactData].join(',')];
    }
  
    const csvContent = [
      headers.join(','),
      ...rows
    ].join('\n');
  
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const safeFilename = company.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.setAttribute('download', `${safeFilename}_profile.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderWebsiteLink = () => {
    const { website } = company;
    if (!website || website.trim() === '') {
      return <span className="text-slate-500">Not available</span>;
    }
  
    let href = website.trim();
    if (!/^https?:\/\//i.test(href)) {
      href = `https://${href}`;
    }
  
    let domain: string;
    try {
      domain = new URL(href).hostname;
    } catch (e) {
      // Fallback for simple domain strings like "example.com"
      const domainMatch = href.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/im);
      domain = domainMatch ? domainMatch[1] : website.trim();
    }
    
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  
    return (
      <div className="flex items-center gap-2">
        <img
          src={faviconUrl}
          alt="" // Decorative, so alt is empty
          className="w-4 h-4 flex-shrink-0"
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
          {website}
        </a>
      </div>
    );
  };
  
  const encodedName = encodeURIComponent(company.name);
  const logoUrl = `https://ui-avatars.com/api/?name=${encodedName}&size=128&background=e2e8f0&color=312e81&font-size=0.4`;

  const socialLinks = company.socialMedia;
  const hasSocialLinks = socialLinks && (socialLinks.linkedin || socialLinks.twitter || socialLinks.facebook);

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-6">
        <div className="flex items-center gap-6">
            <img 
              src={logoUrl} 
              alt={`${company.name} logo`} 
              className="w-24 h-24 rounded-lg bg-slate-100 border border-slate-200 flex-shrink-0 object-cover" 
            />
            <div>
              <h2 className="text-4xl font-extrabold text-slate-900">{company.name}</h2>
              <p className="text-xl text-primary font-medium mt-1">{company.industry}</p>
            </div>
        </div>
        <div className="flex gap-2 flex-shrink-0 self-start sm:self-auto">
          <button
            onClick={onBack}
            className="text-sm px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-colors flex-shrink-0"
          >
            &larr; Back
          </button>
          <button
            onClick={handleExportCSV}
            className="text-sm px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-light transition-colors flex items-center gap-2"
          >
            <Icon icon="download" className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <div className="space-y-8">

        <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-2xl font-bold text-slate-800 mb-4 flex items-center">
              <Icon icon="target" className="w-6 h-6 mr-3 text-primary" />
              Buyer Intent
            </h3>
            <div className="flex flex-col md:flex-row items-center gap-6 bg-gradient-to-tr from-slate-50 to-slate-100 p-6 rounded-lg">
                <div className="flex-shrink-0">
                    <IntentGauge score={company.buyerIntent.score} />
                </div>
                <div className="flex-grow">
                    <h4 className="font-bold text-lg text-slate-800 mb-1">Intent Summary</h4>
                    <p className="text-slate-600 leading-relaxed">{company.buyerIntent.summary}</p>
                </div>
            </div>
            {company.buyerIntent.signals && company.buyerIntent.signals.length > 0 && (
                <div className="mt-6">
                    <h4 className="font-bold text-lg text-slate-800 mb-3">Key Signals</h4>
                    <ul className="space-y-2">
                        {company.buyerIntent.signals.map((signal, index) => (
                            <li key={index} className="flex items-start">
                                <Icon icon="check-circle" className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                <span className="text-slate-600">{signal}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-2xl font-bold text-slate-800 mb-4">About</h3>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{company.description}</p>
                </section>
                
                <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-2xl font-bold text-slate-800 mb-4">Key Contacts</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {company.contacts.map((contact) => (
                      <ContactCard key={contact.name} contact={contact} />
                    ))}
                  </div>
                </section>
            </div>
            <div className="lg:col-span-1">
                <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                   <h3 className="text-2xl font-bold text-slate-800 mb-6">Company Details</h3>
                   <div className="space-y-6">
                      <InfoItem icon="globe" label="Headquarters" value={`${company.location.city}, ${company.location.state}, ${company.location.country}`} />
                      <InfoItem icon="users" label="Employee Count" value={company.employeeCount} />
                      <InfoItem icon="dollar" label="Estimated Revenue" value={company.revenue} />
                      <InfoItem 
                          icon="globe" 
                          label="Website" 
                          value={renderWebsiteLink()}
                      />
                   </div>
                   {hasSocialLinks && (
                    <>
                      <hr className="my-6 border-slate-200" />
                      <div>
                        <p className="text-sm font-medium text-slate-500 mb-3">Social Media</p>
                        <div className="flex items-center space-x-4">
                          {socialLinks.linkedin && (
                            <a href={socialLinks.linkedin} title="LinkedIn" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-primary transition-colors">
                              <Icon icon="linkedin" className="w-6 h-6" />
                            </a>
                          )}
                          {socialLinks.twitter && (
                            <a href={socialLinks.twitter} title="Twitter" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-primary transition-colors">
                              <Icon icon="twitter" className="w-6 h-6" />
                            </a>
                          )}
                          {socialLinks.facebook && (
                            <a href={socialLinks.facebook} title="Facebook" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-primary transition-colors">
                              <Icon icon="facebook" className="w-6 h-6" />
                            </a>
                          )}
                        </div>
                      </div>
                    </>
                   )}
                </section>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyProfile;