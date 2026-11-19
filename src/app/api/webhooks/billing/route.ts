import { NextRequest, NextResponse } from "next/server";
import { ensureDbInitialized, db } from "@/lib/db";
import { users, webhookLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    await ensureDbInitialized();

    const rawBody = await req.text();
    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = { raw: rawBody };
    }

    const lsSignature = req.headers.get("x-signature");
    const dodoSignature = req.headers.get("webhook-signature") || req.headers.get("x-dodo-signature");
    const secret = process.env.BILLING_WEBHOOK_SECRET;

    // Optional HMAC signature verification if secret is provided
    if (secret && lsSignature) {
      const hmac = crypto.createHmac("sha256", secret);
      const digest = hmac.update(rawBody).digest("hex");
      if (digest !== lsSignature) {
        return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 401 });
      }
    }

    // Determine event type
    const eventName =
      req.headers.get("x-event-name") ||
      payload.event_name ||
      payload.type ||
      payload.event ||
      (payload.test_upgrade ? "test_upgrade" : "order_created");

    const provider = lsSignature
      ? "lemon_squeezy"
      : dodoSignature
      ? "dodo_payments"
      : "merchant_of_record";

    const logId = `wh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await db.insert(webhookLogs).values({
      id: logId,
      provider,
      eventType: eventName,
      payload: JSON.stringify(payload),
      createdAt: Date.now(),
    });

    // Extract target user email or user_id
    const userEmail =
      payload.data?.attributes?.user_email ||
      payload.customer?.email ||
      payload.email ||
      "demo@ledgerguard.internal";

    const targetUserId =
      payload.meta?.custom_data?.user_id ||
      payload.userId ||
      "demo-user-123";

    // Upgrade user to Pro (unlimited audits)
    const isProEvent = [
      "order_created",
      "subscription_created",
      "subscription_updated",
      "payment.succeeded",
      "subscription.active",
      "test_upgrade",
    ].includes(eventName.toLowerCase());

    if (isProEvent) {
      await db
        .update(users)
        .set({
          isPro: true,
          updatedAt: Date.now(),
        })
        .where(eq(users.id, targetUserId));

      return NextResponse.json({
        success: true,
        message: "User account upgraded to LedgerGuard Pro (Unlimited Audits)",
        provider,
        eventType: eventName,
        userId: targetUserId,
        isPro: true,
      });
    }

    return NextResponse.json({
      received: true,
      message: `Webhook event "${eventName}" acknowledged`,
    });
  } catch (error: any) {
    console.error("[LedgerGuard Webhook] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
