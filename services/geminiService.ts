

import { GoogleGenAI, Type } from '@google/genai';
import { CompanySearchResult, CompanyProfile, SearchCriteria, CompanyUrlResult } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const companyListSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: 'Company name' },
      industry: { type: Type.STRING, description: 'Primary industry' },
      location: {
        type: Type.OBJECT,
        properties: {
          city: { type: Type.STRING },
          state: { type: Type.STRING },
          country: { type: Type.STRING },
        },
        required: ['city', 'state', 'country'],
      },
    },
    required: ['name', 'industry', 'location'],
  },
};

const companyProfileSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        industry: { type: Type.STRING },
        location: {
            type: Type.OBJECT,
            properties: {
                city: { type: Type.STRING },
                state: { type: Type.STRING },
                country: { type: Type.STRING },
            },
            required: ['city', 'state', 'country'],
        },
        description: { type: Type.STRING, description: "A brief 2-3 sentence overview of the company." },
        website: { type: Type.STRING, description: "A realistic but fictional website domain (e.g., 'acme-corp.com'). Do not include 'http://' or 'www.'." },
        revenue: { type: Type.STRING, description: "Estimated annual revenue range (e.g., '$50M - $100M')." },
        employeeCount: { type: Type.STRING, description: "Employee count range (e.g., '501-1,000')." },
        contacts: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "Full name of the contact." },
                    title: { type: Type.STRING, description: "Job title of the contact (e.g., 'CEO', 'VP of Marketing')." },
                    email: { type: Type.STRING, description: "A realistic but fictional email address for the contact, using varied patterns like 'first.last@domain.com', 'flast@domain.com', or 'firstinitial.last@domain.com' based on the contact's name and company domain." },
                },
                required: ['name', 'title', 'email'],
            },
        },
        buyerIntent: {
            type: Type.OBJECT,
            properties: {
                score: { type: Type.INTEGER, description: "A buyer intent score from 0 to 100, indicating the likelihood of purchasing business/sales software." },
                summary: { type: Type.STRING, description: "A 1-2 sentence summary explaining the signals behind the intent score (e.g., recent funding, hiring for sales roles, new product launches)." },
                signals: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.STRING,
                        description: "A specific, individual signal contributing to the score (e.g., 'Hiring for Sales Development roles')."
                    },
                    description: "A list of 3-5 specific signals that contribute to the buyer intent score."
                }
            },
            required: ['score', 'summary', 'signals'],
        },
        socialMedia: {
            type: Type.OBJECT,
            properties: {
                linkedin: { type: Type.STRING, description: "A fictional but realistic LinkedIn company page URL (e.g., 'https://www.linkedin.com/company/acme-corp'). Can be an empty string if not applicable." },
                twitter: { type: Type.STRING, description: "A fictional but realistic Twitter profile URL (e.g., 'https://twitter.com/AcmeCorp'). Can be an empty string if not applicable." },
                facebook: { type: Type.STRING, description: "A fictional but realistic Facebook page URL (e.g., 'https://www.facebook.com/AcmeCorporation'). Can be an empty string if not applicable." },
            },
        },
    },
    required: ['name', 'industry', 'location', 'description', 'website', 'revenue', 'employeeCount', 'contacts', 'buyerIntent', 'socialMedia'],
};


const companyUrlListSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: 'The company name exactly as it was provided in the input list.' },
      url: { type: Type.STRING, description: "The company's official website URL, including the 'https://' scheme (e.g., 'https://www.acme.com'). Use an empty string if the official website cannot be confidently determined." },
      found: { type: Type.BOOLEAN, description: 'True if a confident match for the official website was found, false otherwise.' },
    },
    required: ['name', 'url', 'found'],
  },
};

