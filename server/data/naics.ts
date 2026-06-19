// NAICS reference data used by the category picker and by providers.
//
// `sectors` covers all 20 NAICS 2-digit sectors, each mapped to the slug D&B
// uses in its business-directory industry URLs (these slugs are NAICS-aligned).
// `common` is a curated set of frequently-used detailed (4-6 digit) codes so the
// picker is useful without shipping the full ~1,000-code table. Users can also
// type any code directly.

export interface NaicsSector {
  code: string; // 2-digit (ranges like 31-33 collapsed to first code)
  title: string;
  dnbSlug: string;
}

export interface NaicsCode {
  code: string; // 2-6 digit
  title: string;
  sector: string; // 2-digit sector code this rolls up to
}

export const NAICS_SECTORS: NaicsSector[] = [
  { code: '11', title: 'Agriculture, Forestry, Fishing and Hunting', dnbSlug: 'agriculture-forestry-fishing-and-hunting' },
  { code: '21', title: 'Mining, Quarrying, and Oil and Gas Extraction', dnbSlug: 'mining-quarrying-and-oil-and-gas-extraction' },
  { code: '22', title: 'Utilities', dnbSlug: 'utilities' },
  { code: '23', title: 'Construction', dnbSlug: 'construction' },
  { code: '31', title: 'Manufacturing', dnbSlug: 'manufacturing' },
  { code: '42', title: 'Wholesale Trade', dnbSlug: 'wholesale-trade' },
  { code: '44', title: 'Retail Trade', dnbSlug: 'retail-trade' },
  { code: '48', title: 'Transportation and Warehousing', dnbSlug: 'transportation-and-warehousing' },
  { code: '51', title: 'Information', dnbSlug: 'information' },
  { code: '52', title: 'Finance and Insurance', dnbSlug: 'finance-and-insurance' },
  { code: '53', title: 'Real Estate and Rental and Leasing', dnbSlug: 'real-estate-and-rental-and-leasing' },
  { code: '54', title: 'Professional, Scientific, and Technical Services', dnbSlug: 'professional-scientific-and-technical-services' },
  { code: '55', title: 'Management of Companies and Enterprises', dnbSlug: 'management-of-companies-and-enterprises' },
  { code: '56', title: 'Administrative, Support, Waste Management and Remediation', dnbSlug: 'administrative-and-support-and-waste-management-and-remediation-services' },
  { code: '61', title: 'Educational Services', dnbSlug: 'educational-services' },
  { code: '62', title: 'Health Care and Social Assistance', dnbSlug: 'health-care-and-social-assistance' },
  { code: '71', title: 'Arts, Entertainment, and Recreation', dnbSlug: 'arts-entertainment-and-recreation' },
  { code: '72', title: 'Accommodation and Food Services', dnbSlug: 'accommodation-and-food-services' },
  { code: '81', title: 'Other Services (except Public Administration)', dnbSlug: 'other-services-except-public-administration' },
  { code: '92', title: 'Public Administration', dnbSlug: 'public-administration' },
];

