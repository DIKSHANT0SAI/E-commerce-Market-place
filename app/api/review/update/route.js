import connectDB from "@/config/db";
import { getAuth } from "@clerk/nextjs/server";
import Review from "@/models/Review";
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { User } from "@/models/user";
import mongoose from "mongoose";

// configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function PUT(request) {
    try {
        const { userId } = getAuth(request);
        if (!userId) {
            return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
        }

        const formData = await request.formData();
        const reviewId = formData.get('reviewId');
        const rating = formData.get('rating');
        const title = formData.get('title');
        const description = formData.get('description');
        const files = formData.getAll('images');
        const existingImages = formData.get('existingImages'); // JSON string of existing image URLs

        if (!reviewId || !rating || !description) {
            return NextResponse.json({ success: false, message: 'Review ID, rating, and description are required' }, { status: 400 });
        }

        const ratingNum = Number(rating);
        if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            return NextResponse.json({ success: false, message: 'Rating must be a whole number from 1 to 5.' }, { status: 400 });
        }

        await connectDB();

        // Find the review and check if user owns it
        if (!mongoose.Types.ObjectId.isValid(reviewId)) {
            return NextResponse.json({ success: false, message: 'Invalid review id' }, { status: 400 });
        }

        const existingReview = await Review.findById(reviewId);
        if (!existingReview) {
            return NextResponse.json({ success: false, message: 'Review not found' }, { status: 404 });
        }

        if (existingReview.userId !== userId) {
            return NextResponse.json({ success: false, message: 'Not authorized to edit this review' }, { status: 403 });
        }

        // Parse existing images
        let currentImages = [];
        if (existingImages) {
            try {
                currentImages = JSON.parse(existingImages);
            } catch (error) {
                console.error('Error parsing existing images:', error);
            }
        }

        let newImages = [];
        
        // Upload new images to Cloudinary if any
        if (files && files.length > 0) {
            const result = await Promise.all(
                files.map(async (file) => {
                    if (!file || file.size === 0) return null;
                    
                    const arrayBuffer = await file.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);

                    return new Promise((resolve, reject) => {
                        const stream = cloudinary.uploader.upload_stream(
                            { resource_type: 'auto' },
                            (error, result) => {
                                if (error) {
                                    reject(error);
                                } else {
                                    resolve(result);
                                }
                            }
                        );

                        stream.end(buffer);
                    });
                })
            );

            newImages = result.filter(result => result !== null).map(result => result.secure_url);
        }

        // Combine existing and new images
        const allImages = [...currentImages, ...newImages];

        // Update the review
        const updatedReview = await Review.findByIdAndUpdate(
            reviewId,
            {
                rating: ratingNum,
                title: title || '',
                description,
                images: allImages
            },
            { new: true }
        );

        // Get user info for response
        const user = await User.findById(userId);
        const reviewWithUser = {
            ...updatedReview.toObject(),
            user: {
                name: user.name,
                image: user.imageUrl
            }
        };

        return NextResponse.json({ 
            success: true, 
            message: 'Review updated successfully',
            review: reviewWithUser
        });

    } catch (error) {
        console.error('Review update error:', error);
        return NextResponse.json({ success: false, message: error.message });
    }
} 