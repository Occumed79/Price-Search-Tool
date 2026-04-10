import { db } from "@workspace/db";
import {
  searchRunsTable,
  priceResultsTable,
  domainRulesTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const SERPER_API_KEY = process.env.SERPER_API_KEY;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const EXA_API_KEY = process.env.EXA_API_KEY;
const BROWSE_AI_API_KEY = process.env.BROWSE_AI_API_KEY;
const BROWSER_USE_API_KEY = process.env.BROWSER_USE_API_KEY;
const OLOSTEP_API_KEY = process.env.OLOSTEP_API_KEY;
const CLOD_API_KEY = process.env.CLOD_API_KEY;
const BROWSE_AI_SEARCH_URL = process.env.BROWSE_AI_SEARCH_URL;
const BROWSER_USE_SEARCH_URL = process.env.BROWSER_USE_SEARCH_URL;
const OLOSTEP_SEARCH_URL = process.env.OLOSTEP_SEARCH_URL;
const CLOD_SEARCH_URL = process.env.CLOD_SEARCH_URL;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OPENROUTER_KEY = process.env.OPENROUTER_KEY ?? process.env.OPENROUTER_API_KEY;

type SearchHit = { url: string; title: string; snippet: string };

async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  timeoutMs = 8000,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

interface SearchParams {
  location: string;
  radiusMiles: number;
  clinicType: string;
  serviceType: string;
  freeText?: string;
  postedPricesOnly: boolean;
  directClinicOnly: boolean;
  includePdfs: boolean;
  includeMarketplaces: boolean;
  verifiedEvidenceOnly: boolean;
  sortBy: string;
}

interface SearchResult {
  clinicName: string;
  clinicType: string;
  location: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  requestedService: string;
  postedPrice?: string;
  priceMin?: number;
  priceMax?: number;
  priceSnippet?: string;
  sourceUrl?: string;
  pageTitle?: string;
  sourceBucket: "posted_price" | "clinic_no_price" | "possible_match";
  sourceType: "direct_clinic" | "clinic_chain" | "marketplace" | "pdf" | "rendered_js" | "weak_reference";
  isPdf: boolean;
  isRendered: boolean;
  extractionNotes?: string;
  matchedServicePhrase?: string;
}

interface DebugEntry {
  query: string;
  provider: string;
  urlsSearched: string[];
  status: string;
  notes?: string;
}

const SERVICE_ALIASES: Record<string, string[]> = {
  "treadmill stress test": ["exercise stress test", "cardiac stress test", "treadmill test"],
  "physical exam": ["annual physical", "sports physical", "pre-employment physical", "wellness exam"],
  "dental exam": ["new patient exam", "comprehensive exam", "dental evaluation"],
  "dot physical": ["cdl exam", "fmcsa physical", "dot exam", "cdl physical"],
  "faa medical exam": ["aviation medical", "ame exam", "faa medical", "flight physical"],
  "urgent care visit": ["urgent care", "walk-in visit", "self-pay urgent care"],
  "office visit": ["clinic visit", "primary care visit", "provider visit"],
  "mammogram": ["mammography", "breast screening", "breast x-ray"],
  "drug screen": ["urine drug test", "drug test", "substance screening"],
  "tb test": ["tuberculosis test", "ppd test", "mantoux test"],
};

const TRANSPARENT_DOMAINS = [
  "mdsave.com",
  "sesamecare.com",
  "solv.com",
  "zocdoc.com",
  "cvs.com",
  "minuteclinic.com",
  "walgreens.com",
  "concentra.com",
  "carenow.com",
  "newchoicehealth.com",
  "rediclinicclinics.com",
  "gohealthuc.com",
  "citymd.com",
  "fastmed.com",
  "urgentteam.com",
  "nextcare.com",
];

const MARKETPLACE_DOMAINS = ["mdsave.com", "sesamecare.com", "solv.com", "zocdoc.com", "newchoicehealth.com"];
const LOW_QUALITY_HOST_PATTERNS = [
  /wikipedia\.org$/i,
  /reddit\.com$/i,
  /youtube\.com$/i,
  /facebook\.com$/i,
  /instagram\.com$/i,
  /linkedin\.com$/i,
  /yelp\.com$/i,
];
const PRICE_PAGE_HINTS = ["price", "pricing", "self-pay", "cash", "fee", "fees", "transparency", "cost"];

function buildQueries(params: SearchParams): string[] {
  const { location, clinicType, serviceType, freeText } = params;
  const queries: string[] = [];
  const aliases = SERVICE_ALIASES[serviceType.toLowerCase()] || [];
  const allServices = [serviceType, ...aliases];

  for (const service of allServices.slice(0, 2)) {
    queries.push(`"${service}" price ${location} ${clinicType} site:* self-pay cash`);
    queries.push(`${service} cash price ${location} ${clinicType}`);
    queries.push(`${service} posted price fee schedule ${location}`);
    queries.push(`${clinicType} ${location} ${service} "$" pricing`);
  }

  queries.push(`${serviceType} price ${location} PDF fee schedule`);
  queries.push(`${clinicType} chain ${serviceType} pricing page`);

  if (freeText) {
    queries.push(`${freeText} ${location} price posted`);
  }

  return queries.slice(0, 6);
}

async function searchWithSerper(query: string): Promise<SearchHit[]> {
  if (!SERPER_API_KEY) return [];
  try {
    const response = await fetchWithTimeout("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: query, num: 10 }),
    }, 7000);
    if (!response.ok) return [];
    const data = (await response.json()) as { organic?: Array<{ link: string; title: string; snippet: string }> };
    return (data.organic || []).map((r) => ({
      url: r.link,
      title: r.title,
      snippet: r.snippet,
    }));
  } catch {
    return [];
  }
}

