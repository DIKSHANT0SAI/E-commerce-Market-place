import connectDB from "@/config/db";
import Order from "@/models/Order";
import PaymentIntent from "@/models/PaymentIntent";
import { NextResponse } from "next/server";
import { createOrderForUser } from "@/lib/createOrder";
import { isValidSignature } from "@/lib/razorpaySignature";

/**
 * Razorpay → server webhook. This is the RELIABLE path to order creation.
 *
 * The browser callback in OrderSummary is best-effort only. In live mode every real
 * payment method leaves the site and comes back — UPI switches to GPay/PhonePe, cards
 * redirect through 3-D Secure, netbanking goes to the bank's portal — and mobile
 * browsers routinely evict a backgrounded tab. When that callback never runs the
 * customer has paid and no order exists.
 *
 * Razorpay calls this endpoint server-to-server and retries for up to 24 hours, so it
 * does not depend on the customer's device surviving the round trip.
 *
 * Both paths call the same createOrderForUser(). The partial unique index on
 * `razorpayOrderId` means whichever arrives second simply returns the order the first
 * one created — which is exactly why adding this endpoint is safe.
 *
 * Setup: Razorpay Dashboard → Settings → Webhooks → add
 *   URL:    https://<your-domain>/api/payment/webhook
 *   Events: payment.captured
 *   Secret: paste the same value into RAZORPAY_WEBHOOK_SECRET
 *
 * Note the webhook secret is a DIFFERENT value from RAZORPAY_KEY_SECRET.
 */

// HTTP status choices below are deliberate: Razorpay retries on non-2xx, so we return
// 2xx for anything a retry cannot fix, and 5xx only for genuinely transient failures.
export async function POST(request) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      console.error("razorpay webhook: RAZORPAY_WEBHOOK_SECRET is not set");
      // 500 → Razorpay keeps retrying, so events aren't lost while the key is missing.
      return NextResponse.json({ success: false, message: "Webhook not configured" }, { status: 500 });
    }

    // The signature is computed over the RAW request body. Parsing and re-serialising
    // the JSON would change key order/whitespace and the signature would never match.
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") || "";

    if (!isValidSignature({ payload: rawBody, signature, secret })) {
      // Not from Razorpay (or the wrong secret). Don't retry a forgery.
      return NextResponse.json({ success: false, message: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const paymentEntity = event?.payload?.payment?.entity;

    // Only a captured payment creates an order. Acknowledge everything else with 2xx so
    // Razorpay stops retrying events we intentionally ignore (refunds, failures, etc).
    if (!paymentEntity || !["payment.captured", "order.paid"].includes(event?.event)) {
      return NextResponse.json({ success: true, ignored: event?.event || "unknown" });
    }

    const razorpayOrderId = paymentEntity.order_id;
    const razorpayPaymentId = paymentEntity.id;
    if (!razorpayOrderId || !razorpayPaymentId) {
      return NextResponse.json({ success: true, message: "Event missing order/payment id" });
    }

    await connectDB();

    // Already handled — either the browser callback won the race, or this is a repeat
    // delivery of the same event. Idempotent by design.
    const existing = await Order.findOne({ razorpayOrderId });
    if (existing) {
      return NextResponse.json({
        success: true,
        message: "Already processed",
        orderId: existing._id.toString(),
      });
    }

    // The cart/amount come ONLY from the server-stored intent, exactly as in /verify —
    // the webhook payload never dictates what was bought.
    const intent = await PaymentIntent.findOne({ razorpayOrderId });
    if (!intent) {
      // The intent's 1h TTL expired before the webhook arrived. A retry cannot recreate
      // it, so acknowledge and log loudly — this row needs manual reconciliation against
      // the Razorpay dashboard.
      console.error(
        "razorpay webhook: PAID BUT NO INTENT — manual reconciliation required. " +
          `razorpayOrderId=${razorpayOrderId} paymentId=${razorpayPaymentId}`
      );
      return NextResponse.json({ success: true, message: "No payment session found" });
    }

    const result = await createOrderForUser({
      userId: intent.userId,
      address: intent.address,
      items: intent.items.map((it) => ({ product: it.product, quantity: it.quantity })),
      payment: {
        method: "Online",
        status: "Paid",
        paymentId: razorpayPaymentId,
        razorpayOrderId,
      },
      lockedAmount: intent.amount, // record exactly what was charged
    });

    if (!result.ok) {
      console.error("razorpay webhook: order creation failed:", result.message);
      // 500 → Razorpay retries. Worth retrying: this is usually a transient DB error.
      return NextResponse.json({ success: false, message: result.message }, { status: 500 });
    }

    await PaymentIntent.deleteOne({ _id: intent._id });
    return NextResponse.json({ success: true, orderId: result.order._id.toString() });
  } catch (error) {
    console.error("razorpay webhook error:", error);
    // 500 → retry, in case the failure was transient.
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
