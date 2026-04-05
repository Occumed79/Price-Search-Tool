import { Router } from "express";
import { db } from "@workspace/db";
import {
  searchRunsTable,
  priceResultsTable,
  savedResultsTable,
  manualReviewsTable,
  domainRulesTable,
  searchPresetsTable,
} from "@workspace/db";
import { eq, desc, count } from "drizzle-orm";
import {
  StartSearchBody,
  SaveResultBody,
  AddManualReviewBody,
  CreateDomainRuleBody,
  CreateSearchPresetBody,
} from "@workspace/api-zod";
import { runSearch } from "../services/searchPipeline";
import { logger } from "../lib/logger";

const router = Router();

router.post("/search", async (req, res) => {
  const parsed = StartSearchBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const body = parsed.data;

  const [run] = await db
    .insert(searchRunsTable)
    .values({
      location: body.location,
      radiusMiles: body.radiusMiles ?? 25,
      clinicType: body.clinicType,
      serviceType: body.serviceType,
      freeText: body.freeText,
      postedPricesOnly: body.postedPricesOnly ?? true,
      directClinicOnly: body.directClinicOnly ?? false,
      includePdfs: body.includePdfs ?? true,
      includeMarketplaces: body.includeMarketplaces ?? true,
      verifiedEvidenceOnly: body.verifiedEvidenceOnly ?? false,
      sortBy: body.sortBy ?? "lowest_price",
      status: "pending",
      resultCount: 0,
      postedPriceCount: 0,
      noPostingCount: 0,
    })
    .returning();

  setImmediate(() => {
    runSearch(run.id, {
      location: body.location,
      radiusMiles: body.radiusMiles ?? 25,
      clinicType: body.clinicType,
      serviceType: body.serviceType,
      freeText: body.freeText,
      postedPricesOnly: body.postedPricesOnly ?? true,
      directClinicOnly: body.directClinicOnly ?? false,
      includePdfs: body.includePdfs ?? true,
      includeMarketplaces: body.includeMarketplaces ?? true,
      verifiedEvidenceOnly: body.verifiedEvidenceOnly ?? false,
      sortBy: body.sortBy ?? "lowest_price",
    }).catch((err: unknown) => logger.error({ err }, "Search pipeline error"));
  });

  res.json({
    id: run.id,
    location: run.location,
    radiusMiles: run.radiusMiles,
    clinicType: run.clinicType,
    serviceType: run.serviceType,
    freeText: run.freeText,
    status: run.status,
    resultCount: run.resultCount,
    postedPriceCount: run.postedPriceCount,
    noPostingCount: run.noPostingCount,
    createdAt: run.createdAt.toISOString(),
    completedAt: run.completedAt?.toISOString() ?? null,
  });
});

router.get("/search/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [run] = await db.select().from(searchRunsTable).where(eq(searchRunsTable.id, id));
  if (!run) {
    res.status(404).json({ error: "Search not found" });
    return;
  }

  const results = await db
    .select()
    .from(priceResultsTable)
    .where(eq(priceResultsTable.searchId, id));

  res.json({
    id: run.id,
    location: run.location,
    radiusMiles: run.radiusMiles,
    clinicType: run.clinicType,
    serviceType: run.serviceType,
    freeText: run.freeText,
    status: run.status,
    resultCount: run.resultCount,
    postedPriceCount: run.postedPriceCount,
    noPostingCount: run.noPostingCount,
    createdAt: run.createdAt.toISOString(),
    completedAt: run.completedAt?.toISOString() ?? null,
    results: results.map((r) => ({
      id: r.id,
      searchId: r.searchId,
      clinicName: r.clinicName,
      clinicType: r.clinicType,
      location: r.location,
      city: r.city,
      state: r.state,
      zipCode: r.zipCode,
      latitude: r.latitude ? parseFloat(r.latitude) : null,
      longitude: r.longitude ? parseFloat(r.longitude) : null,
      requestedService: r.requestedService,
      postedPrice: r.postedPrice,
      priceMin: r.priceMin ? parseFloat(r.priceMin) : null,
      priceMax: r.priceMax ? parseFloat(r.priceMax) : null,
      priceSnippet: r.priceSnippet,
      sourceUrl: r.sourceUrl,
      pageTitle: r.pageTitle,
      sourceBucket: r.sourceBucket,
      sourceType: r.sourceType,
      isPdf: r.isPdf,
      isRendered: r.isRendered,
      screenshotPath: r.screenshotPath,
      extractionNotes: r.extractionNotes,
      matchedServicePhrase: r.matchedServicePhrase,
      isSaved: r.isSaved,
      userReview: r.userReview,
      foundAt: r.foundAt.toISOString(),
    })),
    debugLog: run.debugLog ?? [],
  });
});

