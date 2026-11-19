import { DeterministicAuditResult } from "../engine/types";

export function generateAuditCsv(audit: DeterministicAuditResult): string {
  const headers = [
    "Line Number",
    "SKU",
    "Description",
    "Quantity",
    "Unit Price",
    "Claimed Total",
    "Calculated Total",
    "Discrepancy Amount",
    "Has Math Error",
    "Is Duplicate",
    "Is Price Spike",
    "Baseline Price",
    "Price Spike %",
    "Flags",
  ];

  const rows = audit.lineItems.map((item) => [
    item.lineNumber,
    `"${(item.sku || "").replace(/"/g, '""')}"`,
    `"${item.description.replace(/"/g, '""')}"`,
    item.quantity,
    item.unitPrice.toFixed(2),
    item.claimedLineTotal.toFixed(2),
    item.calculatedLineTotal.toFixed(2),
    item.discrepancyAmount.toFixed(2),
    item.hasMathError ? "YES" : "NO",
    item.isDuplicate ? "YES" : "NO",
    item.isPriceSpike ? "YES" : "NO",
    item.baselinePrice !== null ? item.baselinePrice.toFixed(2) : "N/A",
    item.priceSpikePct !== null ? `${item.priceSpikePct.toFixed(1)}%` : "N/A",
    `"${item.flags.join("; ").replace(/"/g, '""')}"`,
  ]);

  // Reconciliation summary footer
  const reconciliationRows = [
    [],
    ["RECONCILIATION SUMMARY"],
    ["Vendor", `"${audit.vendorName.replace(/"/g, '""')}"`],
    ["Invoice Number", `"${audit.invoiceNumber}"`],
    ["Invoice Date", audit.invoiceDate],
    ["Claimed Subtotal", audit.reconciliation.claimedSubtotal.toFixed(2)],
    ["Calculated Subtotal", audit.reconciliation.calculatedSubtotal.toFixed(2)],
    ["Claimed Tax", audit.reconciliation.claimedTax.toFixed(2)],
    ["Calculated Tax", audit.reconciliation.calculatedTax.toFixed(2)],
    ["Claimed Grand Total", audit.reconciliation.claimedGrandTotal.toFixed(2)],
    ["Calculated Grand Total", audit.reconciliation.calculatedGrandTotal.toFixed(2)],
    ["Net Customer Overcharge", audit.reconciliation.netCustomerOvercharge.toFixed(2)],
    ["Status", audit.status],
  ];

  return [
    headers.join(","),
    ...rows.map((r) => r.join(",")),
    ...reconciliationRows.map((r) => r.join(",")),
  ].join("\n");
}
