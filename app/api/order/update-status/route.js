import connectDB from "@/config/db";
import Order from "@/models/Order";
import Product from "@/models/Product";
import authSeller from "@/lib/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

const ALLOWED_STATUSES = ["Order Placed", "Shipped", "Out for Delivery", "Delivered", "Cancelled"];

export async function PATCH(request) {
  try {
    const { userId } = getAuth(request);
    const isSeller = await authSeller(userId);
    if (!isSeller) {
      return NextResponse.json({ success: false, message: "Not authorized" }, { status: 403 });
    }

    const { orderId, status } = await request.json();
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json({ success: false, message: "Invalid order id" }, { status: 400 });
    }
    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json({ success: false, message: "Invalid status" }, { status: 400 });
    }

    await connectDB();

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    // The seller may update an order only if it contains one of THEIR products.
    const productIds = order.items
      .map((it) => it.product)
      .filter((pid) => mongoose.Types.ObjectId.isValid(pid));
    const ownsItem = await Product.exists({ _id: { $in: productIds }, userId });
    if (!ownsItem) {
      return NextResponse.json({ success: false, message: "Not authorized to update this order" }, { status: 403 });
    }

    order.status = status;
    await order.save();

    return NextResponse.json({ success: true, status: order.status });
  } catch (error) {
    console.error("Order status update error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