export const findCompanyUrls = async (names: string[]): Promise<CompanyUrlResult[]> => {
  try {
    const cleanedNames = names.map(n => n.trim()).filter(Boolean);

    if (cleanedNames.length === 0) {
      return [];
    }

    const prompt = `You are a B2B data enrichment assistant. For each company name in the list below, find its official website homepage URL.

Rules:
- Return the canonical, official homepage URL for each company, including the "https://" scheme.
- Keep the "name" field exactly as provided in the input so results can be matched back.
- Preserve the original order of the input list and return one entry per input name.
- If you cannot confidently identify the official website, return an empty string for the url and set "found" to false. Do not guess or invent a URL.
- Do not return social media profiles, directory listings, or news articles — only the company's own website.

Company names:
${cleanedNames.map((n, i) => `${i + 1}. ${n}`).join('\n')}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: companyUrlListSchema,
      },
    });

    const jsonString = response.text.trim();
    const data = JSON.parse(jsonString);
    return data as CompanyUrlResult[];
  } catch (error) {
    console.error("Error finding company URLs:", error);
    throw new Error("Failed to fetch company URLs from Gemini API.");
  }
};

export const searchCompanies = async (criteria: SearchCriteria, isThinkingMode: boolean): Promise<CompanySearchResult[]> => {
  try {
    let prompt = 'Generate a list of 10 fictional but realistic companies based on the following criteria:';
    
    let hasCriteria = false;
    if (criteria.keywords) {
      prompt += `\n- Keywords or Name: "${criteria.keywords}"`;
      hasCriteria = true;
    }
    if (criteria.industry) {
      prompt += `\n- Industry: "${criteria.industry}"`;
      hasCriteria = true;
    }
    if (criteria.location) {
      prompt += `\n- Location: "${criteria.location}"`;
      hasCriteria = true;
    }
    if (criteria.employeeCount && criteria.employeeCount !== 'Any') {
      prompt += `\n- Employee Count: "${criteria.employeeCount}"`;
      hasCriteria = true;
    }
    if (criteria.revenue && criteria.revenue !== 'Any') {
      prompt += `\n- Annual Revenue: "${criteria.revenue}"`;
      hasCriteria = true;
    }
    if (criteria.buyerIntent && criteria.buyerIntent !== 'Any') {
      prompt += `\n- Buyer Intent Level: "${criteria.buyerIntent}"`;
      hasCriteria = true;
    }
    if (criteria.buyerIntentTopic) {
        prompt += `\n- Showing buyer intent for the topic: "${criteria.buyerIntentTopic}"`;
        hasCriteria = true;
    }

    if (!hasCriteria) {
        prompt = 'Generate a list of 10 diverse, fictional but realistic companies from various industries and locations.'
    }
    
    prompt += '\n\nFor each company, provide its name, primary industry, and location (city, state, country).';
    
    const model = isThinkingMode ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
    const config = {
      responseMimeType: 'application/json',
      responseSchema: companyListSchema,
      ...(isThinkingMode && { thinkingConfig: { thinkingBudget: 32768 } }),
    };

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config,
    });

    const jsonString = response.text.trim();
    const data = JSON.parse(jsonString);
    return data as CompanySearchResult[];
  } catch (error) {
    console.error("Error searching companies:", error);
    throw new Error("Failed to fetch company list from Gemini API.");
  }
};

export const getCompanyDetails = async (company: CompanySearchResult, isThinkingMode: boolean, buyerIntentTopic?: string): Promise<CompanyProfile> => {
    try {
        let prompt = `Generate a detailed profile for the fictional company "${company.name}", which is in the "${company.industry}" industry and located in ${company.location.city}, ${company.location.state}. Provide a company description, a fake website, estimated revenue, employee count, and a list of 5 key contacts with their names, job titles, and fictional but realistic email addresses. Also include fictional but realistic social media links for LinkedIn, Twitter, and Facebook. Additionally, generate a buyer intent score (0-100), a summary explaining the score, and a list of 3-5 specific, realistic but fictional signals that justify the score.`;

        if (buyerIntentTopic) {
            prompt += ` The buyer intent score and signals should specifically reflect the company's likelihood to purchase solutions related to "${buyerIntentTopic}". The signals should be realistic but fictional and justify the score in this context (e.g., 'Hiring engineers with experience in ${buyerIntentTopic}', 'Their CTO mentioned challenges related to ${buyerIntentTopic} in a recent interview').`;
        } else {
            prompt += ` The intent score should reflect the company's likelihood to purchase new business intelligence or sales software. The signals should be realistic but fictional and justify the score (e.g., 'Recent $50M Series B funding', 'Hiring for 10+ Account Executive roles', 'Published a new case study on scaling their sales team').`;
        }


        const model = isThinkingMode ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
        const config = {
          responseMimeType: 'application/json',
          responseSchema: companyProfileSchema,
          ...(isThinkingMode && { thinkingConfig: { thinkingBudget: 32768 } }),
        };

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config
        });

        const jsonString = response.text.trim();
        const data = JSON.parse(jsonString);
        return data as CompanyProfile;

    } catch (error) {
        console.error("Error getting company details:", error);
        throw new Error("Failed to fetch company details from Gemini API.");
    }
};