export const NAICS_COMMON: NaicsCode[] = [
  // Agriculture
  { code: '1111', title: 'Oilseed and Grain Farming', sector: '11' },
  { code: '1151', title: 'Support Activities for Crop Production', sector: '11' },
  // Mining / energy
  { code: '2111', title: 'Oil and Gas Extraction', sector: '21' },
  { code: '2211', title: 'Electric Power Generation, Transmission and Distribution', sector: '22' },
  // Construction
  { code: '2361', title: 'Residential Building Construction', sector: '23' },
  { code: '2362', title: 'Nonresidential Building Construction', sector: '23' },
  { code: '2382', title: 'Building Equipment Contractors', sector: '23' },
  // Manufacturing
  { code: '3118', title: 'Bakeries and Tortilla Manufacturing', sector: '31' },
  { code: '3254', title: 'Pharmaceutical and Medicine Manufacturing', sector: '31' },
  { code: '3341', title: 'Computer and Peripheral Equipment Manufacturing', sector: '31' },
  { code: '3345', title: 'Navigational, Measuring, Electromedical & Control Instruments', sector: '31' },
  { code: '3361', title: 'Motor Vehicle Manufacturing', sector: '31' },
  // Wholesale
  { code: '4231', title: 'Motor Vehicle and Parts Wholesalers', sector: '42' },
  { code: '4234', title: 'Professional & Commercial Equipment Wholesalers', sector: '42' },
  // Retail
  { code: '4451', title: 'Grocery Stores', sector: '44' },
  { code: '4481', title: 'Clothing Stores', sector: '44' },
  { code: '4541', title: 'Electronic Shopping and Mail-Order Houses', sector: '44' },
  // Transportation
  { code: '4811', title: 'Scheduled Air Transportation', sector: '48' },
  { code: '4841', title: 'General Freight Trucking', sector: '48' },
  { code: '4931', title: 'Warehousing and Storage', sector: '48' },
  // Information
  { code: '5112', title: 'Software Publishers', sector: '51' },
  { code: '5121', title: 'Motion Picture and Video Industries', sector: '51' },
  { code: '5151', title: 'Radio and Television Broadcasting', sector: '51' },
  { code: '5179', title: 'Other Telecommunications', sector: '51' },
  { code: '5182', title: 'Data Processing, Hosting, and Related Services', sector: '51' },
  { code: '5191', title: 'Web Search Portals & Other Information Services', sector: '51' },
  // Finance & insurance
  { code: '5221', title: 'Depository Credit Intermediation (Banking)', sector: '52' },
  { code: '5231', title: 'Securities and Commodity Brokerage', sector: '52' },
  { code: '5242', title: 'Insurance Agencies and Brokerages', sector: '52' },
  // Real estate
  { code: '5311', title: 'Lessors of Real Estate', sector: '53' },
  { code: '5312', title: 'Offices of Real Estate Agents and Brokers', sector: '53' },
  // Professional services
  { code: '5411', title: 'Legal Services', sector: '54' },
  { code: '5412', title: 'Accounting, Tax Prep, Bookkeeping & Payroll', sector: '54' },
  { code: '5413', title: 'Architectural, Engineering, and Related Services', sector: '54' },
  { code: '5414', title: 'Specialized Design Services', sector: '54' },
  { code: '5415', title: 'Computer Systems Design and Related Services', sector: '54' },
  { code: '541511', title: 'Custom Computer Programming Services', sector: '54' },
  { code: '541512', title: 'Computer Systems Design Services', sector: '54' },
  { code: '5416', title: 'Management, Scientific & Technical Consulting', sector: '54' },
  { code: '5417', title: 'Scientific Research and Development Services', sector: '54' },
  { code: '5418', title: 'Advertising, Public Relations, and Related Services', sector: '54' },
  // Management
  { code: '5511', title: 'Management of Companies and Enterprises', sector: '55' },
  // Administrative & support
  { code: '5611', title: 'Office Administrative Services', sector: '56' },
  { code: '5613', title: 'Employment Services', sector: '56' },
  { code: '5616', title: 'Investigation and Security Services', sector: '56' },
  // Education
  { code: '6111', title: 'Elementary and Secondary Schools', sector: '61' },
  { code: '6113', title: 'Colleges, Universities, and Professional Schools', sector: '61' },
  // Health care
  { code: '6211', title: 'Offices of Physicians', sector: '62' },
  { code: '6221', title: 'General Medical and Surgical Hospitals', sector: '62' },
  { code: '6231', title: 'Nursing Care Facilities', sector: '62' },
  // Arts & entertainment
  { code: '7111', title: 'Performing Arts Companies', sector: '71' },
  { code: '7139', title: 'Other Amusement and Recreation Industries', sector: '71' },
  // Accommodation & food
  { code: '7211', title: 'Traveler Accommodation (Hotels)', sector: '72' },
  { code: '7225', title: 'Restaurants and Other Eating Places', sector: '72' },
  // Other services
  { code: '8111', title: 'Automotive Repair and Maintenance', sector: '81' },
  { code: '8121', title: 'Personal Care Services', sector: '81' },
  // Public administration
  { code: '9211', title: 'Executive, Legislative & Other General Government', sector: '92' },
];

const SECTOR_BY_CODE = new Map(NAICS_SECTORS.map((s) => [s.code, s]));

/** Map a NAICS code (any length) to its 2-digit sector, handling NAICS ranges. */
export function sectorForCode(code: string): NaicsSector | undefined {
  const two = code.slice(0, 2);
  // NAICS collapses some sectors into ranges; normalize to the canonical first code.
  const normalized: Record<string, string> = {
    '32': '31', '33': '31', // Manufacturing 31-33
    '45': '44', // Retail 44-45
    '49': '48', // Transportation 48-49
  };
  return SECTOR_BY_CODE.get(normalized[two] ?? two);
}

export function naicsTitle(code: string): string | undefined {
  if (!code) return undefined;
  const exact = NAICS_COMMON.find((c) => c.code === code);
  if (exact) return exact.title;
  return SECTOR_BY_CODE.get(code)?.title;
}
