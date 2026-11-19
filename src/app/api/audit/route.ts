import { NextRequest, NextResponse } from "next/server";
import { ensureDbInitialized, db } from "@/lib/db";
import { audits, auditLineItems, users, vendorBaselines } from "@/lib/db/schema";
import { extractInvoiceData } from "@/lib/ai/extractor";
import { runDeterministicAudit } from "@/lib/engine/auditEngine";
import { SAMPLE_BROKEN_INVOICE, SAMPLE_CLEAN_INVOICE } from "@/lib/ai/mockFixtures";
import { eq, desc } from "drizzle-orm";
import { RawExtractedInvoice } from "@/lib/engine/types";

export async function POST(req: NextRequest) {
  try {
    await ensureDbInitialized();

    const body = await req.json();
    const { sampleType, text, fileBufferBase64, mimeType, filename, userId = "demo-user-123" } = body;

    // Check user quota
    const userList = await db.select().from(users).where(eq(users.id, userId));
    const user = userList[0];

    if (user && !user.isPro && user.auditCount >= user.maxFreeAudits && !sampleType) {
      return NextResponse.json(
        {
          error: "FREE_TIER_LIMIT_REACHED",
          message: "You have reached your 3 free audits limit. Please upgrade to Pro for unlimited audits.",
          isPro: false,
          auditCount: user.auditCount,
          maxFreeAudits: user.maxFreeAudits,
        },
        { status: 403 }
      );
    }

    let extractedData: RawExtractedInvoice;
    let docName = filename || "Uploaded-Document";

    if (sampleType === "broken") {
      extractedData = SAMPLE_BROKEN_INVOICE;
      docName = "Apex-Freight-Wholesale-INV-88492.pdf";
    } else if (sampleType === "clean") {
      extractedData = SAMPLE_CLEAN_INVOICE;
      docName = "Apex-Clean-INV-90114.pdf";
    } else {
      // Extract with Gemini Structured Output or fallback
      extractedData = await extractInvoiceData({
        text,
        fileBufferBase64,
        mimeType,
        filename,
      });
    }

    // Fetch vendor baselines from SQLite
    const baselines = await db.select().from(vendorBaselines);
    const historicalBaselines = baselines.map((b) => ({
      sku: b.sku,
      itemDescription: b.itemDescription,
      baselineUnitPrice: b.baselineUnitPrice,
    }));

    // Run pure deterministic TypeScript audit
    const auditResult = runDeterministicAudit(extractedData, historicalBaselines);

    // Save to database
    const auditId = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();

    await db.insert(audits).values({
      id: auditId,
      userId,
      documentName: docName,
      documentType: sampleType ? "sample" : (mimeType?.split("/")[1] || "text"),
      invoiceNumber: auditResult.invoiceNumber,
      vendorName: auditResult.vendorName,
      invoiceDate: auditResult.invoiceDate,
      currency: auditResult.currency,
      claimedSubtotal: auditResult.reconciliation.claimedSubtotal,
      claimedTax: auditResult.reconciliation.claimedTax,
      claimedGrandTotal: auditResult.reconciliation.claimedGrandTotal,
      calculatedSubtotal: auditResult.reconciliation.calculatedSubtotal,
      calculatedTax: auditResult.reconciliation.calculatedTax,
      calculatedGrandTotal: auditResult.reconciliation.calculatedGrandTotal,
      totalDiscrepancy: auditResult.reconciliation.netCustomerOvercharge,
      discrepancyCount: auditResult.issueCounts.total,
      status: auditResult.status,
      verdictSummary: auditResult.verdictTitle,
      rawExtractedData: JSON.stringify(extractedData),
      createdAt: now,
    });

    // Save line items
    for (const item of auditResult.lineItems) {
      const lineItemId = `ali_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await db.insert(auditLineItems).values({
        id: lineItemId,
        auditId,
        lineNumber: item.lineNumber,
        sku: item.sku,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        claimedLineTotal: item.claimedLineTotal,
        calculatedLineTotal: item.calculatedLineTotal,
        discrepancyAmount: item.discrepancyAmount,
        hasMathError: item.hasMathError,
        isDuplicate: item.isDuplicate,
        isPriceSpike: item.isPriceSpike,
        baselinePrice: item.baselinePrice,
        priceSpikePct: item.priceSpikePct,
        flags: JSON.stringify(item.flags),
      });
    }

    // Increment user audit count
    if (user) {
      await db
        .update(users)
        .set({
          auditCount: user.auditCount + 1,
          updatedAt: now,
        })
        .where(eq(users.id, userId));
    }

    const updatedUserList = await db.select().from(users).where(eq(users.id, userId));
    const updatedUser = updatedUserList[0];

    return NextResponse.json({
      success: true,
      auditId,
      auditResult,
      rawExtracted: extractedData,
      userState: {
        isPro: updatedUser?.isPro ?? false,
        auditCount: updatedUser?.auditCount ?? 1,
        maxFreeAudits: updatedUser?.maxFreeAudits ?? 3,
      },
    });
  } catch (error: any) {
    console.error("[LedgerGuard] Audit error:", error);
    return NextResponse.json(
      {
        error: "AUDIT_FAILED",
        message: error.message || "Failed to audit invoice.",
      },
      { status: 500 }
    );
  }
}
