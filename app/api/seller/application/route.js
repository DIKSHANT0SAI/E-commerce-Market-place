import connectDB from "@/config/db";
import SellerApplication from "@/models/SellerApplication";
import authSeller from "@/lib/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Returns the signed-in user's seller status: whether they're already a seller, and
// their latest application (if any) so the Become-a-Seller page can show the right state.
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    }

    const isSeller = await authSeller(userId);

    await connectDB();
    const application = await SellerApplication.findOne({ userId }).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      isSeller,
      application: application
        ? {
            status: application.status,
            storeName: application.storeName,
            rejectionReason: application.rejectionReason || "",
            createdAt: application.createdAt,
          }
        : null,
    });
  } catch (error) {
    console.error("get seller application error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