async function searchWithTavily(query: string): Promise<SearchHit[]> {
  if (!TAVILY_API_KEY) return [];
  try {
    const response = await fetchWithTimeout("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query,
        search_depth: "basic",
        max_results: 10,
      }),
    }, 7000);
    if (!response.ok) return [];
    const data = (await response.json()) as { results?: Array<{ url: string; title: string; content: string }> };
    return (data.results || []).map((r) => ({
      url: r.url,
      title: r.title,
      snippet: r.content,
    }));
  } catch {
    return [];
  }
}

function normalizeSearchHits(items: Array<{ url?: string; link?: string; title?: string; snippet?: string; content?: string; text?: string }>): SearchHit[] {
  return items
    .map((item) => ({
      url: item.url || item.link || "",
      title: item.title || "",
      snippet: item.snippet || item.content || item.text || "",
    }))
    .filter((item) => item.url.startsWith("http"));
}

function extractHitsFromUnknownPayload(payload: unknown): SearchHit[] {
  const hits: SearchHit[] = [];
  const visited = new Set<unknown>();

  const walk = (node: unknown): void => {
    if (!node || typeof node !== "object" || visited.has(node)) return;
    visited.add(node);

    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }

    const record = node as Record<string, unknown>;
    const urlValue = typeof record.url === "string"
      ? record.url
      : typeof record.link === "string"
        ? record.link
        : undefined;

    if (urlValue?.startsWith("http")) {
      const titleValue = typeof record.title === "string" ? record.title : "";
      const snippetValue =
        typeof record.snippet === "string"
          ? record.snippet
          : typeof record.content === "string"
            ? record.content
            : typeof record.text === "string"
              ? record.text
              : "";
      hits.push({ url: urlValue, title: titleValue, snippet: snippetValue });
    }

    for (const value of Object.values(record)) {
      walk(value);
    }
  };

  walk(payload);
  return hits.slice(0, 15);
}

async function searchWithExa(query: string): Promise<SearchHit[]> {
  if (!EXA_API_KEY) return [];
  try {
    const response = await fetchWithTimeout("https://api.exa.ai/search", {
      method: "POST",
      headers: {
        "x-api-key": EXA_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        numResults: 10,
        type: "keyword",
      }),
    }, 7000);
    if (!response.ok) return [];
    const data = (await response.json()) as { results?: Array<{ url?: string; title?: string; text?: string }> };
    return normalizeSearchHits(data.results || []);
  } catch {
    return [];
  }
}

async function searchWithGenericProvider(
  provider: "browseai" | "browseruse" | "olostep" | "clod",
  query: string,
): Promise<SearchHit[]> {
  const config = {
    browseai: {
      key: BROWSE_AI_API_KEY,
      endpoint: BROWSE_AI_SEARCH_URL,
    },
    browseruse: {
      key: BROWSER_USE_API_KEY,
      endpoint: BROWSER_USE_SEARCH_URL,
    },
    olostep: {
      key: OLOSTEP_API_KEY,
      endpoint: OLOSTEP_SEARCH_URL,
    },
    clod: {
      key: CLOD_API_KEY,
      endpoint: CLOD_SEARCH_URL,
    },
  }[provider];

  if (!config.key || !config.endpoint) return [];

  try {
    const response = await fetchWithTimeout(config.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        maxResults: 10,
      }),
    }, 5000);
    if (!response.ok) return [];
    const data = await response.json();
    return extractHitsFromUnknownPayload(data);
  } catch {
    return [];
  }
}

