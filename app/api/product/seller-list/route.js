import connectDB from "@/config/db";
import authSeller from "@/lib/authSeller";
import Product from "@/models/Product";
import Order from "@/models/Order";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { parsePagination } from "@/lib/pagination";

export async function GET(request){
    try {
        const { userId } = getAuth(request);
        const isSeller = await authSeller(userId);
        if (!isSeller) {
            return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        // Fixed page size here — the seller table renders 5 rows per page.
        const { page, limit, skip } = parsePagination(searchParams, { defaultLimit: 5, maxLimit: 5 });

        await connectDB();

        // First, get the total count of products for the seller for pagination calculation.
        const totalProducts = await Product.countDocuments({ userId: userId });
        const totalPages = Math.ceil(totalProducts / limit);

        // Step 1: Fetch the paginated list of products for the specific seller.
        const products = await Product.find({ userId: userId })
            .sort({ date: -1 }) // Sort by most recent
            .skip(skip)
            .limit(limit)
            .lean();
        
        if (products.length === 0 && page > 1) {
             return NextResponse.json({ success: true, products: [], totalPages, currentPage: page });
        }

        // Step 2: Create an array of product IDs from the paginated list.
        const productIds = products.map(p => p._id.toString());
        
        // Step 3: Aggregate sales data only for the products on the current page.
        const salesData = await Order.aggregate([
            { $unwind: '$items' },
            { $match: { 'items.product': { $in: productIds } } },
            { 
                $group: {
                    _id: '$items.product',
                    unitsSold: { $sum: '$items.quantity' }
                }
            }
        ]);

        // Step 4: Create a map for easy lookup.
        const salesMap = salesData.reduce((map, sale) => {
            map[sale._id.toString()] = sale.unitsSold;
            return map;
        }, {});

        // Step 5: Merge the sales data into the paginated products list.
        const productsWithSales = products.map(product => ({
            ...product,
            unitsSold: salesMap[product._id.toString()] || 0
        }));

        return NextResponse.json({ 
            success: true, 
            products: productsWithSales,
            totalPages,
            currentPage: page
        });

    } catch (error) {
        console.error("Error fetching seller products with sales:", error);
        return NextResponse.json({ success: false, message: "An error occurred while fetching products." }, { status: 500 });
    }
}