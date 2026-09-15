import connectDB from "@/config/db";
import SellerApplication from "@/models/SellerApplication";
import authAdmin from "@/lib/authAdmin";
import { getAuth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Admin-only: approve or reject a seller application.
// Approve = the ONLY place in the app that writes a Clerk role (grants role: 'seller').
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    if (!(await authAdmin(userId))) {
      return NextResponse.json({ success: false, message: "Not authorized" }, { status: 403 });
    }

    const { applicationId, action, reason } = await request.json();
    if (!applicationId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ success: false, message: "Invalid request" }, { status: 400 });
    }

    await connectDB();
    const application = await SellerApplication.findById(applicationId);
    if (!application) {
      return NextResponse.json({ success: false, message: "Application not found" }, { status: 404 });
    }

    // Idempotent: re-actioning an application that's already in the target state is a no-op.
    const targetStatus = action === "approve" ? "approved" : "rejected";
    if (application.status === targetStatus) {
      return NextResponse.json({ success: true, message: `Already ${targetStatus}` });
    }

    if (action === "approve") {
      const client = await clerkClient();
      const target = await client.users.getUser(application.userId);
      const existingRole = target.publicMetadata?.role;

      // Don't silently clobber a different role (e.g. a delivery agent) — role is a single field.
      if (existingRole && existingRole !== "seller") {
        return NextResponse.json(
          { success: false, message: `This user already has the '${existingRole}' role and can't be converted to a seller.` },
          { status: 409 }
        );
      }

      // Grant the seller role via Clerk, preserving any other publicMetadata. Skip the
      // write if they're already a seller (idempotent).
      if (existingRole !== "seller") {
        await client.users.updateUser(application.userId, {
          publicMetadata: { ...(target.publicMetadata || {}), role: "seller" },
        });
      }
      application.status = "approved";
      application.rejectionReason = "";
    } else {
      application.status = "rejected";
      application.rejectionReason = (reason || "").trim();
    }

    application.reviewedBy = userId;
    application.reviewedAt = Date.now();
    await application.save();

    return NextResponse.json({
      success: true,
      message: action === "approve" ? "Seller approved" : "Application rejected",
    });
  } catch (error) {
    console.error("review application error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
