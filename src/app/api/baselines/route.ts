import { NextRequest, NextResponse } from "next/server";
import { ensureDbInitialized, db } from "@/lib/db";
import { vendorBaselines } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    await ensureDbInitialized();
    const baselines = await db
      .select()
      .from(vendorBaselines)
      .orderBy(desc(vendorBaselines.updatedAt));

    return NextResponse.json({ baselines });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const body = await req.json();
    const { vendorName, sku, itemDescription, baselineUnitPrice, currency = "USD" } = body;

    if (!vendorName || !sku || !baselineUnitPrice) {
      return NextResponse.json(
        { error: "vendorName, sku, and baselineUnitPrice are required" },
        { status: 400 }
      );
    }

    const id = `vb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = Date.now();

    await db.insert(vendorBaselines).values({
      id,
      vendorName,
      normalizedVendor: vendorName.toLowerCase().trim(),
      sku: sku.trim().toUpperCase(),
      itemDescription: itemDescription || sku,
      baselineUnitPrice: Number(baselineUnitPrice),
      currency,
      lastObservedPrice: Number(baselineUnitPrice),
      lastAuditDate: new Date().toISOString().split("T")[0],
      updatedAt: now,
    });

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