async function fetchPageWithFirecrawl(url: string): Promise<{ text: string; isPdf: boolean } | null> {
  if (!FIRECRAWL_API_KEY) return null;
  try {
    const response = await fetchWithTimeout("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown", "html"],
      }),
    }, 9000);
    if (!response.ok) return null;
    const data = (await response.json()) as {
      data?: {
        markdown?: string;
        content?: string;
        html?: string;
        metadata?: { sourceURL?: string };
      };
    };
    const text = data.data?.markdown || data.data?.content || data.data?.html;
    if (!text) return null;
    const isPdf = url.toLowerCase().endsWith(".pdf");
    const cleaned = text.replace(/\s+/g, " ").slice(0, 20000);
    return { text: cleaned, isPdf };
  } catch {
    return null;
  }
}

async function fetchPage(url: string): Promise<{ text: string; isPdf: boolean } | null> {
  const firecrawlResult = await fetchPageWithFirecrawl(url);
  if (firecrawlResult) return firecrawlResult;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ClinicPriceBot/1.0)",
        Accept: "text/html,application/pdf,*/*",
      },
    });
    clearTimeout(timeout);
    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") || "";
    const isPdf = contentType.includes("pdf") || url.toLowerCase().endsWith(".pdf");

    if (isPdf) {
      return { text: "[PDF document — price extraction attempted]", isPdf: true };
    }

    const text = await response.text();
    const cleaned = text
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .slice(0, 20000);
    return { text: cleaned, isPdf: false };
  } catch {
    return null;
  }
}

const PRICE_PATTERNS = [
  /\$\s*(\d{1,4}(?:\.\d{2})?)/g,
  /from\s+\$\s*(\d{1,4}(?:\.\d{2})?)/gi,
  /starting\s+at\s+\$\s*(\d{1,4}(?:\.\d{2})?)/gi,
  /self[-\s]pay\s+\$\s*(\d{1,4}(?:\.\d{2})?)/gi,
  /cash\s+price[:\s]+\$\s*(\d{1,4}(?:\.\d{2})?)/gi,
  /(\d{1,4}(?:\.\d{2})?)\s+(?:per|each|\/)/gi,
];

const FALSE_POSITIVE_PATTERNS = [
  /save\s+\$\d+/i,
  /call\s+for\s+pricing/i,
  /insurance\s+only/i,
  /members?\s+only/i,
  /discount\s+\$\d+\s+off/i,
  /retail\s+value/i,
  /msrp/i,
  /average\s+cost/i,
  /typically\s+ranges?/i,
  /may\s+vary/i,
  /estimated?/i,
];

function hasStrongServiceMatch(text: string, serviceType: string, freeText?: string): boolean {
  const normalized = text.toLowerCase();
  const service = serviceType.toLowerCase().trim();
  if (normalized.includes(service)) return true;

  const aliases = SERVICE_ALIASES[service] || [];
  if (aliases.some((alias) => normalized.includes(alias.toLowerCase()))) return true;

  const serviceTokens = service
    .split(/\s+/)
    .filter((token) => token.length >= 4 && !["visit", "test", "exam", "care"].includes(token));

  const tokenMatches = serviceTokens.filter((token) => normalized.includes(token));
  if (serviceTokens.length > 0 && tokenMatches.length >= Math.max(1, Math.ceil(serviceTokens.length * 0.6))) {
    return true;
  }

  if (freeText) {
    const freeTokens = freeText
      .toLowerCase()
      .split(/\s+/)
      .filter((token) => token.length >= 4);
    if (freeTokens.some((token) => normalized.includes(token))) return true;
  }

  return false;
}

function isLikelyEstimatedPrice(snippet: string | undefined): boolean {
  if (!snippet) return false;
  return [
    /average/i,
    /typically/i,
    /range/i,
    /may vary/i,
    /estimated?/i,
    /about\s+\$/i,
    /approximately/i,
  ].some((pattern) => pattern.test(snippet));
}

