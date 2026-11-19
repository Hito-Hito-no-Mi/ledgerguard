import { NextRequest, NextResponse } from "next/server";
import { ensureDbInitialized, db } from "@/lib/db";
import { audits, auditLineItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbInitialized();
    const { id } = await params;

    const auditRecords = await db.select().from(audits).where(eq(audits.id, id));
    if (auditRecords.length === 0) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    const audit = auditRecords[0];
    const lineItems = await db
      .select()
      .from(auditLineItems)
      .where(eq(auditLineItems.auditId, id));

    const parsedLineItems = lineItems.map((item) => ({
      ...item,
      flags: item.flags ? JSON.parse(item.flags) : [],
    }));

    return NextResponse.json({
      audit,
      lineItems: parsedLineItems,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbInitialized();
    const { id } = await params;

    await db.delete(auditLineItems).where(eq(auditLineItems.auditId, id));
    await db.delete(audits).where(eq(audits.id, id));

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
