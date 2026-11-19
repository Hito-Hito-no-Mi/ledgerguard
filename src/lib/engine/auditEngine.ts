import {
  RawExtractedInvoice,
  DeterministicAuditResult,
  LineItemAuditResult,
  ReconciliationBreakdown,
  HistoricalBaseline,
} from "./types";

/**
 * Rounds a monetary amount to 2 decimal places cleanly
 */
export function roundCurrency(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Pure TypeScript deterministic audit engine.
 * Never delegates arithmetic or logic to LLM.
 */
export function runDeterministicAudit(
  invoice: RawExtractedInvoice,
  historicalBaselines: HistoricalBaseline[] = []
): DeterministicAuditResult {
  const currency = invoice.currency || "USD";
  const baselineMap = new Map<string, number>();

  // Map baselines by normalized SKU and normalized description
  historicalBaselines.forEach((b) => {
    if (b.sku) {
      baselineMap.set(b.sku.trim().toUpperCase(), b.baselineUnitPrice);
    }
    if (b.itemDescription) {
      baselineMap.set(b.itemDescription.trim().toLowerCase(), b.baselineUnitPrice);
    }
  });

  const auditedLines: LineItemAuditResult[] = [];
  const seenSkus = new Map<string, number>();
  const seenDescriptions = new Map<string, number>();

  let calculatedSubtotal = 0;
  let mathErrorsCount = 0;
  let duplicatesCount = 0;
  let priceSpikesCount = 0;

  invoice.line_items.forEach((item, index) => {
    const lineNumber = item.line_number || index + 1;
    const sku = item.sku?.trim().toUpperCase() || `ITEM-${lineNumber}`;
    const desc = item.description.trim();
    const qty = Number(item.quantity) || 0;
    const unitPrice = Number(item.unit_price) || 0;
    const claimedLineTotal = roundCurrency(Number(item.line_total) || 0);

    // 1. Line-item math recalculation (qty * unit_price)
    const exactCalculatedTotal = roundCurrency(qty * unitPrice);
    calculatedSubtotal = roundCurrency(calculatedSubtotal + exactCalculatedTotal);

    const lineDiscrepancy = roundCurrency(claimedLineTotal - exactCalculatedTotal);
    const hasMathError = Math.abs(lineDiscrepancy) > 0.01;

    const flags: string[] = [];

    if (hasMathError) {
      mathErrorsCount++;
      const dir = lineDiscrepancy > 0 ? "Overcharge" : "Undercharge";
      flags.push(
        `MATH ERROR: Claimed $${claimedLineTotal.toFixed(2)} vs Recalculated $${exactCalculatedTotal.toFixed(2)} (${qty} × $${unitPrice.toFixed(2)}) → ${dir} of $${Math.abs(lineDiscrepancy).toFixed(2)}`
      );
    }

    // 2. Duplicate Detection (Intra-document)
    // Check if identical SKU or normalized description has already been billed
    const normDesc = desc.toLowerCase().replace(/[^a-z0-9]/g, "");
    let isDuplicate = false;

    if (sku && seenSkus.has(sku)) {
      const prevLine = seenSkus.get(sku);
      isDuplicate = true;
      duplicatesCount++;
      flags.push(
        `DUPLICATE CHARGE: SKU "${sku}" was already billed on Line #${prevLine}`
      );
    } else if (normDesc.length > 5 && seenDescriptions.has(normDesc)) {
      const prevLine = seenDescriptions.get(normDesc);
      isDuplicate = true;
      duplicatesCount++;
      flags.push(
        `DUPLICATE ITEM: Description matches Line #${prevLine} ("${desc}")`
      );
    } else {
      if (sku) seenSkus.set(sku, lineNumber);
      if (normDesc.length > 5) seenDescriptions.set(normDesc, lineNumber);
    }

    // 3. Historical Baseline Price Spike Detection (>5% increase)
    const baseline =
      baselineMap.get(sku) ??
      baselineMap.get(desc.toLowerCase()) ??
      null;

    let isPriceSpike = false;
    let priceSpikePct: number | null = null;

    if (baseline !== null && baseline > 0) {
      const diff = unitPrice - baseline;
      const pctIncrease = (diff / baseline) * 100;

      if (pctIncrease > 5.0) {
        isPriceSpike = true;
        priceSpikesCount++;
        priceSpikePct = roundCurrency(pctIncrease);
        const overchargePerUnit = roundCurrency(diff);
        const totalSpikeImpact = roundCurrency(overchargePerUnit * qty);
        flags.push(
          `PRICE CREEP (+${priceSpikePct.toFixed(1)}%): Baseline was $${baseline.toFixed(2)}, billed at $${unitPrice.toFixed(2)} (+$${totalSpikeImpact.toFixed(2)} impact across ${qty} units)`
        );
      }
    }

    auditedLines.push({
      lineNumber,
      sku,
      description: desc,
      quantity: qty,
      unitPrice,
      claimedLineTotal,
      calculatedLineTotal: exactCalculatedTotal,
      discrepancyAmount: lineDiscrepancy,
      hasMathError,
      isDuplicate,
      isPriceSpike,
      baselinePrice: baseline,
      priceSpikePct,
      flags,
    });
  });

  // 4. Subtotal, Tax, and Grand Total Verification
  const claimedSubtotal = roundCurrency(Number(invoice.subtotal) || 0);
  const subtotalVariance = roundCurrency(claimedSubtotal - calculatedSubtotal);

  const claimedTax = roundCurrency(Number(invoice.tax_amount) || 0);
  const taxRatePercent = invoice.tax_rate_percent !== undefined ? Number(invoice.tax_rate_percent) : null;
  
  let calculatedTax = claimedTax;
  let taxErrorsCount = 0;

  if (taxRatePercent !== null && taxRatePercent > 0) {
    calculatedTax = roundCurrency((calculatedSubtotal * taxRatePercent) / 100);
  }

  const taxVariance = roundCurrency(claimedTax - calculatedTax);
  if (Math.abs(taxVariance) > 0.01) {
    taxErrorsCount++;
  }

  const claimedShipping = roundCurrency(Number(invoice.shipping_amount) || 0);
  const claimedDiscount = roundCurrency(Number(invoice.discount_amount) || 0);

  const claimedGrandTotal = roundCurrency(Number(invoice.grand_total) || 0);
  const calculatedGrandTotal = roundCurrency(
    calculatedSubtotal + calculatedTax + claimedShipping - claimedDiscount
  );

  const grandTotalVariance = roundCurrency(claimedGrandTotal - calculatedGrandTotal);

  // Net overcharge: If claimed > calculated, customer is being overbilled
  const netCustomerOvercharge = grandTotalVariance;

  const totalIssuesFound = mathErrorsCount + duplicatesCount + priceSpikesCount + taxErrorsCount;
  const isClean = totalIssuesFound === 0 && Math.abs(grandTotalVariance) <= 0.01;

  const reconciliation: ReconciliationBreakdown = {
    claimedSubtotal,
    calculatedSubtotal,
    subtotalVariance,
    claimedTax,
    calculatedTax,
    taxVariance,
    taxRatePercent,
    claimedShipping,
    claimedDiscount,
    claimedGrandTotal,
    calculatedGrandTotal,
    grandTotalVariance,
    netCustomerOvercharge,
  };

  const status: "PASS" | "DISCREPANCY_DETECTED" = isClean ? "PASS" : "DISCREPANCY_DETECTED";

  let verdictTitle = "PASS: 100% AUDIT ACCURACY";
  let verdictDescription = "All line item arithmetic, tax formulas, baseline pricing, and totals verified with zero variance.";

  if (!isClean) {
    const formattedDiff = Math.abs(netCustomerOvercharge).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    if (netCustomerOvercharge > 0) {
      verdictTitle = `DISCREPANCY DETECTED: -$${formattedDiff} OVERCHARGE`;
      verdictDescription = `Audit caught ${totalIssuesFound} error${totalIssuesFound > 1 ? "s" : ""} across line items, contract baselines, and tax calculations. Total recoverable overcharge is $${formattedDiff}.`;
    } else {
      verdictTitle = `DISCREPANCY DETECTED: +$${formattedDiff} UNDERCHARGE`;
      verdictDescription = `Audit identified variance between claimed totals and calculated line items totaling $${formattedDiff}.`;
    }
  }

  return {
    vendorName: invoice.vendor_name || "Unknown Vendor",
    invoiceNumber: invoice.invoice_number || "INV-UNKNOWN",
    invoiceDate: invoice.invoice_date || new Date().toISOString().split("T")[0],
    currency,
    status,
    verdictTitle,
    verdictDescription,
    reconciliation,
    lineItems: auditedLines,
    issueCounts: {
      total: totalIssuesFound,
      mathErrors: mathErrorsCount,
      duplicates: duplicatesCount,
      priceSpikes: priceSpikesCount,
      taxErrors: taxErrorsCount,
    },
  };
}
