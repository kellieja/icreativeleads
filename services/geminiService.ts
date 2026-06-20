

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

// Turn a raw API/SDK error into a short, friendly explanation for end users.
const describeApiError = (error: unknown): string => {
  const text = (error instanceof Error ? error.message : String(error)).toLowerCase();
  if (
    text.includes('credit') ||
    text.includes('billing') ||
    text.includes('prepayment') ||
    text.includes('depleted')
  ) {
    return 'Your Google API account is out of credits, so lookups can’t run. Add billing/credits in Google AI Studio (ai.studio/projects) for your project, then try again.';
  }
  if (
    text.includes('resource_exhausted') ||
    text.includes('quota') ||
    text.includes('rate') ||
    text.includes('429')
  ) {
    return 'Google is rate-limiting your account or you’ve hit a usage limit. Try a smaller list, wait a minute, or add billing in Google AI Studio.';
  }
  if (
    text.includes('api key') ||
    text.includes('api_key') ||
    text.includes('permission') ||
    text.includes('unauthenticated') ||
    text.includes('401') ||
    text.includes('403') ||
    text.includes('invalid')
  ) {
    return 'There’s a problem with your API key. Double-check the GEMINI_API_KEY in your Vercel project settings.';
  }
  return 'Couldn’t reach the Google API. Please check your connection and try again in a moment.';
};

// Retry a call a few times with backoff so a single transient hiccup doesn't
// surface as an error to the user.
const withRetry = async <T>(fn: () => Promise<T>, attempts = 3): Promise<T> => {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < attempts - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }
  throw lastError;
};

