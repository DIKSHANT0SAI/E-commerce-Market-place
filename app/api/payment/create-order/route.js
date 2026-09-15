import Razorpay from "razorpay";
import connectDB from "@/config/db";
import PaymentIntent from "@/models/PaymentIntent";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { computeCartAmount } from "@/lib/createOrder";

// Creates a Razorpay order sized by the SERVER-computed cart total, and LOCKS the
// priced cart server-side (PaymentIntent) so /api/payment/verify can't be cart-swapped.
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    }

    const { items, address } = await request.json();
    if (!address || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: "Invalid data" });
    }
    const itemsValid = items.every(
      (it) => it && it.product && Number.isInteger(it.quantity) && it.quantity > 0
    );
    if (!itemsValid) {
      return NextResponse.json({ success: false, message: "Invalid cart items" });
    }

    // Online payments need Razorpay configured; fail cleanly (not a 500) otherwise.
    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { success: false, message: "Online payment isn't configured yet. Please use Cash on Delivery." },
        { status: 503 }
      );
    }

    // Server-computed amount (never trust a client-supplied amount).
    const priced = await computeCartAmount(items);
    if (!priced.ok) {
      return NextResponse.json(
        { success: false, message: priced.message, deletedProducts: priced.deletedProducts },
        { status: priced.status || 400 }
      );
    }

    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const rzpOrder = await razorpay.orders.create({
      amount: Math.round(priced.amount * 100), // paise
      currency: "INR",
      receipt: `rcpt_${String(userId).slice(-10)}_${Date.now()}`,
    });

    // Lock the priced cart to this Razorpay order. verify() reads from here, not the
    // client, so the items/amount can't be changed after payment.
    await connectDB();
    await PaymentIntent.create({
      razorpayOrderId: rzpOrder.id,
      userId,
      items: items.map((it) => ({ product: it.product, quantity: it.quantity })),
      address,
      amount: priced.amount,
    });

    return NextResponse.json({
      success: true,
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("create-order error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
