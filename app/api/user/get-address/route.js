import connectDB from "@/config/db";
import Address from "@/models/address";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    }

    await connectDB();
    const addresses = await Address.find({ userId }).lean();
    return NextResponse.json({ success: true, addresses });
  } catch (error) {
    console.error("get address error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
