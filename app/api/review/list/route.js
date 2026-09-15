import { NextResponse } from 'next/server';
import connectDB from "@/config/db";
import Review from '@/models/Review';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ success: false, message: 'Product ID is required' });
    }

    await connectDB();

    const reviewsWithUser = await Review.aggregate([
      { $match: { product: productId } },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          product: 1,
          userId: 1,
          rating: 1,
          title: 1,
          description: 1,
          images: 1,
          createdAt: 1,
          updatedAt: 1,
          "user.name": 1,
          "user.imageUrl": 1
        }
      }
    ]);

    return NextResponse.json({
      success: true,
      reviews: reviewsWithUser
    }, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ success: false, message: error.message });
  }
} 