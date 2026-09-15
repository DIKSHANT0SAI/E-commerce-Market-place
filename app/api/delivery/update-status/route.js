import connectDB from "@/config/db";
import Order from "@/models/Order";
import authDelivery from "@/lib/authDelivery";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

// Delivery agents may only advance fulfillment stages (never cancel).
const DELIVERY_STATUSES = ["Shipped", "Out for Delivery", "Delivered"];

export async function PATCH(request) {
  try {
    const { userId } = getAuth(request);
    const isDelivery = await authDelivery(userId);
    if (!isDelivery) {
      return NextResponse.json({ success: false, message: "Not authorized" }, { status: 403 });
    }

    const { orderId, status } = await request.json();
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json({ success: false, message: "Invalid order id" }, { status: 400 });
    }
    if (!DELIVERY_STATUSES.includes(status)) {
      return NextResponse.json({ success: false, message: "Invalid status" }, { status: 400 });
    }

    await connectDB();

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }
    // Scoped: an agent can only update an order assigned to THEM.
    if (order.assignedTo !== userId) {
      return NextResponse.json({ success: false, message: "This order is not assigned to you" }, { status: 403 });
    }

    order.status = status;
    await order.save();
    return NextResponse.json({ success: true, status: order.status });
  } catch (error) {
    console.error("Delivery status update error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
