import connectDB from "@/config/db";
import Product from "@/models/Product";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { parsePagination } from "@/lib/pagination";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    await connectDB();

    if (id) {
      // Fetch single product
      const product = await Product.findById(id).lean();
      if (!product) {
        return NextResponse.json({ success: false, message: "Product not found", products: [] });
      }
      return NextResponse.json({ success: true, products: [product] });
    }

    // Fetch multiple products by id (used by the cart to resolve its own items,
    // which may not be in the default paginated list).
    const ids = searchParams.get("ids");
    if (ids) {
      const idArray = ids
        .split(",")
        .map((s) => s.trim())
        .filter((s) => mongoose.Types.ObjectId.isValid(s));
      if (idArray.length === 0) {
        return NextResponse.json({ success: true, products: [] });
      }
      const products = await Product.find({ _id: { $in: idArray } }).lean();
      return NextResponse.json({ success: true, products });
    }

    // Pagination params (clamped — see lib/pagination.js)
    const { page, limit, skip } = parsePagination(searchParams, { defaultLimit: 10 });

    // ✅ Filter params
    const categories = searchParams.get("categories");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");

    let query = {};
    if (categories) {
      query.category = { $in: categories.split(",") };
    }
    if (minPrice && maxPrice) {
      query.offerPrice = {
        $gte: parseInt(minPrice),
        $lte: parseInt(maxPrice),
      };
    }

    // Unfiltered count is O(1) via estimatedDocumentCount; only pay for a full
    // scan-count when a filter is actually applied.
    const totalProducts =
      Object.keys(query).length === 0
        ? await Product.estimatedDocumentCount()
        : await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);

    const products = await Product.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const hasMore = skip + products.length < totalProducts;

    return NextResponse.json({
      success: true,
      products,
      total: totalProducts,
      totalPages,
      currentPage: page,
      hasMore,
    }, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message });
  }
}
