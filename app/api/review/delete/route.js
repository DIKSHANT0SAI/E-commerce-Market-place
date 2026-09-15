import connectDB from "@/config/db";
import { getAuth } from "@clerk/nextjs/server";
import Review from "@/models/Review";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function DELETE(request) {
    try {
        const { userId } = getAuth(request);
        if (!userId) {
            return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const reviewId = searchParams.get('reviewId');

        if (!reviewId || !mongoose.Types.ObjectId.isValid(reviewId)) {
            return NextResponse.json({ success: false, message: 'Valid review ID is required' }, { status: 400 });
        }

        await connectDB();

        // Find the review and check if user owns it
        const review = await Review.findById(reviewId);
        if (!review) {
            return NextResponse.json({ success: false, message: 'Review not found' }, { status: 404 });
        }

        if (review.userId !== userId) {
            return NextResponse.json({ success: false, message: 'Not authorized to delete this review' }, { status: 403 });
        }

        // Delete the review
        await Review.findByIdAndDelete(reviewId);

        return NextResponse.json({ 
            success: true, 
            message: 'Review deleted successfully' 
        });

    } catch (error) {
        console.error('Review deletion error:', error);
        return NextResponse.json({ success: false, message: error.message });
    }
} 