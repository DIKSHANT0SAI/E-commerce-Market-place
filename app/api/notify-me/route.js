import connectDB from '@/config/db';
import NotifyMe from '@/models/NotifyMe';
import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }
    const { productId } = await request.json();
    if (!productId) {
      return NextResponse.json({ success: false, message: 'Product ID is required' }, { status: 400 });
    }
    await connectDB();
    // Prevent duplicate requests
    const existing = await NotifyMe.findOne({ userId, productId });
    if (existing) {
      return NextResponse.json({ success: false, message: 'You have already requested notification for this product.' }, { status: 409 });
    }
    const notify = await NotifyMe.create({ userId, productId });
    return NextResponse.json({ success: true, message: 'You will be notified when the product is active.' });
  } catch (error) {
    console.error('Notify Me API error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
} 