function extractPrices(
  text: string,
  serviceType: string,
  _freeText?: string,
): Array<{ price: string; min: number; max: number; snippet: string; phrase: string }> {
  const results = [];
  const aliases = SERVICE_ALIASES[serviceType.toLowerCase()] || [];
  const allServices = [serviceType, ...aliases];

  for (const pattern of PRICE_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const idx = match.index;
      const context = text.slice(Math.max(0, idx - 150), idx + 150);

      if (FALSE_POSITIVE_PATTERNS.some((fp) => fp.test(context))) continue;

      const hasServiceContext = allServices.some((s) =>
        context.toLowerCase().includes(s.toLowerCase().split(" ")[0]),
      );
      if (!hasServiceContext) continue;

      const priceStr = match[1] || match[0];
      const priceNum = parseFloat(priceStr.replace(/[$,]/g, ""));
      if (priceNum < 5 || priceNum > 50000) continue;

      const rawMatch = match[0];

      results.push({
        price: rawMatch.startsWith("$") ? rawMatch : `$${priceNum.toFixed(2)}`,
        min: priceNum,
        max: priceNum,
        snippet: context.trim(),
        phrase: serviceType,
      });

      if (results.length >= 3) break;
    }
    if (results.length >= 3) break;
  }

  return results;
}

interface AiPriceResult {
  hasPostedPrice: boolean;
  price: string | null;
  priceMin: number | null;
  priceMax: number | null;
  snippet: string | null;
  provider: string;
}

const AI_PRICE_PROMPT = (serviceType: string, clinicType: string, text: string) => `You are a healthcare price transparency expert. Analyze the webpage text below and determine if it contains an actual publicly posted cash or self-pay price for "${serviceType}" at a ${clinicType}.

Rules:
- Only return hasPostedPrice=true if you see an explicit dollar amount posted as a price
- "Call for pricing", estimates, ranges without numbers, insurance rates = NOT a posted price
- Any "average cost", "typically ranges", or "may vary" language = NOT a posted price
- A real posted price looks like: "$89", "Self-pay: $95", "Cash price $110", "$75-$120"
- Extract the price exactly as written in the text

Respond ONLY with valid JSON (no markdown, no explanation):
{"hasPostedPrice":boolean,"price":"string or null","priceMin":number_or_null,"priceMax":number_or_null,"snippet":"exact text containing price or null"}

Webpage text (truncated):
${text.slice(0, 3000)}`;

async function aiExtractPriceWithGroq(text: string, serviceType: string, clinicType: string): Promise<AiPriceResult | null> {
  if (!GROQ_API_KEY) return null;
  try {
    const response = await fetchWithTimeout("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: AI_PRICE_PROMPT(serviceType, clinicType, text) }],
        temperature: 0,
        max_tokens: 200,
        response_format: { type: "json_object" },
      }),
    }, 9000);
    if (!response.ok) return null;
    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content) as AiPriceResult;
    return { ...parsed, provider: "groq" };
  } catch {
    return null;
  }
}

async function aiExtractPriceWithOpenRouter(text: string, serviceType: string, clinicType: string): Promise<AiPriceResult | null> {
  if (!OPENROUTER_KEY) return null;
  try {
    const response = await fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://postedpriceclinicsearch.replit.app",
        "X-Title": "Posted Price Clinic Search",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-8b-instruct:free",
        messages: [{ role: "user", content: AI_PRICE_PROMPT(serviceType, clinicType, text) }],
        temperature: 0,
        max_tokens: 200,
      }),
    }, 9000);
    if (!response.ok) return null;
    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]) as AiPriceResult;
    return { ...parsed, provider: "openrouter" };
  } catch {
    return null;
  }
}

async function aiExtractPrice(text: string, serviceType: string, clinicType: string): Promise<AiPriceResult | null> {
  const groqResult = await aiExtractPriceWithGroq(text, serviceType, clinicType);
  if (groqResult) return groqResult;
  return aiExtractPriceWithOpenRouter(text, serviceType, clinicType);
}

function classifySourceType(url: string): "direct_clinic" | "clinic_chain" | "marketplace" | "pdf" | "weak_reference" {
  if (url.toLowerCase().endsWith(".pdf")) return "pdf";
  if (MARKETPLACE_DOMAINS.some((d) => url.includes(d))) return "marketplace";
  if (TRANSPARENT_DOMAINS.some((d) => url.includes(d) && !MARKETPLACE_DOMAINS.includes(d))) return "clinic_chain";
  if (url.includes("location") || url.includes("clinic") || url.includes("office")) return "direct_clinic";
  return "weak_reference";
}

function isHighConfidenceUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace("www.", "");
    if (LOW_QUALITY_HOST_PATTERNS.some((pattern) => pattern.test(host))) return false;

    const full = `${host}${parsed.pathname}`.toLowerCase();
    const hasPriceHint = PRICE_PAGE_HINTS.some((hint) => full.includes(hint));
    const isMarketplace = MARKETPLACE_DOMAINS.some((d) => host.includes(d));
    const isClinicLike =
      host.includes("clinic") ||
      host.includes("medical") ||
      host.includes("health") ||
      host.includes("urgent") ||
      host.includes("care");

    return hasPriceHint || isMarketplace || isClinicLike;
  } catch {
    return false;
  }
}

