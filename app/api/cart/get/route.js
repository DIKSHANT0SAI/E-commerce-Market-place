import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import getOrCreateUser from "@/lib/getOrCreateUser";

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    }

    const user = await getOrCreateUser(userId);
    return NextResponse.json({ success: true, cartItems: user.cartItems });
  } catch (error) {
    console.error("cart get error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
