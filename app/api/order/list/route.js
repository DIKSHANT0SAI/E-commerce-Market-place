import connectDB from "@/config/db";
import Address from "@/models/address";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { parsePagination } from "@/lib/pagination";

export async function GET(request) {
  try {
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams, { defaultLimit: 5 });

    await connectDB();
    let orders = await Order.find({ userId })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const fetchedCount = orders.length; // raw page size, before filtering deleted products

    // Filter out orders with invalid address or items.product
    orders = orders.filter(order => {
      // Address must be a valid ObjectId string
      if (!order.address || !mongoose.Types.ObjectId.isValid(order.address)) return false;
      // All items.product must be valid ObjectId strings
      if (!order.items.every(item => mongoose.Types.ObjectId.isValid(item.product))) return false;
      return true;
    });
    
    // Now safely populate
    orders = await Order.populate(orders, { path: 'address items.product' });
    
    // ...rest of your filtering logic...
    const filteredOrders = orders
      .map(order => {
        const filteredItems = order.items.filter(item => item.product !== null);
        return { ...order, items: filteredItems };
      })
      .filter(order => order.items.length > 0);
    
    // Get total count for pagination
    const total = await Order.countDocuments({ userId });
    // A full raw page means there may be more. Basing this on the *filtered* length
    // caused an infinite empty-page loop when orders were dropped for deleted products.
    const hasMore = fetchedCount === limit;

    return NextResponse.json({ 
      success: true, 
      orders: filteredOrders, 
      total, 
      hasMore, 
      currentPage: page 
    });
  } catch (error) {
    console.error("Fetch orders error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