function shouldSkipWeakSnippet(snippet: string): boolean {
  const text = snippet.toLowerCase();
  return (
    text.includes("average cost") ||
    text.includes("typically ranges") ||
    text.includes("may vary") ||
    text.includes("estimate") ||
    text.includes("general information")
  );
}

function classifySourceBucket(
  prices: ReturnType<typeof extractPrices>,
  hasClinicContext: boolean,
): "posted_price" | "clinic_no_price" | "possible_match" {
  if (prices.length > 0) return "posted_price";
  if (hasClinicContext) return "clinic_no_price";
  return "possible_match";
}

function extractClinicName(title: string, url: string): string {
  if (title && title.length > 2) {
    return title.split("|")[0].split("-")[0].trim().slice(0, 80);
  }
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    return hostname.split(".")[0];
  } catch {
    return "Unknown Clinic";
  }
}

function parseLocation(locationStr: string): { city?: string; state?: string; zip?: string } {
  const zipMatch = locationStr.match(/\b(\d{5})\b/);
  const stateMatch = locationStr.match(/\b([A-Z]{2})\b/);
  const parts = locationStr.split(",").map((p) => p.trim());

  return {
    zip: zipMatch?.[1],
    state: stateMatch?.[1] || parts[1]?.trim(),
    city: parts[0],
  };
}

