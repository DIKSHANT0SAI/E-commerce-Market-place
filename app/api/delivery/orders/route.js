import connectDB from "@/config/db";
import Order from "@/models/Order";
import Address from "@/models/address"; // registers ref for populate
import Product from "@/models/Product"; // registers ref for populate
import authDelivery from "@/lib/authDelivery";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

// Delivery agents see ONLY the orders assigned to them.
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const isDelivery = await authDelivery(userId);
    if (!isDelivery) {
      return NextResponse.json({ success: false, message: "Not authorized" }, { status: 403 });
    }

    await connectDB();

    let orders = await Order.find({ assignedTo: userId }).sort({ date: -1 }).lean();

    // Guard malformed refs before populate so a bad ObjectId can't 500 the page.
    orders = orders.map((o) => ({
      ...o,
      address: o.address && mongoose.Types.ObjectId.isValid(o.address) ? o.address : null,
      items: (o.items || []).filter((it) => it.product && mongoose.Types.ObjectId.isValid(it.product)),
    }));
    orders = await Order.populate(orders, { path: "address items.product" });
    orders = orders.map((o) => ({ ...o, items: (o.items || []).filter((it) => it.product) }));

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error("Delivery orders error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
