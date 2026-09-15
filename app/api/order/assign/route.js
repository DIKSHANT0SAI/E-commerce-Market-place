import connectDB from "@/config/db";
import Order from "@/models/Order";
import Product from "@/models/Product";
import authSeller from "@/lib/authSeller";
import { getAuth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

// Seller-only: assign (or unassign) an order to a delivery agent.
export async function PATCH(request) {
  try {
    const { userId } = getAuth(request);
    const isSeller = await authSeller(userId);
    if (!isSeller) {
      return NextResponse.json({ success: false, message: "Not authorized" }, { status: 403 });
    }

    const { orderId, agentId } = await request.json();
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json({ success: false, message: "Invalid order id" }, { status: 400 });
    }

    await connectDB();

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    // The seller may assign an order only if it contains one of THEIR products.
    const productIds = order.items
      .map((it) => it.product)
      .filter((pid) => mongoose.Types.ObjectId.isValid(pid));
    const ownsItem = await Product.exists({ _id: { $in: productIds }, userId });
    if (!ownsItem) {
      return NextResponse.json({ success: false, message: "Not authorized to assign this order" }, { status: 403 });
    }

    if (!agentId) {
      // Unassign
      order.assignedTo = null;
      order.assignedToName = "";
    } else {
      // Verify the target user is actually a delivery agent before assigning.
      const client = await clerkClient();
      let agent;
      try {
        agent = await client.users.getUser(agentId);
      } catch {
        return NextResponse.json({ success: false, message: "Invalid delivery agent" }, { status: 400 });
      }
      if (agent?.publicMetadata?.role !== "delivery") {
        return NextResponse.json({ success: false, message: "Selected user is not a delivery agent" }, { status: 400 });
      }
      order.assignedTo = agentId;
      order.assignedToName =
        [agent.firstName, agent.lastName].filter(Boolean).join(" ") || agent.username || agentId;
    }

    await order.save();
    return NextResponse.json({
      success: true,
      assignedTo: order.assignedTo,
      assignedToName: order.assignedToName,
    });
  } catch (error) {
    console.error("Assign order error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
