import { NextRequest, NextResponse } from "next/server";
import { ensureDbInitialized, db } from "@/lib/db";
import { audits, auditLineItems, users } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    await ensureDbInitialized();

    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get("userId") || "demo-user-123";

    const allAudits = await db
      .select()
      .from(audits)
      .orderBy(desc(audits.createdAt));

    // Calculate aggregated statistics
    let totalSaved = 0;
    let totalAudited = allAudits.length;
    let totalDiscrepancies = 0;

    allAudits.forEach((a) => {
      if (a.totalDiscrepancy > 0) {
        totalSaved += a.totalDiscrepancy;
      }
      if (a.status === "DISCREPANCY_DETECTED") {
        totalDiscrepancies++;
      }
    });

    const discrepancyRate = totalAudited > 0 ? (totalDiscrepancies / totalAudited) * 100 : 0;

    // Get current user status
    const userList = await db.select().from(users).where(eq(users.id, userId));
    const user = userList[0];

    return NextResponse.json({
      audits: allAudits,
      stats: {
        totalSaved,
        totalAudited,
        totalDiscrepancies,
        discrepancyRate,
      },
      user: {
        isPro: user?.isPro ?? false,
        auditCount: user?.auditCount ?? 0,
        maxFreeAudits: user?.maxFreeAudits ?? 3,
      },
    });
  } catch (error: any) {
    console.error("[LedgerGuard] Audits fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
