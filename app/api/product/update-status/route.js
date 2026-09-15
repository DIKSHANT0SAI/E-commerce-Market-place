import connectDB from '@/config/db';
import Product from '@/models/Product';
import authSeller from '@/lib/authSeller';
import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { inngest } from '@/config/inngest';
import mongoose from 'mongoose';

export async function PUT(request) {
  try {
    const { userId } = getAuth(request);
    const isSeller = await authSeller(userId);
    if (!isSeller) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    const { productId, status } = await request.json();
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json({ success: false, message: 'Valid product ID is required.' }, { status: 400 });
    }
    if (!['active', 'inactive'].includes(status)) {
      return NextResponse.json({ success: false, message: 'Status must be "active" or "inactive".' }, { status: 400 });
    }

    await connectDB();

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found.' }, { status: 404 });
    }
    if (product.userId !== userId) {
      return NextResponse.json({ success: false, message: 'Not authorized to update this product.' }, { status: 403 });
    }

    product.status = status;
    const updatedProduct = await product.save();

    // Trigger Inngest event based on product status
    if (updatedProduct.status === 'active') {
      await inngest.send({
        name: 'product.activated',
        data: { productId: updatedProduct._id.toString() }
      });
    } else if (updatedProduct.status === 'inactive') {
      await inngest.send({
        name: 'product.deactivated',
        data: { productId: updatedProduct._id.toString() }
      });
    }

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error('Update product status error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
} 