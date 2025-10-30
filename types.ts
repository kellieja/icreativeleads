
export interface Location {
  city: string;
  state: string;
  country: string;
}

export interface Contact {
  name: string;
  title: string;
  email: string;
}

export interface CompanySearchResult {
  name: string;
  location: Location;
  industry: string;
}

export interface SearchCriteria {
  keywords: string;
  industry: string;
  location: string;
  employeeCount: string;
  revenue: string;
  buyerIntent: string;
  buyerIntentTopic: string;
}

export interface BuyerIntent {
  score: number; // A score from 0 to 100
  summary: string; // A brief summary of intent signals
  signals: string[]; // A list of specific, detailed intent signals
}

export interface SocialMedia {
  linkedin?: string;
  twitter?: string;
  facebook?: string;
}

export interface CompanyProfile extends CompanySearchResult {
  description: string;
  website: string;
  revenue: string;
  employeeCount: string;
  contacts: Contact[];
  buyerIntent: BuyerIntent;
  socialMedia: SocialMedia;
}