export interface RawExtractedLineItem {
  line_number?: number;
  sku?: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface RawExtractedInvoice {
  vendor_name: string;
  vendor_address?: string;
  vendor_tax_id?: string;
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  currency?: string;
  line_items: RawExtractedLineItem[];
  subtotal: number;
  tax_rate_percent?: number;
  tax_amount: number;
  shipping_amount?: number;
  discount_amount?: number;
  grand_total: number;
}

export interface LineItemAuditResult {
  lineNumber: number;
  sku: string;
  description: string;
  quantity: number;
  unitPrice: number;
  claimedLineTotal: number;
  calculatedLineTotal: number;
  discrepancyAmount: number;
  hasMathError: boolean;
  isDuplicate: boolean;
  isPriceSpike: boolean;
  baselinePrice: number | null;
  priceSpikePct: number | null;
  flags: string[];
}

export interface ReconciliationBreakdown {
  claimedSubtotal: number;
  calculatedSubtotal: number;
  subtotalVariance: number;

  claimedTax: number;
  calculatedTax: number;
  taxVariance: number;
  taxRatePercent: number | null;

  claimedShipping: number;
  claimedDiscount: number;

  claimedGrandTotal: number;
  calculatedGrandTotal: number;
  grandTotalVariance: number;

  netCustomerOvercharge: number; // Positive = Customer was overcharged (needs refund/credit)
}

export interface DeterministicAuditResult {
  id?: string;
  vendorName: string;
  invoiceNumber: string;
  invoiceDate: string;
  currency: string;
  status: "PASS" | "DISCREPANCY_DETECTED";
  verdictTitle: string;
  verdictDescription: string;
  reconciliation: ReconciliationBreakdown;
  lineItems: LineItemAuditResult[];
  issueCounts: {
    total: number;
    mathErrors: number;
    duplicates: number;
    priceSpikes: number;
    taxErrors: number;
  };
}

export interface HistoricalBaseline {
  sku: string;
  itemDescription?: string;
  baselineUnitPrice: number;
}
