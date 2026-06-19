# IntelliLeads — Business Directory Scraper

Pull company data from a business directory by **country** and **NAICS category**,
view rich company profiles (name, website, contacts/CEO, emails, revenue, employee
stats, and more), and export results to **CSV or JSON**.

It ships with a provider abstraction so you can switch the data source:

| Provider | Key | Needs a key? | Notes |
| --- | --- | --- | --- |
| **Demo (synthetic)** | `demo` | No | Key-free, deterministic data shaped like real records. Works out of the box. |
| **Explorium** (Vibe Prospecting) | `explorium` | `EXPLORIUM_API_KEY` | Licensed data: companies + prospects with emails, NAICS + country filters, firmographics. |
| **Apollo.io** | `apollo` | `APOLLO_API_KEY` | Licensed B2B database. NAICS + HQ-location filters; revenue, headcount, socials. |
| **D&B scraper** | `dnb` | Gateway recommended | Scrapes `dnb.com/business-directory`. See the warning below. |

## ⚠️ About scraping dnb.com

`dnb.com` sits behind enterprise bot protection and returns **HTTP 403** to plain
requests, and scraping it runs against **D&B's Terms of Service** (their directory
is a licensed product). The `dnb` provider is included as requested and is fully
implemented (URL construction from country + NAICS, listing + profile parsing),
but to actually retrieve data you must route requests through a rendering/anti-bot
gateway via `DNB_SCRAPER_GATEWAY` (ScrapingBee, ScraperAPI, Bright Data, Zyte, …).

For reliable, compliant results, prefer the **Explorium** or **Apollo** providers —
they return the same fields (and real contact emails) through licensed APIs.

## Architecture

```
server/                 Express + TypeScript API (the scraper backend)
  index.ts              /api/meta, /api/search, /api/company, /api/export
  providers/            demo, explorium, apollo, dnb (D&B scraper)
  data/                 countries + NAICS reference data (sector → D&B slug map)
  csv.ts                CSV serialization (one row per contact)
  types.ts              normalized Company model every provider returns
App.tsx, components/     React UI (country/NAICS/provider pickers, results, export)
services/apiService.ts  frontend → backend client
```

The frontend talks to the backend over `/api`, which Vite proxies to the API port
in development.

## Run locally

**Prerequisites:** Node.js 20+

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure providers (optional — the `demo` source needs nothing):
   ```bash
   cp .env.example .env
   # then fill in APOLLO_API_KEY / EXPLORIUM_API_KEY / DNB_SCRAPER_GATEWAY as needed
   ```
3. Run the API and the web app together:
   ```bash
   npm run dev:all
   ```
   - Web app: http://localhost:3000
   - API: http://localhost:4000

   Or run them separately: `npm run server` and `npm run dev`.

## Using the D&B scraper (on your own machine)

dnb.com blocks cloud/datacenter requests, so the `dnb` provider routes through a
scraping gateway. Run this on a normal computer (not a locked-down cloud sandbox)
so the gateway host is reachable.

1. Get a **ScraperAPI** key (free trial) at https://www.scraperapi.com/.
2. In your `.env`, set the gateway (D&B is a hard target — keep `render` and
   `premium` on):
   ```env
   DNB_SCRAPER_GATEWAY=https://api.scraperapi.com/?api_key=YOUR_KEY&render=true&premium=true&url={url}
   ```
3. `npm run dev:all`, open http://localhost:3000, pick **Data Source → D&B
   Business Directory (scraper)**, choose a country + NAICS, and search.

If results come back empty or blocked, bump `premium=true` to `ultra_premium=true`
in the gateway URL. The scraper parses what D&B exposes (name, profile URL,
location, revenue/employee hints, and key principals); licensed providers return
more complete contact/email data.

## Usage

1. Choose a **Data Source**, **Country**, and **NAICS Category** (type to filter; you
   can also enter any NAICS code directly).
2. Click **Search Directory**.
3. Click a result to open its full profile (enriched on demand for providers that
   support it).
4. Select rows (or "Select all") and **Export CSV / JSON**. The per-company export
   buttons on a profile export just that company.

## API reference

| Endpoint | Method | Body | Returns |
| --- | --- | --- | --- |
| `/api/meta` | GET | – | countries, NAICS sectors + common codes, provider availability |
| `/api/search` | POST | `{ provider, countryCode, naicsCode, keywords?, limit? }` | `{ companies[], total?, warnings? }` |
| `/api/company` | POST | `{ provider, company }` | enriched `Company` |
| `/api/export` | POST | `{ companies[], format: "csv" \| "json" }` | file download |

## Environment variables

See [`.env.example`](.env.example). Key ones:

- `SCRAPER_PORT` — API port (default `4000`).
- `APOLLO_API_KEY`, `EXPLORIUM_API_KEY` — licensed provider keys.
- `DNB_SCRAPER_GATEWAY` — anti-bot gateway URL template (`{url}` placeholder) for the D&B scraper.
- `DNB_USER_AGENT` — optional custom UA for direct D&B requests.
