import { RawExtractedInvoice } from "../engine/types";

export const SAMPLE_BROKEN_INVOICE: RawExtractedInvoice = {
  vendor_name: "Apex Logistics & Industrial Supply Corp.",
  vendor_address: "742 Industrial Parkway, Suite 400, Chicago, IL 60607",
  vendor_tax_id: "US-EIN-36-8849201",
  invoice_number: "INV-2026-88492",
  invoice_date: "2026-10-24",
  due_date: "2026-11-24",
  currency: "USD",
  line_items: [
    {
      line_number: 1,
      sku: "FRT-HEAVY-01",
      description: "Heavy Freight Linehaul - Dedicated Pallet Route",
      quantity: 25,
      unit_price: 395.0, // Historical baseline is $320.00 (+23.4% unapproved price spike!)
      line_total: 9875.0,
    },
    {
      line_number: 2,
      sku: "FEE-PEAK-SUR",
      description: "Peak Season Fuel & Congestion Surcharge",
      quantity: 1,
      unit_price: 498.5,
      line_total: 498.5,
    },
    {
      line_number: 3,
      sku: "WHS-CRATE-09",
      description: "Reinforced Heavy Crate Enclosures",
      quantity: 20,
      unit_price: 85.0, // 20 * 85 = 1,700.00, but invoice billed 2,100.00 (+$400.00 math error!)
      line_total: 2100.0,
    },
    {
      line_number: 4,
      sku: "DOC-HAZMAT-X",
      description: "Hazmat Compliance Electronic Manifest Filing",
      quantity: 4,
      unit_price: 150.0,
      line_total: 600.0,
    },
    {
      line_number: 5,
      sku: "FEE-PEAK-SUR", // DUPLICATE line item identical to Line 2!
      description: "Peak Season Fuel & Congestion Surcharge",
      quantity: 1,
      unit_price: 498.5,
      line_total: 498.5,
    },
  ],
  subtotal: 13572.0, // Claimed subtotal includes flawed line 3
  tax_rate_percent: 5.0,
  tax_amount: 1008.6, // True 5% of calculated $13,172 is $658.60 (+$350.00 tax calculation inflation!)
  shipping_amount: 309.4,
  discount_amount: 0.0,
  grand_total: 14890.0,
};

export const SAMPLE_CLEAN_INVOICE: RawExtractedInvoice = {
  vendor_name: "Apex Logistics & Industrial Supply Corp.",
  vendor_address: "742 Industrial Parkway, Suite 400, Chicago, IL 60607",
  vendor_tax_id: "US-EIN-36-8849201",
  invoice_number: "INV-2026-90114",
  invoice_date: "2026-11-02",
  due_date: "2026-12-02",
  currency: "USD",
  line_items: [
    {
      line_number: 1,
      sku: "FRT-HEAVY-01",
      description: "Heavy Freight Linehaul - Dedicated Pallet Route",
      quantity: 15,
      unit_price: 320.0, // Matches approved baseline exactly
      line_total: 4800.0,
    },
    {
      line_number: 2,
      sku: "WHS-CRATE-09",
      description: "Reinforced Heavy Crate Enclosures",
      quantity: 10,
      unit_price: 85.0,
      line_total: 850.0,
    },
    {
      line_number: 3,
      sku: "DOC-HAZMAT-X",
      description: "Hazmat Compliance Electronic Manifest Filing",
      quantity: 2,
      unit_price: 150.0,
      line_total: 300.0,
    },
  ],
  subtotal: 5950.0, // Exact 4800 + 850 + 300
  tax_rate_percent: 5.0,
  tax_amount: 297.5, // Exact 5.0% of $5950.00
  shipping_amount: 150.0,
  discount_amount: 0.0,
  grand_total: 6397.5, // Exact 5950 + 297.50 + 150
};