router.get("/searches", async (_req, res) => {
  const runs = await db
    .select()
    .from(searchRunsTable)
    .orderBy(desc(searchRunsTable.createdAt))
    .limit(50);

  res.json(
    runs.map((r) => ({
      id: r.id,
      location: r.location,
      radiusMiles: r.radiusMiles,
      clinicType: r.clinicType,
      serviceType: r.serviceType,
      freeText: r.freeText,
      status: r.status,
      resultCount: r.resultCount,
      postedPriceCount: r.postedPriceCount,
      noPostingCount: r.noPostingCount,
      createdAt: r.createdAt.toISOString(),
      completedAt: r.completedAt?.toISOString() ?? null,
    })),
  );
});

router.post("/save-result", async (req, res) => {
  const parsed = SaveResultBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  await db
    .update(priceResultsTable)
    .set({ isSaved: true })
    .where(eq(priceResultsTable.id, parsed.data.resultId));

  const [saved] = await db
    .insert(savedResultsTable)
    .values({ resultId: parsed.data.resultId, notes: parsed.data.notes })
    .returning();

  res.json({
    id: saved.id,
    resultId: saved.resultId,
    notes: saved.notes,
    savedAt: saved.savedAt.toISOString(),
  });
});

router.get("/saved-results", async (_req, res) => {
  const rows = await db
    .select()
    .from(savedResultsTable)
    .leftJoin(priceResultsTable, eq(savedResultsTable.resultId, priceResultsTable.id))
    .orderBy(desc(savedResultsTable.savedAt));

  res.json(
    rows.map((row) => ({
      id: row.saved_results.id,
      resultId: row.saved_results.resultId,
      notes: row.saved_results.notes,
      savedAt: row.saved_results.savedAt.toISOString(),
      result: row.price_results
        ? {
            id: row.price_results.id,
            searchId: row.price_results.searchId,
            clinicName: row.price_results.clinicName,
            clinicType: row.price_results.clinicType,
            location: row.price_results.location,
            city: row.price_results.city,
            state: row.price_results.state,
            zipCode: row.price_results.zipCode,
            latitude: row.price_results.latitude ? parseFloat(row.price_results.latitude) : null,
            longitude: row.price_results.longitude ? parseFloat(row.price_results.longitude) : null,
            requestedService: row.price_results.requestedService,
            postedPrice: row.price_results.postedPrice,
            priceMin: row.price_results.priceMin ? parseFloat(row.price_results.priceMin) : null,
            priceMax: row.price_results.priceMax ? parseFloat(row.price_results.priceMax) : null,
            priceSnippet: row.price_results.priceSnippet,
            sourceUrl: row.price_results.sourceUrl,
            pageTitle: row.price_results.pageTitle,
            sourceBucket: row.price_results.sourceBucket,
            sourceType: row.price_results.sourceType,
            isPdf: row.price_results.isPdf,
            isRendered: row.price_results.isRendered,
            screenshotPath: row.price_results.screenshotPath,
            extractionNotes: row.price_results.extractionNotes,
            matchedServicePhrase: row.price_results.matchedServicePhrase,
            isSaved: row.price_results.isSaved,
            userReview: row.price_results.userReview,
            foundAt: row.price_results.foundAt.toISOString(),
          }
        : null,
    })),
  );
});

router.delete("/saved-results/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [row] = await db.select().from(savedResultsTable).where(eq(savedResultsTable.id, id));
  if (row) {
    await db.update(priceResultsTable).set({ isSaved: false }).where(eq(priceResultsTable.id, row.resultId));
  }

  await db.delete(savedResultsTable).where(eq(savedResultsTable.id, id));
  res.json({ success: true });
});

router.post("/manual-review", async (req, res) => {
  const parsed = AddManualReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  await db
    .update(priceResultsTable)
    .set({ userReview: parsed.data.verdict })
    .where(eq(priceResultsTable.id, parsed.data.resultId));

  const [review] = await db
    .insert(manualReviewsTable)
    .values({
      resultId: parsed.data.resultId,
      verdict: parsed.data.verdict,
      notes: parsed.data.notes,
    })
    .returning();

  res.json({
    id: review.id,
    resultId: review.resultId,
    verdict: review.verdict,
    notes: review.notes,
    reviewedAt: review.reviewedAt.toISOString(),
  });
});

router.get("/domain-rules", async (_req, res) => {
  const rules = await db.select().from(domainRulesTable).orderBy(desc(domainRulesTable.createdAt));
  res.json(
    rules.map((r) => ({
      id: r.id,
      domain: r.domain,
      ruleType: r.ruleType,
      reason: r.reason,
      createdAt: r.createdAt.toISOString(),
    })),
  );
});

router.post("/domain-rules", async (req, res) => {
  const parsed = CreateDomainRuleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  const [rule] = await db
    .insert(domainRulesTable)
    .values({ domain: parsed.data.domain, ruleType: parsed.data.ruleType, reason: parsed.data.reason })
    .returning();

  res.json({
    id: rule.id,
    domain: rule.domain,
    ruleType: rule.ruleType,
    reason: rule.reason,
    createdAt: rule.createdAt.toISOString(),
  });
});

