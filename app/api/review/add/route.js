import connectDB from "@/config/db";
import { getAuth } from "@clerk/nextjs/server";
import Review from "@/models/Review";
import Order from "@/models/Order";
import { User } from "@/models/user";
import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import { inngest } from "@/config/inngest";

// configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function POST(request) {
    try {
        const { userId } = getAuth(request);
        if (!userId) {
            return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
        }

        const formData = await request.formData();
        const product = formData.get('product');
        const rating = formData.get('rating');
        const title = formData.get('title');
        const description = formData.get('description');
        const files = formData.getAll('images');

        // Validate required fields
        if (!product || !rating || !description) {
            return NextResponse.json({ success: false, message: 'Please fill all required fields.' }, { status: 400 });
        }

        const ratingNum = Number(rating);
        if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            return NextResponse.json({ success: false, message: 'Rating must be a whole number from 1 to 5.' }, { status: 400 });
        }

        await connectDB();

        // Check if user has purchased this product
        const order = await Order.findOne({
            userId: userId,
            'items.product': product,
            status: { $ne: 'Cancelled' }
        });

        if (!order) {
            return NextResponse.json({
                success: false, 
                message: 'You can only review products you have purchased.' 
            }, { status: 403 });
        }

        // Check if user has already reviewed this product
        const existingReview = await Review.findOne({
            userId: userId,
            product: product
        });

        if (existingReview) {
            return NextResponse.json({
                success: false,
                message: 'You have already reviewed this product.'
            }, { status: 409 });
        }

        let images = [];
        
        // Upload images to Cloudinary if any
        if (files && files.length > 0) {
            const result = await Promise.all(
                files.map(async (file) => {
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

            images = result.map(result => result.secure_url);
        }

        const newReview = await Review.create({
            userId,
            product,
            rating: ratingNum,
            title: title || '',
            description,
            images
        });

        // Trigger Inngest event for seller notification
        await inngest.send({
            name: "review/added",
            data: {
                reviewId: newReview._id.toString(),
                productId: product,
                userId: userId,
                rating: ratingNum,
                comment: description
            }
        });

        // Get user info for response
        const user = await User.findById(userId);
        const reviewWithUser = {
            ...newReview.toObject(),
            user: {
                name: user.name,
                image: user.imageUrl
            }
        };

        return NextResponse.json({ 
            success: true, 
            message: 'Review submitted successfully',
            review: reviewWithUser
        });
    } catch (error) {
        console.error('Review submission error:', error);
        return NextResponse.json({ success: false, message: error.message });
    }
} 