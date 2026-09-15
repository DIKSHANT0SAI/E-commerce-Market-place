import connectDB from "@/config/db";
import Order from "@/models/Order";
import Address from "@/models/address"; // registers ref for populate
import Product from "@/models/Product"; // registers ref for populate
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET(request, { params }) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid order id" }, { status: 400 });
    }

    await connectDB();

    const order = await Order.findById(id).lean();
    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }
    // Ownership: a buyer can only view their own order.
    if (order.userId !== userId) {
      return NextResponse.json({ success: false, message: "Not authorized" }, { status: 403 });
    }

    // Guard malformed refs before populate (mirrors order/list + seller-orders) so a
    // bad ObjectId can't throw a CastError -> 500 for the legitimate owner. The page
    // falls back to "Address/Product unavailable" for nulls.
    if (!order.address || !mongoose.Types.ObjectId.isValid(order.address)) {
      order.address = null;
    }
    order.items = (order.items || []).filter(
      (it) => it.product && mongoose.Types.ObjectId.isValid(it.product)
    );

    const populated = await Order.populate(order, { path: "address items.product" });
    // Drop items whose product was deleted so the UI never reads a null product.
    populated.items = (populated.items || []).filter((it) => it.product);

    return NextResponse.json({ success: true, order: populated });
  } catch (error) {
    console.error("Order detail error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