router.delete("/domain-rules/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(domainRulesTable).where(eq(domainRulesTable.id, id));
  res.json({ success: true });
});

router.get("/search-presets", async (_req, res) => {
  const presets = await db.select().from(searchPresetsTable).orderBy(desc(searchPresetsTable.createdAt));
  res.json(
    presets.map((p) => ({
      id: p.id,
      name: p.name,
      location: p.location,
      radiusMiles: p.radiusMiles,
      clinicType: p.clinicType,
      serviceType: p.serviceType,
      freeText: p.freeText,
      createdAt: p.createdAt.toISOString(),
    })),
  );
});

router.post("/search-presets", async (req, res) => {
  const parsed = CreateSearchPresetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  const [preset] = await db
    .insert(searchPresetsTable)
    .values({
      name: parsed.data.name,
      location: parsed.data.location,
      radiusMiles: parsed.data.radiusMiles,
      clinicType: parsed.data.clinicType,
      serviceType: parsed.data.serviceType,
      freeText: parsed.data.freeText,
    })
    .returning();

  res.json({
    id: preset.id,
    name: preset.name,
    location: preset.location,
    radiusMiles: preset.radiusMiles,
    clinicType: preset.clinicType,
    serviceType: preset.serviceType,
    freeText: preset.freeText,
    createdAt: preset.createdAt.toISOString(),
  });
});

router.delete("/search-presets/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(searchPresetsTable).where(eq(searchPresetsTable.id, id));
  res.json({ success: true });
});

router.get("/export/:searchId", async (req, res) => {
  const searchId = parseInt(req.params.searchId);
  if (isNaN(searchId)) {
    res.status(400).json({ error: "Invalid searchId" });
    return;
  }

  const results = await db
    .select()
    .from(priceResultsTable)
    .where(eq(priceResultsTable.searchId, searchId));

  res.json({
    searchId,
    exportedAt: new Date().toISOString(),
    results: results.map((r) => ({
      id: r.id,
      searchId: r.searchId,
      clinicName: r.clinicName,
      clinicType: r.clinicType,
      location: r.location,
      city: r.city,
      state: r.state,
      zipCode: r.zipCode,
      latitude: r.latitude,
      longitude: r.longitude,
      requestedService: r.requestedService,
      postedPrice: r.postedPrice,
      priceMin: r.priceMin,
      priceMax: r.priceMax,
      priceSnippet: r.priceSnippet,
      sourceUrl: r.sourceUrl,
      pageTitle: r.pageTitle,
      sourceBucket: r.sourceBucket,
      sourceType: r.sourceType,
      isPdf: r.isPdf,
      isRendered: r.isRendered,
      extractionNotes: r.extractionNotes,
      matchedServicePhrase: r.matchedServicePhrase,
      isSaved: r.isSaved,
      userReview: r.userReview,
      foundAt: r.foundAt.toISOString(),
    })),
  });
});

router.get("/stats", async (_req, res) => {
  const [{ total: totalSearches }] = await db
    .select({ total: count() })
    .from(searchRunsTable);

  const [{ total: totalResults }] = await db
    .select({ total: count() })
    .from(priceResultsTable);

  const [{ total: totalSaved }] = await db
    .select({ total: count() })
    .from(savedResultsTable);

  const postedRows = await db
    .select({ total: count() })
    .from(priceResultsTable)
    .where(eq(priceResultsTable.sourceBucket, "posted_price"));
  const totalPostedPrices = postedRows[0]?.total ?? 0;

  res.json({
    totalSearches: totalSearches ?? 0,
    totalResults: totalResults ?? 0,
    totalPostedPrices: totalPostedPrices ?? 0,
    totalSaved: totalSaved ?? 0,
    topServices: [],
    topLocations: [],
  });
});

router.get("/results/:searchId/map", async (req, res) => {
  const searchId = parseInt(req.params.searchId);
  if (isNaN(searchId)) {
    res.status(400).json({ error: "Invalid searchId" });
    return;
  }

  const results = await db
    .select()
    .from(priceResultsTable)
    .where(eq(priceResultsTable.searchId, searchId));

  const pins = results
    .filter((r) => r.latitude && r.longitude)
    .map((r) => ({
      resultId: r.id,
      clinicName: r.clinicName,
      clinicType: r.clinicType,
      location: r.location || "",
      latitude: parseFloat(r.latitude!),
      longitude: parseFloat(r.longitude!),
      postedPrice: r.postedPrice,
      sourceUrl: r.sourceUrl,
      sourceBucket: r.sourceBucket,
      isSaved: r.isSaved,
    }));

  res.json(pins);
});

export default router;
