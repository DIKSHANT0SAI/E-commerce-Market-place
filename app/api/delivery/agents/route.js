import authSeller from "@/lib/authSeller";
import { getAuth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Seller-only: list users whose Clerk role is 'delivery', for assignment dropdowns.
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const isSeller = await authSeller(userId);
    if (!isSeller) {
      return NextResponse.json({ success: false, message: "Not authorized" }, { status: 403 });
    }

    const client = await clerkClient();
    const res = await client.users.getUserList({ limit: 100 });
    const users = res?.data || res || []; // Clerk v6 returns { data, totalCount }

    const agents = users
      .filter((u) => u.publicMetadata?.role === "delivery")
      .map((u) => ({
        id: u.id,
        name: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || u.id,
        email: u.emailAddresses?.[0]?.emailAddress || "",
      }));

    return NextResponse.json({ success: true, agents });
  } catch (error) {
    console.error("List delivery agents error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
