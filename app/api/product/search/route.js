import connectDB from "@/config/db";
import Product from "@/models/Product";
import { NextResponse } from "next/server";
import { parsePagination } from "@/lib/pagination";

// Cache search responses briefly at the CDN/shared-cache layer.
const CACHE_HEADER = "public, s-maxage=30, stale-while-revalidate=120";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    const { limit } = parsePagination(searchParams, { defaultLimit: 10, maxLimit: 20 });

    // Require at least 2 characters so a single keystroke never scans the catalog.
    if (q.length < 2) {
      return NextResponse.json([], { headers: { "Cache-Control": CACHE_HEADER } });
    }

    await connectDB();

    // Primary: indexed full-text search (uses the { name, description } text index — fast).
    let results = [];
    try {
      results = await Product.find(
        { $text: { $search: q } },
        { score: { $meta: "textScore" } }
      )
        .sort({ score: { $meta: "textScore" } })
        .limit(limit)
        .lean();
    } catch (e) {
      // Text index missing or still building (MongoDB error 27): degrade to the
      // regex fallback below instead of failing the request.
      console.error("text search unavailable, falling back to regex:", e.message);
    }

    // Fallback: substring/partial matches the word-based text index can't catch
    // (e.g. typing "head" before the whole word "headphone" is complete) — and the
    // safety net when the $text index isn't ready yet.
    if (results.length === 0) {
      const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // escape regex metacharacters
      results = await Product.find({ name: { $regex: safe, $options: "i" } })
        .limit(limit)
        .lean();
    }

    return NextResponse.json(results, { headers: { "Cache-Control": CACHE_HEADER } });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
