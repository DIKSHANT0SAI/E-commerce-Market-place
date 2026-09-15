import connectDB from "@/config/db";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createOrderForUser } from "@/lib/createOrder";

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    }

    const { address, items, idempotencyKey } = await request.json();
    if (!address || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: "Invalid data" });
    }
    const itemsValid = items.every(
      (it) => it && it.product && Number.isInteger(it.quantity) && it.quantity > 0
    );
    if (!itemsValid) {
      return NextResponse.json({ success: false, message: "Invalid cart items" });
    }

    // Cart validation only — confirm availability without creating an order.
    // Mirrors priceCart(): a product counts as unavailable if it was deleted OR
    // deactivated by its seller, so the cart drops it before the user reaches checkout.
    if (address === "check-only") {
      await connectDB();
      const productIds = items.map((i) => i.product);
      const products = await Product.find({ _id: { $in: productIds }, status: "active" })
        .select("_id")
        .lean();
      const found = new Set(products.map((p) => p._id.toString()));
      const deletedProducts = items.map((i) => i.product).filter((id) => !found.has(String(id)));
      return NextResponse.json({
        success: deletedProducts.length === 0,
        message: deletedProducts.length === 0 ? "All products available" : "Some products are no longer available",
        deletedProducts,
      });
    }

    // Cash on Delivery order (online payments go through /api/payment/*).
    const result = await createOrderForUser({
      userId,
      address,
      items,
      payment: { method: "COD", status: "Pending" },
      idempotencyKey: typeof idempotencyKey === "string" ? idempotencyKey : "",
    });
    if (!result.ok) {
      return NextResponse.json(
        { success: false, message: result.message, deletedProducts: result.deletedProducts },
        { status: result.status || 400 }
      );
    }
    return NextResponse.json({ success: true, message: "Order placed successfully", orderId: result.order._id.toString() });
  } catch (error) {
    console.error("Order error:", error);
    return NextResponse.json({ success: false, message: error.message });
  }
}