export const findCompanyUrls = async (
  names: string[],
  onProgress?: (completed: number, total: number) => void,
): Promise<CompanyUrlResult[]> => {
  const cleanedNames = names.map(n => n.trim()).filter(Boolean);

  if (cleanedNames.length === 0) {
    return [];
  }

  // Large lists can't be sent in a single request (response token limits and
  // timeouts), so we split the work into small batches and run a few in
  // parallel, reporting progress as each batch completes.
  const BATCH_SIZE = 40;
  const CONCURRENCY = 5;
  const MAX_ATTEMPTS = 3;

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const batches: string[][] = [];
  for (let i = 0; i < cleanedNames.length; i += BATCH_SIZE) {
    batches.push(cleanedNames.slice(i, i + BATCH_SIZE));
  }

  const fetchBatch = async (batch: string[]): Promise<CompanyUrlResult[]> => {
    const prompt = `You are a B2B data enrichment assistant. For each company name in the list below, find its official website homepage URL.

Rules:
- Return the canonical, official homepage URL for each company, including the "https://" scheme.
- Keep the "name" field exactly as provided in the input so results can be matched back.
- Return one entry per input name.
- If you cannot confidently identify the official website, return an empty string for the url and set "found" to false. Do not guess or invent a URL.
- Do not return social media profiles, directory listings, or news articles — only the company's own website.

Company names:
${batch.map((n, i) => `${i + 1}. ${n}`).join('\n')}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: companyUrlListSchema,
        maxOutputTokens: 8192,
      },
    });

    const jsonString = response.text.trim();
    return JSON.parse(jsonString) as CompanyUrlResult[];
  };

  // Align a batch's results back to its input names (by name, case-insensitive),
  // filling in any names the model dropped so every input gets exactly one row.
  const normalizeBatch = (batch: string[], result: CompanyUrlResult[]): CompanyUrlResult[] => {
    const byName = new Map<string, CompanyUrlResult>();
    for (const r of result || []) {
      if (r && typeof r.name === 'string') {
        byName.set(r.name.trim().toLowerCase(), r);
      }
    }
    return batch.map(name => {
      const match = byName.get(name.trim().toLowerCase());
      const ok = !!(match && match.found && match.url);
      return { name, url: ok ? match!.url : '', found: ok };
    });
  };

  const results: CompanyUrlResult[][] = new Array(batches.length);
  let completed = 0;
  let nextIndex = 0;
  let successfulBatches = 0;
  let firstError: unknown = null;

  const worker = async () => {
    while (true) {
      const current = nextIndex++;
      if (current >= batches.length) break;
      const batch = batches[current];

      let batchResult: CompanyUrlResult[] | null = null;
      let lastError: unknown = null;
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        try {
          batchResult = await fetchBatch(batch);
          break;
        } catch (error) {
          lastError = error;
          console.error(`Error finding URLs for batch ${current} (attempt ${attempt + 1}):`, error);
          if (attempt < MAX_ATTEMPTS - 1) {
            await sleep(1000 * (attempt + 1));
          }
        }
      }

      if (batchResult) {
        successfulBatches++;
        results[current] = normalizeBatch(batch, batchResult);
      } else {
        // The batch failed every attempt. Mark its names as "not found" so the
        // rest of the run continues, but remember the error in case nothing works.
        if (firstError === null) firstError = lastError;
        results[current] = batch.map(name => ({ name, url: '', found: false }));
      }

      completed += batch.length;
      onProgress?.(Math.min(completed, cleanedNames.length), cleanedNames.length);
    }
  };

  const workers = Array.from(
    { length: Math.min(CONCURRENCY, batches.length) },
    () => worker(),
  );
  await Promise.all(workers);

  // If every batch failed, surface the real reason instead of silently
  // returning a list of "not found" rows.
  if (successfulBatches === 0 && firstError !== null) {
    throw new Error(describeApiError(firstError));
  }

  return results.flat();
};

export const searchCompanies = async (criteria: SearchCriteria, isThinkingMode: boolean, excludeNames: string[] = []): Promise<CompanySearchResult[]> => {
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

    if (excludeNames.length > 0) {
      prompt += `\n\nDo NOT include any of these companies, which have already been shown: ${excludeNames.join(', ')}. Generate entirely different companies that still match the criteria.`;
    }

    const model = isThinkingMode ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
    const config = {
      responseMimeType: 'application/json',
      responseSchema: companyListSchema,
      ...(isThinkingMode && { thinkingConfig: { thinkingBudget: 32768 } }),
    };

    const response = await withRetry(() =>
      ai.models.generateContent({
        model,
        contents: prompt,
        config,
      }),
    );

    const jsonString = response.text?.trim();
    if (!jsonString) {
      throw new Error('The model returned an empty response.');
    }
    const data = JSON.parse(jsonString);
    return data as CompanySearchResult[];
  } catch (error) {
    console.error("Error searching companies:", error);
    throw new Error(describeApiError(error));
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

        const response = await withRetry(() =>
            ai.models.generateContent({
                model,
                contents: prompt,
                config
            }),
        );

        const jsonString = response.text?.trim();
        if (!jsonString) {
            throw new Error('The model returned an empty response.');
        }
        const data = JSON.parse(jsonString);
        return data as CompanyProfile;

    } catch (error) {
        console.error("Error getting company details:", error);
        throw new Error(describeApiError(error));
    }
};

// Fetch full profiles (incl. contacts/emails) for a list of companies, a few at
// a time, reporting progress. Used to build an enriched CSV export. A company
// whose profile can't be fetched is returned with empty contacts rather than
// failing the whole export.
export const fetchContactsForCompanies = async (
    companies: CompanySearchResult[],
    isThinkingMode: boolean,
    buyerIntentTopic?: string,
    onProgress?: (completed: number, total: number) => void,
): Promise<CompanyProfile[]> => {
    if (companies.length === 0) {
        return [];
    }

    const CONCURRENCY = 4;
    const results: CompanyProfile[] = new Array(companies.length);
    let completed = 0;
    let nextIndex = 0;

    const worker = async () => {
        while (true) {
            const current = nextIndex++;
            if (current >= companies.length) break;
            const company = companies[current];
            try {
                results[current] = await getCompanyDetails(company, isThinkingMode, buyerIntentTopic);
            } catch (error) {
                console.error(`Could not enrich "${company.name}":`, error);
                results[current] = {
                    ...company,
                    description: '',
                    website: '',
                    revenue: '',
                    employeeCount: '',
                    contacts: [],
                    buyerIntent: { score: 0, summary: '', signals: [] },
                    socialMedia: {},
                };
            }
            completed++;
            onProgress?.(completed, companies.length);
        }
    };

    await Promise.all(
        Array.from({ length: Math.min(CONCURRENCY, companies.length) }, () => worker()),
    );

    return results;
};