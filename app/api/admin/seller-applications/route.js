import connectDB from "@/config/db";
import SellerApplication from "@/models/SellerApplication";
import authAdmin from "@/lib/authAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Admin-only: list seller applications (optionally filtered by ?status=pending).
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    if (!(await authAdmin(userId))) {
      return NextResponse.json({ success: false, message: "Not authorized" }, { status: 403 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const query = status ? { status } : {};
    const applications = await SellerApplication.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      applications: applications.map((a) => ({
        id: a._id.toString(),
        userId: a.userId,
        name: a.name,
        email: a.email,
        storeName: a.storeName,
        phone: a.phone,
        description: a.description,
        status: a.status,
        rejectionReason: a.rejectionReason || "",
        createdAt: a.createdAt,
        reviewedAt: a.reviewedAt || null,
      })),
    });
  } catch (error) {
    console.error("admin list applications error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
