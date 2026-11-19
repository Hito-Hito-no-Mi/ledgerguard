import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const sqliteUrl = process.env.DATABASE_URL || "file:ledgerguard.db";

const client = createClient({
  url: sqliteUrl,
});

export const db = drizzle(client, { schema });

// Auto-initialize tables and seed default data if not present
let initialized = false;

export async function ensureDbInitialized() {
  if (initialized) return;

  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      is_pro INTEGER NOT NULL DEFAULT 0,
      audit_count INTEGER NOT NULL DEFAULT 0,
      max_free_audits INTEGER NOT NULL DEFAULT 3,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS vendor_baselines (
      id TEXT PRIMARY KEY,
      vendor_name TEXT NOT NULL,
      normalized_vendor TEXT NOT NULL,
      sku TEXT NOT NULL,
      item_description TEXT NOT NULL,
      baseline_unit_price REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      last_observed_price REAL NOT NULL,
      last_audit_date TEXT,
      updated_at INTEGER NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS audits (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      document_name TEXT NOT NULL,
      document_type TEXT NOT NULL DEFAULT 'pdf',
      invoice_number TEXT NOT NULL,
      vendor_name TEXT NOT NULL,
      invoice_date TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      claimed_subtotal REAL NOT NULL,
      claimed_tax REAL NOT NULL,
      claimed_grand_total REAL NOT NULL,
      calculated_subtotal REAL NOT NULL,
      calculated_tax REAL NOT NULL,
      calculated_grand_total REAL NOT NULL,
      total_discrepancy REAL NOT NULL,
      discrepancy_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL,
      verdict_summary TEXT NOT NULL,
      raw_extracted_data TEXT,
      created_at INTEGER NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS audit_line_items (
      id TEXT PRIMARY KEY,
      audit_id TEXT NOT NULL,
      line_number INTEGER NOT NULL,
      sku TEXT,
      description TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      claimed_line_total REAL NOT NULL,
      calculated_line_total REAL NOT NULL,
      discrepancy_amount REAL NOT NULL DEFAULT 0,
      has_math_error INTEGER NOT NULL DEFAULT 0,
      is_duplicate INTEGER NOT NULL DEFAULT 0,
      is_price_spike INTEGER NOT NULL DEFAULT 0,
      baseline_price REAL,
      price_spike_pct REAL,
      flags TEXT,
      FOREIGN KEY (audit_id) REFERENCES audits(id) ON DELETE CASCADE
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS webhook_logs (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      event_type TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  // Ensure guest user exists
  const guestCheck = await client.execute({
    sql: "SELECT id FROM users WHERE id = ?",
    args: ["demo-user-123"],
  });

  if (guestCheck.rows.length === 0) {
    const now = Date.now();
    await client.execute({
      sql: `INSERT INTO users (id, email, name, is_pro, audit_count, max_free_audits, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        "demo-user-123",
        "demo@ledgerguard.internal",
        "Demo Auditor",
        0,
        1, // 1 sample audit used so far
        3,
        now,
        now,
      ],
    });
  }

  // Pre-seed realistic vendor contract baselines
  const baselinesCheck = await client.execute("SELECT COUNT(*) as count FROM vendor_baselines");
  const count = Number(baselinesCheck.rows[0]?.count ?? 0);

  if (count === 0) {
    const now = Date.now();
    const defaultBaselines = [
      {
        id: "vb_1",
        vendor: "Apex Logistics & Industrial Supply Corp.",
        sku: "FRT-HEAVY-01",
        desc: "Heavy Freight Linehaul - 10 Pallets",
        baselinePrice: 320.0,
      },
      {
        id: "vb_2",
        vendor: "Apex Logistics & Industrial Supply Corp.",
        sku: "WHS-CRATE-09",
        desc: "Reinforced Crate Enclosures",
        baselinePrice: 85.0,
      },
      {
        id: "vb_3",
        vendor: "Apex Logistics & Industrial Supply Corp.",
        sku: "DOC-HAZMAT-X",
        desc: "Hazmat Compliance Electronic Filing",
        baselinePrice: 150.0,
      },
      {
        id: "vb_4",
        vendor: "Apex Logistics & Industrial Supply Corp.",
        sku: "FEE-PEAK-SUR",
        desc: "Peak Season Fuel & Congestion Surcharge",
        baselinePrice: 498.5,
      },
      {
        id: "vb_5",
        vendor: "Global Silicon Components Ltd.",
        sku: "CHIP-RISC-V3",
        desc: "Embedded Controller Microprocessor 64-bit",
        baselinePrice: 14.5,
      },
      {
        id: "vb_6",
        vendor: "FastLine Cloud Infrastructure",
        sku: "SRV-EDGE-NODE",
        desc: "Dedicated Edge Compute Node (Monthly)",
        baselinePrice: 220.0,
      },
    ];

    for (const b of defaultBaselines) {
      await client.execute({
        sql: `INSERT INTO vendor_baselines 
              (id, vendor_name, normalized_vendor, sku, item_description, baseline_unit_price, currency, last_observed_price, last_audit_date, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          b.id,
          b.vendor,
          b.vendor.toLowerCase().trim(),
          b.sku,
          b.desc,
          b.baselinePrice,
          "USD",
          b.baselinePrice,
          "2026-09-15",
          now,
        ],
      });
    }
  }

  initialized = true;
}