async function geocodeLocation(location: string): Promise<{ lat?: number; lng?: number }> {
  try {
    const encoded = encodeURIComponent(location + " USA");
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`,
      {
        headers: { "User-Agent": "PostedPriceClinicSearch/1.0" },
      },
    );
    if (!response.ok) return {};
    const data = (await response.json()) as Array<{ lat: string; lon: string }>;
    if (data[0]) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch {
    // ignore
  }
  return {};
}

export async function runSearch(searchId: number, params: SearchParams): Promise<void> {
  const debugLog: DebugEntry[] = [];

  try {
    await db
      .update(searchRunsTable)
      .set({ status: "running" })
      .where(eq(searchRunsTable.id, searchId));

    const blockedDomains = await db
      .select()
      .from(domainRulesTable)
      .where(eq(domainRulesTable.ruleType, "block"));
    const blockedSet = new Set(blockedDomains.map((r) => r.domain));

    const preferredDomains = await db
      .select()
      .from(domainRulesTable)
      .where(eq(domainRulesTable.ruleType, "prefer"));
    const preferredSet = new Set(preferredDomains.map((r) => r.domain));

    const queries = buildQueries(params);
    const allUrls = new Set<string>();
    const urlResults: SearchHit[] = [];
    const hasAnySearchProviderKey = Boolean(
      SERPER_API_KEY ||
      TAVILY_API_KEY ||
      EXA_API_KEY ||
      (BROWSE_AI_API_KEY && BROWSE_AI_SEARCH_URL) ||
      (BROWSER_USE_API_KEY && BROWSER_USE_SEARCH_URL) ||
      (OLOSTEP_API_KEY && OLOSTEP_SEARCH_URL) ||
      (CLOD_API_KEY && CLOD_SEARCH_URL),
    );

    for (const query of queries) {
      const debugEntry: DebugEntry = {
        query,
        provider: "none",
        urlsSearched: [],
        status: "pending",
      };

      const providerTasks: Array<{ name: string; run: () => Promise<SearchHit[]> }> = [];
      if (SERPER_API_KEY) providerTasks.push({ name: "serper", run: () => searchWithSerper(query) });
      if (TAVILY_API_KEY) providerTasks.push({ name: "tavily", run: () => searchWithTavily(query) });
      if (EXA_API_KEY) providerTasks.push({ name: "exa", run: () => searchWithExa(query) });
      if (BROWSE_AI_API_KEY && BROWSE_AI_SEARCH_URL) providerTasks.push({ name: "browseai", run: () => searchWithGenericProvider("browseai", query) });
      if (BROWSER_USE_API_KEY && BROWSER_USE_SEARCH_URL) providerTasks.push({ name: "browseruse", run: () => searchWithGenericProvider("browseruse", query) });
      if (OLOSTEP_API_KEY && OLOSTEP_SEARCH_URL) providerTasks.push({ name: "olostep", run: () => searchWithGenericProvider("olostep", query) });
      if (CLOD_API_KEY && CLOD_SEARCH_URL) providerTasks.push({ name: "clod", run: () => searchWithGenericProvider("clod", query) });

      const providerNames = providerTasks.map((task) => task.name);
      const results: SearchHit[] = [];

      debugEntry.provider = providerNames.length > 0 ? providerNames.join(",") : "none";

      if (providerTasks.length === 0) {
        debugEntry.status = "no_api_key";
        debugEntry.notes = "No search provider configured. For generic providers, set both *_API_KEY and *_SEARCH_URL.";
        debugLog.push(debugEntry);
        continue;
      }

      const providerResults = await Promise.allSettled(providerTasks.map((task) => task.run()));
      for (const settled of providerResults) {
        if (settled.status === "fulfilled" && settled.value.length > 0) {
          results.push(...settled.value);
        }
      }

      for (const result of results) {
        if (!isHighConfidenceUrl(result.url)) continue;
        if (shouldSkipWeakSnippet(result.snippet)) continue;
        if (!allUrls.has(result.url)) {
          allUrls.add(result.url);
          urlResults.push(result);
          debugEntry.urlsSearched.push(result.url);
        }
      }

      debugEntry.status = results.length > 0 ? "complete" : "no_results";
      debugLog.push(debugEntry);
    }

    const { city, state, zip } = parseLocation(params.location);
    const geo = await geocodeLocation(params.location);
    const insertedResults: SearchResult[] = [];

    for (const urlResult of urlResults.slice(0, 20)) {
      const { url, title, snippet } = urlResult;

      try {
        const domain = new URL(url).hostname.replace("www.", "");
        if (blockedSet.has(domain)) continue;
        if (params.directClinicOnly && MARKETPLACE_DOMAINS.some((d) => url.includes(d))) continue;
        if (!params.includeMarketplaces && MARKETPLACE_DOMAINS.some((d) => url.includes(d))) continue;
        if (!params.includePdfs && url.toLowerCase().endsWith(".pdf")) continue;

        const pageData = await fetchPage(url);
        const isPdf = pageData?.isPdf || false;
        // For PDFs, fetchPage returns a placeholder — fall back to the search snippet instead
        const textToSearch = (pageData && !isPdf) ? pageData.text : snippet;

        const regexPrices = extractPrices(textToSearch, params.serviceType, params.freeText);
        const hasServiceMatch = hasStrongServiceMatch(textToSearch, params.serviceType, params.freeText);
        const hasClinicContext =
          textToSearch.toLowerCase().includes("clinic") ||
          textToSearch.toLowerCase().includes("medical") ||
          textToSearch.toLowerCase().includes("health") ||
          textToSearch.toLowerCase().includes("urgent care") ||
          textToSearch.toLowerCase().includes("doctor");

        // AI extraction: run when AI keys are available
        // Always run on pages with clinic context, regardless of regex result
        let aiResult: AiPriceResult | null = null;
        const hasAiKey = !!(GROQ_API_KEY || OPENROUTER_KEY);
        if (hasAiKey && hasClinicContext) {
          aiResult = await aiExtractPrice(textToSearch, params.serviceType, params.clinicType);
        }

        // Merge: AI result takes priority; regex is fallback
        let finalPrice: string | undefined;
        let finalPriceMin: number | undefined;
        let finalPriceMax: number | undefined;
        let finalSnippet: string | undefined;
        let extractionNotes: string;
        let hasPostedPrice: boolean;

        if (aiResult?.hasPostedPrice && aiResult.price) {
          finalPrice = aiResult.price;
          finalPriceMin = aiResult.priceMin ?? undefined;
          finalPriceMax = aiResult.priceMax ?? finalPriceMin;
          finalSnippet = aiResult.snippet?.slice(0, 300) ?? undefined;
          hasPostedPrice = true;
          extractionNotes = `AI (${aiResult.provider}) confirmed posted price: ${aiResult.price}`;
        } else if (regexPrices.length > 0) {
          finalPrice = regexPrices[0].price;
          finalPriceMin = regexPrices[0].min;
          finalPriceMax = regexPrices[0].max;
          finalSnippet = regexPrices[0].snippet?.slice(0, 300);
          hasPostedPrice = true;
          extractionNotes = `Regex found ${regexPrices.length} price match(es)${aiResult ? `; AI (${aiResult.provider}) did not confirm` : ""}`;
        } else {
          hasPostedPrice = false;
          finalSnippet = undefined;
          extractionNotes = hasClinicContext
            ? `Clinic found — no posted price detected${aiResult ? ` (AI: ${aiResult.provider} confirmed no price)` : ""}`
            : "No clear clinic or price evidence";
        }

        const sourceType = classifySourceType(url);
        const likelyEstimated = isLikelyEstimatedPrice(finalSnippet);
        if (hasPostedPrice && (!hasServiceMatch || likelyEstimated || sourceType === "weak_reference")) {
          hasPostedPrice = false;
          finalPrice = undefined;
          finalPriceMin = undefined;
          finalPriceMax = undefined;
          finalSnippet = undefined;
          extractionNotes = !hasServiceMatch
            ? "Candidate price rejected: weak match for requested service"
            : likelyEstimated
              ? "Candidate price rejected: estimated/average language detected"
              : "Candidate price rejected: weak reference source";
        }

        // Build synthetic prices array for bucket classification
        const prices = hasPostedPrice ? [{ price: finalPrice!, min: finalPriceMin ?? 0, max: finalPriceMax ?? 0, snippet: finalSnippet ?? "", phrase: params.serviceType }] : [];

        const sourceBucket = classifySourceBucket(prices, hasClinicContext);

        if (sourceBucket === "posted_price" && params.postedPricesOnly) {
          if (sourceType === "weak_reference") continue;
          if (!params.includeMarketplaces && sourceType === "marketplace") continue;
        }

        if (params.verifiedEvidenceOnly && sourceBucket !== "posted_price") continue;
        if (params.postedPricesOnly && sourceBucket !== "posted_price") continue;

        const isPreferred = preferredSet.has(new URL(url).hostname.replace("www.", ""));
        const clinicName = extractClinicName(title, url);

        const result: SearchResult = {
          clinicName: isPreferred ? `★ ${clinicName}` : clinicName,
          clinicType: params.clinicType,
          location: params.location,
          city,
          state,
          zipCode: zip,
          latitude: geo.lat,
          longitude: geo.lng,
          requestedService: params.serviceType,
          postedPrice: finalPrice,
          priceMin: finalPriceMin,
          priceMax: finalPriceMax,
          priceSnippet: finalSnippet,
          sourceUrl: url,
          pageTitle: title?.slice(0, 200),
          sourceBucket,
          sourceType,
          isPdf,
          isRendered: false,
          extractionNotes,
          matchedServicePhrase: params.serviceType,
        };

        insertedResults.push(result);
      } catch (err) {
        logger.warn({ err, url }, "Failed to process URL");
      }
    }

    if (!hasAnySearchProviderKey) {
      const demoResults = generateDemoResults(params, city, state, zip, geo);
      insertedResults.push(...demoResults);
    }

    let sorted = insertedResults;
    if (params.sortBy === "lowest_price") {
      sorted = insertedResults.sort((a, b) => {
        if (a.sourceBucket === "posted_price" && b.sourceBucket !== "posted_price") return -1;
        if (b.sourceBucket === "posted_price" && a.sourceBucket !== "posted_price") return 1;
        return (a.priceMin || Infinity) - (b.priceMin || Infinity);
      });
    } else if (params.sortBy === "source_type") {
      const order = { direct_clinic: 0, clinic_chain: 1, marketplace: 2, pdf: 3, rendered_js: 4, weak_reference: 5 };
      sorted = insertedResults.sort((a, b) => (order[a.sourceType] || 5) - (order[b.sourceType] || 5));
    }

    const postedPriceCount = sorted.filter((r) => r.sourceBucket === "posted_price").length;
    const noPostingCount = sorted.filter((r) => r.sourceBucket === "clinic_no_price").length;

    for (const result of sorted) {
      await db.insert(priceResultsTable).values({
        searchId,
        clinicName: result.clinicName,
        clinicType: result.clinicType,
        location: result.location,
        city: result.city,
        state: result.state,
        zipCode: result.zipCode,
        latitude: result.latitude?.toString(),
        longitude: result.longitude?.toString(),
        requestedService: result.requestedService,
        postedPrice: result.postedPrice,
        priceMin: result.priceMin?.toString(),
        priceMax: result.priceMax?.toString(),
        priceSnippet: result.priceSnippet,
        sourceUrl: result.sourceUrl,
        pageTitle: result.pageTitle,
        sourceBucket: result.sourceBucket,
        sourceType: result.sourceType,
        isPdf: result.isPdf,
        isRendered: result.isRendered,
        extractionNotes: result.extractionNotes,
        matchedServicePhrase: result.matchedServicePhrase,
        isSaved: false,
      });
    }

    await db
      .update(searchRunsTable)
      .set({
        status: "complete",
        resultCount: sorted.length,
        postedPriceCount,
        noPostingCount,
        completedAt: new Date(),
        debugLog: debugLog as unknown as typeof searchRunsTable.$inferInsert.debugLog,
      })
      .where(eq(searchRunsTable.id, searchId));
  } catch (err) {
    logger.error({ err, searchId }, "Search pipeline failed");
    await db
      .update(searchRunsTable)
      .set({ status: "failed", completedAt: new Date() })
      .where(eq(searchRunsTable.id, searchId));
  }
}

function generateDemoResults(
  params: SearchParams,
  city?: string,
  state?: string,
  zip?: string,
  geo?: { lat?: number; lng?: number },
): SearchResult[] {
  const locationDisplay = params.location;

  const usLatLng = geo?.lat ? geo : {
    lat: 37.7749,
    lng: -122.4194,
  };

  const demoData: SearchResult[] = [
    {
      clinicName: `${params.clinicType === "urgent care" ? "FastCare Urgent Care" : "MedFirst Clinic"} — ${city || locationDisplay}`,
      clinicType: params.clinicType,
      location: locationDisplay,
      city,
      state,
      zipCode: zip,
      latitude: usLatLng.lat,
      longitude: usLatLng.lng,
      requestedService: params.serviceType,
      postedPrice: "$89",
      priceMin: 89,
      priceMax: 89,
      priceSnippet: `Self-pay ${params.serviceType}: $89. No insurance required. Posted price includes exam and basic treatment.`,
      sourceUrl: `https://example-clinic.com/${city?.toLowerCase() || "location"}/pricing`,
      pageTitle: `Pricing | FastCare Urgent Care ${city || locationDisplay}`,
      sourceBucket: "posted_price",
      sourceType: "direct_clinic",
      isPdf: false,
      isRendered: false,
      extractionNotes: "Demo result — configure SERPER_API_KEY or TAVILY_API_KEY for real results",
      matchedServicePhrase: params.serviceType,
    },
    {
      clinicName: `Concentra Occupational Health — ${locationDisplay}`,
      clinicType: params.clinicType,
      location: locationDisplay,
      city,
      state,
      zipCode: zip,
      latitude: usLatLng.lat ? usLatLng.lat + 0.02 : undefined,
      longitude: usLatLng.lng ? usLatLng.lng + 0.02 : undefined,
      requestedService: params.serviceType,
      postedPrice: "$125",
      priceMin: 125,
      priceMax: 125,
      priceSnippet: `${params.serviceType} cash price $125. Self-pay patients welcome.`,
      sourceUrl: "https://concentra.com/locations/pricing",
      pageTitle: `Concentra — ${params.serviceType} Pricing`,
      sourceBucket: "posted_price",
      sourceType: "clinic_chain",
      isPdf: false,
      isRendered: false,
      extractionNotes: "Demo result — configure SERPER_API_KEY or TAVILY_API_KEY for real results",
      matchedServicePhrase: params.serviceType,
    },
    {
      clinicName: `Sesame Care — ${params.clinicType} Providers Near ${locationDisplay}`,
      clinicType: params.clinicType,
      location: locationDisplay,
      city,
      state,
      zipCode: zip,
      latitude: usLatLng.lat ? usLatLng.lat - 0.03 : undefined,
      longitude: usLatLng.lng ? usLatLng.lng - 0.01 : undefined,
      requestedService: params.serviceType,
      postedPrice: "$75",
      priceMin: 75,
      priceMax: 95,
      priceSnippet: `${params.serviceType} from $75. Transparent pricing, no surprise bills.`,
      sourceUrl: "https://sesamecare.com/specialty/urgent-care",
      pageTitle: `Sesame — ${params.serviceType} Near You`,
      sourceBucket: "posted_price",
      sourceType: "marketplace",
      isPdf: false,
      isRendered: false,
      extractionNotes: "Demo result — configure SERPER_API_KEY or TAVILY_API_KEY for real results",
      matchedServicePhrase: params.serviceType,
    },
    {
      clinicName: `Community Health Center — ${locationDisplay}`,
      clinicType: params.clinicType,
      location: locationDisplay,
      city,
      state,
      zipCode: zip,
      latitude: usLatLng.lat ? usLatLng.lat + 0.05 : undefined,
      longitude: usLatLng.lng ? usLatLng.lng - 0.05 : undefined,
      requestedService: params.serviceType,
      sourceBucket: "clinic_no_price",
      sourceType: "direct_clinic",
      isPdf: false,
      isRendered: false,
      extractionNotes: "Clinic found in area but no publicly posted price detected on website",
    },
  ];

  return demoData;
}
