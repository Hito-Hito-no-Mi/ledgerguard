import { DeterministicAuditResult } from "../engine/types";
import { formatCurrency } from "./currency";

export interface DisputeEmailContent {
  subject: string;
  body: string;
  recipientHint: string;
}

export function generateDisputeEmail(audit: DeterministicAuditResult): DisputeEmailContent {
  const overcharge = audit.reconciliation.netCustomerOvercharge;
  const isOvercharged = overcharge > 0;
  const absOvercharge = Math.abs(overcharge);

  const subject = `Billing Discrepancy Notice: Invoice #${audit.invoiceNumber} - Adjustment Requested (${formatCurrency(overcharge, audit.currency)})`;

  const itemizedIssues: string[] = [];

  // Group line item issues
  audit.lineItems.forEach((item) => {
    if (item.hasMathError || item.isDuplicate || item.isPriceSpike) {
      let desc = `• Line #${item.lineNumber} [${item.sku || "N/A"}] - "${item.description}":`;
      if (item.hasMathError) {
        desc += `\n    - Arithmetic variance: Invoiced total of $${item.claimedLineTotal.toFixed(2)} does not match Qty ${item.quantity} × $${item.unitPrice.toFixed(2)} (Actual: $${item.calculatedLineTotal.toFixed(2)}). Discrepancy: $${item.discrepancyAmount.toFixed(2)}`;
      }
      if (item.isDuplicate) {
        desc += `\n    - Duplicate billing: Item/surcharge appears to be duplicated in this billing period.`;
      }
      if (item.isPriceSpike && item.baselinePrice !== null) {
        desc += `\n    - Unapproved rate variance: Billed at $${item.unitPrice.toFixed(2)} vs contracted baseline of $${item.baselinePrice.toFixed(2)} (${item.priceSpikePct !== null ? `+${item.priceSpikePct.toFixed(1)}%` : "increase"}).`;
      }
      itemizedIssues.push(desc);
    }
  });

  // Tax check
  if (Math.abs(audit.reconciliation.taxVariance) > 0.01) {
    itemizedIssues.push(
      `• Tax Computation Variance:\n    - Invoiced tax of $${audit.reconciliation.claimedTax.toFixed(2)} exceeds recalculated tax ($${audit.reconciliation.calculatedTax.toFixed(2)}) by $${audit.reconciliation.taxVariance.toFixed(2)}.`
    );
  }

  const issuesList = itemizedIssues.length > 0 
    ? itemizedIssues.join("\n\n")
    : "• Line totals and reconciliation discrepancies detected upon independent automated audit.";

  const body = `Dear ${audit.vendorName} Accounts Receivable Team,

We have completed an automated audit of Invoice #${audit.invoiceNumber} (Dated: ${audit.invoiceDate}) and identified several billing variances requiring reconciliation before final remittance can be approved.

SUMMARY OF AUDIT FINDINGS:
--------------------------------------------------
Claimed Invoice Total:       ${formatCurrency(audit.reconciliation.claimedGrandTotal, audit.currency)}
Verified Payable Total:      ${formatCurrency(audit.reconciliation.calculatedGrandTotal, audit.currency)}
Net Discrepancy / Overcharge: ${formatCurrency(overcharge, audit.currency)}
--------------------------------------------------

ITEMIZED DISCREPANCIES:
${issuesList}

REQUIRED ACTION:
Please issue an amended invoice or a Credit Memo in the amount of ${formatCurrency(absOvercharge, audit.currency)} to reflect the verified reconciliation total of ${formatCurrency(audit.reconciliation.calculatedGrandTotal, audit.currency)}. 

Our accounts payable department will release payment for the undisputed net amount of ${formatCurrency(audit.reconciliation.calculatedGrandTotal, audit.currency)} upon receipt of the revised statement or confirmation of credit note.

Thank you for your prompt assistance in resolving this billing variance.

Sincerely,
Accounts Payable & Procurement Audit
LedgerGuard Audit Reference: LG-${audit.invoiceNumber.replace(/[^a-zA-Z0-9]/g, "")}`;

  return {
    subject,
    body,
    recipientHint: `ar@${audit.vendorName.toLowerCase().replace(/[^a-z0-9]/g, "") || "vendor"}.com`,
  };
}
