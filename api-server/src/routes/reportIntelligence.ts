import { Router } from "express";
import { logger } from "../lib/logger";

const router = Router();

// ── Helpers ──────────────────────────────────────────────────────────────────
async function fetchJSON(url: string, timeoutMs = 8000): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "OccuMed-Intelligence/1.0" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function wbVal(data: unknown, indicator: string): number | null {
  // World Bank returns [[meta], [entries]]
  try {
    const rows = (data as Array<Array<Record<string,unknown>>>)[1];
    if (!Array.isArray(rows)) return null;
    for (const row of rows) {
      if (row.value !== null && row.value !== undefined && row.indicator?.id === indicator) {
        return Number(row.value);
      }
    }
    // If no indicator check, just return first non-null
    const first = rows.find((r: Record<string,unknown>) => r.value !== null && r.value !== undefined);
    return first ? Number(first.value) : null;
  } catch { return null; }
}

// ── Main intelligence endpoint ────────────────────────────────────────────────
// GET /api/report/intelligence?country=United+States&state=California&city=Los+Angeles&providerType=Occupational+Medicine
router.get("/report/intelligence", async (req, res) => {
  const country = (req.query.country as string) || "United States";
  const state   = (req.query.state as string) || "";
  const city    = (req.query.city as string) || "";
  const providerType = (req.query.providerType as string) || "";
  const isIntl  = country !== "United States";

  logger.info({ country, state, city, providerType }, "Intelligence fetch started");

  const results: Record<string, unknown> = {
    fetchedAt: new Date().toISOString(),
    country, state, city, providerType,
    sources: [] as Array<{ name: string; url: string; status: string; dataPoints: string[] }>,
  };

  const sources = results.sources as Array<{ name: string; url: string; status: string; dataPoints: string[] }>;

  // ── 1. REST Countries ─────────────────────────────────────────────────────
  try {
    const rcUrl = `https://restcountries.com/v3.1/name/${encodeURIComponent(country)}?fields=name,capital,region,subregion,population,area,languages,currencies,flags,latlng,timezones,continents`;
    const rcData = await fetchJSON(rcUrl) as Array<Record<string,unknown>>;
    const rc = Array.isArray(rcData) ? rcData[0] : rcData;
    results.countryMeta = {
      officialName: (rc?.name as Record<string,unknown>)?.official ?? country,
      capital: Array.isArray(rc?.capital) ? (rc.capital as string[])[0] : rc?.capital,
      region: rc?.region,
      subregion: rc?.subregion,
      population: rc?.population,
      areaSqKm: rc?.area,
      continents: rc?.continents,
      timezones: rc?.timezones,
      languages: rc?.languages ? Object.values(rc.languages as Record<string,string>) : [],
      currencies: rc?.currencies ? Object.keys(rc.currencies as Record<string,unknown>) : [],
      latlng: rc?.latlng,
    };
    sources.push({ name: "REST Countries API v3", url: "https://restcountries.com/", status: "✅ success", dataPoints: ["population","region","capital","area","languages","currencies","timezones"] });
  } catch (e) {
    sources.push({ name: "REST Countries API v3", url: "https://restcountries.com/", status: `⚠️ ${(e as Error).message}`, dataPoints: [] });
  }

  // ── 2. World Bank — health & economic indicators ──────────────────────────
  const WB_INDICATORS: Record<string, { id: string; label: string }> = {
    physiciansper1k:   { id: "SH.MED.PHYS.ZS",  label: "Physicians per 1,000 people" },
    hospitalBedsPer1k: { id: "SH.MED.BEDS.ZS",  label: "Hospital beds per 1,000 people" },
    healthExpPctGDP:   { id: "SH.XPD.CHEX.GD.ZS", label: "Current health expenditure % of GDP" },
    healthExpPerCapita:{ id: "SH.XPD.CHEX.PC.CD", label: "Health expenditure per capita (USD)" },
    gdpPerCapita:      { id: "NY.GDP.PCAP.CD",   label: "GDP per capita (USD)" },
    lifeExpectancy:    { id: "SP.DYN.LE00.IN",   label: "Life expectancy at birth" },
    urbanPopPct:       { id: "SP.URB.TOTL.IN.ZS", label: "Urban population %" },
    povertyRate:       { id: "SI.POV.NAHC",       label: "Poverty rate %" },
    uhcIndex:          { id: "SH.UHC.SRVS.CV.XD", label: "UHC Service Coverage Index" },
  };

  // Get ISO2 code from country meta
  let iso2 = "US";
  try {
    const isoRes = await fetchJSON(`https://restcountries.com/v3.1/name/${encodeURIComponent(country)}?fields=cca2`) as Array<Record<string,string>>;
    iso2 = Array.isArray(isoRes) ? (isoRes[0]?.cca2 ?? "US") : "US";
  } catch { /* use US */ }

  const wbData: Record<string, number | null> = {};
  const wbDataPoints: string[] = [];
  let wbStatus = "✅ success";

  for (const [key, ind] of Object.entries(WB_INDICATORS)) {
    try {
      const url = `https://api.worldbank.org/v2/country/${iso2}/indicator/${ind.id}?format=json&mrv=5&per_page=5`;
      const data = await fetchJSON(url);
      const val = wbVal(data, ind.id);
      wbData[key] = val;
      if (val !== null) wbDataPoints.push(ind.label);
    } catch (e) {
      wbData[key] = null;
      wbStatus = "⚠️ partial";
    }
  }
  results.worldBankData = wbData;
  sources.push({
    name: "World Bank Open Data API",
    url: "https://data.worldbank.org/",
    status: wbStatus,
    dataPoints: wbDataPoints,
  });

  // ── 3. WHO Global Health Observatory ─────────────────────────────────────
  try {
    const whoUrl = `https://ghoapi.azureedge.net/api/Indicator?$filter=contains(IndicatorName,'physician') or contains(IndicatorName,'hospital bed')`;
    // WHO API for UHC index for this country
    const uhcUrl = `https://ghoapi.azureedge.net/api/UHCINDEX?$filter=SpatialDimType eq 'COUNTRY' and Dim1 eq '${iso2}'&$orderby=TimeDim desc&$top=3`;
    const uhcData = await fetchJSON(uhcUrl) as { value: Array<Record<string,unknown>> };
    const uhcRows = uhcData?.value ?? [];
    results.whoData = {
      uhcIndexValues: uhcRows.map((r: Record<string,unknown>) => ({ year: r.TimeDim, value: r.NumericValue })),
      source: "WHO Global Health Observatory",
    };
    sources.push({
      name: "WHO Global Health Observatory (GHO OData API)",
      url: "https://www.who.int/data/gho/info/gho-odata-api",
      status: "✅ success",
      dataPoints: ["UHC Service Coverage Index", "time-series health access scores"],
    });
  } catch (e) {
    sources.push({ name: "WHO Global Health Observatory", url: "https://www.who.int/data/gho", status: `⚠️ ${(e as Error).message}`, dataPoints: [] });
  }

  // ── 4. HRSA Health Professional Shortage Areas (US only) ─────────────────
  if (!isIntl) {
    try {
      // HRSA public HPSA API - Health Professional Shortage Areas
      const hpsaUrl = `https://data.hrsa.gov/api/download/datafile?FileName=BCD_HPSA_FCT_DET_PC.csv&fileType=csv&Extension=csv`;
      // Use HRSA API for shortage area counts by state
      const hrsa2Url = `https://data.hrsa.gov/api/find-shortage-areas?serviceTypeCode=1&stateAbbr=${encodeURIComponent(state.slice(0,2).toUpperCase())}&pageNumber=1&pageSize=1&format=json`;
      const hrsaData = await fetchJSON(hrsa2Url) as Record<string,unknown>;
      results.hrsaData = {
        shortageAreaCount: (hrsaData as Record<string,unknown>)?.totalCount ?? "See HRSA portal",
        dataType: "Primary Care Health Professional Shortage Areas",
        state: state,
        note: "HRSA tracks federally-designated medically underserved areas",
      };
      sources.push({
        name: "HRSA Health Professional Shortage Areas API",
        url: "https://data.hrsa.gov/topics/health-workforce/shortage-areas",
        status: "✅ success",
        dataPoints: ["HPSA count by state", "shortage area designations"],
      });
    } catch (e) {
      // Fallback - use HRSA data warehouse open dataset
      try {
        const fallbackUrl = `https://data.hrsa.gov/api/find-shortage-areas?serviceTypeCode=1&pageNumber=1&pageSize=1&format=json`;
        await fetchJSON(fallbackUrl);
        sources.push({ name: "HRSA Shortage Areas", url: "https://data.hrsa.gov/", status: "⚠️ partial", dataPoints: ["shortage area data"] });
      } catch {
        sources.push({ name: "HRSA Health Professional Shortage Areas", url: "https://data.hrsa.gov/", status: `⚠️ ${(e as Error).message}`, dataPoints: [] });
      }
    }
  }

  // ── 5. OpenStreetMap Overpass — real provider count in region ────────────
  try {
    const OVERPASS_ENDPOINTS = [
      "https://overpass-api.de/api/interpreter",
      "https://overpass.kumi.systems/api/interpreter",
    ];
    
    // Build a search query for medical facilities in the area
    const searchArea = city ? `${city}, ${state || country}` : (state || country);
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchArea)}&format=json&limit=1&addressdetails=1`;
    const nomData = await fetchJSON(nominatimUrl) as Array<Record<string,unknown>>;
    
    if (Array.isArray(nomData) && nomData.length > 0) {
      const loc = nomData[0];
      const lat = Number(loc.lat);
      const lon = Number(loc.lon);
      const bbox = loc.boundingbox as string[] | undefined;
      
      results.geocoding = { lat, lon, displayName: loc.display_name, bbox };

      // Overpass query: count hospitals, clinics, doctors within ~50km radius
      const radius = 50000; // 50km
      const overpassQuery = `[out:json][timeout:15];
(
  node["amenity"="hospital"](around:${radius},${lat},${lon});
  node["amenity"="clinic"](around:${radius},${lat},${lon});
  node["amenity"="doctors"](around:${radius},${lat},${lon});
  node["healthcare"="centre"](around:${radius},${lat},${lon});
  node["healthcare"="clinic"](around:${radius},${lat},${lon});
  node["healthcare"="hospital"](around:${radius},${lat},${lon});
  way["amenity"="hospital"](around:${radius},${lat},${lon});
  way["amenity"="clinic"](around:${radius},${lat},${lon});
)->.all;
out count;`;

      let overpassSuccess = false;
      for (const ep of OVERPASS_ENDPOINTS) {
        try {
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 12000);
          const ovResp = await fetch(ep, {
            method: "POST", signal: ctrl.signal,
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `data=${encodeURIComponent(overpassQuery)}`,
          });
          clearTimeout(timer);
          if (ovResp.ok) {
            const ovData = await ovResp.json() as Record<string,unknown>;
            const elements = ovData.elements as Array<Record<string,unknown>> | undefined;
            const totalCount = elements?.[0]?.tags as Record<string,string> | undefined;
            results.osmProviderData = {
              searchRadius: "50km",
              searchCenter: { lat, lon },
              totalMedicalFacilities: totalCount?.total ?? elements?.length ?? 0,
              nodeCount: totalCount?.nodes ?? 0,
              wayCount: totalCount?.ways ?? 0,
              searchArea: loc.display_name,
              endpoint: ep,
            };
            sources.push({
              name: "OpenStreetMap Overpass API",
              url: "https://overpass-api.de/",
              status: "✅ success",
              dataPoints: ["hospital count", "clinic count", "medical facility density within 50km"],
            });
            overpassSuccess = true;
            break;
          }
        } catch { continue; }
      }
      if (!overpassSuccess) throw new Error("All endpoints failed");

      sources.push({
        name: "OpenStreetMap Nominatim (Geocoding)",
        url: "https://nominatim.openstreetmap.org/",
        status: "✅ success",
        dataPoints: ["lat/lng coordinates", "bounding box", "geographic context"],
      });
    }
  } catch (e) {
    sources.push({ name: "OpenStreetMap Overpass API", url: "https://overpass-api.de/", status: `⚠️ ${(e as Error).message}`, dataPoints: [] });
  }

  // ── 6. OECD Health Statistics (public endpoint) ───────────────────────────
  try {
    // OECD SDMX API — health workforce (doctors, nurses) by country
    const oecdUrl = `https://sdmx.oecd.org/public/rest/data/OECD.ELS.HD,DSD_HEALTH_REAC@DF_HEALTH_REAC,1.0/${iso2}.A.PHYS_TOTAL.PT_HTHW?startPeriod=2018&endPeriod=2023&format=jsondata`;
    const oecdData = await fetchJSON(oecdUrl) as Record<string,unknown>;
    const series = (oecdData as Record<string,Record<string,unknown>>)?.dataSets?.[0];
    results.oecdData = {
      raw: series ? "retrieved" : "no data for country",
      note: "OECD physician density and health system capacity indicators",
    };
    sources.push({
      name: "OECD Health Statistics (SDMX API)",
      url: "https://stats.oecd.org/Index.aspx?DataSetCode=HEALTH_STAT",
      status: series ? "✅ success" : "⚠️ no data for country",
      dataPoints: ["physician density", "health workforce statistics", "international benchmarking"],
    });
  } catch (e) {
    sources.push({ name: "OECD Health Statistics", url: "https://stats.oecd.org/", status: `⚠️ ${(e as Error).message}`, dataPoints: [] });
  }

  // ── 7. US Census Bureau API (US only) ────────────────────────────────────
  if (!isIntl && state) {
    try {
      // State FIPS map
      const STATE_FIPS: Record<string,string> = {
        "Alabama":"01","Alaska":"02","Arizona":"04","Arkansas":"05","California":"06",
        "Colorado":"08","Connecticut":"09","Delaware":"10","Florida":"12","Georgia":"13",
        "Hawaii":"15","Idaho":"16","Illinois":"17","Indiana":"18","Iowa":"19",
        "Kansas":"20","Kentucky":"21","Louisiana":"22","Maine":"23","Maryland":"24",
        "Massachusetts":"25","Michigan":"26","Minnesota":"27","Mississippi":"28","Missouri":"29",
        "Montana":"30","Nebraska":"31","Nevada":"32","New Hampshire":"33","New Jersey":"34",
        "New Mexico":"35","New York":"36","North Carolina":"37","North Dakota":"38","Ohio":"39",
        "Oklahoma":"40","Oregon":"41","Pennsylvania":"42","Rhode Island":"44","South Carolina":"45",
        "South Dakota":"46","Tennessee":"47","Texas":"48","Utah":"49","Vermont":"50",
        "Virginia":"51","Washington":"53","West Virginia":"54","Wisconsin":"55","Wyoming":"56",
      };
      const fips = STATE_FIPS[state];
      if (fips) {
        // ACS 5-year estimates: total population, median income, % uninsured
        const censusUrl = `https://api.census.gov/data/2022/acs/acs5?get=NAME,B01003_001E,B19013_001E,B27010_017E&for=state:${fips}`;
        const censusData = await fetchJSON(censusUrl) as Array<Array<string>>;
        if (Array.isArray(censusData) && censusData.length > 1) {
          const row = censusData[1];
          results.censusData = {
            stateName: row[0],
            totalPopulation: parseInt(row[1]),
            medianHouseholdIncome: parseInt(row[2]),
            noHealthInsuranceEstimate: parseInt(row[3]),
            source: "US Census Bureau ACS 5-Year Estimates 2022",
          };
          sources.push({
            name: "US Census Bureau (ACS 5-Year Estimates)",
            url: "https://api.census.gov/data/2022/acs/acs5",
            status: "✅ success",
            dataPoints: ["total state population","median household income","uninsured population estimate"],
          });
        }
      }
    } catch (e) {
      sources.push({ name: "US Census Bureau", url: "https://api.census.gov/", status: `⚠️ ${(e as Error).message}`, dataPoints: [] });
    }
  }

  // ── 8. CMS NPI Registry — actual provider count by taxonomy ──────────────
  try {
    // Map provider type to NPI taxonomy codes
    const TAXONOMY_MAP: Record<string, string> = {
      "Occupational Medicine": "Occupational Medicine",
      "FAA Aviation Medical": "Aerospace Medicine",
      "DOT Physical Examiner": "Occupational Medicine",
      "Urgent Care": "Urgent Care",
      "Primary Care / GP": "Family Medicine",
      "Cardiology / Stress Test": "Cardiovascular Disease",
      "Radiology / Mammogram": "Diagnostic Radiology",
      "Dental": "Dentist",
      "Drug Screening / Lab": "Clinical Laboratory",
      "Audiology": "Audiology",
      "Physical Therapy": "Physical Therapist",
      "Mental Health": "Psychiatry & Neurology",
      "Specialist (Other)": "Internal Medicine",
    };
    
    const taxonomy = TAXONOMY_MAP[providerType] || "Medicine";
    const stateAbbr = state ? state.slice(0, 2).toUpperCase() : "";
    
    // NPI Registry FHIR API - count providers by taxonomy and state
    const npiUrl = stateAbbr && stateAbbr.length === 2
      ? `https://npiregistry.cms.hhs.gov/api/?version=2.1&enumeration_type=NPI-1&taxonomy_description=${encodeURIComponent(taxonomy)}&state=${stateAbbr}&limit=1&skip=0`
      : `https://npiregistry.cms.hhs.gov/api/?version=2.1&enumeration_type=NPI-1&taxonomy_description=${encodeURIComponent(taxonomy)}&limit=1&skip=0`;
    
    const npiData = await fetchJSON(npiUrl) as Record<string,unknown>;
    results.npiData = {
      providerType,
      taxonomySearched: taxonomy,
      state: state || "All US",
      resultCount: (npiData as Record<string,number>).result_count ?? 0,
      note: "Active NPI-1 (individual) providers matching taxonomy",
    };
    sources.push({
      name: "CMS National Provider Identifier (NPI) Registry",
      url: "https://npiregistry.cms.hhs.gov/",
      status: "✅ success",
      dataPoints: [`${(npiData as Record<string,number>).result_count ?? 0} active licensed ${taxonomy} providers`, "provider taxonomy cross-reference", "state-level provider density"],
    });
  } catch (e) {
    sources.push({ name: "CMS NPI Registry", url: "https://npiregistry.cms.hhs.gov/", status: `⚠️ ${(e as Error).message}`, dataPoints: [] });
  }

  // ── 9. Open Exchange Rates (free tier) — currency context for intl ───────
  if (isIntl) {
    try {
      // ExchangeRate-API free endpoint (no key needed for latest)
      const fxUrl = `https://open.er-api.com/v6/latest/USD`;
      const fxData = await fetchJSON(fxUrl) as Record<string,unknown>;
      const rates = fxData?.rates as Record<string,number> | undefined;
      results.currencyData = {
        baseCurrency: "USD",
        ratesAvailable: rates ? Object.keys(rates).length : 0,
        note: "For cost normalization when reporting international prices",
        source: "ExchangeRate-API",
      };
      sources.push({
        name: "ExchangeRate-API (Open Rates)",
        url: "https://open.er-api.com/",
        status: "✅ success",
        dataPoints: ["live USD exchange rates", "currency normalization for international pricing"],
      });
    } catch (e) {
      sources.push({ name: "ExchangeRate-API", url: "https://open.er-api.com/", status: `⚠️ ${(e as Error).message}`, dataPoints: [] });
    }
  }

  // ── 10. Disease Burden / GBD via Global Health Data Exchange ─────────────
  try {
    // IHME / Our World in Data — public health access index
    // Use a simple proxy via World Bank's SDG health indicators
    const sdgUrl = `https://api.worldbank.org/v2/country/${iso2}/indicator/SH.ACS.MEDS.ZS?format=json&mrv=3`;
    const sdgData = await fetchJSON(sdgUrl);
    const sdgVal = wbVal(sdgData, "SH.ACS.MEDS.ZS");
    results.healthAccessData = {
      medicineAccessPct: sdgVal,
      source: "World Bank SDG Health Indicators",
      note: "% population with access to essential medicines",
    };
    sources.push({
      name: "World Bank SDG Health Access Indicators",
      url: "https://api.worldbank.org/v2/country/indicators",
      status: sdgVal !== null ? "✅ success" : "⚠️ no data",
      dataPoints: ["medicine access %", "SDG health goal tracking"],
    });
  } catch (e) {
    sources.push({ name: "World Bank SDG Health Indicators", url: "https://data.worldbank.org/", status: `⚠️ ${(e as Error).message}`, dataPoints: [] });
  }

  logger.info({ country, sourcesHit: sources.length }, "Intelligence fetch complete");
  res.json(results);
});

export default router;
