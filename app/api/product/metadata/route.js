import connectDB from "@/config/db";
import Product from "@/models/Product";
import { NextResponse } from "next/server";
import { cached } from "@/lib/cache";

export async function GET(request) {
    try {
        // Cache the filter metadata (changes only when products are added/edited).
        const data = await cached("product:metadata", 300, async () => {
            await connectDB();
            const metadata = await Product.aggregate([
                {
                    $group: {
                        _id: null,
                        minPrice: { $min: "$offerPrice" },
                        maxPrice: { $max: "$offerPrice" },
                        categories: { $addToSet: "$category" }
                    }
                }
            ]);
            if (metadata.length === 0) {
                return { minPrice: 0, maxPrice: 1000, categories: [] };
            }
            const { minPrice, maxPrice, categories } = metadata[0];
            return {
                minPrice: Math.floor(minPrice),
                maxPrice: Math.ceil(maxPrice),
                categories: categories.sort()
            };
        });

        return NextResponse.json({ success: true, data }, {
            headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message });
    }
} 