import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  isPro: integer("is_pro", { mode: "boolean" }).notNull().default(false),
  auditCount: integer("audit_count").notNull().default(0),
  maxFreeAudits: integer("max_free_audits").notNull().default(3),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const vendorBaselines = sqliteTable("vendor_baselines", {
  id: text("id").primaryKey(),
  vendorName: text("vendor_name").notNull(),
  normalizedVendor: text("normalized_vendor").notNull(),
  sku: text("sku").notNull(),
  itemDescription: text("item_description").notNull(),
  baselineUnitPrice: real("baseline_unit_price").notNull(),
  currency: text("currency").notNull().default("USD"),
  lastObservedPrice: real("last_observed_price").notNull(),
  lastAuditDate: text("last_audit_date"),
  updatedAt: integer("updated_at").notNull(),
});

export const audits = sqliteTable("audits", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  documentName: text("document_name").notNull(),
  documentType: text("document_type").notNull().default("pdf"),
  invoiceNumber: text("invoice_number").notNull(),
  vendorName: text("vendor_name").notNull(),
  invoiceDate: text("invoice_date").notNull(),
  currency: text("currency").notNull().default("USD"),
  
  // Claimed figures from invoice
  claimedSubtotal: real("claimed_subtotal").notNull(),
  claimedTax: real("claimed_tax").notNull(),
  claimedGrandTotal: real("claimed_grand_total").notNull(),
  
  // Deterministically recalculated figures
  calculatedSubtotal: real("calculated_subtotal").notNull(),
  calculatedTax: real("calculated_tax").notNull(),
  calculatedGrandTotal: real("calculated_grand_total").notNull(),
  
  // Variance
  totalDiscrepancy: real("total_discrepancy").notNull(), // Positive means customer was overcharged
  discrepancyCount: integer("discrepancy_count").notNull().default(0),
  status: text("status").notNull(), // "PASS" | "DISCREPANCY_DETECTED"
  verdictSummary: text("verdict_summary").notNull(),
  rawExtractedData: text("raw_extracted_data"), // JSON payload
  createdAt: integer("created_at").notNull(),
});

export const auditLineItems = sqliteTable("audit_line_items", {
  id: text("id").primaryKey(),
  auditId: text("audit_id").notNull().references(() => audits.id),
  lineNumber: integer("line_number").notNull(),
  sku: text("sku"),
  description: text("description").notNull(),
  quantity: real("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  claimedLineTotal: real("claimed_line_total").notNull(),
  calculatedLineTotal: real("calculated_line_total").notNull(),
  discrepancyAmount: real("discrepancy_amount").notNull().default(0),
  hasMathError: integer("has_math_error", { mode: "boolean" }).notNull().default(false),
  isDuplicate: integer("is_duplicate", { mode: "boolean" }).notNull().default(false),
  isPriceSpike: integer("is_price_spike", { mode: "boolean" }).notNull().default(false),
  baselinePrice: real("baseline_price"),
  priceSpikePct: real("price_spike_pct"),
  flags: text("flags"), // JSON array of string tags/explanations
});

export const webhookLogs = sqliteTable("webhook_logs", {
  id: text("id").primaryKey(),
  provider: text("provider").notNull(), // "lemon_squeezy" | "dodo_payments" | "demo"
  eventType: text("event_type").notNull(),
  payload: text("payload").notNull(),
  createdAt: integer("created_at").notNull(),
});
