import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  numeric,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const searchRunsTable = pgTable("search_runs", {
  id: serial("id").primaryKey(),
  location: text("location").notNull(),
  radiusMiles: integer("radius_miles").notNull().default(25),
  clinicType: text("clinic_type").notNull(),
  serviceType: text("service_type").notNull(),
  freeText: text("free_text"),
  postedPricesOnly: boolean("posted_prices_only").notNull().default(true),
  directClinicOnly: boolean("direct_clinic_only").notNull().default(false),
  includePdfs: boolean("include_pdfs").notNull().default(true),
  includeMarketplaces: boolean("include_marketplaces").notNull().default(true),
  verifiedEvidenceOnly: boolean("verified_evidence_only").notNull().default(false),
  sortBy: text("sort_by").notNull().default("lowest_price"),
  status: text("status").notNull().default("pending"),
  resultCount: integer("result_count").notNull().default(0),
  postedPriceCount: integer("posted_price_count").notNull().default(0),
  noPostingCount: integer("no_posting_count").notNull().default(0),
  debugLog: jsonb("debug_log"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const priceResultsTable = pgTable("price_results", {
  id: serial("id").primaryKey(),
  searchId: integer("search_id").notNull().references(() => searchRunsTable.id),
  clinicName: text("clinic_name").notNull(),
  clinicType: text("clinic_type").notNull(),
  location: text("location"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  latitude: numeric("latitude"),
  longitude: numeric("longitude"),
  requestedService: text("requested_service").notNull(),
  postedPrice: text("posted_price"),
  priceMin: numeric("price_min"),
  priceMax: numeric("price_max"),
  priceSnippet: text("price_snippet"),
  sourceUrl: text("source_url"),
  pageTitle: text("page_title"),
  sourceBucket: text("source_bucket").notNull().default("possible_match"),
  sourceType: text("source_type").notNull().default("weak_reference"),
  isPdf: boolean("is_pdf").notNull().default(false),
  isRendered: boolean("is_rendered").notNull().default(false),
  screenshotPath: text("screenshot_path"),
  extractionNotes: text("extraction_notes"),
  matchedServicePhrase: text("matched_service_phrase"),
  isSaved: boolean("is_saved").notNull().default(false),
  userReview: text("user_review"),
  foundAt: timestamp("found_at").notNull().defaultNow(),
});

export const savedResultsTable = pgTable("saved_results", {
  id: serial("id").primaryKey(),
  resultId: integer("result_id").notNull().references(() => priceResultsTable.id),
  notes: text("notes"),
  priceBreakdown: text("price_breakdown"),
  savedAt: timestamp("saved_at").notNull().defaultNow(),
});

export const manualReviewsTable = pgTable("manual_reviews", {
  id: serial("id").primaryKey(),
  resultId: integer("result_id").notNull().references(() => priceResultsTable.id),
  verdict: text("verdict").notNull(),
  notes: text("notes"),
  reviewedAt: timestamp("reviewed_at").notNull().defaultNow(),
});

export const domainRulesTable = pgTable("domain_rules", {
  id: serial("id").primaryKey(),
  domain: text("domain").notNull(),
  ruleType: text("rule_type").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const searchPresetsTable = pgTable("search_presets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location"),
  radiusMiles: integer("radius_miles"),
  clinicType: text("clinic_type").notNull(),
  serviceType: text("service_type").notNull(),
  freeText: text("free_text"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSearchRunSchema = createInsertSchema(searchRunsTable).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});
export type InsertSearchRun = z.infer<typeof insertSearchRunSchema>;
export type SearchRun = typeof searchRunsTable.$inferSelect;

export const insertPriceResultSchema = createInsertSchema(priceResultsTable).omit({
  id: true,
  foundAt: true,
});
export type InsertPriceResult = z.infer<typeof insertPriceResultSchema>;
export type PriceResult = typeof priceResultsTable.$inferSelect;

export const insertSavedResultSchema = createInsertSchema(savedResultsTable).omit({
  id: true,
  savedAt: true,
});
export type InsertSavedResult = z.infer<typeof insertSavedResultSchema>;
export type SavedResult = typeof savedResultsTable.$inferSelect;

export const insertManualReviewSchema = createInsertSchema(manualReviewsTable).omit({
  id: true,
  reviewedAt: true,
});
export type InsertManualReview = z.infer<typeof insertManualReviewSchema>;
export type ManualReview = typeof manualReviewsTable.$inferSelect;

export const insertDomainRuleSchema = createInsertSchema(domainRulesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertDomainRule = z.infer<typeof insertDomainRuleSchema>;
export type DomainRule = typeof domainRulesTable.$inferSelect;

export const insertSearchPresetSchema = createInsertSchema(searchPresetsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertSearchPreset = z.infer<typeof insertSearchPresetSchema>;
export type SearchPreset = typeof searchPresetsTable.$inferSelect;
