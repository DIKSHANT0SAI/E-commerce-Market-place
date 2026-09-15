import connectDB from "@/config/db";
import Order from "@/models/Order";
import Review from "@/models/Review";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Read-only eligibility check for the "Rate Product" button.
//
// The UI used to probe this by firing a deliberately incomplete POST at
// /api/review/add and watching for a 403 — which never fired, because that route
// validates required fields BEFORE the purchase check. A dedicated read endpoint
// keeps the check honest and stops the UI from issuing fake writes.
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    }

    const productId = new URL(request.url).searchParams.get("productId");
    if (!productId) {
      return NextResponse.json({ success: false, message: "productId is required" }, { status: 400 });
    }

    await connectDB();
    const [purchased, reviewed] = await Promise.all([
      Order.exists({ userId, "items.product": productId, status: { $ne: "Cancelled" } }),
      Review.exists({ userId, product: productId }),
    ]);

    return NextResponse.json({
      success: true,
      hasPurchased: !!purchased,
      hasReviewed: !!reviewed,
      canReview: !!purchased && !reviewed,
    });
  } catch (error) {
    console.error("can-review error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
