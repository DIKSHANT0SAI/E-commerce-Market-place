import connectDB from "@/config/db";
import Order from "@/models/Order";
import PaymentIntent from "@/models/PaymentIntent";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createOrderForUser } from "@/lib/createOrder";
import { isValidSignature } from "@/lib/razorpaySignature";

// Verifies the Razorpay signature, then creates the PAID order from the SERVER-STORED
// cart (PaymentIntent) — never from client-supplied items — so the cart/amount the user
// actually paid for is exactly what gets recorded.
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ success: false, message: "Missing payment fields" }, { status: 400 });
    }

    // Verify signature: HMAC-SHA256("<order_id>|<payment_id>", key_secret), constant-time.
    // Shared with the webhook route — see lib/razorpaySignature.js.
    const valid = isValidSignature({
      payload: `${razorpay_order_id}|${razorpay_payment_id}`,
      signature: razorpay_signature,
      secret: process.env.RAZORPAY_KEY_SECRET,
    });
    if (!valid) {
      return NextResponse.json({ success: false, message: "Payment verification failed" }, { status: 400 });
    }

    await connectDB();

    // Idempotent: if this payment was already processed, succeed without duplicating.
    const existing = await Order.findOne({ razorpayOrderId: razorpay_order_id });
    if (existing) {
      return NextResponse.json({ success: true, message: "Payment already processed", orderId: existing._id.toString() });
    }

    // The cart/amount come ONLY from the server-stored intent (locked at create-order).
    const intent = await PaymentIntent.findOne({ razorpayOrderId: razorpay_order_id });
    if (!intent) {
      return NextResponse.json({ success: false, message: "Payment session not found or expired" }, { status: 400 });
    }
    if (intent.userId !== userId) {
      return NextResponse.json({ success: false, message: "Not authorized" }, { status: 403 });
    }

    const result = await createOrderForUser({
      userId,
      address: intent.address,
      items: intent.items.map((it) => ({ product: it.product, quantity: it.quantity })),
      payment: {
        method: "Online",
        status: "Paid",
        paymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
      },
      lockedAmount: intent.amount, // record exactly what was charged
    });
    if (!result.ok) {
      return NextResponse.json({ success: false, message: result.message }, { status: result.status || 400 });
    }

    await PaymentIntent.deleteOne({ _id: intent._id });
    return NextResponse.json({ success: true, message: "Payment successful", orderId: result.order._id.toString() });
  } catch (error) {
    console.error("payment verify error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
