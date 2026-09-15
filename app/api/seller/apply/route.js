import connectDB from "@/config/db";
import SellerApplication from "@/models/SellerApplication";
import authSeller from "@/lib/authSeller";
import authDelivery from "@/lib/authDelivery";
import { getAuth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// A signed-in buyer submits a request to become a seller. Creates a PENDING application
// that an admin later approves (which grants the Clerk seller role) or rejects.
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    }

    // Already a seller? Nothing to apply for.
    if (await authSeller(userId)) {
      return NextResponse.json({ success: false, message: "You are already a seller" }, { status: 400 });
    }

    // The app stores a SINGLE role — a delivery agent becoming a seller would silently
    // revoke their delivery access, so block it here (and again at approval time).
    if (await authDelivery(userId)) {
      return NextResponse.json(
        { success: false, message: "Your account is a delivery account and can't also be a seller." },
        { status: 400 }
      );
    }

    const { storeName, phone, description } = await request.json();
    if (!storeName?.trim() || !phone?.trim()) {
      return NextResponse.json({ success: false, message: "Store name and phone are required" }, { status: 400 });
    }

    await connectDB();

    // Block a second pending application (also enforced atomically by the partial unique index).
    const existingPending = await SellerApplication.findOne({ userId, status: "pending" });
    if (existingPending) {
      return NextResponse.json({ success: false, message: "You already have a pending application" }, { status: 409 });
    }

    // Denormalize name/email from Clerk for the admin's review convenience (best-effort).
    let name = "", email = "";
    try {
      const client = await clerkClient();
      const u = await client.users.getUser(userId);
      name = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || "";
      email =
        u.emailAddresses?.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress ||
        u.emailAddresses?.[0]?.emailAddress || "";
    } catch (e) {
      console.error("apply: could not load Clerk user (non-fatal):", e?.message || e);
    }

    let application;
    try {
      application = await SellerApplication.create({
        userId,
        name,
        email,
        storeName: storeName.trim(),
        phone: phone.trim(),
        description: (description || "").trim(),
        status: "pending",
      });
    } catch (err) {
      // Concurrent double-submit lost the race on the unique partial index.
      if (err?.code === 11000) {
        return NextResponse.json({ success: false, message: "You already have a pending application" }, { status: 409 });
      }
      throw err;
    }

    return NextResponse.json({
      success: true,
      message: "Application submitted — we'll review it shortly.",
      application: { status: application.status },
    });
  } catch (error) {
    console.error("seller apply error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
