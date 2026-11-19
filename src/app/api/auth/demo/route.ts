import { NextRequest, NextResponse } from "next/server";
import { ensureDbInitialized, db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const userId = req.nextUrl.searchParams.get("userId") || "demo-user-123";

    const userList = await db.select().from(users).where(eq(users.id, userId));
    const user = userList[0];

    return NextResponse.json({
      user: user || {
        id: "demo-user-123",
        email: "demo@ledgerguard.internal",
        name: "Demo Auditor",
        isPro: false,
        auditCount: 1,
        maxFreeAudits: 3,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const body = await req.json();
    const { action, userId = "demo-user-123", email } = body;

    if (action === "toggle_pro") {
      const userList = await db.select().from(users).where(eq(users.id, userId));
      const current = userList[0];
      const newPro = !current?.isPro;

      await db
        .update(users)
        .set({ isPro: newPro, updatedAt: Date.now() })
        .where(eq(users.id, userId));

      return NextResponse.json({ success: true, isPro: newPro });
    }

    if (action === "reset_audits") {
      await db
        .update(users)
        .set({ auditCount: 0, updatedAt: Date.now() })
        .where(eq(users.id, userId));

      return NextResponse.json({ success: true, auditCount: 0 });
    }

    if (action === "magic_link") {
      // Magic-link auth stub
      return NextResponse.json({
        success: true,
        message: `Magic link dispatched to ${email || "user@company.com"}. Frictionless demo session active.`,
        token: `lg_tok_${Math.random().toString(36).substring(2)}`,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
