import React from 'react';
import { Company } from '../types';
import Icon from './Icon';
import ContactCard from './ContactCard';

interface CompanyProfileProps {
  company: Company;
  onBack: () => void;
  onExport: (companies: Company[], format: 'csv' | 'json') => void;
}

const InfoItem: React.FC<{ icon: 'building' | 'globe' | 'users' | 'dollar'; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
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

const CompanyProfile: React.FC<CompanyProfileProps> = ({ company, onBack, onExport }) => {
  const renderWebsite = () => {
    if (!company.website) return <span className="text-slate-500">Not available</span>;
    let href = company.website.trim();
    if (!/^https?:\/\//i.test(href)) href = `https://${href}`;
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
        {company.website}
      </a>
    );
  };

  const location = [company.city, company.state, company.country].filter(Boolean).join(', ') || '—';
  const encodedName = encodeURIComponent(company.name);
  const logoUrl = `https://ui-avatars.com/api/?name=${encodedName}&size=128&background=e2e8f0&color=312e81&font-size=0.4`;
  const social = company.socialMedia;
  const hasSocial = social && (social.linkedin || social.twitter || social.facebook);

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-6">
        <div className="flex items-center gap-6">
          <img src={logoUrl} alt={`${company.name} logo`} className="w-24 h-24 rounded-lg bg-slate-100 border border-slate-200 flex-shrink-0 object-cover" />
          <div>
            <h2 className="text-4xl font-extrabold text-slate-900">{company.name}</h2>
            <p className="text-xl text-primary font-medium mt-1">{company.industry || company.naicsLabel || '—'}</p>
            <span className="inline-block mt-2 text-xs uppercase tracking-wide font-semibold text-slate-500 bg-slate-100 rounded px-2 py-0.5">
              Source: {company.source}
            </span>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0 self-start sm:self-auto">
          <button onClick={onBack} className="text-sm px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-colors">
            &larr; Back
          </button>
          <button onClick={() => onExport([company], 'csv')} className="text-sm px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-light transition-colors flex items-center gap-2">
            <Icon icon="download" className="w-4 h-4" /> CSV
          </button>
          <button onClick={() => onExport([company], 'json')} className="text-sm px-4 py-2 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2">
            <Icon icon="download" className="w-4 h-4" /> JSON
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {company.description && (
            <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-2xl font-bold text-slate-800 mb-4">About</h3>
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{company.description}</p>
            </section>
          )}

          <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-2xl font-bold text-slate-800 mb-4">Key Contacts</h3>
            {company.contacts && company.contacts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {company.contacts.map((contact, i) => (
                  <ContactCard key={`${contact.name}-${i}`} contact={contact} />
                ))}
              </div>
            ) : (
              <p className="text-slate-500">No contacts available from this source. Licensed providers (Apollo/Explorium) return executives and emails.</p>
            )}
          </section>
        </div>

        <div className="lg:col-span-1">
          <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-2xl font-bold text-slate-800 mb-6">Company Details</h3>
            <div className="space-y-6">
              <InfoItem icon="globe" label="Headquarters" value={location} />
              <InfoItem icon="globe" label="Website" value={renderWebsite()} />
              {company.phone && <InfoItem icon="building" label="Phone" value={company.phone} />}
              {company.employeeCount && <InfoItem icon="users" label="Employees" value={company.employeeCount} />}
              {company.revenue && <InfoItem icon="dollar" label="Revenue" value={company.revenue} />}
              {company.foundedYear && <InfoItem icon="building" label="Founded" value={company.foundedYear} />}
              {company.naicsCode && <InfoItem icon="building" label="NAICS" value={`${company.naicsCode}${company.naicsLabel ? ` · ${company.naicsLabel}` : ''}`} />}
              {company.duns && <InfoItem icon="building" label="DUNS" value={company.duns} />}
              {company.ticker && <InfoItem icon="dollar" label="Ticker" value={company.ticker} />}
              {company.sourceUrl && (
                <InfoItem icon="globe" label="Source Page" value={
                  <a href={company.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">View</a>
                } />
              )}
            </div>
            {hasSocial && (
              <>
                <hr className="my-6 border-slate-200" />
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-3">Social Media</p>
                  <div className="flex items-center space-x-4">
                    {social!.linkedin && <a href={social!.linkedin} title="LinkedIn" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-primary transition-colors"><Icon icon="linkedin" className="w-6 h-6" /></a>}
                    {social!.twitter && <a href={social!.twitter} title="Twitter" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-primary transition-colors"><Icon icon="twitter" className="w-6 h-6" /></a>}
                    {social!.facebook && <a href={social!.facebook} title="Facebook" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-primary transition-colors"><Icon icon="facebook" className="w-6 h-6" /></a>}
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default CompanyProfile;
