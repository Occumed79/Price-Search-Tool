# Posted Price Clinic Search

A production-quality healthcare price transparency research tool that searches for clinics and returns only actual publicly posted prices for specific services.

## Architecture

### Monorepo Structure
- `artifacts/clinic-search/` — React + Vite frontend (MacOS Tahoe Glass UI, dark mode)
- `artifacts/api-server/` — Express 5 backend (TypeScript)
- `artifacts/mockup-sandbox/` — Canvas design sandbox (separate use)
- `lib/api-spec/` — OpenAPI 3.1 spec (source of truth)
- `lib/api-zod/` — Generated Zod validation schemas
- `lib/api-client-react/` — Generated React Query hooks
- `lib/db/` — Drizzle ORM + PostgreSQL schema

### Frontend (artifacts/clinic-search)
- **Stack:** React 19, Vite, Tailwind CSS v4, Framer Motion, react-simple-maps
- **Design:** MacOS Tahoe Glass — dark atmospheric background, frosted glass panels, cyan/green accents
- **Pages:**
  - `/` — Main search workspace: filter sidebar, search form, result cards grouped by bucket
  - `/saved` — Saved results gallery with interactive USA map showing clinic pin locations
  - `/searches` — Recent search history with status and result counts
  - `/settings` — Domain rules, search presets, API key docs
- **Features:** Real-time search polling, evidence drawer, manual review workflow, JSON export, USA map with colored pins

### Backend (artifacts/api-server)
- **Stack:** Node.js + Express 5, TypeScript, esbuild
- **Search Pipeline:** `src/services/searchPipeline.ts` — query builder, Serper/Tavily adapters, page fetcher, price extraction, false-positive filtering, result classification
- **Routes:** All defined in `src/routes/search.ts`

### Database Schema (lib/db)
Tables:
- `search_runs` — Search queries with status, result counts, debug log
- `price_results` — Extracted price results with location, price, source, evidence
- `saved_results` — User-saved results with notes
- `manual_reviews` — User verdicts (verified/questionable/wrong/no-longer-posted)
- `domain_rules` — Prefer/block domain rules
- `search_presets` — Saved search configurations

## API Endpoints
- `POST /api/search` — Start a new search (runs async pipeline)
- `GET /api/search/:id` — Get search + results (poll until complete)
- `GET /api/searches` — List recent searches
- `POST /api/save-result` — Save a result
- `GET /api/saved-results` — List saved results
- `DELETE /api/saved-results/:id` — Remove saved result
- `POST /api/manual-review` — Add manual verdict
- `GET /api/domain-rules` / `POST /api/domain-rules` / `DELETE /api/domain-rules/:id`
- `GET /api/search-presets` / `POST /api/search-presets` / `DELETE /api/search-presets/:id`
- `GET /api/export/:searchId` — Export results as JSON
- `GET /api/stats` — Usage statistics
- `GET /api/results/:searchId/map` — Map pin data for geocoded results

## Search Providers (API Keys)
Set environment variables to enable live search:
- `SERPER_API_KEY` — Google search via Serper.dev (primary)
- `TAVILY_API_KEY` — AI web search via Tavily (fallback)
- `FIRECRAWL_API_KEY` — Advanced crawling

Without keys, demo results are shown illustrating the tool's features.

## Price Extraction Rules
- Detects `$95`, `from $95`, `self-pay $95`, `cash price $95`, ranges like `$90-$120`
- Rejects false positives: "save $50", "call for pricing", insurance-only prices, wrong-service prices
- Classifies sources: direct_clinic > clinic_chain > marketplace > pdf > weak_reference
- Buckets results: posted_price | clinic_no_price | possible_match

## Key User Flows
1. Enter location + clinic type + service → results appear in ~5-15s
2. Green cards = confirmed posted price found; grayed = clinic found but no price
3. Click "Evidence" on any card → slide-in drawer with full URL, snippet, manual review
4. Click "Save" → result pinned to /saved page, appears as map pin
5. On /saved: USA map shows all saved clinics with colored pins by bucket type
6. Settings: add prefer/block domain rules, save search presets

## Design Principles
- Never show an estimated or averaged price — only real posted prices
- "No actual posted public prices were found" if nothing real found
- Source quality ranking: direct clinic websites rank above marketplaces
