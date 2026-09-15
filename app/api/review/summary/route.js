import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Review from '@/models/Review';
import { cached } from '@/lib/cache';

export async function POST(request) {
  try {
    const { productIds } = await request.json();
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ success: false, message: 'productIds array is required' }, { status: 400 });
    }

    // Cache per product-set (same catalog page → same key → shared cache hit).
    const key = 'review:summary:' + [...productIds].sort().join(',');
    const summary = await cached(key, 120, async () => {
      await connectDB();
      const summaries = await Review.aggregate([
        { $match: { product: { $in: productIds } } },
        {
          $group: {
            _id: '$product',
            avgRating: { $avg: '$rating' },
            reviewCount: { $sum: 1 }
          }
        }
      ]);
      const summaryMap = {};
      for (const s of summaries) {
        summaryMap[s._id] = {
          avgRating: Number(s.avgRating.toFixed(2)),
          reviewCount: s.reviewCount
        };
      }
      return summaryMap;
    });

    return NextResponse.json({ success: true, summary });
  } catch (error) {
    console.error('Error in review summary:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
} 