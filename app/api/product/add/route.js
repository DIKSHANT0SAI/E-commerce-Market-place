import connectDB from "@/config/db";
import authSeller from "@/lib/authSeller";
import Product from "@/models/Product";
import { getAuth } from "@clerk/nextjs/server";
import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import { validateProductFields } from "@/lib/productValidation";

// configure Cloudinary
cloudinary.config({
    cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function POST(request) {
    try {
        const { userId } = getAuth(request);
        const isSeller = await authSeller(userId);

        if (!isSeller) {
            return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
        }

        const formData = await request.formData();
        const name = formData.get('name');
        const description = formData.get('description');
        const category = formData.get('category');
        const price = formData.get('price');
        const offerPrice = formData.get('offerPrice');
        const files = formData.getAll('images');

        // Shared with /api/product/update so both paths enforce identical rules.
        const validation = validateProductFields({ name, description, category, price, offerPrice });
        if (!validation.ok) {
            return NextResponse.json({ success: false, message: validation.message }, { status: 400 });
        }
        const { priceNum, offerNum } = validation;

        // Validate files
        if (!files || files.length === 0) {
            return NextResponse.json({ success: false, message: 'No files uploaded' }, { status: 400 });
        }

        // Upload images to Cloudinary
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

        const image = result.map(result => result.secure_url);

        await connectDB();

        const newProduct = await Product.create({
            userId,
            name,
            description,
            category,
            price: priceNum,
            offerPrice: offerNum,
            image,
            date: Date.now() // optional, if no timestamps:true in schema
        });

        return NextResponse.json({ success: true, message: 'Upload successful', newProduct });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message });
    }
}
